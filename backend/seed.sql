-- ============================================================
--  SENTRA — Complete Database Setup Script
--  Run this entire file in pgAdmin 4 Query Tool
--  against the 'sentra_db' database as sentra_user
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- STEP 0: Alembic version tracking table
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- ────────────────────────────────────────────────────────────
-- STEP 1: roles
-- ────────────────────────────────────────────────────────────
CREATE TABLE roles (
    id          VARCHAR(36)  PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_roles_name ON roles (name);

-- ────────────────────────────────────────────────────────────
-- STEP 2: states
-- ────────────────────────────────────────────────────────────
CREATE TABLE states (
    id         VARCHAR(36)  PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    code       VARCHAR(10)  NOT NULL UNIQUE,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_states_name ON states (name);
CREATE INDEX ix_states_code ON states (code);

-- ────────────────────────────────────────────────────────────
-- STEP 3: districts
-- ────────────────────────────────────────────────────────────
CREATE TABLE districts (
    id          VARCHAR(36)  PRIMARY KEY,
    state_id    VARCHAR(36)  NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    code        VARCHAR(20)  NOT NULL,
    population  INTEGER      NOT NULL DEFAULT 0,
    area_sq_km  FLOAT,
    latitude    FLOAT,
    longitude   FLOAT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_state_district_name UNIQUE (state_id, name)
);
CREATE INDEX ix_districts_state_id ON districts (state_id);
CREATE INDEX ix_districts_name     ON districts (name);
CREATE INDEX ix_districts_code     ON districts (code);

-- ────────────────────────────────────────────────────────────
-- STEP 4: locations
-- ────────────────────────────────────────────────────────────
CREATE TABLE locations (
    id            VARCHAR(36)  PRIMARY KEY,
    district_id   VARCHAR(36)  NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    name          VARCHAR(150) NOT NULL,
    location_type VARCHAR(50)  NOT NULL,
    latitude      FLOAT,
    longitude     FLOAT,
    address       VARCHAR(255),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_locations_district_id   ON locations (district_id);
CREATE INDEX ix_locations_location_type ON locations (location_type);

-- ────────────────────────────────────────────────────────────
-- STEP 5: users
-- ────────────────────────────────────────────────────────────
CREATE TABLE users (
    id                    VARCHAR(36)  PRIMARY KEY,
    email                 VARCHAR(255) NOT NULL UNIQUE,
    hashed_password       VARCHAR(255) NOT NULL,
    is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
    full_name             VARCHAR(100) NOT NULL,
    state_id              VARCHAR(36)  REFERENCES states(id)    ON DELETE SET NULL,
    district_id           VARCHAR(36)  REFERENCES districts(id) ON DELETE SET NULL,
    failed_login_attempts INTEGER      NOT NULL DEFAULT 0,
    locked_until          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_users_email       ON users (email);
CREATE INDEX ix_users_state_id    ON users (state_id);
CREATE INDEX ix_users_district_id ON users (district_id);

-- ────────────────────────────────────────────────────────────
-- STEP 6: user_roles (junction table)
-- ────────────────────────────────────────────────────────────
CREATE TABLE user_roles (
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(36) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ────────────────────────────────────────────────────────────
-- STEP 7: refresh_sessions
-- ────────────────────────────────────────────────────────────
CREATE TABLE refresh_sessions (
    id          VARCHAR(36) PRIMARY KEY,
    user_id     VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    family_id   VARCHAR(36) NOT NULL,
    is_revoked  BOOLEAN     NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMPTZ NOT NULL,
    replaced_by VARCHAR(64),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_refresh_sessions_user_id    ON refresh_sessions (user_id);
CREATE INDEX ix_refresh_sessions_token_hash ON refresh_sessions (token_hash);
CREATE INDEX ix_refresh_sessions_family_id  ON refresh_sessions (family_id);

-- ────────────────────────────────────────────────────────────
-- STEP 8: observations
-- ────────────────────────────────────────────────────────────
CREATE TABLE observations (
    id                  VARCHAR(36)  PRIMARY KEY,
    district_id         VARCHAR(36)  NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    location_id         VARCHAR(36)  REFERENCES locations(id) ON DELETE SET NULL,
    observation_type    VARCHAR(50)  NOT NULL,
    value               FLOAT        NOT NULL,
    unit                VARCHAR(20)  NOT NULL,
    timestamp           TIMESTAMPTZ  NOT NULL,
    data_source         VARCHAR(100) NOT NULL,
    external_record_id  VARCHAR(100),
    quality_status      VARCHAR(20)  NOT NULL DEFAULT 'UNVERIFIED',
    ingestion_timestamp TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_source_external_record UNIQUE (data_source, external_record_id)
);
CREATE INDEX ix_observations_district_id      ON observations (district_id);
CREATE INDEX ix_observations_observation_type ON observations (observation_type);
CREATE INDEX ix_observations_timestamp        ON observations (timestamp);
CREATE INDEX ix_observations_data_source      ON observations (data_source);

-- ────────────────────────────────────────────────────────────
-- STEP 9: risk_assessments
-- ────────────────────────────────────────────────────────────
CREATE TABLE risk_assessments (
    id                VARCHAR(36)  PRIMARY KEY,
    district_id       VARCHAR(36)  NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    hazard_type       VARCHAR(50)  NOT NULL,
    status            VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    time_horizon      VARCHAR(50)  NOT NULL DEFAULT '24h',
    input_snapshot    JSONB        NOT NULL DEFAULT '{}',
    prediction_result JSONB,
    model_name        VARCHAR(100),
    model_version     VARCHAR(50),
    data_provenance   JSONB,
    error_details     VARCHAR(500),
    completed_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_risk_assessments_district_id ON risk_assessments (district_id);
CREATE INDEX ix_risk_assessments_hazard_type ON risk_assessments (hazard_type);
CREATE INDEX ix_risk_assessments_status      ON risk_assessments (status);

-- ────────────────────────────────────────────────────────────
-- STEP 10: health_impacts
-- ────────────────────────────────────────────────────────────
CREATE TABLE health_impacts (
    id                       VARCHAR(36)  PRIMARY KEY,
    risk_assessment_id       VARCHAR(36)  REFERENCES risk_assessments(id) ON DELETE SET NULL,
    district_id              VARCHAR(36)  NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    status                   VARCHAR(40)  NOT NULL DEFAULT 'COMPLETE',
    exposed_population       INTEGER      NOT NULL DEFAULT 0,
    estimated_affected       INTEGER      NOT NULL DEFAULT 0,
    vulnerability_indicators JSONB        NOT NULL DEFAULT '{}',
    estimated_medical_demand JSONB        NOT NULL DEFAULT '{}',
    estimation_method        VARCHAR(100) NOT NULL,
    estimation_version       VARCHAR(50)  NOT NULL,
    assumptions              JSONB        NOT NULL DEFAULT '{}',
    limitations              VARCHAR(500),
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_health_impacts_district_id        ON health_impacts (district_id);
CREATE INDEX ix_health_impacts_risk_assessment_id ON health_impacts (risk_assessment_id);
CREATE INDEX ix_health_impacts_status             ON health_impacts (status);

-- ────────────────────────────────────────────────────────────
-- STEP 11: resources
-- ────────────────────────────────────────────────────────────
CREATE TABLE resources (
    id                 VARCHAR(36)  PRIMARY KEY,
    district_id        VARCHAR(36)  NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    location_id        VARCHAR(36)  REFERENCES locations(id) ON DELETE SET NULL,
    resource_type      VARCHAR(50)  NOT NULL,
    name               VARCHAR(150) NOT NULL,
    total_capacity     INTEGER      NOT NULL,
    available_capacity INTEGER      NOT NULL,
    operational_status VARCHAR(30)  NOT NULL DEFAULT 'OPERATIONAL',
    capabilities       JSONB        NOT NULL DEFAULT '{}',
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_resource_avail_le_total     CHECK (available_capacity <= total_capacity),
    CONSTRAINT ck_resource_avail_non_negative CHECK (available_capacity >= 0),
    CONSTRAINT ck_resource_total_non_negative CHECK (total_capacity >= 0)
);
CREATE INDEX ix_resources_district_id   ON resources (district_id);
CREATE INDEX ix_resources_resource_type ON resources (resource_type);

-- ────────────────────────────────────────────────────────────
-- STEP 12: optimization_runs
-- ────────────────────────────────────────────────────────────
CREATE TABLE optimization_runs (
    id              VARCHAR(36) PRIMARY KEY,
    district_id     VARCHAR(36) REFERENCES districts(id) ON DELETE SET NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'OPTIMAL',
    solver_status   VARCHAR(50) NOT NULL,
    objective_value FLOAT,
    input_snapshot  JSONB       NOT NULL DEFAULT '{}',
    result_summary  JSONB       NOT NULL DEFAULT '{}',
    unmet_demand    JSONB       NOT NULL DEFAULT '{}',
    unused_capacity JSONB       NOT NULL DEFAULT '{}',
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_optimization_runs_status ON optimization_runs (status);

-- ────────────────────────────────────────────────────────────
-- STEP 13: allocations
-- ────────────────────────────────────────────────────────────
CREATE TABLE allocations (
    id                  VARCHAR(36) PRIMARY KEY,
    optimization_run_id VARCHAR(36) REFERENCES optimization_runs(id) ON DELETE CASCADE,
    resource_id         VARCHAR(36) NOT NULL REFERENCES resources(id)  ON DELETE CASCADE,
    district_id         VARCHAR(36) NOT NULL REFERENCES districts(id)  ON DELETE CASCADE,
    allocated_quantity  INTEGER     NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PROPOSED',
    notes               VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_allocations_optimization_run_id ON allocations (optimization_run_id);
CREATE INDEX ix_allocations_resource_id         ON allocations (resource_id);
CREATE INDEX ix_allocations_district_id         ON allocations (district_id);

-- ────────────────────────────────────────────────────────────
-- STEP 14: simulations
-- ────────────────────────────────────────────────────────────
CREATE TABLE simulations (
    id                  VARCHAR(36)  PRIMARY KEY,
    name                VARCHAR(150) NOT NULL,
    description         VARCHAR(255),
    baseline_run_id     VARCHAR(36)  REFERENCES optimization_runs(id) ON DELETE SET NULL,
    scenario_parameters JSONB        NOT NULL DEFAULT '{}',
    status              VARCHAR(30)  NOT NULL DEFAULT 'COMPLETED',
    result_summary      JSONB        NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- STEP 15: alerts
-- ────────────────────────────────────────────────────────────
CREATE TABLE alerts (
    id                 VARCHAR(36)   PRIMARY KEY,
    district_id        VARCHAR(36)   NOT NULL REFERENCES districts(id)      ON DELETE CASCADE,
    hazard_type        VARCHAR(50)   NOT NULL,
    risk_assessment_id VARCHAR(36)   REFERENCES risk_assessments(id)        ON DELETE SET NULL,
    severity           VARCHAR(20)   NOT NULL DEFAULT 'MODERATE',
    status             VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    title              VARCHAR(200)  NOT NULL,
    description        VARCHAR(1000) NOT NULL,
    issued_by          VARCHAR(36)   NOT NULL REFERENCES users(id)          ON DELETE RESTRICT,
    acknowledged_by    VARCHAR(36)   REFERENCES users(id)                   ON DELETE SET NULL,
    acknowledged_at    TIMESTAMPTZ,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_alerts_district_id ON alerts (district_id);
CREATE INDEX ix_alerts_hazard_type ON alerts (hazard_type);
CREATE INDEX ix_alerts_severity    ON alerts (severity);
CREATE INDEX ix_alerts_status      ON alerts (status);

-- ────────────────────────────────────────────────────────────
-- STEP 16: audit_logs
-- ────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id          VARCHAR(36)  PRIMARY KEY,
    user_id     VARCHAR(36)  REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   VARCHAR(36),
    details     JSONB        NOT NULL DEFAULT '{}',
    ip_address  VARCHAR(45),
    timestamp   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_audit_logs_user_id     ON audit_logs (user_id);
CREATE INDEX ix_audit_logs_action      ON audit_logs (action);
CREATE INDEX ix_audit_logs_entity_type ON audit_logs (entity_type);
CREATE INDEX ix_audit_logs_timestamp   ON audit_logs (timestamp);

-- ────────────────────────────────────────────────────────────
-- STEP 17: Mark Alembic migration as applied
-- ────────────────────────────────────────────────────────────
INSERT INTO alembic_version (version_num) VALUES ('0001_initial_schema')
ON CONFLICT DO NOTHING;

-- ============================================================
--  SEED DATA
-- ============================================================

-- Roles
INSERT INTO roles (id, name, description, created_at, updated_at) VALUES
  (gen_random_uuid()::text, 'ADMINISTRATOR',          'Full administrative access to manage users, configuration, and audit logs.',          NOW(), NOW()),
  (gen_random_uuid()::text, 'DISASTER_MANAGER',       'Authorized to request risk assessments, run simulations, and trigger optimization.',   NOW(), NOW()),
  (gen_random_uuid()::text, 'HEALTHCARE_COORDINATOR', 'Manages healthcare capacity, hospital beds, medical teams, and health impacts.',       NOW(), NOW()),
  (gen_random_uuid()::text, 'FIELD_RESPONDER',        'Field level responders receiving and updating emergency alerts and allocations.',       NOW(), NOW()),
  (gen_random_uuid()::text, 'ANALYST',                'Submits environmental observations, reviews model performance, and generates reports.', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- States
INSERT INTO states (id, name, code, is_active, created_at, updated_at) VALUES
  ('state-as-001', 'Assam',       'AS', TRUE, NOW(), NOW()),
  ('state-mh-001', 'Maharashtra', 'MH', TRUE, NOW(), NOW()),
  ('state-od-001', 'Odisha',      'OD', TRUE, NOW(), NOW()),
  ('state-kl-001', 'Kerala',      'KL', TRUE, NOW(), NOW()),
  ('state-rj-001', 'Rajasthan',   'RJ', TRUE, NOW(), NOW()),
  ('state-uk-001', 'Uttarakhand', 'UK', TRUE, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Districts
INSERT INTO districts (id, state_id, name, code, population, area_sq_km, latitude, longitude, created_at, updated_at) VALUES
  ('dist-as-km', 'state-as-001', 'Kamrup Metropolitan', 'AS-KM', 1253938,  1528.0, 26.1445, 91.7362, NOW(), NOW()),
  ('dist-as-dh', 'state-as-001', 'Dhubri',              'AS-DH', 1949258,  2838.0, 26.0207, 89.9743, NOW(), NOW()),
  ('dist-as-ca', 'state-as-001', 'Cachar',              'AS-CA', 1736617,  3786.0, 24.8333, 92.7789, NOW(), NOW()),
  ('dist-mh-mc', 'state-mh-001', 'Mumbai City',         'MH-MC', 3085411,   157.0, 18.9388, 72.8354, NOW(), NOW()),
  ('dist-mh-pu', 'state-mh-001', 'Pune',                'MH-PU', 9429408, 15643.0, 18.5204, 73.8567, NOW(), NOW()),
  ('dist-mh-rg', 'state-mh-001', 'Raigad',              'MH-RG', 2634200,  7152.0, 18.5158, 73.1822, NOW(), NOW()),
  ('dist-od-pu', 'state-od-001', 'Puri',                'OD-PU', 1698730,  3479.0, 19.8135, 85.8312, NOW(), NOW()),
  ('dist-od-ba', 'state-od-001', 'Balasore',            'OD-BA', 2320529,  3806.0, 21.4934, 86.9135, NOW(), NOW()),
  ('dist-kl-er', 'state-kl-001', 'Ernakulam',           'KL-ER', 3282388,  3068.0,  9.9816, 76.2999, NOW(), NOW()),
  ('dist-kl-wa', 'state-kl-001', 'Wayanad',             'KL-WA',  817420,  2132.0, 11.6854, 76.1320, NOW(), NOW()),
  ('dist-rj-jp', 'state-rj-001', 'Jaipur',              'RJ-JP', 6626178, 11152.0, 26.9124, 75.7873, NOW(), NOW()),
  ('dist-rj-js', 'state-rj-001', 'Jaisalmer',           'RJ-JS',  669919, 38401.0, 26.9157, 70.9083, NOW(), NOW()),
  ('dist-uk-ch', 'state-uk-001', 'Chamoli',             'UK-CH',  391605,  8030.0, 30.4231, 79.3283, NOW(), NOW()),
  ('dist-uk-dd', 'state-uk-001', 'Dehradun',            'UK-DD', 1696694,  3088.0, 30.3165, 78.0322, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Emergency Resources (4 per district via loop)
DO $$
DECLARE
  dist_ids   TEXT[] := ARRAY[
    'dist-as-km','dist-as-dh','dist-as-ca',
    'dist-mh-mc','dist-mh-pu','dist-mh-rg',
    'dist-od-pu','dist-od-ba',
    'dist-kl-er','dist-kl-wa',
    'dist-rj-jp','dist-rj-js',
    'dist-uk-ch','dist-uk-dd'
  ];
  dist_names TEXT[] := ARRAY[
    'Kamrup Metropolitan','Dhubri','Cachar',
    'Mumbai City','Pune','Raigad',
    'Puri','Balasore',
    'Ernakulam','Wayanad',
    'Jaipur','Jaisalmer',
    'Chamoli','Dehradun'
  ];
  i INT;
BEGIN
  FOR i IN 1..array_length(dist_ids, 1) LOOP
    INSERT INTO resources (id, district_id, resource_type, name, total_capacity, available_capacity, operational_status, capabilities, created_at, updated_at) VALUES
      (gen_random_uuid()::text, dist_ids[i], 'AMBULANCE',        dist_names[i] || ' Emergency ALS Ambulance Fleet',                   15,  15,  'OPERATIONAL', '{"type":"ALS","oxygen_equipped":true}'::jsonb, NOW(), NOW()),
      (gen_random_uuid()::text, dist_ids[i], 'HOSPITAL_BED',     dist_names[i] || ' District Civil Hospital ICU/Emergency Beds',      120, 120, 'OPERATIONAL', '{"icu":true,"trauma_unit":true}'::jsonb,       NOW(), NOW()),
      (gen_random_uuid()::text, dist_ids[i], 'MEDICAL_TEAM',     dist_names[i] || ' Rapid Health Response Medical Teams',             6,   6,   'OPERATIONAL', '{"doctors":4,"paramedics":8}'::jsonb,          NOW(), NOW()),
      (gen_random_uuid()::text, dist_ids[i], 'TEMPORARY_SHELTER',dist_names[i] || ' Community Relief Center & Cyclone Shelter',       500, 500, 'OPERATIONAL', '{"generator":true,"potable_water":true}'::jsonb,NOW(), NOW());
  END LOOP;
END $$;

-- ============================================================
--  SCHEMA + SEED COMPLETE
--  Next step: python scripts/create_admin.py
-- ============================================================
