"""Analytics and aggregate reporting service."""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.alert import Alert
from app.models.allocation import OptimizationRun
from app.models.health_impact import HealthImpact
from app.models.location import District, State
from app.models.observation import Observation
from app.models.resource import Resource
from app.models.risk_assessment import RiskAssessment
from app.schemas.report import DisasterImpactReport, DistrictImpactSummary, SystemSummaryReport


class ReportService:
    def get_system_summary(self, db: Session) -> SystemSummaryReport:
        return SystemSummaryReport(
            total_states=db.query(State).count(),
            total_districts=db.query(District).count(),
            total_observations=db.query(Observation).count(),
            total_risk_assessments=db.query(RiskAssessment).count(),
            total_active_alerts=db.query(Alert).filter(Alert.status == "ACTIVE").count(),
            total_registered_resources=db.query(Resource).count(),
            total_optimization_runs=db.query(OptimizationRun).count(),
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

    def get_disaster_impact_report(self, db: Session, state_id: Optional[str] = None) -> DisasterImpactReport:
        query = db.query(District)
        if state_id:
            query = query.filter(District.state_id == state_id)
        districts = query.all()

        summaries = []
        for d in districts:
            obs_count = db.query(Observation).filter(Observation.district_id == d.id).count()
            latest_assessment = (
                db.query(RiskAssessment)
                .filter(RiskAssessment.district_id == d.id)
                .order_by(RiskAssessment.created_at.desc())
                .first()
            )
            latest_impact = (
                db.query(HealthImpact)
                .filter(HealthImpact.district_id == d.id)
                .order_by(HealthImpact.created_at.desc())
                .first()
            )
            active_alerts = (
                db.query(Alert)
                .filter(Alert.district_id == d.id, Alert.status == "ACTIVE")
                .count()
            )
            resources_avail = (
                db.query(Resource)
                .filter(Resource.district_id == d.id, Resource.operational_status == "OPERATIONAL")
                .count()
            )

            summaries.append(
                DistrictImpactSummary(
                    district_id=d.id,
                    district_name=d.name,
                    state_name=d.state.name if d.state else "Unknown",
                    total_observations=obs_count,
                    latest_hazard_assessment=latest_assessment.hazard_type if latest_assessment else None,
                    latest_assessment_status=latest_assessment.status if latest_assessment else None,
                    estimated_affected_population=(
                        latest_impact.estimated_affected if latest_impact and latest_impact.status == "COMPLETE" else None
                    ),
                    active_alerts_count=active_alerts,
                    available_resources_count=resources_avail,
                )
            )

        return DisasterImpactReport(
            state_id=state_id,
            summary_by_district=summaries,
            total_districts_reported=len(summaries),
            generated_at=datetime.now(timezone.utc).isoformat(),
        )


report_service = ReportService()
