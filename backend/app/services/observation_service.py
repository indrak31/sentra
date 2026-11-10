"""Environmental observation ingestion and query service."""

from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException
from app.core.logging import logger
from app.models.location import District
from app.models.observation import Observation
from app.schemas.observation import ObservationBulkCreate, ObservationCreate


class ObservationService:
    def create(self, db: Session, req: ObservationCreate) -> Observation:
        # Validate district exists
        district = db.query(District).filter(District.id == req.district_id).first()
        if not district:
            raise EntityNotFoundException("District", req.district_id)

        # De-duplication check if external_record_id provided
        if req.external_record_id:
            existing = (
                db.query(Observation)
                .filter(
                    Observation.data_source == req.data_source,
                    Observation.external_record_id == req.external_record_id,
                )
                .first()
            )
            if existing:
                return existing

        obs = Observation(
            district_id=req.district_id,
            location_id=req.location_id,
            observation_type=req.observation_type.upper(),
            value=req.value,
            unit=req.unit,
            timestamp=req.timestamp,
            data_source=req.data_source,
            external_record_id=req.external_record_id,
            quality_status=req.quality_status,
        )
        db.add(obs)
        db.commit()
        db.refresh(obs)
        return obs

    def bulk_create(self, db: Session, req: ObservationBulkCreate) -> List[Observation]:
        results: List[Observation] = []
        for item in req.observations:
            try:
                obs = self.create(db, item)
                results.append(obs)
            except Exception as exc:
                logger.warning("Error ingesting observation in bulk: %s", exc)
                continue
        return results

    def list_observations(
        self,
        db: Session,
        district_id: Optional[str] = None,
        observation_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Observation], int]:
        query = db.query(Observation)

        if district_id:
            query = query.filter(Observation.district_id == district_id)
        if observation_type:
            query = query.filter(Observation.observation_type == observation_type.upper())
        if start_time:
            query = query.filter(Observation.timestamp >= start_time)
        if end_time:
            query = query.filter(Observation.timestamp <= end_time)

        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(Observation.timestamp.desc()).offset(offset).limit(page_size).all()
        return items, total

    def get_by_id(self, db: Session, observation_id: str) -> Observation:
        obs = db.query(Observation).filter(Observation.id == observation_id).first()
        if not obs:
            raise EntityNotFoundException("Observation", observation_id)
        return obs


observation_service = ObservationService()
