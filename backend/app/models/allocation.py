"""Optimization run and resource allocation database models."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.location import District
from app.models.resource import Resource


class OptimizationRun(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "optimization_runs"

    district_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("districts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="OPTIMAL",
        index=True,
        nullable=False,
        doc="OPTIMAL, FEASIBLE, INFEASIBLE, INVALID_INPUT, FAILED",
    )
    solver_status: Mapped[str] = mapped_column(String(50), nullable=False)
    objective_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    input_snapshot: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    result_summary: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    unmet_demand: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    unused_capacity: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    allocations: Mapped[List["Allocation"]] = relationship(
        "Allocation",
        back_populates="optimization_run",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Allocation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "allocations"

    optimization_run_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("optimization_runs.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    resource_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("resources.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    district_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("districts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    allocated_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20),
        default="PROPOSED",
        index=True,
        nullable=False,
        doc="PROPOSED, CONFIRMED, RELEASED",
    )
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    optimization_run: Mapped[Optional[OptimizationRun]] = relationship(
        "OptimizationRun", back_populates="allocations"
    )
    resource: Mapped[Resource] = relationship("Resource")
    district: Mapped[District] = relationship("District")
