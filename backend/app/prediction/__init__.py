"""Hazard model prediction interfaces and registry."""

from app.prediction.base import BasePredictor
from app.prediction.registry import PredictorRegistry, predictor_registry
from app.prediction.unavailable import UnavailableHazardPredictor

__all__ = [
    "BasePredictor",
    "PredictorRegistry",
    "predictor_registry",
    "UnavailableHazardPredictor",
]
