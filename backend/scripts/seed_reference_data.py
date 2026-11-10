"""Seed development reference data for Indian states, districts, and demo resources.

NOTE: This is a representative development seed dataset for local testing and simulation.
It does NOT contain every official Indian administrative unit or district.
"""

import sys
from pathlib import Path

# Ensure BACKEND directory is in sys.path so script can be run from any working directory
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.logging import logger, setup_logging
from app.db.session import SessionLocal
from app.models.location import District, State
from app.models.resource import Resource

DEVELOPMENT_STATES = [
    {
        "name": "Assam",
        "code": "AS",
        "districts": [
            {"name": "Kamrup Metropolitan", "code": "AS-KM", "population": 1253938, "area_sq_km": 1528.0, "latitude": 26.1445, "longitude": 91.7362},
            {"name": "Dhubri", "code": "AS-DH", "population": 1949258, "area_sq_km": 2838.0, "latitude": 26.0207, "longitude": 89.9743},
            {"name": "Cachar", "code": "AS-CA", "population": 1736617, "area_sq_km": 3786.0, "latitude": 24.8333, "longitude": 92.7789},
        ],
    },
    {
        "name": "Maharashtra",
        "code": "MH",
        "districts": [
            {"name": "Mumbai City", "code": "MH-MC", "population": 3085411, "area_sq_km": 157.0, "latitude": 18.9388, "longitude": 72.8354},
            {"name": "Pune", "code": "MH-PU", "population": 9429408, "area_sq_km": 15643.0, "latitude": 18.5204, "longitude": 73.8567},
            {"name": "Raigad", "code": "MH-RG", "population": 2634200, "area_sq_km": 7152.0, "latitude": 18.5158, "longitude": 73.1822},
        ],
    },
    {
        "name": "Odisha",
        "code": "OD",
        "districts": [
            {"name": "Puri", "code": "OD-PU", "population": 1698730, "area_sq_km": 3479.0, "latitude": 19.8135, "longitude": 85.8312},
            {"name": "Balasore", "code": "OD-BA", "population": 2320529, "area_sq_km": 3806.0, "latitude": 21.4934, "longitude": 86.9135},
        ],
    },
    {
        "name": "Kerala",
        "code": "KL",
        "districts": [
            {"name": "Ernakulam", "code": "KL-ER", "population": 3282388, "area_sq_km": 3068.0, "latitude": 9.9816, "longitude": 76.2999},
            {"name": "Wayanad", "code": "KL-WA", "population": 817420, "area_sq_km": 2132.0, "latitude": 11.6854, "longitude": 76.1320},
        ],
    },
    {
        "name": "Rajasthan",
        "code": "RJ",
        "districts": [
            {"name": "Jaipur", "code": "RJ-JP", "population": 6626178, "area_sq_km": 11152.0, "latitude": 26.9124, "longitude": 75.7873},
            {"name": "Jaisalmer", "code": "RJ-JS", "population": 669919, "area_sq_km": 38401.0, "latitude": 26.9157, "longitude": 70.9083},
        ],
    },
    {
        "name": "Uttarakhand",
        "code": "UK",
        "districts": [
            {"name": "Chamoli", "code": "UK-CH", "population": 391605, "area_sq_km": 8030.0, "latitude": 30.4231, "longitude": 79.3283},
            {"name": "Dehradun", "code": "UK-DD", "population": 1696694, "area_sq_km": 3088.0, "latitude": 30.3165, "longitude": 78.0322},
        ],
    },
]


def seed_data() -> None:
    setup_logging()
    db = SessionLocal()
    try:
        logger.info("Seeding development reference data for Indian states and districts...")
        for state_info in DEVELOPMENT_STATES:
            state = db.query(State).filter(State.code == state_info["code"]).first()
            if not state:
                state = State(name=state_info["name"], code=state_info["code"], is_active=True)
                db.add(state)
                db.commit()
                db.refresh(state)
                logger.info("Created state: %s (%s)", state.name, state.code)

            for dist_info in state_info["districts"]:
                dist = db.query(District).filter(District.state_id == state.id, District.code == dist_info["code"]).first()
                if not dist:
                    dist = District(
                        state_id=state.id,
                        name=dist_info["name"],
                        code=dist_info["code"],
                        population=dist_info["population"],
                        area_sq_km=dist_info["area_sq_km"],
                        latitude=dist_info["latitude"],
                        longitude=dist_info["longitude"],
                    )
                    db.add(dist)
                    db.commit()
                    db.refresh(dist)
                    logger.info("  Created district: %s (%s)", dist.name, dist.code)

                    # Seed sample emergency resources for this district
                    resources = [
                        Resource(
                            district_id=dist.id,
                            resource_type="AMBULANCE",
                            name=f"{dist.name} Emergency ALS Ambulance Fleet",
                            total_capacity=15,
                            available_capacity=15,
                            operational_status="OPERATIONAL",
                            capabilities={"type": "ALS", "oxygen_equipped": True},
                        ),
                        Resource(
                            district_id=dist.id,
                            resource_type="HOSPITAL_BED",
                            name=f"{dist.name} District Civil Hospital ICU/Emergency Beds",
                            total_capacity=120,
                            available_capacity=120,
                            operational_status="OPERATIONAL",
                            capabilities={"icu": True, "trauma_unit": True},
                        ),
                        Resource(
                            district_id=dist.id,
                            resource_type="MEDICAL_TEAM",
                            name=f"{dist.name} Rapid Health Response Medical Teams",
                            total_capacity=6,
                            available_capacity=6,
                            operational_status="OPERATIONAL",
                            capabilities={"doctors": 4, "paramedics": 8},
                        ),
                        Resource(
                            district_id=dist.id,
                            resource_type="TEMPORARY_SHELTER",
                            name=f"{dist.name} Community Relief Center & Cyclone Shelter",
                            total_capacity=500,
                            available_capacity=500,
                            operational_status="OPERATIONAL",
                            capabilities={"generator": True, "potable_water": True},
                        ),
                    ]
                    db.add_all(resources)
                    db.commit()

        logger.info("Development reference data seeding complete.")
    except Exception as exc:
        logger.error("Error during reference data seeding: %s", exc)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
