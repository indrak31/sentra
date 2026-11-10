# SENTRA Frontend — Disaster Intelligence & Resource Optimization Command Center

An enterprise-grade, high-performance command operations interface engineered for Indian disaster response authorities, emergency management commanders, and public health coordinators.

---

## 1. Architectural Highlights

* **Geographic Prioritization**: Integrates directly with backend RBAC and geographic jurisdiction scopes. When a regional administrator (e.g. assigned to Pune, Maharashtra) logs in, the platform immediately prioritizes Pune, Maharashtra, and surrounding sectors while retaining instant access to national drill-downs.
* **Interactive GIS Surveillance**: Full geospatial tracking of India with CartoDB Dark Matter basemaps, custom SVG radar markers, multi-hazard layer switches, emergency resource locations, and tactical legends.
* **Decision Intelligence**:
  * **Google OR-Tools MIP Solver Interface**: Formulate demand points, objectives (`MINIMIZE_UNMET_DEMAND`, `PRIORITIZE_VULNERABLE`, `MINIMIZE_TRAVEL_TIME`), and maximum travel cutoffs, with safety-first row-locked inventory deduction confirmation.
  * **Disaster What-If Simulation Studio**: Stress-test secondary demand surges ($1.0\times - 4.0\times$) and fleet corridor degradation ($0.2\times - 1.0\times$) with side-by-side outcome charts.
  * **Epidemiological Health Surge Estimator**: Calculate required hospital ICU beds, ALS ambulances, medical strike teams, temporary shelters, and relief supply packs.
* **Security & Tokens**: Memory-hard Argon2id authentication compatibility, short-lived JWT Bearer tokens, transparent opaque refresh token rotation (`POST /auth/refresh`) with reuse breach mitigation.

---

## 2. Technology Stack

* **Framework & Bundler**: React 18 + TypeScript + Vite 6
* **Styling**: Tailwind CSS configured with SENTRA tactical dark tokens (`#080D13`, `#0D151E`, `#111C27`, `#243342`)
* **GIS & Mapping**: Leaflet + React-Leaflet
* **Data Visualization**: Recharts
* **State Management**: TanStack Query v5 (server-state & background polling) + Zustand (client state)
* **Routing**: React Router v6 with nested command layouts and RBAC guards
* **HTTP Client**: Axios with Bearer token injection and refresh queuing

---

## 3. Quick Start & Development

### 1. Prerequisites
* Node.js v18+ (tested with v24)
* npm v9+ (tested with v11)

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Environment Configuration
Verify `frontend/.env` is configured with the backend API address:
```ini
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

### 4. Start Development Server
```bash
npm run dev
```
The application will launch on **http://localhost:3000** (matching the backend's allowed CORS origins out-of-the-box).

### 5. Production Build
```bash
npm run build
npm run preview
```

---

## 4. Default Login Credentials

Use the bootstrap administrator account created by `backend/scripts/create_admin.py`:

* **Email**: `admin@sentra.gov.in`
* **Password**: `AdminSecurePassword123!` (or value configured in `backend/.env`)
* **Clearance**: `ADMINISTRATOR` (Nationwide access + User provisioning)

To test a regional operator assigned specifically to **Pune, Maharashtra**:
1. Log in as Administrator.
2. Navigate to **System Admin** (`/admin`).
3. Click **Provision New Operator**, assign role `DISASTER_MANAGER`, and set sector to **Pune (District Sector)**.
4. Log in with the new credentials to observe automated Pune map centering, regional KPI emphasis, and localized alert feeds.

---

## 5. Command Modules Matrix

| Module | Route | Backend API Endpoint |
| :--- | :--- | :--- |
| **Command Dashboard** | `/` | `GET /reports/summary`, `GET /alerts`, `GET /resources` |
| **Geospatial Live Map** | `/map` | Leaflet GIS with CartoDB Dark Matter, `GET /alerts`, `GET /resources` |
| **Hazard Prediction** | `/hazards` | `GET /hazards`, `GET /hazards/models/status`, `POST /risk-assessments` |
| **Incident & Alerts** | `/alerts` | `GET /alerts`, `POST /alerts`, `PATCH /alerts/{id}` |
| **Sensor Telemetry** | `/observations`| `GET /observations`, `POST /observations` |
| **Health Surge Estimator**| `/health` | `POST /health-impacts/estimate`, `GET /health-impacts` |
| **Emergency Resources** | `/resources` | `GET /resources`, `PATCH /resources/{id}` |
| **OR-Tools Solver** | `/optimization`| `POST /optimization/run`, `POST /optimization/allocations/{id}/confirm` |
| **Scenario Simulator** | `/simulations` | `POST /simulations`, `GET /simulations/{id}/compare` |
| **Disaster Reports** | `/reports` | `GET /reports/disaster-impact`, `GET /reports/summary` |
| **System Admin** | `/admin` | `GET /admin/users`, `POST /admin/users`, `GET /admin/audit-logs` |
