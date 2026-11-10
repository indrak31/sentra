"""Initial database schema for SENTRA.

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-20 16:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. roles
    op.create_table(
        'roles',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('name', sa.String(length=50), nullable=False, unique=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_roles_name', 'roles', ['name'])

    # 2. states
    op.create_table(
        'states',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False, unique=True),
        sa.Column('code', sa.String(length=10), nullable=False, unique=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_states_name', 'states', ['name'])
    op.create_index('ix_states_code', 'states', ['code'])

    # 3. districts
    op.create_table(
        'districts',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('state_id', sa.String(length=36), sa.ForeignKey('states.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('population', sa.Integer(), nullable=False, default=0),
        sa.Column('area_sq_km', sa.Float(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('state_id', 'name', name='uq_state_district_name'),
    )
    op.create_index('ix_districts_state_id', 'districts', ['state_id'])
    op.create_index('ix_districts_name', 'districts', ['name'])
    op.create_index('ix_districts_code', 'districts', ['code'])

    # 4. locations
    op.create_table(
        'locations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('district_id', sa.String(length=36), sa.ForeignKey('districts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('location_type', sa.String(length=50), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('address', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_locations_district_id', 'locations', ['district_id'])
    op.create_index('ix_locations_location_type', 'locations', ['location_type'])

    # 5. users
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('state_id', sa.String(length=36), sa.ForeignKey('states.id', ondelete='SET NULL'), nullable=True),
        sa.Column('district_id', sa.String(length=36), sa.ForeignKey('districts.id', ondelete='SET NULL'), nullable=True),
        sa.Column('failed_login_attempts', sa.Integer(), nullable=False, default=0),
        sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_state_id', 'users', ['state_id'])
    op.create_index('ix_users_district_id', 'users', ['district_id'])

    # 6. user_roles
    op.create_table(
        'user_roles',
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('role_id', sa.String(length=36), sa.ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    )

    # 7. refresh_sessions
    op.create_table(
        'refresh_sessions',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False, unique=True),
        sa.Column('family_id', sa.String(length=36), nullable=False),
        sa.Column('is_revoked', sa.Boolean(), nullable=False, default=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('replaced_by', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_refresh_sessions_user_id', 'refresh_sessions', ['user_id'])
    op.create_index('ix_refresh_sessions_token_hash', 'refresh_sessions', ['token_hash'])
    op.create_index('ix_refresh_sessions_family_id', 'refresh_sessions', ['family_id'])

    # 8. observations
    op.create_table(
        'observations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('district_id', sa.String(length=36), sa.ForeignKey('districts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('location_id', sa.String(length=36), sa.ForeignKey('locations.id', ondelete='SET NULL'), nullable=True),
        sa.Column('observation_type', sa.String(length=50), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=20), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('data_source', sa.String(length=100), nullable=False),
        sa.Column('external_record_id', sa.String(length=100), nullable=True),
        sa.Column('quality_status', sa.String(length=20), nullable=False, default='UNVERIFIED'),
        sa.Column('ingestion_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('data_source', 'external_record_id', name='uq_source_external_record'),
    )
    op.create_index('ix_observations_district_id', 'observations', ['district_id'])
    op.create_index('ix_observations_observation_type', 'observations', ['observation_type'])
    op.create_index('ix_observations_timestamp', 'observations', ['timestamp'])
    op.create_index('ix_observations_data_source', 'observations', ['data_source'])

    # 9. risk_assessments
    op.create_table(
        'risk_assessments',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('district_id', sa.String(length=36), sa.ForeignKey('districts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('hazard_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, default='PENDING'),
        sa.Column('time_horizon', sa.String(length=50), nullable=False, default='24h'),
        sa.Column('input_snapshot', sa.JSON(), nullable=False),
        sa.Column('prediction_result', sa.JSON(), nullable=True),
        sa.Column('model_name', sa.String(length=100), nullable=True),
        sa.Column('model_version', sa.String(length=50), nullable=True),
        sa.Column('data_provenance', sa.JSON(), nullable=True),
        sa.Column('error_details', sa.String(length=500), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_risk_assessments_district_id', 'risk_assessments', ['district_id'])
    op.create_index('ix_risk_assessments_hazard_type', 'risk_assessments', ['hazard_type'])
    op.create_index('ix_risk_assessments_status', 'risk_assessments', ['status'])

    # 10. health_impacts
    op.create_table(
        'health_impacts',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('risk_assessment_id', sa.String(length=36), sa.ForeignKey('risk_assessments.id', ondelete='SET NULL'), nullable=True),
        sa.Column('district_id', sa.String(length=36), sa.ForeignKey('districts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(length=40), nullable=False, default='COMPLETE'),
        sa.Column('exposed_population', sa.Integer(), nullable=False, default=0),
        sa.Column('estimated_affected', sa.Integer(), nullable=False, default=0),
        sa.Column('vulnerability_indicators', sa.JSON(), nullable=False),
        sa.Column('estimated_medical_demand', sa.JSON(), nullable=False),
        sa.Column('estimation_method', sa.String(length=100), nullable=False),
        sa.Column('estimation_version', sa.String(length=50), nullable=False),
        sa.Column('assumptions', sa.JSON(), nullable=False),
        sa.Column('limitations', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_health_impacts_district_id', 'health_impacts', ['district_id'])
    op.create_index('ix_health_impacts_risk_assessment_id', 'health_impacts', ['risk_assessment_id'])
    op.create_index('ix_health_impacts_status', 'health_impacts', ['status'])

    # 11. resources
    op.create_table(
        'resources',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('district_id', sa.String(length=36), sa.ForeignKey('districts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('location_id', sa.String(length=36), sa.ForeignKey('locations.id', ondelete='SET NULL'), nullable=True),
        sa.Column('resource_type', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('total_capacity', sa.Integer(), nullable=False),
        sa.Column('available_capacity', sa.Integer(), nullable=False),
        sa.Column('operational_status', sa.String(length=30), nullable=False, default='OPERATIONAL'),
        sa.Column('capabilities', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint('available_capacity <= total_capacity', name='ck_resource_avail_le_total'),
        sa.CheckConstraint('available_capacity >= 0', name='ck_resource_avail_non_negative'),
        sa.CheckConstraint('total_capacity >= 0', name='ck_resource_total_non_negative'),
    )
    op.create_index('ix_resources_district_id', 'resources', ['district_id'])
    op.create_index('ix_resources_resource_type', 'resources', ['resource_type'])

    # 12. optimization_runs
    op.create_table(
        'optimization_runs',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('district_id', sa.String(length=36), sa.ForeignKey('districts.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, default='OPTIMAL'),
        sa.Column('solver_status', sa.String(length=50), nullable=False),
        sa.Column('objective_value', sa.Float(), nullable=True),
        sa.Column('input_snapshot', sa.JSON(), nullable=False),
        sa.Column('result_summary', sa.JSON(), nullable=False),
        sa.Column('unmet_demand', sa.JSON(), nullable=False),
        sa.Column('unused_capacity', sa.JSON(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_optimization_runs_status', 'optimization_runs', ['status'])

    # 13. allocations
    op.create_table(
        'allocations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('optimization_run_id', sa.String(length=36), sa.ForeignKey('optimization_runs.id', ondelete='CASCADE'), nullable=True),
        sa.Column('resource_id', sa.String(length=36), sa.ForeignKey('resources.id', ondelete='CASCADE'), nullable=False),
        sa.Column('district_id', sa.String(length=36), sa.ForeignKey('districts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('allocated_quantity', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, default='PROPOSED'),
        sa.Column('notes', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_allocations_optimization_run_id', 'allocations', ['optimization_run_id'])
    op.create_index('ix_allocations_resource_id', 'allocations', ['resource_id'])
    op.create_index('ix_allocations_district_id', 'allocations', ['district_id'])

    # 14. simulations
    op.create_table(
        'simulations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('baseline_run_id', sa.String(length=36), sa.ForeignKey('optimization_runs.id', ondelete='SET NULL'), nullable=True),
        sa.Column('scenario_parameters', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, default='COMPLETED'),
        sa.Column('result_summary', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 15. alerts
    op.create_table(
        'alerts',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('district_id', sa.String(length=36), sa.ForeignKey('districts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('hazard_type', sa.String(length=50), nullable=False),
        sa.Column('risk_assessment_id', sa.String(length=36), sa.ForeignKey('risk_assessments.id', ondelete='SET NULL'), nullable=True),
        sa.Column('severity', sa.String(length=20), nullable=False, default='MODERATE'),
        sa.Column('status', sa.String(length=20), nullable=False, default='ACTIVE'),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=False),
        sa.Column('issued_by', sa.String(length=36), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('acknowledged_by', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_alerts_district_id', 'alerts', ['district_id'])
    op.create_index('ix_alerts_hazard_type', 'alerts', ['hazard_type'])
    op.create_index('ix_alerts_severity', 'alerts', ['severity'])
    op.create_index('ix_alerts_status', 'alerts', ['status'])

    # 16. audit_logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=100), nullable=False),
        sa.Column('entity_id', sa.String(length=36), nullable=True),
        sa.Column('details', sa.JSON(), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'])
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'])
    op.create_index('ix_audit_logs_entity_type', 'audit_logs', ['entity_type'])
    op.create_index('ix_audit_logs_timestamp', 'audit_logs', ['timestamp'])


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('alerts')
    op.drop_table('simulations')
    op.drop_table('allocations')
    op.drop_table('optimization_runs')
    op.drop_table('resources')
    op.drop_table('health_impacts')
    op.drop_table('risk_assessments')
    op.drop_table('observations')
    op.drop_table('refresh_sessions')
    op.drop_table('user_roles')
    op.drop_table('users')
    op.drop_table('locations')
    op.drop_table('districts')
    op.drop_table('states')
    op.drop_table('roles')
