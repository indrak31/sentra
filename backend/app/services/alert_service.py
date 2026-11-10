"""Emergency alert lifecycle management service."""

from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException
from app.models.alert import Alert
from app.models.location import District
from app.models.risk_assessment import RiskAssessment
from app.schemas.alert import AlertCreate, AlertUpdate


class AlertService:
    def create_alert(self, db: Session, req: AlertCreate, user_id: str) -> Alert:
        district = db.query(District).filter(District.id == req.district_id).first()
        if not district:
            raise EntityNotFoundException("District", req.district_id)

        if req.risk_assessment_id:
            assessment = db.query(RiskAssessment).filter(RiskAssessment.id == req.risk_assessment_id).first()
            if not assessment:
                raise EntityNotFoundException("RiskAssessment", req.risk_assessment_id)

        alert = Alert(
            district_id=req.district_id,
            hazard_type=req.hazard_type.value,
            risk_assessment_id=req.risk_assessment_id,
            severity=req.severity.value,
            status="ACTIVE",
            title=req.title,
            description=req.description,
            issued_by=user_id,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert

    def update_alert(self, db: Session, alert_id: str, req: AlertUpdate, user_id: str) -> Alert:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise EntityNotFoundException("Alert", alert_id)

        if req.severity is not None:
            alert.severity = req.severity.value
        if req.title is not None:
            alert.title = req.title
        if req.description is not None:
            alert.description = req.description
        if req.status is not None:
            new_status = req.status.value
            if new_status == "ACKNOWLEDGED" and alert.status != "ACKNOWLEDGED":
                alert.acknowledged_by = user_id
                alert.acknowledged_at = datetime.now(timezone.utc)
            alert.status = new_status

        db.commit()
        db.refresh(alert)
        return alert

    def get_by_id(self, db: Session, alert_id: str) -> Alert:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise EntityNotFoundException("Alert", alert_id)
        return alert

    def list_alerts(
        self,
        db: Session,
        district_id: Optional[str] = None,
        hazard_type: Optional[str] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Alert], int]:
        query = db.query(Alert)
        if district_id:
            query = query.filter(Alert.district_id == district_id)
        if hazard_type:
            query = query.filter(Alert.hazard_type == hazard_type.upper())
        if severity:
            query = query.filter(Alert.severity == severity.upper())
        if status:
            query = query.filter(Alert.status == status.upper())

        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(Alert.created_at.desc()).offset(offset).limit(page_size).all()
        return items, total


alert_service = AlertService()
