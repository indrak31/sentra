# SENTRA REST API Reference

All API routes are served under prefix `/api/v1`. Interactive documentation is available at `/docs` (Swagger UI) and `/redoc` (ReDoc).

---

## 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Permission / Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register standard user (defaults to ANALYST role) |
| `POST` | `/auth/login` | Public | Obtain access token + opaque refresh token |
| `POST` | `/auth/refresh` | Public | Rotate refresh token and obtain new access token |
| `POST` | `/auth/logout` | Authenticated | Revoke refresh token session |
| `GET` | `/auth/me` | Authenticated | Retrieve current user profile and assigned roles |
| `POST` | `/auth/change-password` | Authenticated | Change user password and invalidate sessions |

---

## 2. Administration (`/api/v1/admin`)

| Method | Endpoint | Permission / Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/users` | ADMINISTRATOR | Paginated list of registered users |
| `POST` | `/admin/users` | ADMINISTRATOR | Create user with explicit roles & geographic scope |
| `PATCH` | `/admin/users/{user_id}` | ADMINISTRATOR | Update roles, active status, or geographic bounds |
| `GET` | `/admin/audit-logs` | ADMINISTRATOR | Paginated audit trail of privileged operations |

---

## 3. Geographic Data (`/api/v1/locations`)

| Method | Endpoint | Permission / Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/locations/states` | Authenticated | List all Indian states and Union Territories |
| `POST` | `/locations/states` | `manage_reference_data` | Register a new state or UT |
| `GET` | `/locations/states/{id}/districts` | Authenticated | List all districts in a state |
| `GET` | `/locations/districts/{id}` | Authenticated | Retrieve district details |
| `POST` | `/locations/districts` | `manage_reference_data` | Add a district to a state |
| `GET` | `/locations` | Authenticated | List specific emergency facilities or stations |
| `POST` | `/locations` | `manage_reference_data` | Register a facility / station |

---

## 4. Environmental Observations (`/api/v1/observations`)

| Method | Endpoint | Permission / Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/observations` | `submit_observations` | Ingest single environmental observation |
| `POST` | `/observations/bulk` | `submit_observations` | Batch ingest up to 500 observations |
| `GET` | `/observations` | `read_observations` | Query observations (filters: district, type, date) |
| `GET` | `/observations/{id}` | `read_observations` | Retrieve single observation by ID |

---

## 5. Hazards & Risk Assessment (`/api/v1/hazards` & `/api/v1/risk-assessments`)

| Method | Endpoint | Permission / Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/hazards` | Authenticated | List 7 supported hazard categories & expected inputs |
| `GET` | `/hazards/models/status` | Authenticated | Query deployment readiness of all 7 hazard models |
| `GET` | `/hazards/{hazard_type}` | Authenticated | Get details for specific hazard |
| `POST` | `/risk-assessments` | `request_risk_assessment` | Request hazard risk evaluation (returns 503 if unconfigured) |
| `GET` | `/risk-assessments` | `read_risk_assessment` | Paginated risk assessments with filters |
| `GET` | `/risk-assessments/{id}` | `read_risk_assessment` | Retrieve risk assessment with provenance |
| `GET` | `/locations/districts/{id}/risk-assessments` | `read_risk_assessment` | District-filtered risk assessments |

---

## 6. Health Impacts (`/api/v1/health-impacts`)

| Method | Endpoint | Permission / Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/health-impacts/estimate` | `estimate_health_impact` | Estimate exposed population, medical demand, beds |
| `GET` | `/health-impacts` | `read_health_impact` | List historical health impact estimations |
| `GET` | `/health-impacts/{id}` | `read_health_impact` | Get health impact estimation details and assumptions |

---

## 7. Emergency Resources (`/api/v1/resources`)

| Method | Endpoint | Permission / Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/resources` | `manage_resources` | Register resource (ambulances, beds, teams, shelters) |
| `GET` | `/resources` | `read_resources` | List resources with type/status/district filters |
| `GET` | `/resources/{id}` | `read_resources` | Get resource details |
| `PATCH` | `/resources/{id}` | `update_resource_status` | Update capacity or operational status |
| `GET` | `/locations/districts/{id}/resources` | `read_resources` | List all resources located in a district |

---

## 8. Optimization Engine (`/api/v1/optimization`)

| Method | Endpoint | Permission / Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/optimization/run` | `run_optimization` | Execute OR-Tools MIP solver (returns proposed plan) |
| `GET` | `/optimization/runs` | `read_optimization` | List optimization run history and solver statuses |
| `GET` | `/optimization/runs/{id}` | `read_optimization` | Get run summary, unmet demand, unused capacity |
| `GET` | `/optimization/runs/{id}/allocations` | `read_optimization` | Get list of planned allocations for a run |
| `POST` | `/optimization/allocations/{id}/confirm` | `confirm_allocation` | Confirm allocation and deduct from live inventory |

---

## 9. Simulations (`/api/v1/simulations`)

| Method | Endpoint | Permission / Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/simulations` | `run_simulation` | Run isolated what-if scenario with multipliers |
| `GET` | `/simulations/{id}` | `read_simulation` | Retrieve scenario simulation results |
| `GET` | `/simulations/{id}/compare` | `read_simulation` | Compare scenario results against baseline |

---

## 10. Alerts & Reports (`/api/v1/alerts` & `/api/v1/reports`)

| Method | Endpoint | Permission / Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/alerts` | `create_alert` | Issue emergency disaster alert |
| `GET` | `/alerts` | `read_alerts` | List alerts (filters: severity, status, district) |
| `GET` | `/alerts/{id}` | `read_alerts` | Get alert details |
| `PATCH` | `/alerts/{id}` | `update_alert` | Update or acknowledge alert |
| `GET` | `/reports/summary` | `read_reports` | Nationwide platform summary metrics |
| `GET` | `/reports/disaster-impact` | `read_reports` | State/district disaster impact report |

---

## 11. Operational Health

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health/live` | Process liveness probe (200 OK) |
| `GET` | `/health/ready` | Dependency & PostgreSQL connectivity probe (200 / 503) |
