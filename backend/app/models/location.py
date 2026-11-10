"""Geographic database models: State, District, and Location."""

from typing import List, Optional
from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class State(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "states"

    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    code: Mapped[str] = mapped_column(String(10), unique=True, index=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    districts: Mapped[List["District"]] = relationship(
        "District",
        back_populates="state",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class District(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "districts"
    __table_args__ = (
        UniqueConstraint("state_id", "name", name="uq_state_district_name"),
    )

    state_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("states.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    code: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    population: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    area_sq_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    state: Mapped[State] = relationship("State", back_populates="districts")
    locations: Mapped[List["Location"]] = relationship(
        "Location",
        back_populates="district",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Location(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "locations"

    district_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("districts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    location_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
        doc="HOSPITAL, SHELTER, STAGING_AREA, OBSERVATION_STATION, DEMAND_ZONE",
    )
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    district: Mapped[District] = relationship("District", back_populates="locations")
