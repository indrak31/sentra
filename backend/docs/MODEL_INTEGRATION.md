# SENTRA Hazard Model Integration Architecture

## 1. Context and Current Status
The seven disaster-prediction machine learning models for SENTRA have **not yet been trained**.

In accordance with strict system requirements:
- No fake predictions or mock probabilities are generated.
- No model training artifacts or fake checkpoints are added.
- The platform implements the **Adapter Pattern** and an explicit **Model Registry** to govern model readiness, provenance, and future integration without altering downstream business logic.

---

## 2. Supported Hazard Categories & Candidate Features

| Hazard | Methodology / Model Scope | Candidate Features |
| :--- | :--- | :--- |
| **FLOOD** | Hydrological runoff & river inundation | Rainfall, cumulative rainfall, river level, elevation, slope, land cover, drainage capacity |
| **CYCLONE** | Atmospheric trajectory & wind speed | Storm position, wind speed, atmospheric pressure, forecast track, coastal exposure |
| **EARTHQUAKE** | Ground motion & seismic shaking | Seismic observations, magnitude, focal depth, geological conditions, seismic zone |
| **DROUGHT** | Agricultural & meteorological deficit | Rainfall deficit, soil moisture, temperature, evapotranspiration, vegetation indices |
| **LANDSLIDE** | Slope stability & rainfall trigger | Rainfall, slope, terrain, soil characteristics, land cover, previous landslide records |
| **TSUNAMI** | Coastal wave runup & displacement | Undersea earthquake magnitude, focal depth, bathymetry, coastal elevation |
| **HEATWAVE** | Thermal stress & apparent temperature | Max temperature, min temperature, humidity, apparent temperature, heatwave duration |

---

## 3. Predictor Interface (`BasePredictor`)

Every model adapter implements `app.prediction.base.BasePredictor`:

```python
class BasePredictor(ABC):
    @property
    @abstractmethod
    def hazard_type(self) -> HazardType: ...

    @property
    @abstractmethod
    def model_name(self) -> str: ...

    @property
    @abstractmethod
    def model_version(self) -> str: ...

    @property
    @abstractmethod
    def is_available(self) -> bool: ...

    @property
    @abstractmethod
    def readiness_status(self) -> str: ...

    @property
    @abstractmethod
    def expected_inputs(self) -> List[str]: ...

    @abstractmethod
    def validate_inputs(self, input_data: Dict[str, Any]) -> Dict[str, Any]: ...

    @abstractmethod
    def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]: ...
```

---

## 4. Current Unavailable Behavior

By default, all seven hazard adapters are registered as `UnavailableHazardPredictor`:
- `is_available` returns `False`.
- `readiness_status` returns `"NOT_TRAINED"`.
- Calling `predict()` raises a typed `ModelUnavailableException` (HTTP 503).
- The platform records an assessment entry with status `MODEL_UNAVAILABLE` and data provenance in the database before raising the exception.

---

## 5. Integrating Future Trained Models

When a validated, trained model (e.g. for Flood prediction) becomes available:

1. Create a concrete class `FloodPredictor(BasePredictor)` in `app/prediction/adapters/flood.py`.
2. Implement preprocessing and inference inside `validate_inputs()` and `predict()`.
3. Register the trained predictor in `app/prediction/registry.py`:
   ```python
   predictor_registry.register(HazardType.FLOOD, FloodPredictor())
   ```
4. No changes are required in `risk_assessment_service.py`, `health_impact_service.py`, or any API route.
