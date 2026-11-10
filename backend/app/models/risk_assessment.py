"""Hazard Risk Assessment database model."""

from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.location import District


class RiskAssessment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "risk_assessments"

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
    status: Mapped[str] = mapped_column(
        String(30),
        default="PENDING",
        index=True,
        nullable=False,
        doc="PENDING, SUCCEEDED, FAILED, MODEL_UNAVAILABLE, INSUFFICIENT_DATA",
    )
    time_horizon: Mapped[str] = mapped_column(String(50), default="24h", nullable=False)
    input_snapshot: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    prediction_result: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    model_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    model_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    data_provenance: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    error_details: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    district: Mapped[District] = relationship("District")
