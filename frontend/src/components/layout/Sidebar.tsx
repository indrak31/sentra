import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { SentraLogo } from '../common/SentraLogo';
import {
  LayoutGrid,
  Radio,
  Layers,
  ShieldCheck,
  Globe,
  Clock,
  FileText,
  Database,
  Settings,
  HelpCircle,
  ChevronDown,
  MoreHorizontal,
  ArrowUpRight,
  LogOut,
  Check,
  Bell,
  Cpu,
  Truck,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRegion, setSelectedRegion] = useState('India National Command');
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const regionOptions = [
    { name: 'India National Command', code: 'IND-HQ', count: 38 },
    { name: 'Eastern Command (Odisha, WB)', code: 'IND-EAST', count: 14 },
    { name: 'Western Command (Maharashtra, Gujarat)', code: 'IND-WEST', count: 12 },
    { name: 'Northeastern Command (Assam, Cachar)', code: 'IND-NE', count: 8 },
    { name: 'Southern Coastal Command (Kerala, TN)', code: 'IND-SOUTH', count: 4 },
  ];

  // Workspace navigation items aligning cleanly with page domains
  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutGrid },
    { name: 'Geographic Explorer', path: '/map', icon: Globe },
    { name: 'Emergency Alerts', path: '/alerts', icon: Bell, badge: '4' },
    { name: 'Sensor Telemetry', path: '/observations', icon: Radio },
    { name: 'Hazard Intelligence', path: '/hazards', icon: Layers },
    { name: 'Risk Simulator', path: '/simulations', icon: ShieldCheck },
    { name: 'Resource Solver', path: '/optimization', icon: Cpu },
    { name: 'Resource Fleet', path: '/resources', icon: Truck },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  const userInitials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AC';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Main Sidebar (Width: 264px matching Figma) */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 h-screen z-50 w-[264px] bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 select-none',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Top Area: Logo + Regional Command Selector + Nav */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          {/* Exact Brand Header */}
          <div className="px-1 py-0.5">
            <SentraLogo size="lg" />
          </div>

          {/* Regional Command Selector Card */}
          <div className="relative">
            <button
              onClick={() => setRegionDropdownOpen((prev) => !prev)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  <Globe className="w-5 h-5 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-slate-900 leading-tight truncate">
                    Regional Command
                  </p>
                  <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
                    {selectedRegion}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0 ml-1" />
            </button>

            {/* Region Dropdown Menu */}
            {regionDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setRegionDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30 text-xs animate-in fade-in duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Select Region
                  </div>
                  {regionOptions.map((reg) => (
                    <button
                      key={reg.name}
                      onClick={() => {
                        setSelectedRegion(reg.name);
                        setRegionDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 text-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        {selectedRegion === reg.name ? (
                          <Check className="w-3.5 h-3.5 text-slate-900" />
                        ) : (
                          <div className="w-3.5 h-3.5" />
                        )}
                        <span className={selectedRegion === reg.name ? 'font-semibold text-slate-900' : ''}>
                          {reg.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {reg.count} events
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Navigation Section */}
          <div className="space-y-2">
            <div className="px-2 pb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.14em]">
                Workspace
              </span>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center justify-between px-3.5 py-3 rounded-xl text-[13.5px] transition-all group select-none min-h-[44px]',
                        isActive
                          ? 'bg-slate-100 text-[#0F172A] font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3.5 min-w-0">
                          <Icon
                            className={clsx(
                              'w-[18px] h-[18px] shrink-0 transition-colors',
                              isActive ? 'text-[#0F172A]' : 'text-slate-400 group-hover:text-slate-700'
                            )}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {item.badge ? (
                          <span
                            className={clsx(
                              'px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-colors',
                              isActive
                                ? 'bg-slate-200 text-slate-900 font-bold'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                            )}
                          >
                            {item.badge}
                          </span>
                        ) : isActive ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0F172A] shrink-0" />
                        ) : null}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Area: Settings + Profile */}
        <div className="p-5 border-t border-slate-100 space-y-4 shrink-0">
          {/* Settings & Help Links */}
          <div className="space-y-0.5">
            <button
              onClick={() => {
                navigate('/settings');
                onClose?.();
              }}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors font-medium',
                location.pathname === '/settings'
                  ? 'bg-slate-100 text-[#0F172A] font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <Settings
                className={clsx(
                  'w-4 h-4',
                  location.pathname === '/settings' ? 'text-[#0F172A]' : 'text-slate-400'
                )}
              />
              <span>Settings</span>
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Help &amp; documentation</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>

          {/* User Profile Pill */}
          <div className="relative pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between p-1 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#E0E7FF] text-[#3730A3] font-bold text-xs flex items-center justify-center shrink-0">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.full_name || 'Alex Carter'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {user?.roles?.[0]?.name || 'Operations Analyst'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                title="Account options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Logout Menu */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 text-xs">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
