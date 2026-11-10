"""Health-impact estimation service."""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException, InsufficientDataException
from app.models.health_impact import HealthImpact
from app.models.location import District
from app.models.risk_assessment import RiskAssessment
from app.schemas.health_impact import HealthImpactEstimateRequest


class HealthImpactService:
    def estimate(self, db: Session, req: HealthImpactEstimateRequest) -> HealthImpact:
        district = db.query(District).filter(District.id == req.district_id).first()
        if not district:
            raise EntityNotFoundException("District", req.district_id)

        exposed_pop = req.exposed_population_override if req.exposed_population_override is not None else district.population

        # Case 1: Check upstream risk assessment if provided
        severity_score = req.hazard_severity_score
        status_val = "COMPLETE"

        if req.risk_assessment_id:
            assessment = db.query(RiskAssessment).filter(RiskAssessment.id == req.risk_assessment_id).first()
            if not assessment:
                raise EntityNotFoundException("RiskAssessment", req.risk_assessment_id)

            if assessment.status != "SUCCEEDED":
                # Upstream prediction is unavailable or failed
                impact = HealthImpact(
                    risk_assessment_id=assessment.id,
                    district_id=district.id,
                    status="SOURCE_PREDICTION_UNAVAILABLE",
                    exposed_population=exposed_pop,
                    estimated_affected=0,
                    vulnerability_indicators={"vulnerability_factor": req.vulnerability_factor},
                    estimated_medical_demand={},
                    estimation_method="SENTRA-EPIDEM-V1.0",
                    estimation_version="1.0.0",
                    assumptions={"note": "Upstream risk assessment did not yield a valid numerical severity score."},
                    limitations=f"Source assessment status is '{assessment.status}'. Cannot infer affected population without valid prediction.",
                )
                db.add(impact)
                db.commit()
                db.refresh(impact)
                return impact

            # If prediction result exists with severity score
            pred_data = assessment.prediction_result or {}
            severity_score = pred_data.get("severity_score", 0.5)

        # Case 2: Insufficient data check
        if severity_score is None:
            raise InsufficientDataException(
                "Either a valid upstream risk_assessment_id or an explicit hazard_severity_score is required for estimation.",
                missing_fields=["hazard_severity_score", "risk_assessment_id"],
            )

        if exposed_pop <= 0:
            impact = HealthImpact(
                risk_assessment_id=req.risk_assessment_id,
                district_id=district.id,
                status="INSUFFICIENT_DATA",
                exposed_population=0,
                estimated_affected=0,
                vulnerability_indicators={"vulnerability_factor": req.vulnerability_factor},
                estimated_medical_demand={},
                estimation_method="SENTRA-EPIDEM-V1.0",
                estimation_version="1.0.0",
                assumptions={},
                limitations="District population record is zero or unconfigured. Cannot compute affected population.",
            )
            db.add(impact)
            db.commit()
            db.refresh(impact)
            return impact

        # Deterministic estimation based on transparent epidemiological coefficients
        # Expected affected ratio = severity (0..1) * vulnerability (0..1) * baseline hazard rate (15%)
        impact_ratio = max(0.0, min(1.0, severity_score * req.vulnerability_factor * 0.15))
        estimated_affected = int(round(exposed_pop * impact_ratio))

        # Medical demand estimates
        # 5% of affected population projected to require inpatient bed care
        # 0.5% require ambulance transport
        # 0.2% require dedicated emergency medical teams
        # 20% require emergency temporary shelter
        medical_demand = {
            "hospital_beds": max(0, int(round(estimated_affected * 0.05))),
            "ambulances": max(0, int(round(estimated_affected * 0.005))),
            "medical_teams": max(0, int(round(estimated_affected * 0.002))),
            "temporary_shelters": max(0, int(round(estimated_affected * 0.20))),
            "relief_supply_packs": estimated_affected,
        }

        assumptions = {
            "severity_score": severity_score,
            "vulnerability_factor": req.vulnerability_factor,
            "inpatient_rate": 0.05,
            "ambulance_rate": 0.005,
            "medical_team_rate": 0.002,
            "shelter_displacement_rate": 0.20,
        }

        impact = HealthImpact(
            risk_assessment_id=req.risk_assessment_id,
            district_id=district.id,
            status=status_val,
            exposed_population=exposed_pop,
            estimated_affected=estimated_affected,
            vulnerability_indicators={
                "vulnerability_factor": req.vulnerability_factor,
                "composite_vulnerability": "MODERATE" if req.vulnerability_factor < 0.7 else "HIGH",
            },
            estimated_medical_demand=medical_demand,
            estimation_method="SENTRA-EPIDEM-V1.0",
            estimation_version="1.0.0",
            assumptions=assumptions,
            limitations="Estimates represent initial macro planning figures and do not replace local clinical triage.",
        )
        db.add(impact)
        db.commit()
        db.refresh(impact)
        return impact

    def get_by_id(self, db: Session, impact_id: str) -> HealthImpact:
        impact = db.query(HealthImpact).filter(HealthImpact.id == impact_id).first()
        if not impact:
            raise EntityNotFoundException("HealthImpact", impact_id)
        return impact

    def list_impacts(
        self, db: Session, district_id: Optional[str] = None, page: int = 1, page_size: int = 20
    ) -> Tuple[List[HealthImpact], int]:
        query = db.query(HealthImpact)
        if district_id:
            query = query.filter(HealthImpact.district_id == district_id)
        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(HealthImpact.created_at.desc()).offset(offset).limit(page_size).all()
        return items, total


health_impact_service = HealthImpactService()
