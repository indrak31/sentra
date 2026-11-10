"""Geographic reference data service."""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.exceptions import EntityAlreadyExistsException, EntityNotFoundException
from app.models.location import District, Location, State
from app.schemas.location import DistrictCreate, LocationCreate, StateCreate


class LocationService:
    def list_states(self, db: Session) -> List[State]:
        return db.query(State).order_by(State.name.asc()).all()

    def get_state(self, db: Session, state_id: str) -> State:
        state = db.query(State).filter(State.id == state_id).first()
        if not state:
            raise EntityNotFoundException("State", state_id)
        return state

    def create_state(self, db: Session, req: StateCreate) -> State:
        existing = db.query(State).filter((State.name == req.name) | (State.code == req.code)).first()
        if existing:
            raise EntityAlreadyExistsException("State", "name or code", req.code)
        state = State(name=req.name, code=req.code, is_active=req.is_active)
        db.add(state)
        db.commit()
        db.refresh(state)
        return state

    def list_districts(self, db: Session, state_id: Optional[str] = None) -> List[District]:
        query = db.query(District)
        if state_id:
            query = query.filter(District.state_id == state_id)
        return query.order_by(District.name.asc()).all()

    def get_district(self, db: Session, district_id: str) -> District:
        district = db.query(District).filter(District.id == district_id).first()
        if not district:
            raise EntityNotFoundException("District", district_id)
        return district

    def create_district(self, db: Session, req: DistrictCreate) -> District:
        # Validate parent state exists
        self.get_state(db, req.state_id)

        existing = (
            db.query(District)
            .filter(District.state_id == req.state_id, District.name == req.name)
            .first()
        )
        if existing:
            raise EntityAlreadyExistsException("District", "name in state", req.name)

        district = District(
            state_id=req.state_id,
            name=req.name,
            code=req.code,
            population=req.population,
            area_sq_km=req.area_sq_km,
            latitude=req.latitude,
            longitude=req.longitude,
        )
        db.add(district)
        db.commit()
        db.refresh(district)
        return district

    def list_locations(self, db: Session, district_id: Optional[str] = None) -> List[Location]:
        query = db.query(Location)
        if district_id:
            query = query.filter(Location.district_id == district_id)
        return query.order_by(Location.name.asc()).all()

    def create_location(self, db: Session, req: LocationCreate) -> Location:
        self.get_district(db, req.district_id)
        location = Location(
            district_id=req.district_id,
            name=req.name,
            location_type=req.location_type,
            latitude=req.latitude,
            longitude=req.longitude,
            address=req.address,
        )
        db.add(location)
        db.commit()
        db.refresh(location)
        return location


location_service = LocationService()
