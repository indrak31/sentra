"""Environmental observation database model."""

from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin, utc_now
from app.models.location import District, Location


class Observation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "observations"
    __table_args__ = (
        UniqueConstraint("data_source", "external_record_id", name="uq_source_external_record"),
    )

    district_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("districts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    location_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("locations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    observation_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
        doc="RAINFALL, RIVER_LEVEL, TEMPERATURE, WIND_SPEED, SEISMIC_INTENSITY, HUMIDITY, SOIL_MOISTURE",
    )
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    data_source: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    external_record_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    quality_status: Mapped[str] = mapped_column(
        String(20),
        default="UNVERIFIED",
        nullable=False,
        doc="VERIFIED, UNVERIFIED, SUSPECT",
    )
    ingestion_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    district: Mapped[District] = relationship("District")
    location: Mapped[Optional[Location]] = relationship("Location")
