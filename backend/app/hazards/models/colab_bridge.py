"""Colab Bridge: Helper utilities to load Google Colab trained model checkpoints or bridge to live Colab API endpoints."""

import os
from pathlib import Path
from typing import Any, Dict, Optional
import httpx
from app.core.logging import logger

# Directory where user can drop .pkl, .joblib, .pt, or .onnx files downloaded from Colab
MODELS_DIR = Path(__file__).resolve().parent

# Optional: live ngrok / Colab tunnel URL set in environment variable or config
COLAB_API_URL = os.getenv("COLAB_API_URL", "").strip()


class ColabBridge:
    """Manages loading Colab exported model weights or calling live Colab inference endpoints."""

    def __init__(self):
        self._loaded_models: Dict[str, Any] = {}
        self.models_dir = MODELS_DIR

    def get_model_path(self, filename: str) -> Path:
        """Resolve path to a model artifact in the models directory."""
        return self.models_dir / filename

    def has_artifact(self, filename: str) -> bool:
        """Check if a specific model artifact file exists on disk."""
        return (self.models_dir / filename).is_file()

    def load_sklearn_joblib(self, filename: str) -> Optional[Any]:
        """Load a scikit-learn or XGBoost / LightGBM model saved via joblib."""
        path = self.get_model_path(filename)
        if not path.is_file():
            return None
        if filename not in self._loaded_models:
            import joblib
            try:
                self._loaded_models[filename] = joblib.load(path)
                logger.info("Successfully loaded Colab artifact: %s", filename)
            except Exception as e:
                logger.error("Failed to load %s: %s", filename, e)
                return None
        return self._loaded_models[filename]

    def call_colab_api(self, hazard_type: str, payload: Dict[str, Any], timeout: float = 12.0) -> Optional[Dict[str, Any]]:
        """Call a live Colab notebook exposing an HTTP endpoint (e.g. via ngrok or Gradio API)."""
        if not COLAB_API_URL:
            return None
        url = f"{COLAB_API_URL.rstrip('/')}/predict/{hazard_type.lower()}"
        try:
            with httpx.Client(timeout=timeout) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    return res.json()
        except Exception as exc:
            logger.warning("Could not reach Colab API at %s: %s", url, exc)
        return None


colab_bridge = ColabBridge()

