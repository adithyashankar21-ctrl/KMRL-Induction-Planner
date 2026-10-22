import React, { useState } from 'react';
import { Train, ShieldCheck, Activity, Bell, User, Bot, RefreshCw, Sun, Moon } from 'lucide-react';
import { UserRole, AlertItem } from '../types';
import { KochiMetroLogo } from './KochiMetroLogo';

interface NavbarProps {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  alerts: AlertItem[];
  onOpenCopilot: () => void;
  onResetFleet: () => void;
  fleetCount: { inService: number; standby: number; maintenance: number };
}

export const Navbar: React.FC<NavbarProps> = ({
  userRole,
  setUserRole,
  alerts,
  onOpenCopilot,
  onResetFleet,
  fleetCount,
}) => {
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <header className="h-16 border-b border-cyan-500/20 bg-black/40 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
      
      {/* Brand & System Title */}
      <div className="flex items-center space-x-3.5">
        <div className="p-1.5 bg-black/60 border border-cyan-500/30 rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] flex-shrink-0">
          <KochiMetroLogo height={32} />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-medium tracking-tight text-white flex items-center gap-1.5" style={{ fontFamily: "'Instrument Serif', serif" }}>
              <span className="text-cyan-400 font-bold">Metro AI</span>
              <span className="text-white text-sm font-sans font-semibold">| Operational OCC</span>
            </h1>
            <span className="hidden lg:inline-block px-2 py-0.5 text-[9px] font-mono font-bold rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase tracking-widest shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              CP-SAT SOLVER
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono tracking-tight">Muttom Depot • 25 Trainset Induction Matrix</p>
        </div>
      </div>

      {/* Live Operational Status Center */}
      <div className="hidden lg:flex items-center space-x-6 text-xs liquid-glass rounded-full px-5 py-2">
        <div className="flex items-center space-x-2 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse glow-emerald"></span>
          <span className="text-cyan-300 uppercase text-[10px] font-bold tracking-wider">Metro AI ONLINE</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-300 text-[11px]">22:00 IST TARGET</span>
        </div>

        <div className="h-4 w-px bg-white/10"></div>

        {/* Target Status Counts */}
        <div className="flex items-center space-x-2 text-[11px] font-mono">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Fleet: 25</span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase text-[10px]">
            Service: {fleetCount.inService}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold uppercase text-[10px]">
            Standby: {fleetCount.standby}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold uppercase text-[10px]">
            Maint: {fleetCount.maintenance}
          </span>
        </div>
      </div>

      {/* Right Actions & Role Selector */}
      <div className="flex items-center space-x-3">
        
        {/* AI Copilot Trigger */}
        <button
          onClick={onOpenCopilot}
          className="liquid-glass rounded-full px-4 py-1.5 text-xs font-semibold text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/20 transition-all cursor-pointer flex items-center space-x-1.5 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
          title="Ask AI Copilot"
        >
          <Bot className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Metro AI Copilot</span>
        </button>

        {/* Quick Alerts Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsMenu(!showAlertsMenu)}
            className="p-2 rounded-full bg-white/5 border border-white/10 hover:border-cyan-400/50 text-cyan-300 transition-colors relative cursor-pointer"
            title="Active Fleet Alerts"
          >
            <Bell className="w-4 h-4" />
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center glow-rose">
                {criticalCount}
              </span>
            )}
          </button>

          {showAlertsMenu && (
            <div className="absolute right-0 mt-2 w-80 liquid-glass border border-cyan-500/30 rounded-xl shadow-2xl z-50 overflow-hidden text-xs backdrop-blur-2xl">
              <div className="p-3 bg-black/60 border-b border-white/10 flex justify-between items-center font-mono">
                <span className="font-bold uppercase tracking-wider text-cyan-300 text-[10px]">Fleet Alerts ({alerts.length})</span>
                <span className="text-[10px] text-rose-400 font-bold uppercase">{criticalCount} Critical</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                {alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className="p-3 hover:bg-cyan-500/10 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold ${alert.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'}`}>
                        {alert.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{alert.timestamp}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Role Selector */}
        <div className="flex items-center space-x-1 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs">
          <User className="w-3.5 h-3.5 text-cyan-400 ml-0.5" />
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as UserRole)}
            className="bg-transparent text-slate-200 text-[11px] font-mono font-medium focus:outline-none pr-1 cursor-pointer"
          >
            <option value="planner" className="bg-slate-950 text-white">Senior Planner</option>
            <option value="supervisor" className="bg-slate-950 text-white">Duty Supervisor</option>
            <option value="viewer" className="bg-slate-950 text-white">Executive Viewer</option>
          </select>
        </div>

        {/* Reset Fleet Seed Data */}
        <button
          onClick={onResetFleet}
          className="p-2 rounded-full bg-white/5 border border-white/10 hover:border-cyan-400/50 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
          title="Reset Fleet Seed Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

    </header>
  );
};
