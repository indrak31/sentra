"""Database initialization and standard reference data seeding."""

from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.logging import logger
from app.core.permissions import RoleName
from app.core.security import get_password_hash
from app.models.role import Role
from app.models.user import User
from app.models.location import State, District, Location
from app.models.alert import Alert
from app.models.observation import Observation
from app.models.resource import Resource

ROLE_DESCRIPTIONS = {
    RoleName.ADMINISTRATOR: "Full administrative access to manage users, configuration, and audit logs.",
    RoleName.DISASTER_MANAGER: "Authorized to request risk assessments, run simulations, and trigger optimization.",
    RoleName.HEALTHCARE_COORDINATOR: "Manages healthcare capacity, hospital beds, medical teams, and health impacts.",
    RoleName.FIELD_RESPONDER: "Field level responders receiving and updating emergency alerts and allocations.",
    RoleName.ANALYST: "Submits environmental observations, reviews model performance, and generates reports.",
}


def init_db(db: Session) -> None:
    """Seed initial system roles, bootstrap users, states, districts, alerts, and resources."""
    # 1. Seed Roles
    for role_name in RoleName:
        existing_role = db.query(Role).filter(Role.name == role_name.value).first()
        if not existing_role:
            role = Role(name=role_name.value, description=ROLE_DESCRIPTIONS.get(role_name, ""))
            db.add(role)
            logger.info("Initialized system role: %s", role_name.value)
    db.commit()

    admin_role = db.query(Role).filter(Role.name == RoleName.ADMINISTRATOR.value).first()
    manager_role = db.query(Role).filter(Role.name == RoleName.DISASTER_MANAGER.value).first()
    analyst_role = db.query(Role).filter(Role.name == RoleName.ANALYST.value).first()

    # 2. Seed Superuser if not present
    if settings.FIRST_SUPERUSER_EMAIL:
        admin_user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
        if not admin_user:
            admin_user = User(
                email=settings.FIRST_SUPERUSER_EMAIL,
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                full_name=settings.FIRST_SUPERUSER_NAME,
                is_active=True,
                roles=[admin_role] if admin_role else [],
            )
            db.add(admin_user)
            db.commit()
            logger.info("Bootstrap superuser created: %s", settings.FIRST_SUPERUSER_EMAIL)
        else:
            # Ensure password aligns with frontend clearance
            admin_user.hashed_password = get_password_hash(settings.FIRST_SUPERUSER_PASSWORD)
            db.commit()

    # 3. Seed Alex Carter (Operations Analyst)
    alex_user = db.query(User).filter(User.email == "alex.carter@sentra.gov.in").first()
    if not alex_user:
        alex_user = User(
            email="alex.carter@sentra.gov.in",
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            full_name="Alex Carter",
            is_active=True,
            roles=[r for r in [analyst_role, manager_role] if r],
        )
        db.add(alex_user)
        db.commit()
        logger.info("Bootstrap operator created: alex.carter@sentra.gov.in")
    else:
        alex_user.hashed_password = get_password_hash(settings.FIRST_SUPERUSER_PASSWORD)
        db.commit()

    # 4. Seed Reference States & Districts
    SEED_STATES = [
        {"id": "st-od", "name": "Odisha", "code": "OR"},
        {"id": "st-mh", "name": "Maharashtra", "code": "MH"},
        {"id": "st-gj", "name": "Gujarat", "code": "GJ"},
        {"id": "st-as", "name": "Assam", "code": "AS"},
        {"id": "st-kl", "name": "Kerala", "code": "KL"},
    ]
    for s_data in SEED_STATES:
        if not db.query(State).filter(State.id == s_data["id"]).first():
            db.add(State(id=s_data["id"], name=s_data["name"], code=s_data["code"], is_active=True))
    db.commit()

    SEED_DISTRICTS_DATA = [
        {"id": "dist-od-pu", "state_id": "st-od", "name": "Puri", "code": "PURI", "pop": 1698730, "lat": 19.8135, "lng": 85.8312},
        {"id": "dist-od-cu", "state_id": "st-od", "name": "Cuttack", "code": "CTC", "pop": 2624470, "lat": 20.4625, "lng": 85.8828},
        {"id": "dist-mh-pu", "state_id": "st-mh", "name": "Pune", "code": "PUNE", "pop": 9429408, "lat": 18.5204, "lng": 73.8567},
        {"id": "dist-gj-ku", "state_id": "st-gj", "name": "Kachchh", "code": "KCH", "pop": 2092371, "lat": 23.2420, "lng": 69.6669},
        {"id": "dist-as-ka", "state_id": "st-as", "name": "Kamrup Metropolitan", "code": "KAMP", "pop": 1253938, "lat": 26.1445, "lng": 91.7362},
    ]
    for d_data in SEED_DISTRICTS_DATA:
        if not db.query(District).filter(District.id == d_data["id"]).first():
            db.add(District(
                id=d_data["id"],
                state_id=d_data["state_id"],
                name=d_data["name"],
                code=d_data["code"],
                population=d_data["pop"],
                latitude=d_data["lat"],
                longitude=d_data["lng"],
            ))
    db.commit()

    # 5. Seed Initial Indian Alerts
    issuer = admin_user or alex_user
    if issuer and db.query(Alert).count() == 0:
        initial_alerts = [
            Alert(
                district_id="dist-od-cu",
                hazard_type="FLOOD",
                severity="CRITICAL",
                status="ACTIVE",
                title="Mahanadi Basin Flash Flood Surge",
                description="River gauging sensor ID-7734 exceeded HFL by 0.42m. Inundation envelope 18.4 km² projected across Cuttack and Puri embankments.",
                issued_by=issuer.id,
            ),
            Alert(
                district_id="dist-od-pu",
                hazard_type="CYCLONE",
                severity="HIGH",
                status="ACTIVE",
                title="Bay of Bengal Severe Storm Surge & Cyclone Watch",
                description="Doppler Radar tracks 110 km/h squalls moving North-Northwest toward Balasore arc with 3.4m wave runup warning.",
                issued_by=issuer.id,
            ),
            Alert(
                district_id="dist-gj-ku",
                hazard_type="EARTHQUAKE",
                severity="HIGH",
                status="ACTIVE",
                title="Kachchh Fault Line Seismic Movement",
                description="M5.4 thrust event at 16km depth. ShakeMap intensity VI generated for Bhuj & Gandhidham corridor.",
                issued_by=issuer.id,
            ),
            Alert(
                district_id="dist-as-ka",
                hazard_type="FLOOD",
                severity="MODERATE",
                status="ACTIVE",
                title="Brahmaputra River Inundation Alert",
                description="River levels rising above danger mark in low-lying riparian embankments across Kamrup corridor.",
                issued_by=issuer.id,
            ),
        ]
        db.add_all(initial_alerts)
        db.commit()
        logger.info("Seeded initial national disaster alerts.")

    # 6. Seed Initial Observations
    if db.query(Observation).count() == 0:
        now = datetime.now(timezone.utc)
        initial_obs = [
            Observation(district_id="dist-od-cu", observation_type="RIVER_LEVEL", value=52.8, unit="m", timestamp=now, data_source="CWC_MAHANADI_BARRAGE", quality_status="VERIFIED"),
            Observation(district_id="dist-od-pu", observation_type="RAINFALL", value=124.0, unit="mm", timestamp=now, data_source="IMD_DOPPLER_PURI", quality_status="VERIFIED"),
            Observation(district_id="dist-od-pu", observation_type="WIND_SPEED", value=88.5, unit="km/h", timestamp=now, data_source="IMD_COASTAL_ANEMOMETER_PURI", quality_status="VERIFIED"),
            Observation(district_id="dist-gj-ku", observation_type="SEISMIC_INTENSITY", value=0.18, unit="g", timestamp=now, data_source="NCS_STRONG_MOTION_BHUJ", quality_status="VERIFIED"),
            Observation(district_id="dist-as-ka", observation_type="RIVER_LEVEL", value=51.4, unit="m", timestamp=now, data_source="CWC_TELEMETRIC_BRAHMAPUTRA", quality_status="VERIFIED"),
            Observation(district_id="dist-mh-pu", observation_type="RAINFALL", value=68.4, unit="mm", timestamp=now, data_source="IMD_AUTOMATIC_WEATHER_STATION_PUNE", quality_status="VERIFIED"),
        ]
        db.add_all(initial_obs)
        db.commit()
        logger.info("Seeded initial telemetric observations.")

    # 7. Seed Initial Resources
    if db.query(Resource).count() == 0:
        initial_res = [
            Resource(district_id="dist-mh-pu", resource_type="AMBULANCE", name="Pune Regional Command AMBI", total_capacity=50, available_capacity=35, operational_status="OPERATIONAL", capabilities={"type": "ALS/BLS"}),
            Resource(district_id="dist-od-pu", resource_type="AMBULANCE", name="Puri Coastal Staging AMBULAN", total_capacity=30, available_capacity=22, operational_status="OPERATIONAL", capabilities={"type": "4x4 Emergency"}),
            Resource(district_id="dist-mh-pu", resource_type="HOSPITAL_BED", name="Pune Regional Command HOSP", total_capacity=50, available_capacity=35, operational_status="OPERATIONAL", capabilities={"type": "ICU & Trauma"}),
            Resource(district_id="dist-od-pu", resource_type="HOSPITAL_BED", name="Puri Coastal Staging HOSPITAL", total_capacity=30, available_capacity=22, operational_status="OPERATIONAL", capabilities={"type": "Emergency Ward"}),
            Resource(district_id="dist-mh-pu", resource_type="MEDICAL_TEAM", name="Pune Regional Command MEDI", total_capacity=50, available_capacity=35, operational_status="OPERATIONAL", capabilities={"specialty": "Trauma Surgery"}),
            Resource(district_id="dist-od-pu", resource_type="RESCUE_TEAM", name="Puri Coastal Staging RESCUE", total_capacity=30, available_capacity=22, operational_status="OPERATIONAL", capabilities={"type": "NDRF Flood Inundation"}),
        ]
        db.add_all(initial_res)
        db.commit()
        logger.info("Seeded initial disaster response resources.")
