import React from 'react';
import { Grid, LayoutDashboard, Train, Cpu, Map, AlertTriangle, FileText, Navigation, Wrench, Users } from 'lucide-react';
import { KochiMetroLogo } from './KochiMetroLogo';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab | 'launcher';
  setActiveTab: (tab: ActiveTab | 'launcher') => void;
  criticalAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  criticalAlertCount,
}) => {
  const menuItems = [
    { id: 'launcher', label: 'Workspace Launcher', icon: Grid, isLauncher: true },
    { id: 'dashboard', label: 'Operations Overview', icon: LayoutDashboard },
    { id: 'induction', label: 'Smart AI Induction Hub', icon: Cpu, highlight: true },
    { id: 'maintenance', label: 'Maintenance & Fitness Hub', icon: Wrench },
    { id: 'operations', label: 'Crew & Track Dispatch', icon: Users },
    { id: 'livemap', label: 'Active Metro Line Map', icon: Navigation },
    { id: 'fleet', label: 'Fleet Manager (25 Rakes)', icon: Train },
    { id: 'depot', label: 'Digital Twin Depot Map', icon: Map },
    { id: 'alerts', label: 'Alert & Compliance Center', icon: AlertTriangle, badge: criticalAlertCount },
    { id: 'report', label: 'Shift Report Generator', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-black/40 border-r border-cyan-500/20 flex-shrink-0 flex flex-col hidden md:flex min-h-[calc(100vh-4rem-2rem)] select-none backdrop-blur-xl">
      <div className="p-3 space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-mono font-bold text-cyan-400/80 uppercase tracking-widest flex items-center justify-between border-b border-white/10 mb-2 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
            <span>METRO AI NAVIGATION</span>
          </div>
          <KochiMetroLogo height={18} />
        </div>

        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs transition-all cursor-pointer ${
                isActive
                  ? 'liquid-glass text-cyan-300 font-semibold border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : item.highlight
                  ? 'text-cyan-300 hover:bg-white/5 border border-cyan-500/30 font-medium'
                  : 'text-slate-400 hover:bg-white/5 hover:text-cyan-300 font-medium'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : item.highlight ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="tracking-tight">{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-mono font-bold shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
