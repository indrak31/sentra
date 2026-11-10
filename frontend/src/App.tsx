import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { CommandDashboardPage } from './features/dashboard/CommandDashboardPage';
import { HazardsOverviewPage } from './features/hazards/HazardsOverviewPage';
import { AlertsPage } from './features/alerts/AlertsPage';
import { SensorObservationsPage } from './features/observations/SensorObservationsPage';
import { HealthSurgeEstimatorPage } from './features/health/HealthSurgeEstimatorPage';
import { ResourceInventoryPage } from './features/resources/ResourceInventoryPage';
import { OptimizationStudioPage } from './features/optimization/OptimizationStudioPage';
import { ScenarioSimulatorPage } from './features/simulations/ScenarioSimulatorPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { LiveMapPage } from './features/map-view/LiveMapPage';
import { UserManagementPage } from './features/admin/UserManagementPage';
import { SettingsPage } from './features/settings/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated Workspace Shell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Operational Overview (Figma Make Design) */}
            <Route path="/" element={<CommandDashboardPage />} />
            <Route path="/overview" element={<CommandDashboardPage />} />

            {/* Geographic Explorer */}
            <Route path="/map" element={<LiveMapPage />} />

            {/* Core Modules */}
            <Route path="/hazards" element={<HazardsOverviewPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/observations" element={<SensorObservationsPage />} />
            <Route path="/health" element={<HealthSurgeEstimatorPage />} />
            <Route path="/resources" element={<ResourceInventoryPage />} />
            <Route path="/optimization" element={<OptimizationStudioPage />} />
            <Route path="/simulations" element={<ScenarioSimulatorPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Admin only route */}
            <Route element={<ProtectedRoute requiredRole="ADMINISTRATOR" />}>
              <Route path="/admin" element={<UserManagementPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
