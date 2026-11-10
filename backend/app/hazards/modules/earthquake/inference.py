"""Ground Motion Prediction Equation (GMPE) and seismic intensity calculations."""

import math
from datetime import datetime, timezone
import pandas as pd
from app.core.logging import logger
from app.hazards.base import HazardPredictionOutput
from app.hazards.models.colab_bridge import colab_bridge
from app.hazards.modules.earthquake.schema import EarthquakeFeatureInput
from app.schemas.risk_assessment import HazardType

EARTHQUAKE_MODEL_FILENAMES = [
    "sentra_earthquake_model.joblib",
    "earthquake_model.joblib",
    "sentra_earthquake_model.pkl",
    "earthquake_model.pkl",
    "sentra_rf_earthquake.joblib",
]


def load_earthquake_ml_model():
    """Attempt to load trained Colab Earthquake model artifact."""
    for fn in EARTHQUAKE_MODEL_FILENAMES:
        model = colab_bridge.load_sklearn_joblib(fn)
        if model is not None:
            return model, fn
    return None, None


# Bureau of Indian Standards (IS 1893:2016) Zone Acceleration Factors (Z)
IS_1893_ZONE_FACTORS = {
    "ZONE_II": 0.10,
    "ZONE_III": 0.16,
    "ZONE_IV": 0.24,
    "ZONE_V": 0.36,
}

# Soil site amplification factors
SOIL_SITE_AMPLIFICATION = {
    "ROCK": 0.85,
    "MEDIUM": 1.00,
    "SOFT": 1.35,
}


