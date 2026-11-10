"""Risk assessment service managing hazard inference and provenance."""

from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException, ModelUnavailableException
from app.core.logging import logger
from app.models.location import District
from app.models.observation import Observation
from app.models.risk_assessment import RiskAssessment
from app.prediction.registry import predictor_registry
from app.schemas.risk_assessment import RiskAssessmentCreate, RiskAssessmentStatus


class RiskAssessmentService:
    def request_assessment(self, db: Session, req: RiskAssessmentCreate) -> RiskAssessment:
        district = db.query(District).filter(District.id == req.district_id).first()
        if not district:
            raise EntityNotFoundException("District", req.district_id)

        predictor = predictor_registry.get(req.hazard_type)
        if not predictor:
            raise ModelUnavailableException(req.hazard_type.value)

        # Assemble environmental input snapshot from recent district observations and request input data
        recent_obs = (
            db.query(Observation)
            .filter(Observation.district_id == req.district_id)
            .order_by(Observation.timestamp.desc())
            .limit(20)
            .all()
        )
        obs_snapshot = {
            obs.observation_type: {"value": obs.value, "unit": obs.unit, "timestamp": obs.timestamp.isoformat()}
            for obs in recent_obs
        }
        if req.input_data:
            obs_snapshot.update(req.input_data)

        # If model is not available / trained, persist explicit MODEL_UNAVAILABLE record and raise 503
        if not predictor.is_available:
            assessment = RiskAssessment(
                district_id=req.district_id,
                hazard_type=req.hazard_type.value,
                status=RiskAssessmentStatus.MODEL_UNAVAILABLE.value,
                time_horizon=req.time_horizon,
                input_snapshot=obs_snapshot,
                prediction_result=None,
                model_name=predictor.model_name,
                model_version=predictor.model_version,
                data_provenance={
                    "source": "SENTRA Observation Station Snapshot",
                    "num_observations": len(recent_obs),
                },
                error_details=f"The prediction model for {req.hazard_type.value} is not yet trained or configured.",
                completed_at=datetime.now(timezone.utc),
            )
            db.add(assessment)
            db.commit()
            db.refresh(assessment)

            logger.info(
                "Risk assessment %s marked as MODEL_UNAVAILABLE for %s in district %s",
                assessment.id,
                req.hazard_type.value,
                district.name,
            )
            # Raise 503 as required by Part 10.3 specification
            raise ModelUnavailableException(
                hazard_type=req.hazard_type.value,
                details=f"Trained model for hazard '{req.hazard_type.value}' is currently unavailable. Assessment record {assessment.id} saved with status MODEL_UNAVAILABLE.",
            )

        # In the future, when trained model is plugged in:
        try:
            validated_inputs = predictor.validate_inputs(obs_snapshot)
            result = predictor.predict(validated_inputs)
            assessment = RiskAssessment(
                district_id=req.district_id,
                hazard_type=req.hazard_type.value,
                status=RiskAssessmentStatus.SUCCEEDED.value,
                time_horizon=req.time_horizon,
                input_snapshot=obs_snapshot,
                prediction_result=result,
                model_name=predictor.model_name,
                model_version=predictor.model_version,
                data_provenance={"source": "Operational Prediction Pipeline"},
                completed_at=datetime.now(timezone.utc),
            )
            db.add(assessment)
            db.commit()
            db.refresh(assessment)
            return assessment
        except Exception as exc:
            assessment = RiskAssessment(
                district_id=req.district_id,
                hazard_type=req.hazard_type.value,
                status=RiskAssessmentStatus.FAILED.value,
                time_horizon=req.time_horizon,
                input_snapshot=obs_snapshot,
                error_details=str(exc),
                completed_at=datetime.now(timezone.utc),
            )
            db.add(assessment)
            db.commit()
            db.refresh(assessment)
            raise

    def list_assessments(
        self,
        db: Session,
        district_id: Optional[str] = None,
        hazard_type: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[RiskAssessment], int]:
        query = db.query(RiskAssessment)
        if district_id:
            query = query.filter(RiskAssessment.district_id == district_id)
        if hazard_type:
            query = query.filter(RiskAssessment.hazard_type == hazard_type.upper())
        if status:
            query = query.filter(RiskAssessment.status == status.upper())

        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(RiskAssessment.created_at.desc()).offset(offset).limit(page_size).all()
        return items, total

    def get_by_id(self, db: Session, assessment_id: str) -> RiskAssessment:
        assessment = db.query(RiskAssessment).filter(RiskAssessment.id == assessment_id).first()
        if not assessment:
            raise EntityNotFoundException("RiskAssessment", assessment_id)
        return assessment


risk_assessment_service = RiskAssessmentService()
