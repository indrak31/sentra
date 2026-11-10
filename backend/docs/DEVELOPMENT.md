# SENTRA Local Development Guide

## 1. Prerequisites
- **Python**: 3.12 or higher.
- **PostgreSQL**: 14+ running locally as a service.
- **Git**: Installed and configured.
- **Docker**: Prohibited for this project.

---

## 2. Virtual Environment Setup

### Windows (PowerShell)
```powershell
# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\activate

# Upgrade pip and install runtime + dev dependencies
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
```

### macOS / Linux (Bash / Zsh)
```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Upgrade pip and install runtime + dev dependencies
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
```

---

## 3. Environment Variables Configuration
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
Update `DATABASE_URL` with your local PostgreSQL credentials:
```ini
DATABASE_URL=postgresql+psycopg://sentra_user:sentra_password@localhost:5432/sentra_db
```

---

## 4. Database Migrations
Apply all schema migrations to your local PostgreSQL instance:
```powershell
alembic upgrade head
```

To inspect generated SQL without executing against database:
```powershell
alembic upgrade head --sql
```

---

## 5. Bootstrap Administrator & Reference Data
Initialize standard roles and create the first administrator account:
```powershell
python scripts/create_admin.py --email admin@sentra.gov.in --password AdminSecurePass123! --name "System Administrator"
```

Seed representative Indian geographic states, districts, and emergency resources:
```powershell
python scripts/seed_reference_data.py
```

---

## 6. Running the Development Server
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Open your browser at:
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- Liveness Probe: [http://127.0.0.1:8000/health/live](http://127.0.0.1:8000/health/live)
- Readiness Probe: [http://127.0.0.1:8000/health/ready](http://127.0.0.1:8000/health/ready)

---

## 7. Testing & Linting
Run the complete automated test suite (34 unit, integration, and security tests):
```powershell
pytest
```

Run code quality and linting checks:
```powershell
ruff check .
```

---

## 8. Common Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `psycopg.OperationalError: connection failed` | PostgreSQL service not running or bad credentials | Run `Get-Service *postgres*` on Windows. Verify username/password in `.env`. |
| `401 Unauthorized` | Missing or expired Bearer token | Call `/api/v1/auth/login` and attach `Authorization: Bearer <token>`. |
| `503 Service Unavailable` on `/risk-assessments` | Model is untrained (expected behavior) | This is the designed behavior for untrained models. To simulate health impacts without models, supply `hazard_severity_score` in `/health-impacts/estimate`. |
| `403 Geographic Scope Denied` | User restricted to specific state/district | User is attempting cross-district access outside assigned scope. Admin accounts bypass this restriction. |
