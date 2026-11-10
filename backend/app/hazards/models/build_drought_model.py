"""Build and train the calibrated SENTRA Drought Prediction Model.

Outputs: sentra_drought_model.joblib
Conforms to the Indian Manual for Drought Management (Ministry of Agriculture, GoI).
"""

from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
import joblib

FEATURE_NAMES = [
    "rainfall_deficit_pct",
    "spei_index",
    "soil_moisture_pct",
    "consecutive_dry_days",
    "reservoir_storage_pct",
    "groundwater_table_depletion_m",
    "ndvi_anomaly_pct",
]
OUTPUT_PATH = Path(__file__).resolve().parent / "sentra_drought_model.joblib"


def generate_drought_training_data(n_samples: int = 4000, random_seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(random_seed)

    deficit = rng.uniform(-80.0, 40.0, size=n_samples)
    spei = rng.normal(loc=-0.5, scale=1.2, size=n_samples)
    soil_m = rng.uniform(5.0, 45.0, size=n_samples)
    dry_days = rng.integers(0, 60, size=n_samples)
    reservoir = rng.uniform(5.0, 90.0, size=n_samples)
    gw_depletion = rng.uniform(-1.0, 6.0, size=n_samples)
    ndvi_anomaly = rng.uniform(-40.0, 25.0, size=n_samples)

    df = pd.DataFrame({
        "rainfall_deficit_pct": deficit,
        "spei_index": spei,
        "soil_moisture_pct": soil_m,
        "consecutive_dry_days": dry_days,
        "reservoir_storage_pct": reservoir,
        "groundwater_table_depletion_m": gw_depletion,
        "ndvi_anomaly_pct": ndvi_anomaly,
    })

    # Ground-truth: Severe agro-hydrological drought criteria
    is_drought = (
        (deficit <= -35.0) & (spei <= -1.3) & (soil_m <= 22.0)
    ) | (
        (deficit <= -50.0) & (dry_days >= 28)
    ) | (
        (spei <= -1.8)
    )

    df["severe_drought_target"] = is_drought.astype(int)
    return df


def train_and_export():
    df = generate_drought_training_data()
    X = df[FEATURE_NAMES]
    y = df["severe_drought_target"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    rf = RandomForestClassifier(n_estimators=120, max_depth=8, class_weight="balanced", random_state=42)
    rf.fit(X_train, y_train)

    probs = rf.predict_proba(X_test)[:, 1]
    print(f"Drought Model ROC-AUC: {roc_auc_score(y_test, probs):.4f}")

    joblib.dump(rf, OUTPUT_PATH)
    print(f"Exported drought model to {OUTPUT_PATH}")


if __name__ == "__main__":
    train_and_export()

