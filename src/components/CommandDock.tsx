import React from 'react';
import {
  Grid,
  LayoutDashboard,
  Navigation,
  Cpu,
  Wrench,
  Users,
  Train,
  Map,
  AlertTriangle,
  FileText,
  Bot,
  Sparkles
} from 'lucide-react';
import { ActiveTab } from '../types';

interface CommandDockProps {
  activeTab: ActiveTab | 'launcher';
  onSelectTab: (tab: ActiveTab | 'launcher') => void;
  onOpenChatbot: () => void;
  isCopilotOpen: boolean;
  criticalAlertCount: number;
}

export const CommandDock: React.FC<CommandDockProps> = ({
  activeTab,
  onSelectTab,
  onOpenChatbot,
  isCopilotOpen,
  criticalAlertCount,
}) => {
  const dockItems = [
    { id: 'launcher', label: 'Launcher Hub', icon: Grid, isLauncher: true },
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'livemap', label: 'Metro Map', icon: Navigation },
    { id: 'induction', label: 'AI Induction', icon: Cpu },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'operations', label: 'Crew & Track', icon: Users },
    { id: 'fleet', label: 'Fleet (25)', icon: Train },
    { id: 'depot', label: 'Depot Map', icon: Map },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: criticalAlertCount },
    { id: 'report', label: 'Report', icon: FileText },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] overflow-x-auto scrollbar-none py-1 px-1">
      <div className="bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-1.5 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex items-center space-x-1 sm:space-x-1.5">
        
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as any)}
              className={`relative group px-2.5 sm:px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 flex-shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-105'
                  : item.isLauncher
                  ? 'bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 hover:text-white'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-cyan-500/20'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-cyan-300'}`} />
              <span className="hidden sm:inline tracking-tight">{item.label}</span>

              {/* Active Window Dot */}
              {isActive && (
                <span className="absolute -top-1 right-1/2 translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping"></span>
              )}

              {/* Alert Badge */}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold">
                  {item.badge}
                </span>
              )}

              {/* Tooltip on hover */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 border border-cyan-500/40 text-cyan-200 text-[10px] font-mono py-1 px-2.5 rounded shadow-xl whitespace-nowrap pointer-events-none z-50">
                {item.label}
              </div>
            </button>
          );
        })}

        <div className="h-6 w-px bg-cyan-500/30 mx-1"></div>

        {/* AI Chatbot Dock Button */}
        <button
          onClick={onOpenChatbot}
          className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 flex-shrink-0 ${
            isCopilotOpen
              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-105'
              : 'bg-slate-900/80 hover:bg-cyan-950 text-cyan-300 border border-cyan-400/50 hover:text-white'
          }`}
          title="Toggle AI Chatbot Window"
        >
          <Bot className="w-4 h-4 text-cyan-300" />
          <span className="hidden md:inline">AI Chatbot</span>
        </button>

      </div>
    </div>
  );
};
