import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../api/reports.api';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { formatNumber, formatDate } from '../../utils/formatters';
import { FileBarChart2, ShieldCheck, Download, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const ReportsPage: React.FC = () => {
  const [selectedState, setSelectedState] = useState<string>('');

  const { data: impactReport, isLoading } = useQuery({
    queryKey: ['disaster-impact-report', selectedState],
    queryFn: () => reportsApi.getDisasterImpactReport(selectedState || undefined),
  });

  const { data: summary } = useQuery({
    queryKey: ['system-summary-reports'],
    queryFn: reportsApi.getSystemSummary,
  });

  const districts = impactReport?.summary_by_district || [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="EXECUTIVE INTELLIGENCE"
        title="Operational Reports"
        subtitle="Automated post-disaster damage assessments, situational briefings, and audit-ready NDMA reports."
        actions={
          <div className="flex items-center gap-2">
            <div className="w-48">
              <Select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
                <option value="">All Indian States</option>
                <option value="state-mh-001">Maharashtra</option>
                <option value="state-as-001">Assam</option>
                <option value="state-od-001">Odisha</option>
                <option value="state-kl-001">Kerala</option>
                <option value="state-rj-001">Rajasthan</option>
                <option value="state-uk-001">Uttarakhand</option>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={() => window.print()}
            >
              Export Report
            </Button>
          </div>
        }
      />

      {/* Summary Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Districts Audited</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {impactReport?.total_districts_reported ?? 14}
          </p>
        </Card>
        <Card className="p-4 bg-white">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Active Alerts</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            {summary?.total_active_alerts ?? '—'}
          </p>
        </Card>
        <Card className="p-4 bg-white">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Resources Deployed</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {summary?.total_registered_resources ?? '—'}
          </p>
        </Card>
        <Card className="p-4 bg-white">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Telemetry Ingests</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {summary?.total_observations ?? '—'}
          </p>
        </Card>
      </div>

      {/* Comprehensive District Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            <FileBarChart2 className="w-4 h-4 text-slate-800" />
            <span>District Disaster Impact Matrix</span>
          </CardTitle>
          <span className="text-[10px] font-bold font-mono text-slate-400 tracking-wider">
            GENERATED AT: {impactReport?.generated_at ? formatDate(impactReport.generated_at) : 'REAL-TIME'}
          </span>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">District & State</th>
                <th className="py-3 px-4">Active Alerts</th>
                <th className="py-3 px-4">Available Resources</th>
                <th className="py-3 px-4">Telemetry Ingests</th>
                <th className="py-3 px-4">Latest Hazard Assessment</th>
                <th className="py-3 px-4">Affected Population</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Aggregating statewide reports...
                  </td>
                </tr>
              ) : districts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No district impact records found.
                  </td>
                </tr>
              ) : (
                districts.map((d) => (
                  <tr key={d.district_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{d.district_name}</div>
                      <div className="text-[11px] text-slate-500">{d.state_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          d.active_alerts_count > 0
                            ? 'text-rose-700 bg-rose-50/70 border border-rose-200/80'
                            : 'text-slate-500 bg-slate-50 border border-slate-200'
                        }`}
                      >
                        {d.active_alerts_count > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                        {d.active_alerts_count} Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600 font-bold">
                      {d.available_resources_count} units
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-800 font-semibold">
                      {formatNumber(d.total_observations)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] text-slate-500">
                        {d.latest_hazard_assessment || 'NO RECENT EVENT'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-600">
                      {d.estimated_affected_population ? formatNumber(d.estimated_affected_population) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
