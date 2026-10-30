import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  LogOut,
  Menu,
  ScanSearch,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenMobileMenu: () => void;
}

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Security Posture Overview',
  '/scanner': 'AI Vulnerability Scanner',
  '/audits': 'Audit History & Telemetry',
  '/compliance': 'Regulatory Compliance Matrix',
  '/settings': 'Governance & Account Settings',
};

export function Navbar({ onOpenMobileMenu }: NavbarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const currentSection = ROUTE_TITLES[location.pathname] || 'Console';

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AU';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-8 shrink-0">
      {/* Zone 1: Mobile Menu Trigger + Breadcrumb Trail */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-md"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-slate-500 hidden sm:inline whitespace-nowrap">
            Governance Console
          </span>
          <span
            className="text-slate-300 hidden sm:inline"
            aria-hidden="true"
          >
            /
          </span>
          <span className="font-semibold text-slate-900 truncate">
            {currentSection}
          </span>
        </div>
      </div>

      {/* Zone 2 & 3: Primary Action + Account Menu */}
      <div className="flex items-center gap-3 shrink-0">
        {location.pathname !== '/scanner' && (
          <button
            type="button"
            onClick={() => navigate('/scanner')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <ScanSearch className="w-3.5 h-3.5" />
            <span>New Security Scan</span>
          </button>
        )}

        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <span className="w-7 h-7 rounded-md bg-slate-900 text-white text-xs font-mono font-semibold flex items-center justify-center shrink-0">
                {initials}
              </span>
              <span className="hidden sm:block text-left">
                <span className="block text-xs font-semibold text-slate-900 leading-tight max-w-[140px] truncate">
                  {user.fullName}
                </span>
                <span className="block text-[11px] text-slate-500 leading-tight">
                  {user.role}
                </span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-lg shadow-sm py-1.5 z-30">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {user.email}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {user.role} · {user.department}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account &amp; Policy Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
