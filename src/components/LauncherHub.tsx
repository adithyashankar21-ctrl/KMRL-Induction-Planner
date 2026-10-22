import React from 'react';
import { LayoutDashboard, Navigation, Cpu, Wrench, Users, Train, Map, AlertTriangle, FileText, Bot, Sparkles, Activity, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { ActiveTab } from '../types';
import { KochiMetroLogo } from './KochiMetroLogo';

interface LauncherHubProps {
  onOpenTab: (tab: ActiveTab) => void;
  onOpenChatbot: () => void;
  criticalAlertCount: number;
  fleetCount: { inService: number; standby: number; maintenance: number };
}

export const LauncherHub: React.FC<LauncherHubProps> = ({
  onOpenTab,
  onOpenChatbot,
  criticalAlertCount,
  fleetCount,
}) => {
  const options = [
    {
      id: 'dashboard',
      title: 'Operations Overview',
      subtitle: 'Real-time telemetry, 22:00 IST induction targets & fleet KPI cards',
      icon: LayoutDashboard,
      gradient: 'from-cyan-500/20 via-slate-900/90 to-slate-950',
      borderColor: 'border-cyan-500/40',
      textColor: 'text-cyan-300',
      badge: 'Live Telemetry',
    },
    {
      id: 'livemap',
      title: 'Active Metro Line Map',
      subtitle: 'Real-time 25-station Aluva-Thrippunithura map, zoom & station search',
      icon: Navigation,
      gradient: 'from-emerald-500/20 via-slate-900/90 to-slate-950',
      borderColor: 'border-emerald-500/40',
      textColor: 'text-emerald-300',
      badge: '25 Stations',
    },
    {
      id: 'induction',
      title: 'Smart AI Induction Hub',
      subtitle: 'CP-SAT optimization solver engine with certificate & mileage rules',
      icon: Cpu,
      gradient: 'from-purple-500/20 via-slate-900/90 to-slate-950',
      borderColor: 'border-purple-500/40',
      textColor: 'text-purple-300',
      badge: 'CP-SAT Engine',
    },
    {
      id: 'maintenance',
      title: 'Maintenance & Fitness Hub',
      subtitle: 'Job card tracker, 30-item daily inspection checklists & cleaning logs',
      icon: Wrench,
      gradient: 'from-amber-500/20 via-slate-900/90 to-slate-950',
      borderColor: 'border-amber-500/40',
      textColor: 'text-amber-300',
      badge: 'Job Cards',
    },
    {
      id: 'operations',
      title: 'Crew & Track Dispatch',
      subtitle: 'Loco pilot duty rosters, Muttom platform tracks & broadcast system',
      icon: Users,
      gradient: 'from-blue-500/20 via-slate-900/90 to-slate-950',
      borderColor: 'border-blue-500/40',
      textColor: 'text-blue-300',
      badge: 'Crew & Tracks',
    },
    {
      id: 'fleet',
      title: 'Fleet Manager (25 Rakes)',
      subtitle: 'Detailed rake inspector, wheel diameter, cert validity & manual overrides',
      icon: Train,
      gradient: 'from-cyan-500/20 via-slate-900/90 to-slate-950',
      borderColor: 'border-cyan-500/40',
      textColor: 'text-cyan-300',
      badge: `${fleetCount.inService + fleetCount.standby + fleetCount.maintenance} Rakes`,
    },
    {
      id: 'depot',
      title: 'Digital Twin Depot Map',
      subtitle: 'Muttom Depot track layout, stabling lines, inspection bays & IBL/EBL',
      icon: Map,
      gradient: 'from-emerald-500/20 via-slate-900/90 to-slate-950',
      borderColor: 'border-emerald-500/40',
      textColor: 'text-emerald-300',
      badge: 'Muttom Depot',
    },
    {
      id: 'alerts',
      title: 'Alert & Compliance Center',
      subtitle: 'Critical safety violations, expiring certificates & rule overrides',
      icon: AlertTriangle,
      gradient: 'from-rose-500/20 via-slate-900/90 to-slate-950',
      borderColor: 'border-rose-500/40',
      textColor: 'text-rose-300',
      badge: criticalAlertCount > 0 ? `${criticalAlertCount} Critical` : '0 Critical',
      badgeColor: criticalAlertCount > 0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : undefined,
    },
    {
      id: 'report',
      title: 'Shift Report Generator',
      subtitle: 'Generate printable shift handover reports & PDF export summaries',
      icon: FileText,
      gradient: 'from-slate-800/40 via-slate-900/90 to-slate-950',
      borderColor: 'border-slate-700/50',
      textColor: 'text-slate-200',
      badge: 'Handover PDF',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8 select-none">
      
      {/* Launcher Welcome Banner */}
      <div className="cyber-card p-6 rounded-2xl border-cyan-500/30 bg-slate-950/80 backdrop-blur-2xl relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)]">
        <div className="absolute -top-10 -right-10 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-2.5 bg-black/60 border border-cyan-400/50 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <KochiMetroLogo height={36} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">
                  KMRL Operational OCC Command Hub
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Select Workspace Window
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans mt-1">
                Select any operational module below to launch its interactive floating window over the live Muttom Depot telemetry canvas.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenChatbot}
            className="liquid-glass bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black px-5 py-3 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] flex items-center space-x-2 transition-all cursor-pointer group flex-shrink-0 hover:scale-105"
          >
            <Bot className="w-5 h-5 text-slate-950 group-hover:rotate-12 transition-transform" />
            <span className="text-xs uppercase tracking-wider font-mono">Open AI Chatbot</span>
          </button>
        </div>
      </div>

      {/* Grid of Interactive Window Option Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => onOpenTab(opt.id as ActiveTab)}
              className={`group text-left p-5 rounded-2xl bg-gradient-to-b ${opt.gradient} border ${opt.borderColor} hover:border-cyan-400 transition-all cursor-pointer backdrop-blur-2xl shadow-xl hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] relative overflow-hidden flex flex-col justify-between h-48 hover:-translate-y-1 duration-200`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none"></div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-center ${opt.textColor} group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.2)]`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${opt.badgeColor || 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'}`}>
                    {opt.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 font-mono tracking-tight transition-colors">
                  {opt.title}
                </h3>
                <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed line-clamp-2">
                  {opt.subtitle}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[11px] font-mono text-cyan-400 font-semibold group-hover:text-cyan-300">
                <span>Launch Interactive Window</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
};
