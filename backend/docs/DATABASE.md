# SENTRA Database Architecture and PostgreSQL Setup

## 1. Relational Database Overview
SENTRA uses PostgreSQL as its primary database, managed via SQLAlchemy 2.x declarative models and Alembic migrations.

### Tables & Relationships

```mermaid
erDiagram
    STATES ||--o{ DISTRICTS : contains
    DISTRICTS ||--o{ LOCATIONS : contains
    DISTRICTS ||--o{ OBSERVATIONS : records
    DISTRICTS ||--o{ RISK_ASSESSMENTS : evaluates
    DISTRICTS ||--o{ HEALTH_IMPACTS : estimates
    DISTRICTS ||--o{ RESOURCES : maintains
    DISTRICTS ||--o{ ALERTS : issues
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : grants
    USERS ||--o{ REFRESH_SESSIONS : owns
    USERS ||--o{ AUDIT_LOGS : performs
    OPTIMIZATION_RUNS ||--o{ ALLOCATIONS : plans
    RESOURCES ||--o{ ALLOCATIONS : allocated_to
```

---

## 2. Table Catalog

1. **`roles`**: Standard system roles (`ADMINISTRATOR`, `DISASTER_MANAGER`, etc.).
2. **`users`**: User credentials, Argon2id password hash, lockout tracking, and geographic boundaries.
3. **`user_roles`**: Many-to-many relationship mapping users to roles.
4. **`refresh_sessions`**: Opaque refresh token hashes, expiration, revocation, and token family IDs.
5. **`states`**: Indian states and Union Territories with standardized postal/ISO codes.
6. **`districts`**: District units with population figures, land area, and geographic coordinates.
7. **`locations`**: Specific emergency sites (hospitals, shelters, staging areas, observation stations).
8. **`observations`**: Numeric environmental observations (rainfall, temperature, river level, etc.) with source provenance and deduplication.
9. **`risk_assessments`**: Hazard evaluation records tracking time horizons, input snapshots, model provenance, and explicit statuses (`MODEL_UNAVAILABLE`, `SUCCEEDED`, etc.).
10. **`health_impacts`**: Epidemiological and macro health impact estimates (exposed population, affected population, medical demand).
11. **`resources`**: Emergency resources (ambulances, hospital beds, teams, shelters) with check constraints (`available_capacity <= total_capacity`).
12. **`optimization_runs`**: Persisted mathematical optimization runs executed via Google OR-Tools.
13. **`allocations`**: Individual proposed or confirmed resource assignments.
14. **`simulations`**: Isolated what-if scenario parameterizations and outcomes.
15. **`alerts`**: Official emergency alerts with severity (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`) and lifecycle status.
16. **`audit_logs`**: Tamper-evident record of privileged actions, changes, and user IP addresses.

---

## 3. Database Constraints & Data Integrity

- **Check Constraints**:
  - `ck_resource_avail_le_total`: Ensures `available_capacity <= total_capacity`.
  - `ck_resource_avail_non_negative`: Ensures `available_capacity >= 0`.
  - `ck_resource_total_non_negative`: Ensures `total_capacity >= 0`.
- **Unique Constraints**:
  - `uq_state_district_name`: Prevents duplicate district names within a state.
  - `uq_source_external_record`: Idempotency guard on observations with known external IDs.
- **Foreign Keys**: Cascading deletes for child location data; `RESTRICT` on critical audit or alert issuer references.

---

## 4. Local PostgreSQL Setup (Windows)

PostgreSQL must run as a normal local database service (Docker is prohibited).

### Step 1: Install PostgreSQL
Download and install PostgreSQL 14, 15, 16, 17, or 18 from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/).

Ensure the **PostgreSQL Server** and **Command Line Tools** options are selected.

### Step 2: Start PostgreSQL Service
Verify the service is running in PowerShell:
```powershell
Get-Service *postgres*
```

### Step 3: Create Database and User
Using `psql`:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
```
Inside SQL prompt:
```sql
CREATE DATABASE sentra_db;
CREATE USER sentra_user WITH ENCRYPTED PASSWORD 'sentra_password';
GRANT ALL PRIVILEGES ON DATABASE sentra_db TO sentra_user;
ALTER DATABASE sentra_db OWNER TO sentra_user;
\q
```

### Step 4: Configure `.env`
In `.env`:
```ini
DATABASE_URL=postgresql+psycopg://sentra_user:sentra_password@localhost:5432/sentra_db
```

### Step 5: Apply Migrations
```powershell
alembic upgrade head
```
