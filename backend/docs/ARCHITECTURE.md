# SENTRA System Architecture

## 1. Overview
**SENTRA** (*State-wise Environmental, Natural-disaster, Health-impact and Resource Optimization Platform*) is an enterprise disaster-risk management and emergency resource allocation backend designed for India.

The architecture is built as a **modular monolith** in Python 3.12 using FastAPI, PostgreSQL, SQLAlchemy 2.x, Alembic, and Google OR-Tools.

```
                              ┌─────────────────────────────┐
                              │     FastAPI HTTP Client     │
                              │ (Swagger UI / ReDoc / Apps) │
                              └──────────────┬──────────────┘
                                             │ Bearer JWT (HS256)
                                             ▼
                              ┌─────────────────────────────┐
                              │      API v1 Routers         │
                              │   (Auth, Geo, Resources...) │
                              └──────────────┬──────────────┘
                                             │
             ┌───────────────────────────────┼───────────────────────────────┐
             ▼                               ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│     Geographic &        │     │  Hazard Prediction      │     │  Emergency Resource     │
│   Observation Data      │     │  Adapter Registry (7)   │     │  Optimization Engine    │
│ (States/Districts/Obs)  │     │  (Readiness / Provenance)│    │  (Google OR-Tools MIP)  │
└────────────┬────────────┘     └────────────┬────────────┘     └────────────┬────────────┘
             │                               │                               │
             ▼                               ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           Domain Services & Business Rules                              │
│         (AuthService, RiskService, HealthImpactService, ResourceService, etc.)          │
└────────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                             PostgreSQL Relational Storage                               │
│      (16 Tables: RBAC, Geography, Observations, Risk, Health, Inventory, Auditing)      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Principles

### 2.1 Geographic Hierarchy vs. Hazard Models
- **Geographic Layer**: Organised hierarchically: `India -> State / UT -> District -> Location / Facility`.
- **Hazard Model Layer**: 7 independent hazard-specific model adapters (Flood, Cyclone, Earthquake, Drought, Landslide, Tsunami, Heatwave). Hazard models are decoupled from individual states—the same Flood model will ingest location-specific hydrological parameters regardless of administrative boundary.

### 2.2 Prediction vs. Operational Safety Separation
- Machine learning models are currently untrained. The system implements an explicit **Adapter & Registry Pattern**.
- If inference is requested for an unconfigured model, the system records the provenance and transactionally returns an HTTP `503 Service Unavailable` with status `MODEL_UNAVAILABLE`.
- It **never fabricates ML predictions** or hallucinates casualty counts.
- Operations that do not require ML models (inventory management, simulation with explicit scenario inputs, reference data, user management) function completely independently.

### 2.3 Proposed Allocations vs. Live Inventory
- OR-Tools optimization runs produce **proposed allocation plans** (`status="PROPOSED"`).
- Proposed plans do not mutate live resource capacity automatically.
- Authorized coordinators must execute a dedicated confirmation step (`POST /optimization/allocations/{id}/confirm`) which verifies capacity under a database lock and decrements `available_capacity`.

---

## 3. Directory Layout & Module Responsibilities

- **`app/api/`**: HTTP endpoints, route grouping, request validation, and dependency injection (`deps.py`).
- **`app/core/`**: Configuration (`config.py`), Argon2id & PyJWT security (`security.py`), RBAC & geographic scope rules (`permissions.py`), request correlation & rate limiting (`middleware.py`), and domain exceptions (`exceptions.py`).
- **`app/db/`**: Declarative base, engine connection, session generator, and initial DB seeding (`base.py`, `session.py`, `init_db.py`).
- **`app/models/`**: 16 SQLAlchemy 2.x declarative models with foreign keys, check constraints, and unique indices.
- **`app/schemas/`**: Pydantic v2 schemas for type-safe validation and response serialization.
- **`app/services/`**: Encapsulated business logic decoupling HTTP handlers from raw database transactions.
- **`app/prediction/`**: `BasePredictor` contract, `UnavailableHazardPredictor` adapters, and the `PredictorRegistry`.
- **`app/optimization/`**: Google OR-Tools Mixed-Integer Programming (MIP) solver for multi-point resource allocation.
- **`migrations/`**: Alembic schema versioning scripts.
- **`scripts/`**: Administrator bootstrapping and representative development reference dataset seeding.
- **`tests/`**: Unit, integration, security, and API test suites.
