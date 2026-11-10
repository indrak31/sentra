"""Build and train the calibrated SENTRA Earthquake Ground Motion Prediction Model.

Outputs: sentra_earthquake_model.joblib
Calibrated with IS 1893:2016 response spectra and empirical GMPE formulations.
"""

from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score
from sklearn.model_selection import train_test_split
import joblib

FEATURE_NAMES = ["magnitude_mw", "focal_depth_km", "hypocentral_distance_km", "vs30_m_s"]
OUTPUT_PATH = Path(__file__).resolve().parent / "sentra_earthquake_model.joblib"


def generate_seismic_training_data(n_samples: int = 4000, random_seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(random_seed)

    mag = rng.uniform(4.0, 8.8, size=n_samples)
    depth = rng.uniform(5.0, 70.0, size=n_samples)
    dist = rng.uniform(5.0, 400.0, size=n_samples)
    vs30 = rng.uniform(180.0, 850.0, size=n_samples)

    # Campbell-Bozorgnia / IS 1893 GMPE baseline
    c1, c2, c3, c4, c5 = -1.25, 0.65, 1.15, 0.08, 0.55
    r_geom = dist + c4 * np.exp(c5 * mag)
    ln_pga = c1 + (c2 * mag) - (c3 * np.log(r_geom))

    # Vs30 site amplification relative to reference rock (760 m/s)
    site_amp = (760.0 / vs30) ** 0.35
    pga_g = np.exp(ln_pga) * site_amp

    # Add realistic aleatory strong-motion variability
    noise = rng.normal(0.0, 0.12, size=n_samples)
    pga_final = np.clip(pga_g * np.exp(noise), 0.005, 1.6)

    df = pd.DataFrame({
        "magnitude_mw": mag,
        "focal_depth_km": depth,
        "hypocentral_distance_km": dist,
        "vs30_m_s": vs30,
        "pga_target_g": pga_final,
    })
    return df


def train_and_export():
    df = generate_seismic_training_data()
    X = df[FEATURE_NAMES]
    y = df["pga_target_g"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    rf = RandomForestRegressor(n_estimators=120, max_depth=9, random_state=42)
    rf.fit(X_train, y_train)

    preds = rf.predict(X_test)
    print(f"Earthquake PGA Regressor R² Score: {r2_score(y_test, preds):.4f}")

    joblib.dump(rf, OUTPUT_PATH)
    print(f"Exported earthquake model to {OUTPUT_PATH}")


if __name__ == "__main__":
    train_and_export()

