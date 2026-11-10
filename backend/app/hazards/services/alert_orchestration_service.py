"""Alert orchestration service evaluating hazard risks against official threshold criteria."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.hazards.base import HazardPredictionOutput
from app.schemas.risk_assessment import HazardType


class AlertOrchestrationService:
    """Evaluates multi-hazard inference results and telemetry against statutory early-warning thresholds."""

    def evaluate_alert_thresholds(
        self,
        district_id: str,
        hazard_type: HazardType,
        prediction: HazardPredictionOutput,
    ) -> Optional[Dict[str, Any]]:
        """Determine if a prediction warrants an official emergency alert escalation."""
        if prediction.severity_level not in ["HIGH", "CRITICAL"]:
            return None

        # Severity mapping
        alert_severity = "SEVERE" if prediction.severity_level == "CRITICAL" else "HIGH"

        alert_title = f"{hazard_type.value.capitalize()} Early Warning Advisory: {prediction.severity_level} Threat Level"
        alert_desc = (
            f"Automated hazard assessment triggered threshold alert: {prediction.summary} "
            f"Recommended Immediate Action: {prediction.recommended_actions[0] if prediction.recommended_actions else 'Monitor official state bulletins.'}"
        )

        return {
            "district_id": district_id,
            "hazard_type": hazard_type.value,
            "severity": alert_severity,
            "status": "ACTIVE",
            "title": alert_title,
            "description": alert_desc,
            "triggered_by_prediction": True,
            "risk_score": prediction.risk_score,
            "primary_metric": f"{prediction.primary_metric_name}: {prediction.primary_metric_value} {prediction.primary_metric_unit}",
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }


alert_orchestration_service = AlertOrchestrationService()