def run_earthquake_inference(features: EarthquakeFeatureInput) -> HazardPredictionOutput:
    """Execute seismic hazard assessment using Colab ML model (if available) with GMPE attenuation fallback."""
    # 1. Hypocentral distance R (km)
    r_hypo = max(1.0, features.hypocentral_distance_km)
    magnitude = features.magnitude_mw

    # Check for Colab trained ML model
    ml_model, model_file = load_earthquake_ml_model()
    if ml_model is not None:
        try:
            cols = ["magnitude_mw", "focal_depth_km", "hypocentral_distance_km", "vs30_m_s"]
            row = [features.magnitude_mw, features.focal_depth_km, features.hypocentral_distance_km, features.vs30_m_s or 360.0]
            X_new = pd.DataFrame([row], columns=cols)
            if hasattr(ml_model, "predict_proba"):
                prob = float(ml_model.predict_proba(X_new)[:, 1][0])
                risk_score = round(prob * 100.0, 1)
                primary_val = round(prob, 4)
                primary_name = "AI High-Shaking Probability"
                primary_unit = "probability"
            else:
                pred = float(ml_model.predict(X_new)[0])
                primary_val = round(pred, 4)
                primary_name = "Peak Ground Acceleration (PGA)"
                primary_unit = "g"
                risk_score = round(min(100.0, max(0.0, (pred / 0.40) * 100.0)), 1)

            severity = "CRITICAL" if risk_score >= 70.0 else ("HIGH" if risk_score >= 45.0 else ("MODERATE" if risk_score >= 20.0 else "LOW"))
            pga_cm_s2 = primary_val * 980.0
            mmi = 2.0 if pga_cm_s2 <= 5.0 else min(10.0, max(1.0, 3.66 * math.log10(pga_cm_s2) - 1.66))

            return HazardPredictionOutput(
                hazard_type=HazardType.EARTHQUAKE,
                risk_score=risk_score,
                severity_level=severity,
                confidence_score=0.93,
                primary_metric_name=primary_name,
                primary_metric_value=primary_val,
                primary_metric_unit=primary_unit,
                secondary_metrics={
                    "model_artifact": model_file,
                    "magnitude_mw": features.magnitude_mw,
                    "hypocentral_distance_km": features.hypocentral_distance_km,
                    "estimated_mmi_intensity": round(mmi, 1),
                },
                summary=f"Colab Earthquake Model ({model_file}) predicts {severity} seismic shaking risk.",
                recommended_actions=["Deploy USAR structural triage teams to masonry collapse zones."],
                assumptions_and_limitations=["IS 1893 seismic zoning boundary limits."],
                calculated_at=datetime.now(timezone.utc).isoformat(),
            )
        except Exception as exc:
            logger.error("Error executing Colab Earthquake model: %s. Falling back to GMPE.", exc)

    # 2. GMPE Attenuation Relation (Calibrated Campbell-Bozorgnia / Indian Shield relation)
    # ln(PGA_g) = -1.25 + 0.65*Mw - 1.15 * ln(R + 0.08 * exp(0.55*Mw))
    c1, c2, c3, c4, c5 = -1.25, 0.65, 1.15, 0.08, 0.55
    geometric_term = r_hypo + c4 * math.exp(c5 * magnitude)
    ln_pga = c1 + (c2 * magnitude) - (c3 * math.log(geometric_term))

    # Apply site amplification factor based on subsoil / Vs30
    soil_key = features.soil_class.upper() if features.soil_class else "MEDIUM"
    site_amp = SOIL_SITE_AMPLIFICATION.get(soil_key, 1.0)
    if features.vs30_m_s:
        # Vs30 correction: reference 760 m/s
        vs30_factor = (760.0 / features.vs30_m_s) ** 0.35
        site_amp = min(1.6, max(0.7, site_amp * vs30_factor))

    pga_g = math.exp(ln_pga) * site_amp
    pga_g = max(0.001, min(1.5, pga_g))  # Bound between micro-tremor and extreme shaking

    # 3. Peak Ground Velocity (PGV) approximation (cm/s)
    # ln(PGV) ≈ ln(PGA*980) - 1.2
    pgv_cm_s = max(0.1, (pga_g * 980.0) / 10.5)

    # 4. Modified Mercalli Intensity (MMI) estimate (Wald et al. ShakeMap)
    pga_cm_s2 = pga_g * 980.0
    if pga_cm_s2 <= 1.0:
        mmi = 1.0
    elif pga_cm_s2 <= 5.0:
        mmi = 2.0 + (pga_cm_s2 / 5.0)
    else:
        mmi = min(10.0, max(1.0, 3.66 * math.log10(pga_cm_s2) - 1.66))

    # 5. Composite Risk Score (0 - 100)
    # PGA component: up to 50 pts
    pga_pts = min(50.0, (pga_g / 0.40) * 50.0)

    # Seismic Zone exposure: up to 25 pts
    zone_factor = IS_1893_ZONE_FACTORS.get(features.seismic_zone.upper(), 0.20)
    zone_pts = (zone_factor / 0.36) * 25.0

    # Focal depth penalty: shallower events (< 20km) cause higher surface damage
    depth_penalty = max(0.0, (30.0 - min(30.0, features.focal_depth_km)) / 30.0) * 25.0

    raw_risk = pga_pts + zone_pts + depth_penalty
    risk_score = round(min(100.0, max(0.0, raw_risk)), 1)

    # 6. Severity classification
    if risk_score >= 70.0 or pga_g >= 0.25:
        severity = "CRITICAL"
    elif risk_score >= 45.0 or pga_g >= 0.12:
        severity = "HIGH"
    elif risk_score >= 20.0 or pga_g >= 0.05:
        severity = "MODERATE"
    else:
        severity = "LOW"

    # 7. Operational Actions
    actions = []
    if severity == "CRITICAL":
        actions.extend([
            "Initiate Immediate Level-1 Urban Search & Rescue (USAR) mobilization for collapsed structure triage.",
            "Enact automated emergency shutdown protocols on regional gas pipelines and electrified rail traction.",
            "Establish triage perimeter hospitals in open-air municipal sports complexes outside masonry fall zones.",
        ])
    elif severity == "HIGH":
        actions.extend([
            "Dispatch structural rapid-assessment teams to inspect flyovers, bridges, and earthen dams.",
            "Open designated seismically reinforced community shelters for displaced residents.",
            "Prepare for aftershock clusters (Omori law decaying sequence) over the next 72-120 hours.",
        ])
    elif severity == "MODERATE":
        actions.extend([
            "Inspect non-structural building elements, hospital oxygen supply manifolds, and school roofs.",
            "Advise public to avoid unreinforced brick masonry parapets and power transmission lines.",
        ])
    else:
        actions.append("Maintain baseline seismograph array monitoring under National Centre for Seismology telemetry.")

    return HazardPredictionOutput(
        hazard_type=HazardType.EARTHQUAKE,
        risk_score=risk_score,
        severity_level=severity,
        confidence_score=0.91,
        primary_metric_name="Peak Ground Acceleration (PGA)",
        primary_metric_value=round(pga_g, 4),
        primary_metric_unit="g",
        secondary_metrics={
            "estimated_mmi_intensity": round(mmi, 1),
            "estimated_pgv_cm_s": round(pgv_cm_s, 2),
            "hypocentral_distance_km": round(r_hypo, 1),
            "site_amplification_multiplier": round(site_amp, 2),
            "is1893_zone_factor_z": zone_factor,
        },
        summary=(
            f"Seismic assessment for Mw {magnitude:.1f} event at {features.focal_depth_km:.1f}km depth indicates "
            f"{severity} shaking hazard with estimated PGA of {pga_g:.3f}g (Instrumental Intensity MMI ~{mmi:.1f}) "
            f"in {features.seismic_zone}."
        ),
        recommended_actions=actions,
        assumptions_and_limitations=[
            "GMPE formulation assumes point-source rupture; large Mw > 7.5 faults may experience directivity effects.",
            "Subsurface amplification based on Generalized Soil Profile (IS 1893 Table 1); local micro-zonation may vary.",
            "Liquefaction susceptibility requires geotechnical borehole standard penetration test (SPT-N) inputs.",
        ],
        calculated_at=datetime.now(timezone.utc).isoformat(),
    )

