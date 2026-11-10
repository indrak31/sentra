import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin.api';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatDate } from '../../utils/formatters';
import { SEED_DISTRICTS } from '../../utils/constants';
import { Users, Shield, Plus, Lock, History, AlertCircle, MapPin } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state for creating a user
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'DISASTER_MANAGER',
    district_id: 'dist-mh-pu',
  });

  // Fetch users
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getUsers({ page_size: 50 }),
  });

  // Fetch audit logs
  const { data: auditData, isLoading: isAuditLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminApi.getAuditLogs({ page_size: 50 }),
    enabled: activeTab === 'audit',
  });

  const users = usersData?.items || [];
  const auditLogs = auditData?.items || [];

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: (data: any) =>
      adminApi.createUser({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        roles: [data.role],
        district_id: data.district_id || null,
        state_id: data.district_id ? SEED_DISTRICTS[data.district_id]?.code.slice(0, 2) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsCreateOpen(false);
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        role: 'DISASTER_MANAGER',
        district_id: 'dist-mh-pu',
      });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newUser);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SECURITY & ACCESS CONTROL"
        title="User Governance"
        subtitle="Role-based access management, command authorization, and audit logs for incident operators."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'users' ? 'primary' : 'outline'}
              size="sm"
              icon={<Users className="w-3.5 h-3.5" />}
              onClick={() => setActiveTab('users')}
            >
              Operator Accounts
            </Button>
            <Button
              variant={activeTab === 'audit' ? 'primary' : 'outline'}
              size="sm"
              icon={<History className="w-3.5 h-3.5" />}
              onClick={() => setActiveTab('audit')}
            >
              Security Audit Logs
            </Button>
          </div>
        }
      />

      {activeTab === 'users' ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <Users className="w-4 h-4 text-slate-800" />
              <span>Registered Emergency Operators</span>
            </CardTitle>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3 h-3" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Provision New Operator
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Assigned Roles</th>
                  <th className="py-3 px-4">Geographic Jurisdiction</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isUsersLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Loading operator directory...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No operators found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const district = u.district_id ? SEED_DISTRICTS[u.district_id] : null;
                    const scopeLabel = district
                      ? `${district.name}, ${district.state}`
                      : u.state_id
                      ? `${u.state_id} (State Scope)`
                      : 'National Clearance';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{u.full_name}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {u.roles.map((r) => (
                              <span
                                key={r.id}
                                className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-slate-50 text-slate-700 border border-slate-200/90 font-medium"
                              >
                                {r.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{scopeLabel}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-semibold border ${
                              u.is_active
                                ? 'bg-emerald-50/70 text-emerald-700 border-emerald-200/80'
                                : 'bg-rose-50/70 text-rose-700 border-rose-200/80'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            {u.is_active ? 'ACTIVE' : 'LOCKED'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          {formatDate(u.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              <History className="w-4 h-4 text-slate-800" />
              <span>Immutable System Audit Trail</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Operator / Actor ID</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isAuditLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Retrieving audit logs...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No audit trail recorded.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors font-mono">
                      <td className="py-3 px-4 font-semibold text-amber-600">{log.action}</td>
                      <td className="py-3 px-4 text-slate-900">{log.entity_type}</td>
                      <td className="py-3 px-4 text-slate-500">{log.user_id ? log.user_id.slice(0, 12) + '...' : 'SYSTEM'}</td>
                      <td className="py-3 px-4 text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                      <td className="py-3 px-4 text-slate-400">{formatDate(log.timestamp)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Provision Operator Dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Provision Emergency Response Operator"
        description="Assign least-privilege roles and geographic jurisdiction boundaries"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={newUser.full_name}
            onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
            placeholder="e.g. Vikram Patil"
            required
            minLength={2}
          />

          <Input
            label="Gov / Department Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            placeholder="v.patil@sentra.gov.in"
            required
          />

          <Input
            label="Initial Temporary Password"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            placeholder="Minimum 8 characters"
            required
            minLength={8}
          />

          <Select
            label="Security Role Clearance"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            <option value="DISASTER_MANAGER">DISASTER_MANAGER (Full Incident & Solver Clearance)</option>
            <option value="HEALTHCARE_COORDINATOR">HEALTHCARE_COORDINATOR (Medical & Bed Surge Focus)</option>
            <option value="FIELD_RESPONDER">FIELD_RESPONDER (District Alerts & Acknowledgment)</option>
            <option value="ANALYST">ANALYST (Sensor Ingestion & Report Inquiries)</option>
            <option value="ADMINISTRATOR">ADMINISTRATOR (Full Platform Privilege)</option>
          </Select>

          <Select
            label="Assigned Geographic Jurisdiction Sector"
            value={newUser.district_id}
            onChange={(e) => setNewUser({ ...newUser, district_id: e.target.value })}
          >
            <option value="">National Scope (Unconstrained)</option>
            <optgroup label="Maharashtra">
              <option value="dist-mh-pu">Pune (District Sector)</option>
              <option value="dist-mh-mc">Mumbai City</option>
              <option value="dist-mh-rg">Raigad</option>
            </optgroup>
            <optgroup label="Assam">
              <option value="dist-as-km">Kamrup Metropolitan</option>
              <option value="dist-as-dh">Dhubri</option>
            </optgroup>
            <optgroup label="Odisha">
              <option value="dist-od-pu">Puri</option>
              <option value="dist-od-ba">Balasore</option>
            </optgroup>
          </Select>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createMutation.isPending}>
              Provision Account
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
