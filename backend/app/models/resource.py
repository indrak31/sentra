"""Emergency resource database model."""

from typing import Any, Dict, Optional
from sqlalchemy import CheckConstraint, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.location import District, Location


class Resource(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "resources"
    __table_args__ = (
        CheckConstraint("available_capacity <= total_capacity", name="ck_resource_avail_le_total"),
        CheckConstraint("available_capacity >= 0", name="ck_resource_avail_non_negative"),
        CheckConstraint("total_capacity >= 0", name="ck_resource_total_non_negative"),
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
    resource_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
        doc="AMBULANCE, HOSPITAL_BED, MEDICAL_TEAM, TEMPORARY_SHELTER, RESCUE_TEAM, RELIEF_SUPPLY_PACK",
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    total_capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    available_capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    operational_status: Mapped[str] = mapped_column(
        String(30),
        default="OPERATIONAL",
        nullable=False,
        doc="OPERATIONAL, DEGRADED, OFFLINE",
    )
    capabilities: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    district: Mapped[District] = relationship("District")
    location: Mapped[Optional[Location]] = relationship("Location")
