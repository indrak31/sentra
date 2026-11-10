import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { LoadingScreen } from '../../components/common/LoadingScreen';

interface ProtectedRouteProps {
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { user, accessToken, isInitialized, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (accessToken && !user && !isInitialized) {
      fetchProfile();
    }
  }, [accessToken, user, isInitialized, fetchProfile]);

  if (!isInitialized && accessToken && !user) {
    return <LoadingScreen message="Initializing SENTRA Command Twin..." />;
  }

  if (requiredRole && user) {
    const hasRole = user.roles?.some((r) => r.name === requiredRole || r.name === 'ADMINISTRATOR');
    if (!hasRole) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-lg font-bold text-rose-600">Access Denied (403)</h2>
          <p className="text-sm mt-2 text-slate-500">
            This operational module requires the '{requiredRole}' clearance role.
          </p>
        </div>
      );
    }
  }

  return <Outlet />;
};
