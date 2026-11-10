"""Scenario simulation database model."""

from typing import Any, Dict, Optional
from sqlalchemy import ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.allocation import OptimizationRun


class Simulation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "simulations"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    baseline_run_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("optimization_runs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    scenario_parameters: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30),
        default="COMPLETED",
        index=True,
        nullable=False,
        doc="COMPLETED, FAILED",
    )
    result_summary: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    baseline_run: Mapped[Optional[OptimizationRun]] = relationship("OptimizationRun")
