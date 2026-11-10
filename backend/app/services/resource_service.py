"""Resource inventory and allocation service."""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException, SentraException
from app.models.allocation import Allocation
from app.models.location import District, Location
from app.models.resource import Resource
from app.schemas.resource import ResourceCreate, ResourceUpdate


class ResourceService:
    def create(self, db: Session, req: ResourceCreate) -> Resource:
        district = db.query(District).filter(District.id == req.district_id).first()
        if not district:
            raise EntityNotFoundException("District", req.district_id)

        if req.location_id:
            loc = db.query(Location).filter(Location.id == req.location_id).first()
            if not loc:
                raise EntityNotFoundException("Location", req.location_id)

        resource = Resource(
            district_id=req.district_id,
            location_id=req.location_id,
            resource_type=req.resource_type.value,
            name=req.name,
            total_capacity=req.total_capacity,
            available_capacity=req.available_capacity,
            operational_status=req.operational_status.value,
            capabilities=req.capabilities,
        )
        db.add(resource)
        db.commit()
        db.refresh(resource)
        return resource

    def update(self, db: Session, resource_id: str, req: ResourceUpdate) -> Resource:
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            raise EntityNotFoundException("Resource", resource_id)

        if req.name is not None:
            resource.name = req.name
        if req.total_capacity is not None:
            resource.total_capacity = req.total_capacity
        if req.available_capacity is not None:
            if req.available_capacity > resource.total_capacity:
                raise SentraException(
                    "available_capacity cannot exceed total_capacity",
                    code="INVALID_CAPACITY",
                    status_code=400,
                )
            resource.available_capacity = req.available_capacity
        if req.operational_status is not None:
            resource.operational_status = req.operational_status.value
        if req.capabilities is not None:
            resource.capabilities = req.capabilities

        db.commit()
        db.refresh(resource)
        return resource

    def get_by_id(self, db: Session, resource_id: str) -> Resource:
        res = db.query(Resource).filter(Resource.id == resource_id).first()
        if not res:
            raise EntityNotFoundException("Resource", resource_id)
        return res

    def list_resources(
        self,
        db: Session,
        district_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Resource], int]:
        query = db.query(Resource)
        if district_id:
            query = query.filter(Resource.district_id == district_id)
        if resource_type:
            query = query.filter(Resource.resource_type == resource_type.upper())
        if status:
            query = query.filter(Resource.operational_status == status.upper())

        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(Resource.name.asc()).offset(offset).limit(page_size).all()
        return items, total

    def confirm_allocation(self, db: Session, allocation_id: str) -> Allocation:
        """Confirm a proposed allocation and deduct from live inventory safely."""
        alloc = db.query(Allocation).filter(Allocation.id == allocation_id).first()
        if not alloc:
            raise EntityNotFoundException("Allocation", allocation_id)

        if alloc.status == "CONFIRMED":
            return alloc

        resource = db.query(Resource).filter(Resource.id == alloc.resource_id).with_for_update().first()
        if not resource:
            raise EntityNotFoundException("Resource", alloc.resource_id)

        if resource.available_capacity < alloc.allocated_quantity:
            raise SentraException(
                f"Insufficient available capacity for resource '{resource.name}'. Available: {resource.available_capacity}, Required: {alloc.allocated_quantity}",
                code="INSUFFICIENT_RESOURCE_CAPACITY",
                status_code=400,
            )

        resource.available_capacity -= alloc.allocated_quantity
        alloc.status = "CONFIRMED"
        db.commit()
        db.refresh(alloc)
        return alloc


resource_service = ResourceService()
