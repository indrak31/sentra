import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  Search,
  Bell,
  Menu,
  LogOut,
  Shield,
  Sparkles,
} from 'lucide-react';

interface TopNavbarProps {
  onToggleSidebar?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);

  // Map route to breadcrumb label
  const getBreadcrumb = () => {
    switch (location.pathname) {
      case '/':
      case '/overview':
        return 'Overview';
      case '/map':
        return 'Geographic Explorer';
      case '/hazards':
        return 'Hazard Intelligence';
      case '/alerts':
        return 'Emergency Alerts';
      case '/observations':
        return 'Sensor Telemetry';
      case '/health':
        return 'Health Surge Estimator';
      case '/resources':
        return 'Resource Inventory';
      case '/optimization':
        return 'Resource Solver';
      case '/simulations':
        return 'Risk Simulator';
      case '/reports':
        return 'Reports';
      case '/settings':
        return 'Settings & Preferences';
      case '/admin':
        return 'User Management';
      default:
        return 'Overview';
    }
  };

  const userInitials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AC';

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 sticky top-0 z-40 px-6 sm:px-8 flex items-center justify-between gap-4 select-none">
      {/* Left: Mobile Toggle + Clean Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Clean Breadcrumb: Workspace > Overview */}
        <div className="flex items-center gap-2.5 text-[13px]">
          <Link
            to="/"
            className="text-slate-500 hover:text-slate-900 transition-colors font-normal"
          >
            Workspace
          </Link>
          <span className="text-slate-300 font-light">&gt;</span>
          <span className="text-slate-900 font-semibold">{getBreadcrumb()}</span>
        </div>
      </div>

      {/* Right: Search + System Live + Notification Bell + User Avatar */}
      <div className="flex items-center gap-3.5 sm:gap-4">
        {/* Global Search with ⌘K badge */}
        <div className="relative hidden md:flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-64 lg:w-72 pl-9 pr-12 py-2 bg-white text-xs text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900/20 focus:border-slate-900 transition-all placeholder:text-slate-400"
          />
          <kbd className="absolute right-2 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded shadow-2xs pointer-events-none font-sans">
            ⌘ K
          </kbd>
        </div>

        {/* Vertical Divider */}
        <div className="hidden sm:block h-5 w-[1px] bg-slate-200 mx-1" />

        {/* System Live Indicator - Clean Inline with pulsing dot */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System live</span>
        </div>

        {/* Notification Bell with indicator */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          title="Priority Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white" />
        </button>

        {/* User Avatar Circle */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="w-8 h-8 rounded-full bg-[#0F172A] text-white font-bold text-xs flex items-center justify-center transition-all hover:ring-2 hover:ring-slate-900/20 focus:outline-none"
            title={user?.full_name || 'Alex Carter'}
          >
            {userInitials}
          </button>

          {/* User Dropdown Menu */}
          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-lg py-2 z-40 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-900 truncate">
                    {user?.full_name || 'Alex Carter'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {user?.email || 'alex.carter@sentra.gov.in'}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-medium text-[10px]">
                    {user?.roles?.[0]?.name || 'Operations Analyst'}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/');
                    }}
                    className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    Operational Overview
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/reports');
                    }}
                    className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                    Reports &amp; Audit
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full text-left px-3.5 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
