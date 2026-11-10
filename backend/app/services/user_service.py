"""User and administrator management service with audit logging."""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.core.exceptions import EntityAlreadyExistsException, EntityNotFoundException
from app.core.security import get_password_hash
from app.models.audit_log import AuditLog
from app.models.role import Role
from app.models.user import User
from app.schemas.user import AdminUserCreate, AdminUserUpdate


class UserService:
    def list_users(self, db: Session, page: int = 1, page_size: int = 20) -> Tuple[List[User], int]:
        total = db.query(User).count()
        offset = (page - 1) * page_size
        users = db.query(User).offset(offset).limit(page_size).all()
        return users, total

    def get_by_id(self, db: Session, user_id: str) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise EntityNotFoundException("User", user_id)
        return user

    def create_admin_user(
        self,
        db: Session,
        req: AdminUserCreate,
        actor_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> User:
        existing = db.query(User).filter(User.email == req.email.lower()).first()
        if existing:
            raise EntityAlreadyExistsException("User", "email", req.email)

        roles = []
        if req.roles:
            roles = db.query(Role).filter(Role.name.in_(req.roles)).all()

        user = User(
            email=req.email.lower(),
            hashed_password=get_password_hash(req.password),
            full_name=req.full_name,
            is_active=True,
            state_id=req.state_id,
            district_id=req.district_id,
            roles=roles,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Audit log
        self.record_audit(
            db=db,
            actor_id=actor_id,
            action="CREATE_USER",
            entity_type="User",
            entity_id=user.id,
            details={"email": user.email, "roles": [r.name for r in roles]},
            ip_address=ip_address,
        )
        return user

    def update_admin_user(
        self,
        db: Session,
        user_id: str,
        req: AdminUserUpdate,
        actor_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> User:
        user = self.get_by_id(db, user_id)

        changes = {}
        if req.full_name is not None:
            user.full_name = req.full_name
            changes["full_name"] = req.full_name
        if req.is_active is not None:
            user.is_active = req.is_active
            changes["is_active"] = req.is_active
        if req.state_id is not None:
            user.state_id = req.state_id
            changes["state_id"] = req.state_id
        if req.district_id is not None:
            user.district_id = req.district_id
            changes["district_id"] = req.district_id
        if req.roles is not None:
            roles = db.query(Role).filter(Role.name.in_(req.roles)).all()
            user.roles = roles
            changes["roles"] = [r.name for r in roles]

        db.commit()
        db.refresh(user)

        self.record_audit(
            db=db,
            actor_id=actor_id,
            action="UPDATE_USER",
            entity_type="User",
            entity_id=user.id,
            details=changes,
            ip_address=ip_address,
        )
        return user

    def record_audit(
        self,
        db: Session,
        actor_id: Optional[str],
        action: str,
        entity_type: str,
        entity_id: Optional[str],
        details: dict,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        log = AuditLog(
            user_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
        )
        db.add(log)
        db.commit()
        return log

    def list_audit_logs(
        self, db: Session, page: int = 1, page_size: int = 20
    ) -> Tuple[List[AuditLog], int]:
        total = db.query(AuditLog).count()
        offset = (page - 1) * page_size
        logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(offset).limit(page_size).all()
        return logs, total


user_service = UserService()
