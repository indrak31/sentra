# SENTRA — State-wise Environmental, Natural-disaster, Health-impact and Resource Optimization Platform

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791.svg)](https://www.postgresql.org/)
[![OR-Tools](https://img.shields.io/badge/Google%20OR--Tools-9.15+-orange.svg)](https://developers.google.com/optimization)
[![Tests](https://img.shields.io/badge/Pytest-34%20Passed-brightgreen.svg)]()

A high-performance, modular backend engineered for nationwide disaster-risk assessment, epidemiological health impact forecasting, and mathematical emergency resource optimization across India.

---

## Table of Contents
1. [Project Name and Purpose](#1-project-name-and-purpose)
2. [The Disaster-Management Problem Addressed](#2-the-disaster-management-problem-addressed)
3. [The Seven Supported Hazard Categories](#3-the-seven-supported-hazard-categories)
4. [State-Wise Geographic Architecture](#4-state-wise-geographic-architecture)
5. [Hazard-Specific Prediction Architecture](#5-hazard-specific-prediction-architecture)
6. [Health-Impact Estimation](#6-health-impact-estimation)
7. [OR-Tools Resource Optimization](#7-or-tools-resource-optimization)
8. [Authentication and Role-Based Access](#8-authentication-and-role-based-access)
9. [Technology Stack](#9-technology-stack)
10. [Folder Structure](#10-folder-structure)
11. [Prerequisites](#11-prerequisites)
12. [Python Virtual Environment Setup](#12-python-virtual-environment-setup)
13. [Windows Activation Commands](#13-windows-activation-commands)
14. [macOS / Linux Activation Commands](#14-macos--linux-activation-commands)
15. [Dependency Installation](#15-dependency-installation)
16. [PostgreSQL Installation and Database Creation](#16-postgresql-installation-and-database-creation)
17. [Environment-Variable Configuration](#17-environment-variable-configuration)
18. [Alembic Migrations](#18-alembic-migrations)
19. [Administrator Bootstrap](#19-administrator-bootstrap)
20. [Starting the Backend](#20-starting-the-backend)
21. [Swagger UI and ReDoc Usage](#21-swagger-ui-and-redoc-usage)
22. [Authentication and Obtaining Tokens](#22-authentication-and-obtaining-tokens)
23. [Example API Requests](#23-example-api-requests)
24. [Running Tests](#24-running-tests)
25. [Current Model-Unavailable Behavior](#25-current-model-unavailable-behavior)
26. [How Future Trained Models Will Be Integrated](#26-how-future-trained-models-will-be-integrated)
27. [How the Optimization Engine Works](#27-how-the-optimization-engine-works)
28. [Common Errors and Solutions](#28-common-errors-and-solutions)
29. [Known Limitations](#29-known-limitations)
30. [Future Work](#30-future-work)

---

## 1. Project Name and Purpose
**SENTRA** (*State-wise Environmental, Natural-disaster, Health-impact and Resource Optimization Platform*) is an enterprise decision-intelligence backend designed for Indian disaster management authorities, public health departments, and emergency response commanders.

SENTRA provides the technological backbone to ingest environmental observations, evaluate multi-hazard risks across Indian states, project emergency medical surges, and mathematically optimize the allocation of constrained life-saving resources (ambulances, hospital beds, medical teams, relief packs).

---

## 2. The Disaster-Management Problem Addressed
India is exposed to diverse natural hazards across different geographies:
- **Floods**: Brahmaputra and Ganga basins (Assam, Bihar, Uttar Pradesh, West Bengal), Kerala river systems.
- **Cyclones**: Bay of Bengal and Arabian Sea coastlines (Odisha, Andhra Pradesh, Tamil Nadu, Gujarat, West Bengal).
- **Earthquakes**: Himalayan seismic belt, Northeast India, Gujarat (Kutch), and Andaman & Nicobar Islands.
- **Droughts**: Arid and semi-arid zones across Rajasthan, Maharashtra, Karnataka, and Telangana.
- **Landslides**: Western Ghats and Himalayan slopes (Uttarakhand, Himachal Pradesh, Kerala).
- **Tsunamis**: Vulnerable coastal areas and island territories.
- **Heatwaves**: Northern, Central, and Eastern plains experiencing extreme summer thermal distress.

During acute disaster events, authorities must rapidly answer:
1. Which districts and communities face imminent threat?
2. How many people will be exposed and displaced?
3. What is the expected surge in medical demand (ICU beds, ALS ambulances, field triage teams)?
4. Where are available resources positioned, and how should they be routed to minimize loss of life?
5. How will a worsening scenario (capacity loss, road cutoffs) impact emergency response?

SENTRA delivers structured APIs and mathematical optimization to resolve these critical operational questions.

---

## 3. The Seven Supported Hazard Categories
SENTRA natively defines independent prediction interfaces for seven natural hazard categories:
1. `FLOOD`: Inundation, rainfall runoff, river gauge discharge.
2. `CYCLONE`: Atmospheric pressure, wind speed trajectories, coastal surge.
3. `EARTHQUAKE`: Ground motion acceleration, focal depth, geological susceptibility.
4. `DROUGHT`: Precipitation deficit, soil moisture, evapotranspiration indices.
5. `LANDSLIDE`: Slope stability, geological composition, rainfall triggers.
6. `TSUNAMI`: Subsea seismic displacement, bathymetry, coastal runup.
7. `HEATWAVE`: Maximum/minimum temperature, relative humidity, thermal stress indices.

---

## 4. State-Wise Geographic Architecture
The platform is organized strictly along a nationwide geographic hierarchy:
$$\text{India} \longrightarrow \text{State / Union Territory} \longrightarrow \text{District} \longrightarrow \text{Location / Facility}$$

- State and district records use standardized administrative codes (e.g. `AS`, `MH`, `KL`).
- Operations, observations, resource inventories, and alerts are bound to specific districts via foreign keys.
- The system supports extensible nationwide reference data rather than hardcoded single-state logic.

---

## 5. Hazard-Specific Prediction Architecture
Prediction is decoupled from state boundaries:
- Hazard models learn from scientific meteorological and geological variables rather than administrative borders.
- Each hazard category implements an independent adapter conforming to the `BasePredictor` interface.
- Adapters are registered in a central `PredictorRegistry`, maintaining explicit metadata and expected feature signatures.

---

## 6. Health-Impact Estimation
The health-impact engine converts validated hazard assessments or scenario parameters into macro emergency demand figures:
- **Exposed Population**: Calculated from district census records or explicit operational overrides.
- **Estimated Affected Population**: Transparent mathematical modeling based on hazard severity and vulnerability factors:
  $$\text{Affected} = \text{Exposed} \times (\text{Severity} \times \text{Vulnerability} \times 0.15)$$
- **Medical Resource Surges**:
  - Hospital Beds: 5% of affected population.
  - ALS Ambulances: 0.5% of affected population.
  - Emergency Medical Teams: 0.2% of affected population.
  - Temporary Shelter Capacity: 20% displacement assumption.
  - Relief Supply Packs: 100% of affected population.
- If upstream data is incomplete, the system records `INSUFFICIENT_DATA` or `SOURCE_PREDICTION_UNAVAILABLE` rather than hallucinating zeros.

---

## 7. OR-Tools Resource Optimization
SENTRA uses **Google OR-Tools** Mixed-Integer Programming (MIP) to allocate constrained resources to competing emergency zones:
- Solves integer decision variables $x_{i,j}$ (units of resource $j$ allocated to demand $i$).
- Enforces strict capacity limits, demand satisfaction upper bounds, and resource type compatibility.
- Respects maximum travel time cutoffs.
- Prioritizes high-vulnerability communities while balancing distance penalties.
- Operates under a **safety-first policy**: Optimization creates a proposed plan (`PROPOSED`); live database capacity is only deducted upon explicit confirmation under database row locks.

---

## 8. Authentication and Role-Based Access
- **Password Hashing**: Memory-hard **Argon2id** (RFC 9106) with lockout protection against brute-force attacks.
- **Access Tokens**: Short-lived (30 min) signed **PyJWT** access tokens.
- **Refresh Tokens**: Cryptographically secure 64-character opaque tokens stored only as SHA-256 hashes with **automatic reuse detection** (revoking entire session families if token theft is attempted).
- **Five Roles**: `ADMINISTRATOR`, `DISASTER_MANAGER`, `HEALTHCARE_COORDINATOR`, `FIELD_RESPONDER`, `ANALYST`.
- **Geographic Scope**: Users can be constrained to national, state, or district boundaries.

---

## 9. Technology Stack
- **Language**: Python 3.12
- **Framework**: FastAPI 0.115+
- **ASGI Server**: Uvicorn
- **Database**: PostgreSQL 14+ (via SQLAlchemy 2.x and `psycopg` v3 binary)
- **Migrations**: Alembic 1.13+
- **Optimization**: Google OR-Tools 9.15+ (MIP SCIP / CBC)
- **Validation**: Pydantic v2 & Pydantic Settings
- **Security**: Argon2id (`argon2-cffi`), PyJWT
- **Testing**: Pytest 8.4+, HTTPX, Starlette TestClient, Ruff linter

---

## 10. Folder Structure
```
c:\Projects\SENTRA\
|-- app/
|   |-- __init__.py
|   |-- main.py                      # FastAPI lifespan, middleware, health routes
|   |-- api/
|   |   |-- deps.py                  # Database, JWT auth, RBAC & geographic dependencies
|   |   |-- v1/
|   |       |-- router.py            # API v1 central router
|   |       |-- endpoints/           # Modular route controllers
|   |           |-- auth.py
|   |           |-- users.py
|   |           |-- admin.py
|   |           |-- locations.py
|   |           |-- observations.py
|   |           |-- hazards.py
|   |           |-- risk_assessments.py
|   |           |-- health_impacts.py
|   |           |-- resources.py
|   |           |-- optimization.py
|   |           |-- simulations.py
|   |           |-- alerts.py
|   |           |-- reports.py
|   |-- core/                        # Configuration, Argon2id, RBAC, logging, exceptions
|   |-- db/                          # Database session, declarative base, seeders
|   |-- models/                      # 16 SQLAlchemy 2.x declarative ORM models
|   |-- schemas/                     # Pydantic v2 validation & response models
|   |-- services/                    # Encapsulated domain business logic
|   |-- prediction/                  # BasePredictor, UnavailableAdapters, Registry
|   |-- optimization/                # Google OR-Tools MIP solver implementation
|   |-- scripts/                     # Location import utilities
|-- migrations/                      # Alembic schema versioning scripts
|-- scripts/                         # Bootstrap admin and reference data seeders
|-- docs/                            # Comprehensive architectural and technical guides
|-- tests/                           # Unit, API, and security test suites (34 tests)
|-- .env.example                     # Environment template
|-- .gitignore                       # Git exclusion rules
|-- alembic.ini                      # Alembic migration configuration
|-- pyproject.toml                   # Project metadata and test configuration
|-- requirements.txt                 # Runtime dependencies
|-- requirements-dev.txt             # Development & testing dependencies
|-- README.md                        # Master project documentation
```

---

## 11. Prerequisites
- **Python**: 3.12 installed on your system.
- **PostgreSQL**: Version 14 or higher installed and running locally as a service.
- **Git**: Installed.
- **Docker is strictly prohibited**: SENTRA runs directly in a local virtual environment with native database services.

---

## 12. Python Virtual Environment Setup
Open a terminal in `c:\Projects\SENTRA` and create a dedicated virtual environment:
```powershell
python -m venv .venv
```

---

## 13. Windows Activation Commands
In PowerShell:
```powershell
.\.venv\Scripts\activate
```
*(If PowerShell restricts execution: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`)*

In Windows Command Prompt (`cmd`):
```cmd
.venv\Scripts\activate.bat
```

---

## 14. macOS / Linux Activation Commands
In Bash / Zsh:
```bash
source .venv/bin/activate
```

---

## 15. Dependency Installation
Upgrade pip and install all runtime and development packages:
```powershell
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
```

---

## 16. PostgreSQL Installation and Database Creation

### Windows Setup
1. Ensure PostgreSQL is installed and running:
   ```powershell
   Get-Service *postgres*
   ```
2. Connect to local PostgreSQL instance using `psql`:
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
   ```
3. Create the database and dedicated application user:
   ```sql
   CREATE DATABASE sentra_db;
   CREATE USER sentra_user WITH ENCRYPTED PASSWORD 'sentra_password';
   GRANT ALL PRIVILEGES ON DATABASE sentra_db TO sentra_user;
   ALTER DATABASE sentra_db OWNER TO sentra_user;
   \q
   ```

### macOS / Linux Setup
```bash
sudo -u postgres psql -c "CREATE DATABASE sentra_db;"
sudo -u postgres psql -c "CREATE USER sentra_user WITH ENCRYPTED PASSWORD 'sentra_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sentra_db TO sentra_user;"
sudo -u postgres psql -c "ALTER DATABASE sentra_db OWNER TO sentra_user;"
```

---

## 17. Environment-Variable Configuration
Copy the template configuration file:
```powershell
Copy-Item .env.example .env
```
Ensure `.env` matches your database credentials and secret key:
```ini
ENVIRONMENT=development
DATABASE_URL=postgresql+psycopg://sentra_user:sentra_password@localhost:5432/sentra_db
JWT_SECRET_KEY=change_this_to_a_very_strong_random_secret_in_production_environment_32bytes_min
FIRST_SUPERUSER_EMAIL=admin@sentra.gov.in
FIRST_SUPERUSER_PASSWORD=ChangeMeAdmin@2026!
FIRST_SUPERUSER_NAME="National Disaster Administrator"
```

---

## 18. Alembic Migrations
Run all database migrations to initialize tables, indexes, and foreign keys:
```powershell
alembic upgrade head
```

To review the raw SQL DDL without executing:
```powershell
alembic upgrade head --sql
```

---

## 19. Administrator Bootstrap
Seed the standard roles and create the initial administrator user:
```powershell
python scripts/create_admin.py
```
To seed representative Indian states, districts, and demo emergency resources:
```powershell
python scripts/seed_reference_data.py
```

---

## 20. Starting the Backend
Start the local development server with Uvicorn:
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

## 21. Swagger UI and ReDoc Usage
Once the server is running, navigate to:
- **Interactive Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **OpenAPI Schema (JSON)**: [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

---

## 22. Authentication and Obtaining Tokens
In Swagger UI, click the **Authorize** button at the top right, or send a `POST` request to `/api/v1/auth/login`:
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@sentra.gov.in", "password": "ChangeMeAdmin@2026!"}'
```
Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "yM4A7qW0V3...",
  "token_type": "bearer",
  "expires_in": 1800
}
```
Attach this token to all subsequent requests via header:
`Authorization: Bearer <access_token>`

---

## 23. Example API Requests

### 1. Ingest an Environmental Observation
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/observations" \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{
       "district_id": "<DISTRICT_ID>",
       "observation_type": "RAINFALL",
       "value": 85.5,
       "unit": "mm",
       "timestamp": "2026-10-20T12:00:00Z",
       "data_source": "IMD_WEATHER_STATION",
       "quality_status": "VERIFIED"
     }'
```

### 2. Request an OR-Tools Optimization Run
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/optimization/run" \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{
       "objective": "MINIMIZE_UNMET_DEMAND",
       "demands": [
         {
           "demand_id": "zone-north",
           "name": "North Riverfront Evacuation",
           "resource_type": "AMBULANCE",
           "quantity_demanded": 5,
           "priority_weight": 2.5
         }
       ]
     }'
```

### 3. Estimate Health Impact (Without ML Model)
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/health-impacts/estimate" \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{
       "district_id": "<DISTRICT_ID>",
       "hazard_severity_score": 0.75,
       "vulnerability_factor": 0.6
     }'
```

---

## 24. Running Tests
Run the entire automated test suite:
```powershell
pytest
```
Run tests with coverage analysis:
```powershell
pytest --cov=app
```
Run linter checks:
```powershell
ruff check .
```

---

## 25. Current Model-Unavailable Behavior
When calling `POST /api/v1/risk-assessments`:
- Because ML models are untrained, the system returns **HTTP 503 Service Unavailable** with error code `MODEL_UNAVAILABLE`.
- It records a traceable risk assessment entry in the database with status `MODEL_UNAVAILABLE` and data provenance.
- It **never fabricates a fake prediction result or fake probability score**.

---

## 26. How Future Trained Models Will Be Integrated
When future ML models are ready:
1. Implement `BasePredictor` in `app/prediction/adapters/<hazard>.py`.
2. Register the adapter in `app/prediction/registry.py`:
   ```python
   predictor_registry.register(HazardType.FLOOD, MyTrainedFloodPredictor())
   ```
3. No database schemas or API routes need to be altered.

---

## 27. How the Optimization Engine Works
- Formulates a Mixed-Integer Programming (MIP) problem using OR-Tools.
- Variables: Integer allocations $x_{i,j}$ between demand points and supplies.
- Maximizes weighted demand satisfied while minimizing travel time penalties.
- Strict constraint prevents exceeding live available capacity.
- Returns optimal/feasible status, unmet demand breakdown, and proposed allocations.

---

## 28. Common Errors and Solutions

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| `Cannot connect to database` | PostgreSQL service stopped or credentials incorrect | Start PostgreSQL service (`Get-Service *postgres*`) and verify `DATABASE_URL` in `.env`. |
| `HTTP 503 MODEL_UNAVAILABLE` | Hazard model not trained | Expected behavior. Supply explicit `hazard_severity_score` to `/health-impacts/estimate` for deterministic simulation. |
| `HTTP 403 GEOGRAPHIC_SCOPE_DENIED` | Cross-jurisdiction access | User's role is restricted to a specific district or state. Use an Administrator account for nationwide queries. |
| `HTTP 401 TOKEN_REUSE_DETECTED` | Refresh token was used more than once | Security violation triggered. Re-authenticate via `/api/v1/auth/login`. |

---

## 29. Known Limitations
- Machine learning models for hazard prediction are currently untrained.
- Travel time matrix currently relies on explicit scenario inputs or Euclidean approximations; live OpenStreetMap/routing engine integration is slated for future phases.
- Real-time weather observation polling requires authorized external IMD API credentials.

---

## 30. Future Work
- Integration of trained neural networks and gradient boosting models for the 7 hazard categories.
- Real-time sensor streaming ingestion (Apache Pulsar / WebSockets).
- Automated GIS spatial buffer analysis.
- Multi-tier emergency vehicle routing with dynamic road impassability graphs.
- Qwen LLM integration for conversational disaster assistant operations (post formal approval).

---
*SENTRA — State-wise Environmental, Natural-disaster, Health-impact and Resource Optimization Platform*
