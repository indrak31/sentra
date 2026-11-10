import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resourcesApi } from '../../api/resources.api';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { OperationalBadge } from '../../components/common/StatusBadge';
import { SEED_DISTRICTS } from '../../utils/constants';
import { ResourceRead, OperationalStatusEnum, ResourceTypeEnum } from '../../types';
import {
  Ambulance,
  Bed,
  HeartPulse,
  Home,
  Users,
  Package,
  Plus,
  Edit2,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

const RESOURCE_CONFIG: Record<
  string,
  { label: string; icon: React.FC<{ className?: string }> }
> = {
  AMBULANCE: { label: 'Ambulance Unit', icon: Ambulance },
  HOSPITAL_BED: { label: 'Hospital Facility', icon: Bed },
  MEDICAL_TEAM: { label: 'Medical Response Team', icon: HeartPulse },
  TEMPORARY_SHELTER: { label: 'Emergency Shelter', icon: Home },
  RESCUE_TEAM: { label: 'Disaster Rescue Team', icon: Users },
  RELIEF_SUPPLY_PACK: { label: 'Relief Supply Depot', icon: Package },
};

export const ResourceInventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Edit capacity state
  const [editingResource, setEditingResource] = useState<ResourceRead | null>(null);
  const [editCapacity, setEditCapacity] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<OperationalStatusEnum>('OPERATIONAL');

  const { data: resourcesData, isLoading } = useQuery({
    queryKey: ['resources-inventory', selectedType, selectedDistrict, selectedStatus],
    queryFn: () =>
      resourcesApi.getResources({
        resource_type: selectedType !== 'all' ? selectedType : undefined,
        district_id: selectedDistrict !== 'all' ? selectedDistrict : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        page_size: 100,
      }),
  });

  const resources = resourcesData?.items || [];

  // Update resource mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => resourcesApi.updateResource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-resources'] });
      setEditingResource(null);
    },
  });

  const handleEditOpen = (res: ResourceRead) => {
    setEditingResource(res);
    setEditCapacity(res.available_capacity);
    setEditStatus(res.operational_status);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    updateMutation.mutate({
      id: editingResource.id,
      data: {
        available_capacity: editCapacity,
        operational_status: editStatus,
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="LOGISTICS & FLEET ASSETS"
        title="Resource & Fleet Inventory"
        subtitle="Real-time availability, readiness status, and geo-allocation for emergency relief fleets and NDRF battalions."
      />

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="w-48">
          <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="all">All Resource Types</option>
            <option value="AMBULANCE">ALS Ambulances</option>
            <option value="HOSPITAL_BED">Hospital Beds</option>
            <option value="MEDICAL_TEAM">Medical Teams</option>
            <option value="TEMPORARY_SHELTER">Temporary Shelters</option>
            <option value="RELIEF_SUPPLY_PACK">Relief Packs</option>
          </Select>
        </div>

        <div className="w-48">
          <Select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
            <option value="all">All Districts</option>
            {Object.entries(SEED_DISTRICTS).map(([id, d]) => (
              <option key={id} value={id}>
                {d.name} ({d.state})
              </option>
            ))}
          </Select>
        </div>

        <div className="w-44">
          <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="OPERATIONAL">Operational</option>
            <option value="DEGRADED">Degraded</option>
            <option value="OFFLINE">Offline</option>
          </Select>
        </div>
      </div>

      {/* Resource Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            Loading real-time resource units...
          </div>
        ) : resources.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No resource inventory matches current filters.
          </div>
        ) : (
          resources.map((res) => {
            const district = SEED_DISTRICTS[res.district_id];
            const loc = district ? `${district.name}, ${district.state}` : res.district_id;
            const pct = res.total_capacity > 0 ? Math.round((res.available_capacity / res.total_capacity) * 100) : 0;
            const config = RESOURCE_CONFIG[res.resource_type] || {
              label: res.resource_type.replace(/_/g, ' '),
              icon: Package,
            };
            const Icon = config.icon;

            return (
              <div
                key={res.id}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3.5 group"
              >
                {/* Header: Icon + Category + Name + Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-center text-slate-600 group-hover:text-blue-600 group-hover:bg-blue-50/60 group-hover:border-blue-200/70 transition-colors shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                        {config.label}
                      </span>
                      <h3
                        className="text-sm font-semibold text-slate-900 leading-snug line-clamp-1"
                        title={res.name}
                      >
                        {res.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{loc}</span>
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <OperationalBadge status={res.operational_status} />
                  </div>
                </div>

                {/* Capacity Metric Section */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <div className="flex items-baseline gap-1 text-slate-900">
                      <span className="text-sm font-bold font-mono tracking-tight">
                        {res.available_capacity}
                      </span>
                      <span className="text-slate-400 text-[11px] font-normal">
                        / {res.total_capacity} units available
                      </span>
                    </div>
                    <span
                      className={`font-semibold font-mono text-[11px] ${
                        pct > 50
                          ? 'text-emerald-700'
                          : pct > 20
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>

                  {/* Clean, sleek progress line */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        pct > 50
                          ? 'bg-emerald-500'
                          : pct > 20
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {res.capabilities?.generator_backup && (
                      <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded font-medium">
                        Generator
                      </span>
                    )}
                    {res.capabilities?.all_weather_certified && (
                      <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded font-medium">
                        All-Weather
                      </span>
                    )}
                    {res.capabilities?.water_purification && (
                      <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded font-medium">
                        Purification
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEditOpen(res)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-md hover:bg-slate-100 border border-slate-200/80 transition-colors shrink-0"
                  >
                    <Edit2 className="w-3 h-3 text-slate-400" />
                    <span>Update Capacity</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Capacity Dialog */}
      <Dialog
        isOpen={!!editingResource}
        onClose={() => setEditingResource(null)}
        title="Update Operational Resource Capacity"
        description={editingResource?.name}
      >
        {editingResource && (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Total Fleet Units:</span>
                <span className="text-slate-900 font-bold">{editingResource.total_capacity}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Type:</span>
                <span className="text-sky-600 font-medium">{editingResource.resource_type}</span>
              </div>
            </div>

            <Input
              label="Available Working Units"
              type="number"
              min="0"
              max={editingResource.total_capacity}
              value={editCapacity}
              onChange={(e) => setEditCapacity(parseInt(e.target.value) || 0)}
              required
            />

            <Select
              label="Operational Fleet Status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as OperationalStatusEnum)}
            >
              <option value="OPERATIONAL">OPERATIONAL (Normal Service)</option>
              <option value="DEGRADED">DEGRADED (Partial Crew / Damaged)</option>
              <option value="OFFLINE">OFFLINE (Inaccessible / Road Block)</option>
            </Select>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingResource(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={updateMutation.isPending}>
                Save Fleet Update
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
};
