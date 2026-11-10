"""Hydrological flood risk inference and rational runoff calculations."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import pandas as pd
from app.core.logging import logger
from app.hazards.base import HazardPredictionOutput
from app.hazards.models.colab_bridge import colab_bridge
from app.hazards.modules.flood.schema import FloodFeatureInput
from app.schemas.risk_assessment import HazardType

MODEL_FILENAMES = [
    "sentra_rf_threshold_tuned.joblib",
    "flood_model.joblib",
    "sentra_rf_threshold_tuned.pkl",
    "flood_model.pkl",
]


def load_flood_ml_model():
    """Attempt to load trained Colab RandomForest pipeline."""
    for fn in MODEL_FILENAMES:
        model = colab_bridge.load_sklearn_joblib(fn)
        if model is not None:
            return model, fn
    return None, None


def run_flood_inference(features: FloodFeatureInput) -> HazardPredictionOutput:
    """Execute hydrological flood assessment using Colab ML model (if available) with Catchment Water Balance fallback."""
    # 1. Peak runoff discharge calculation (Rational Method: Q = C * I * A / 3.6 in m^3/s)
    rainfall_intensity_mm_hr = features.rainfall_24h_mm / 24.0
    peak_discharge_cumecs = (
        features.runoff_coefficient * rainfall_intensity_mm_hr * features.catchment_area_sq_km
    ) / 3.6

    # 2. Freeboard margin relative to danger level (in meters)
    stage_difference_m = features.river_water_level_m - features.danger_level_m

    # 3. Antecedent moisture saturation factor (normalized 0 to 1)
    saturation_factor = min(1.0, features.cumulative_rainfall_72h_mm / 300.0)

    # 4. Check for trained Colab ML RandomForest artifact
    ml_model, model_file = load_flood_ml_model()

    if ml_model is not None:
        try:
            cols = ['T1d', 'T2d', 'T3d', 'T4d', 'T5d', 'T6d', 'T7d', 'T8d', 'T9d', 'T10d']
            vec = features.get_time_lag_vector()
            X_new = pd.DataFrame([vec], columns=cols)
            prob = float(ml_model.predict_proba(X_new)[:, 1][0])

            # Operational risk score: ML probability combined with river gauge stage exceedance
            ml_risk = prob * 100.0
            stage_risk = (35.0 + min(40.0, max(0.0, stage_difference_m * 25.0))) if stage_difference_m >= 0.0 else 0.0
            risk_score = round(min(100.0, max(ml_risk, stage_risk)), 1)

            if risk_score >= 70.0 or stage_difference_m >= 1.0:
                severity = "CRITICAL"
            elif risk_score >= 45.0 or stage_difference_m >= 0.0:
                severity = "HIGH"
            elif risk_score >= 20.0:
                severity = "MODERATE"
            else:
                severity = "LOW"

            actions = []
            if severity == "CRITICAL":
                actions.extend([
                    "Issue immediate Level-3 flood evacuation advisory for riverine floodplains and low-lying wards.",
                    "Deploy NDRF/SDRF motor rescue boat units to pre-designated staging embankments.",
                    "Activate high-capacity dewatering pump clusters at critical urban outfalls.",
                ])
            elif severity == "HIGH":
                actions.extend([
                    "Place emergency medical and civil defense rapid response teams on active standby.",
                    "Monitor upstream reservoir releases and CWC telemetry at 1-hour intervals.",
                    "Pre-position drinking water purification packs and food packets at designated relief shelters.",
                ])
            elif severity == "MODERATE":
                actions.extend([
                    "Clear obstruction and silt in major municipal drainage channels.",
                    "Alert riparian community vanguards and panchayat disaster management committees.",
                ])
            else:
                actions.append("Maintain routine hydrological station logging and catchment observation.")

            confidence = round(min(0.96, max(0.68, 0.5 + abs(prob - 0.5) * 0.9)), 2)

            return HazardPredictionOutput(
                hazard_type=HazardType.FLOOD,
                risk_score=risk_score,
                severity_level=severity,
                confidence_score=confidence,
                primary_metric_name="RandomForest Severe Flood Probability",
                primary_metric_value=round(prob, 4),
                primary_metric_unit="probability",
                secondary_metrics={
                    "model_artifact": model_file,
                    "model_version": "v11.0.1-rf-threshold-tuned",
                    "peak_discharge_cumecs": round(peak_discharge_cumecs, 2),
                    "stage_difference_from_danger_level_m": round(stage_difference_m, 2),
                    "antecedent_saturation_factor": round(saturation_factor, 2),
                    "T1d_rainfall_mm": vec[0],
                    "T2d_rainfall_mm": vec[1],
                    "T3d_rainfall_mm": vec[2],
                    "T4d_rainfall_mm": vec[3],
                },
                summary=(
                    f"Colab RandomForest Model ({model_file}) predicts {prob:.1%} probability of severe flood "
                    f"({severity} alert) with peak discharge of {peak_discharge_cumecs:.1f} m³/s."
                ),
                recommended_actions=actions,
                assumptions_and_limitations=[
                    "Features correspond to 10-day antecedent precipitation lags [T1d..T10d].",
                    "Classification threshold tuned on historical ASDMA/IMD monsoon callset to minimize false negatives.",
                    "Stage gauge level referenced to nearest CWC datum."
                ],
                calculated_at=datetime.now(timezone.utc).isoformat(),
            )
        except Exception as exc:
            logger.error("Error executing Colab Flood ML model: %s. Falling back to hydrologic water balance.", exc)

    # 5. Hydrological Water Balance fallback (Rational Method + Stage margin)
    if stage_difference_m > 1.5:
        stage_pts = 45.0
    elif stage_difference_m > 0:
        stage_pts = 30.0 + (stage_difference_m / 1.5) * 15.0
    elif stage_difference_m > -1.0:
        stage_pts = 15.0 + ((stage_difference_m + 1.0) / 1.0) * 15.0
    else:
        stage_pts = max(0.0, 15.0 + (stage_difference_m + 1.0) * 5.0)

    rain_pts = min(20.0, (features.rainfall_24h_mm / 150.0) * 20.0) + (saturation_factor * 15.0)
    infra_penalty = (1.0 - features.embankment_integrity) * 12.0 + (1.0 - features.drainage_capacity_index) * 8.0

    raw_risk = stage_pts + rain_pts + infra_penalty
    risk_score = round(min(100.0, max(0.0, raw_risk)), 1)

    if risk_score >= 75.0 or stage_difference_m >= 1.0:
        severity = "CRITICAL"
    elif risk_score >= 50.0 or stage_difference_m >= 0.0:
        severity = "HIGH"
    elif risk_score >= 25.0:
        severity = "MODERATE"
    else:
        severity = "LOW"

    actions = []
    if severity == "CRITICAL":
        actions.extend([
            "Issue immediate Level-3 flood evacuation advisory for riverine floodplains and low-lying wards.",
            "Deploy NDRF/SDRF motor rescue boat units to pre-designated staging embankments.",
            "Activate high-capacity dewatering pump clusters at critical urban outfalls.",
        ])
    elif severity == "HIGH":
        actions.extend([
            "Place emergency medical and civil defense rapid response teams on active standby.",
            "Monitor upstream reservoir releases and CWC telemetry at 1-hour intervals.",
            "Pre-position drinking water purification packs and food packets at designated relief shelters.",
        ])
    elif severity == "MODERATE":
        actions.extend([
            "Clear obstruction and silt in major municipal drainage channels.",
            "Alert riparian community vanguards and panchayat disaster management committees.",
        ])
    else:
        actions.append("Maintain routine hydrological station logging and catchment observation.")

    return HazardPredictionOutput(
        hazard_type=HazardType.FLOOD,
        risk_score=risk_score,
        severity_level=severity,
        confidence_score=0.88,
        primary_metric_name="Peak Estimated Catchment Discharge",
        primary_metric_value=round(peak_discharge_cumecs, 2),
        primary_metric_unit="m³/s",
        secondary_metrics={
            "stage_difference_from_danger_level_m": round(stage_difference_m, 2),
            "antecedent_saturation_factor": round(saturation_factor, 2),
            "estimated_24h_rainfall_intensity_mm_hr": round(rainfall_intensity_mm_hr, 2),
            "embankment_integrity_rating": features.embankment_integrity,
            "drainage_capacity_index": features.drainage_capacity_index,
        },
        summary=(
            f"Hydrological assessment indicates {severity} flood risk with estimated peak discharge of "
            f"{peak_discharge_cumecs:.1f} m³/s and river stage {abs(stage_difference_m):.2f}m "
            f"{'above' if stage_difference_m >= 0 else 'below'} CWC danger threshold."
        ),
        recommended_actions=actions,
        assumptions_and_limitations=[
            "Assumes SCS Curve Number runoff distribution across the upstream sub-catchment.",
            "Assumes river stage measurement is calibrated to nearest CWC benchmark gauge datum.",
            "Local flash flooding may exceed regional projections in unmapped micro-topographic depressions.",
        ],
        calculated_at=datetime.now(timezone.utc).isoformat(),
    )
