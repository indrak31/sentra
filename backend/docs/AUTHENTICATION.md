# SENTRA Authentication and Authorization Security

## 1. Overview
SENTRA implements a defense-in-depth security model designed for sensitive government disaster-response infrastructure.

The architecture strictly decouples token generation from database integrity and enforces least-privilege role-based access control (RBAC) along with geographic boundary restrictions.

---

## 2. Password Security (Argon2id)
Passwords are never stored in plaintext and never logged. Hashing is performed using **Argon2id** (RFC 9106) with memory-hard parameters:

- `time_cost`: 2 iterations
- `memory_cost`: 65,536 KiB (64 MiB)
- `parallelism`: 1 thread
- `hash_len`: 32 bytes
- `type`: `Type.ID`

Generic error messages ("Invalid email or password.") prevent username enumeration during failed login attempts.

Account lockout triggers automatically after 5 consecutive failed login attempts, locking the account for 15 minutes.

---

## 3. JWT Access Tokens
Access tokens are signed JSON Web Tokens (JWT) adhering to standard claims:

- `sub`: User UUID
- `iat`: Issued at timestamp (UTC)
- `exp`: Expiration timestamp (default: 30 minutes)
- `iss`: Issuer (`sentra-backend`)
- `aud`: Audience (`sentra-platform`)
- `token_type`: Always `"access"`
- `roles`: Array of user's active role names
- `state_id`: Optional state restriction
- `district_id`: Optional district restriction

Tokens are verified cryptographically using the environment-configured `JWT_SECRET_KEY` and `JWT_ALGORITHM` (HS256).

---

## 4. Opaque Refresh Tokens & Reuse Detection
Refresh tokens are **cryptographically random 64-character opaque strings** generated via `secrets.token_urlsafe(64)`.

Only the SHA-256 hash of the token is stored in the database (`refresh_sessions.token_hash`), ensuring that even a database dump cannot expose raw refresh tokens.

### Token Rotation & Family Tracking
1. When a user logs in, a new refresh token is issued and assigned a unique `family_id`.
2. Upon calling `POST /api/v1/auth/refresh`, the existing refresh token is marked `is_revoked=True` and `replaced_by=<new_hash>`.
3. A new refresh token is generated within the same `family_id`.
4. **Breach / Reuse Detection**: If an old or replaced token is submitted again, the system detects a token hijack and **immediately revokes all active sessions in that family**, preventing unauthorized access.

### Logout
Calling `POST /api/v1/auth/logout` revokes the specific refresh session in the database immediately.

---

## 5. Role-Based Access Control (RBAC)

SENTRA defines 5 initial roles:

1. **ADMINISTRATOR**: Full control over user accounts, role assignments, audit logs, system health, and geographic reference data.
2. **DISASTER_MANAGER**: Can request hazard assessments, run scenario simulations, trigger OR-Tools optimization, issue emergency alerts, and confirm allocations.
3. **HEALTHCARE_COORDINATOR**: Focuses on medical demand, hospital beds, ambulance capacity, and health-impact estimations.
4. **FIELD_RESPONDER**: Receives local district alerts, inspects assigned tasks, and updates alert acknowledgment statuses.
5. **ANALYST**: Submits environmental observations (weather, river levels, seismic sensors), monitors hazard models, and generates impact reports.

Role enforcement is centralized via the `require_permission(permission: Permission)` dependency in `app/api/deps.py`.

---

## 6. Geographic Scope Enforcement
Operational personnel can be restricted to specific jurisdictions:

- **Nationwide Scope**: `state_id=None` and `district_id=None` (or `ADMINISTRATOR` role).
- **State Scope**: `state_id="MH"` — Can access all districts in Maharashtra, but rejected from accessing Assam or Odisha.
- **District Scope**: `district_id="MH-PU"` — Can only query and operate on resources, alerts, and observations in Pune district.

Attempting to access records outside the assigned boundary returns `HTTP 403 Forbidden` (`GEOGRAPHIC_SCOPE_DENIED`).
