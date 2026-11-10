"""Emergency alert database model."""

from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.location import District
from app.models.risk_assessment import RiskAssessment
from app.models.user import User


class Alert(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "alerts"

    district_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("districts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    hazard_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
        doc="FLOOD, CYCLONE, EARTHQUAKE, DROUGHT, LANDSLIDE, TSUNAMI, HEATWAVE",
    )
    risk_assessment_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("risk_assessments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    severity: Mapped[str] = mapped_column(
        String(20),
        default="MODERATE",
        index=True,
        nullable=False,
        doc="LOW, MODERATE, HIGH, CRITICAL",
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="ACTIVE",
        index=True,
        nullable=False,
        doc="DRAFT, ACTIVE, ACKNOWLEDGED, RESOLVED, CANCELLED",
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    issued_by: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    acknowledged_by: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    district: Mapped[District] = relationship("District")
    risk_assessment: Mapped[Optional[RiskAssessment]] = relationship("RiskAssessment")
    issuer: Mapped[User] = relationship("User", foreign_keys=[issued_by])
    acknowledger: Mapped[Optional[User]] = relationship("User", foreign_keys=[acknowledged_by])
