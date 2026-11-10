"""Health-impact estimation database model."""

from typing import Any, Dict, Optional
from sqlalchemy import ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.location import District
from app.models.risk_assessment import RiskAssessment


class HealthImpact(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "health_impacts"

    risk_assessment_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("risk_assessments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    district_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("districts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(40),
        default="COMPLETE",
        index=True,
        nullable=False,
        doc="COMPLETE, INSUFFICIENT_DATA, SOURCE_PREDICTION_UNAVAILABLE, FAILED",
    )
    exposed_population: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    estimated_affected: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    vulnerability_indicators: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    estimated_medical_demand: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    estimation_method: Mapped[str] = mapped_column(String(100), nullable=False)
    estimation_version: Mapped[str] = mapped_column(String(50), nullable=False)
    assumptions: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    limitations: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    risk_assessment: Mapped[Optional[RiskAssessment]] = relationship("RiskAssessment")
    district: Mapped[District] = relationship("District")
