import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '../../api/alerts.api';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { SeverityBadge, HazardBadge } from '../../components/common/StatusBadge';
import { SEED_DISTRICTS } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import { AlertCreate, AlertSeverityEnum, HazardType } from '../../types';
import { AlertTriangle, Plus, CheckCircle, ShieldAlert, Filter, MapPin } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState<AlertCreate>({
    district_id: 'dist-mh-pu',
    hazard_type: 'FLOOD',
    severity: 'HIGH',
    title: '',
    description: '',
  });

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['alerts-list', selectedSeverity, selectedStatus],
    queryFn: () =>
      alertsApi.getAlerts({
        severity: selectedSeverity !== 'all' ? selectedSeverity : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        page_size: 50,
      }),
  });

  const alerts = alertsData?.items || [];

  // Create alert mutation
  const createMutation = useMutation({
    mutationFn: alertsApi.createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
      setIsCreateOpen(false);
      setFormData({
        district_id: 'dist-mh-pu',
        hazard_type: 'FLOOD',
        severity: 'HIGH',
        title: '',
        description: '',
      });
    },
  });

  // Acknowledge alert mutation
  const ackMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACKNOWLEDGED' | 'RESOLVED' }) =>
      alertsApi.updateAlert(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="EARLY WARNING DISSEMINATION"
        title="Emergency Alerts"
        subtitle="Authoritative multi-channel CAP alerts, evacuation advisories, and cell-broadcast sirens across high-risk sectors."
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Broadcast Emergency Alert
          </Button>
        }
      />

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
          <Filter className="w-3.5 h-3.5 text-slate-800" />
          <span>Filters:</span>
        </div>

        <div className="w-40">
          <Select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
          >
            <option value="all">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </Select>
        </div>

        <div className="w-40">
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </Select>
        </div>
      </div>

      {/* Alerts Table Card */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 w-28">Severity</th>
                <th className="py-3 px-4 w-44">Hazard</th>
                <th className="py-3 px-4">Alert Details</th>
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading incident records...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No emergency alerts match the selected criteria.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => {
                  const district = SEED_DISTRICTS[alert.district_id];
                  const loc = district ? `${district.name}, ${district.state}` : alert.district_id;

                  return (
                    <tr key={alert.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <SeverityBadge severity={alert.severity} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <HazardBadge hazard={alert.hazard_type} size="sm" variant="inline" />
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-semibold text-slate-900 text-xs">
                          {alert.title}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {alert.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{loc}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">
                        {formatDate(alert.created_at)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-semibold border ${
                            alert.status === 'ACTIVE'
                              ? 'bg-rose-50/70 text-rose-700 border-rose-200/80'
                              : alert.status === 'ACKNOWLEDGED'
                              ? 'bg-amber-50/70 text-amber-800 border-amber-200/80'
                              : 'bg-emerald-50/70 text-emerald-700 border-emerald-200/80'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              alert.status === 'ACTIVE'
                                ? 'bg-rose-500'
                                : alert.status === 'ACKNOWLEDGED'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          {alert.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {alert.status === 'ACTIVE' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => ackMutation.mutate({ id: alert.id, status: 'ACKNOWLEDGED' })}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {alert.status !== 'RESOLVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => ackMutation.mutate({ id: alert.id, status: 'RESOLVED' })}
                          >
                            Resolve
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Broadcast Alert Modal */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Broadcast Emergency Disaster Alert"
        description="Issue verified incident alert to district emergency response personnel"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Alert Headline"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Flash Flood Inundation Warning — Zone B"
            required
            minLength={5}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Hazard Category"
              value={formData.hazard_type}
              onChange={(e) => setFormData({ ...formData, hazard_type: e.target.value as HazardType })}
            >
              <option value="FLOOD">Flood</option>
              <option value="CYCLONE">Cyclone</option>
              <option value="EARTHQUAKE">Earthquake</option>
              <option value="HEATWAVE">Heatwave</option>
              <option value="LANDSLIDE">Landslide</option>
              <option value="DROUGHT">Drought</option>
            </Select>

            <Select
              label="Severity Level"
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as AlertSeverityEnum })}
            >
              <option value="LOW">Low (Advisory)</option>
              <option value="MODERATE">Moderate (Watch)</option>
              <option value="HIGH">High (Warning)</option>
              <option value="CRITICAL">Critical (Emergency)</option>
            </Select>
          </div>

          <Select
            label="Target Jurisdiction"
            value={formData.district_id}
            onChange={(e) => setFormData({ ...formData, district_id: e.target.value })}
          >
            {Object.entries(SEED_DISTRICTS).map(([id, d]) => (
              <option key={id} value={id}>
                {d.name} ({d.state})
              </option>
            ))}
          </Select>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Disaster Impact Details & Guidance
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-3 h-24 transition-all placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              placeholder="Immediate evacuation orders, shelter locations, medical emergency contact details..."
              required
              minLength={10}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createMutation.isPending}>
              Issue Broadcast
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
