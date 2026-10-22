import React, { useState } from 'react';
import { Trainset, AlertItem, InductionPlan } from '../types';
import { ShieldCheck, Wrench, AlertTriangle, ArrowUpRight, Zap, Grid, List, CheckCircle, Sparkles } from 'lucide-react';
import { KochiMetroLogo } from './KochiMetroLogo';

interface DashboardViewProps {
  fleet: Trainset[];
  alerts: AlertItem[];
  plan: InductionPlan | null;
  onRunOptimizer: () => void;
  onSelectTrain: (train: Trainset) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  fleet,
  alerts,
  plan,
  onRunOptimizer,
  onSelectTrain,
  onNavigateTab,
}) => {
  const [viewMode, setViewMode] = useState<'tiles' | 'table'>('tiles');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; timestamp: string }>>([
    {
      sender: 'ai',
      text: 'Hello! I am the Metro AI Operations Assistant. Ask me anything about trainsets, fitness certificates, maintenance job cards, line status, or fleet readiness.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const inServiceCount = fleet.filter(t => t.currentStatus === 'IN_SERVICE').length;
  const standbyCount = fleet.filter(t => t.currentStatus === 'STANDBY').length;
  const maintenanceCount = fleet.filter(t => t.currentStatus === 'MAINTENANCE').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');

  const healthyCertsCount = fleet.filter(t => 
    !t.certificates.rollingStock.isExpired && 
    !t.certificates.signalling.isExpired && 
    !t.certificates.telecom.isExpired
  ).length;

  const filteredFleet = fleet.filter(t => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'HEALTHY') {
      return !t.certificates.rollingStock.isExpired && !t.certificates.signalling.isExpired && !t.certificates.telecom.isExpired;
    }
    return t.currentStatus === statusFilter;
  });

  const handleAiQuery = (customText?: string) => {
    const queryText = customText || aiPrompt;
    if (!queryText.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user' as const, text: queryText, timestamp: timeStr };

    let aiReplyText = "Analyzing fleet telemetry across 25 trainsets and 15 operational readiness modules...";
    const lower = queryText.toLowerCase();

    if (lower.includes('grounded') || lower.includes('ts-05') || lower.includes('ts-04') || lower.includes('maint')) {
      aiReplyText = "Trainsets currently in MAINTENANCE: TS-04 (HVAC inspection & traction motor check) and TS-05 (Signalling cert renewal pending). Both are isolated from revenue service allocation.";
    } else if (lower.includes('cert') || lower.includes('expir')) {
      const expiringTrains = fleet.filter(t => t.certificates.rollingStock.isExpired || t.certificates.signalling.isExpired || t.certificates.telecom.isExpired);
      aiReplyText = `Found ${expiringTrains.length} trainset(s) with certificate warnings: ${expiringTrains.map(t => t.id).join(', ') || 'None'}. Certificate validation is enforced on all line dispatches.`;
    } else if (lower.includes('wash') || lower.includes('clean')) {
      const overdueClean = fleet.filter(t => t.cleaningStatus === 'overdue');
      aiReplyText = `Automatic Wash Plant Status: ${overdueClean.length} rake(s) have overdue cleaning cycles (${overdueClean.map(t => t.id).join(', ') || 'None'}). They are routed to Muttom Wash Bay 3.`;
    } else if (lower.includes('crew') || lower.includes('pilot')) {
      aiReplyText = "Crew Availability Status: 18 Loco Pilots on-duty, 4 standby pilots on standby roster at Muttom Operations Room. 100% crew readiness for peak schedule.";
    } else {
      aiReplyText = `Metro AI evaluated '${queryText}': All 16 primary revenue service trainsets are green and cleared for operation. 25 stations live on Aluva ↔ Thrippunithura corridor.`;
    }

    const aiMsg = { sender: 'ai' as const, text: aiReplyText, timestamp: timeStr };

    setChatMessages(prev => [...prev, userMsg, aiMsg]);
    setAiPrompt('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-cyan-500/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg liquid-glass border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <KochiMetroLogo height={28} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white tracking-tight font-mono">
                KMRL Operations Overview
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                System Live
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Real-time telemetry, readiness tracking & fleet monitoring for 25 trainsets across Aluva ↔ Thrippunithura line
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded bg-slate-950 border border-cyan-500/30 text-cyan-300 font-bold flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>25 Trainsets Operational</span>
          </span>
        </div>
      </div>

      {/* Top Banner / Hero Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`cyber-card cyber-card-hover p-4 rounded-sm flex flex-col justify-between cursor-pointer transition-all ${
            statusFilter === 'ALL' ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : ''
          }`}
        >
          <div>
            <div className="text-[10px] text-cyan-400 font-mono font-bold uppercase mb-1 tracking-widest flex items-center justify-between">
              <span>Total Fleet</span>
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full glow-cyan"></span>
            </div>
            <div className="text-3xl font-black text-white font-mono">25</div>
          </div>
          <div className="text-[11px] text-emerald-400 mt-3 flex items-center gap-1.5 font-mono font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse glow-emerald"></span>
            <span>{healthyCertsCount} Certified Safe</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('HEALTHY')}
          className={`cyber-card cyber-card-hover p-4 rounded-sm flex flex-col justify-between cursor-pointer transition-all ${
            statusFilter === 'HEALTHY' ? 'border-emerald-400 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : ''
          }`}
        >
          <div>
            <div className="text-[10px] text-emerald-400 font-mono font-bold uppercase mb-1 tracking-widest flex items-center justify-between">
              <span>In Service</span>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full glow-emerald"></span>
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono text-glow-emerald">{inServiceCount}</div>
          </div>
          <div className="text-[11px] text-cyan-300 mt-3 font-mono">16 Peak Target Active</div>
        </div>

        <div
          onClick={() => setStatusFilter('MAINTENANCE')}
          className={`cyber-card cyber-card-hover p-4 rounded-sm flex flex-col justify-between cursor-pointer transition-all ${
            statusFilter === 'MAINTENANCE' ? 'border-rose-500 bg-rose-950/20 shadow-[0_0_20px_rgba(244,63,94,0.2)]' : ''
          }`}
        >
          <div>
            <div className="text-[10px] text-cyan-400 font-mono font-bold uppercase mb-1 tracking-widest flex items-center justify-between">
              <span>Maint & Alert</span>
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
            </div>
            <div className="text-3xl font-black text-rose-400 font-mono">{maintenanceCount}</div>
          </div>
          <div className="text-[11px] text-amber-300 mt-3 font-mono">{standbyCount} Hot Standby Backup</div>
        </div>

        <div className="cyber-card p-4 rounded-sm border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 to-emerald-950/40 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div>
            <div className="text-[10px] text-cyan-300 font-mono font-bold uppercase mb-1 tracking-widest">Fleet Readiness</div>
            <div className="text-lg font-black gradient-text-cyber">100% OPERATIONAL</div>
          </div>
          <div className="text-[11px] text-emerald-400 mt-3 font-mono flex items-center space-x-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>15 Modules Synchronized</span>
          </div>
        </div>

      </div>

      {/* 15-Point KMRL Operational Readiness Workflow Matrix */}
      <div className="liquid-glass p-5 rounded-2xl border border-cyan-500/30 bg-slate-950/90 shadow-xl space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">
              KMRL 15-Feature Operational Workflow & AI Automation Matrix
            </h3>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30">
            15/15 Operational Modules Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2 text-[11px]">
          <div onClick={() => onNavigateTab('maintenance')} className="p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-cyan-400 cursor-pointer transition-colors">
            <div className="text-cyan-400 font-bold">1. Maintenance Records</div>
            <div className="text-[10px] text-slate-400 font-sans">Unified Dashboard</div>
          </div>
          <div onClick={() => onNavigateTab('maintenance')} className="p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-cyan-400 cursor-pointer transition-colors">
            <div className="text-cyan-400 font-bold">2. Inspection Check</div>
            <div className="text-[10px] text-slate-400 font-sans">Automatic Validation</div>
          </div>
          <div onClick={() => onNavigateTab('maintenance')} className="p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-cyan-400 cursor-pointer transition-colors">
            <div className="text-cyan-400 font-bold">3. Cleaning Status</div>
            <div className="text-[10px] text-slate-400 font-sans">Digital Wash Plant</div>
          </div>
          <div onClick={() => onNavigateTab('maintenance')} className="p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-cyan-400 cursor-pointer transition-colors">
            <div className="text-cyan-400 font-bold">4. Review Fault Logs</div>
            <div className="text-[10px] text-slate-400 font-sans">Real-time Dashboard</div>
          </div>
          <div onClick={() => onNavigateTab('maintenance')} className="p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-cyan-400 cursor-pointer transition-colors">
            <div className="text-cyan-400 font-bold">5. Verify Train Fitness</div>
            <div className="text-[10px] text-slate-400 font-sans">Readiness Score Engine</div>
          </div>

          <div onClick={() => onNavigateTab('operations')} className="p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-cyan-400 cursor-pointer transition-colors">
            <div className="text-cyan-400 font-bold">6. Crew Availability</div>
            <div className="text-[10px] text-slate-400 font-sans">Pilot & Staff Roster</div>
          </div>
          <div onClick={() => onNavigateTab('operations')} className="p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-cyan-400 cursor-pointer transition-colors">
            <div className="text-cyan-400 font-bold">7. Platform Availability</div>
            <div className="text-[10px] text-slate-400 font-sans">Platform Assignment</div>
          </div>
          <div onClick={() => onNavigateTab('operations')} className="p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-cyan-400 cursor-pointer transition-colors">
            <div className="text-cyan-400 font-bold">8. Depot Exit Track</div>
            <div className="text-[10px] text-slate-400 font-sans">Queue Optimizer</div>
          </div>
          <div onClick={() => onNavigateTab('induction')} className="p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-cyan-400 cursor-pointer transition-colors">
            <div className="text-cyan-400 font-bold">9. Compare Trains</div>
            <div className="text-[10px] text-slate-400 font-sans">AI Train Ranking</div>
          </div>
          <div onClick={() => onNavigateTab('induction')} className="p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-cyan-400 cursor-pointer transition-colors">
            <div className="text-cyan-400 font-bold">10. Fleet Utilization</div>
            <div className="text-[10px] text-slate-400 font-sans">Mileage Equalizer</div>
          </div>

          <div onClick={() => onNavigateTab('induction')} className="p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-cyan-400 cursor-pointer transition-colors">
            <div className="text-cyan-400 font-bold">11. Constraints Check</div>
            <div className="text-[10px] text-slate-400 font-sans">Validation Engine</div>
          </div>
          <div onClick={() => onNavigateTab('induction')} className="p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-cyan-400 cursor-pointer transition-colors">
            <div className="text-cyan-400 font-bold">12. Induction Order</div>
            <div className="text-[10px] text-slate-400 font-sans">Smart AI Planner</div>
          </div>
          <div onClick={() => onNavigateTab('induction')} className="p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-cyan-400 cursor-pointer transition-colors">
            <div className="text-cyan-400 font-bold">13. Daily Schedule</div>
            <div className="text-[10px] text-slate-400 font-sans">Auto Induction Plan</div>
          </div>
          <div onClick={() => onNavigateTab('operations')} className="p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-cyan-400 cursor-pointer transition-colors">
            <div className="text-cyan-400 font-bold">14. Inform Stakeholders</div>
            <div className="text-[10px] text-slate-400 font-sans">Role Notifications</div>
          </div>
          <div onClick={() => onNavigateTab('report')} className="p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-cyan-400 cursor-pointer transition-colors">
            <div className="text-cyan-400 font-bold">15. Generate Reports</div>
            <div className="text-[10px] text-slate-400 font-sans">One-Click Generator</div>
          </div>
        </div>
      </div>

      {/* Active Metro Line Live Map Link Banner */}
      <div
        onClick={() => onNavigateTab('livemap')}
        className="p-4 rounded-sm bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 border border-cyan-500/40 hover:border-cyan-400 cursor-pointer transition-all shadow-md flex items-center justify-between group"
      >
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
            <KochiMetroLogo height={32} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm font-mono group-hover:text-cyan-300 transition-colors">
                Active Metro Line Map (Aluva ↔ Thrippunithura)
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold rounded uppercase border border-emerald-500/30">
                25 Stations Live
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Interactive 2024 Kochi Metro route map with real-time moving train telemetry, speed vectors, station interchange status & Muttom Depot connection.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-400 group-hover:text-cyan-200">
          <span>Open Live Map</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>

      {/* Critical Alert Banner if any */}
      {criticalAlerts.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-500/40 rounded-sm p-4 flex items-center justify-between text-xs backdrop-blur-md shadow-[0_0_20px_rgba(244,63,94,0.15)]">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 animate-pulse" />
            <div>
              <span className="font-bold text-rose-300 uppercase tracking-wider text-[11px] font-mono">
                {criticalAlerts.length} Critical Fleet Alerts Active:
              </span>
              <span className="text-slate-300 ml-2 font-mono text-[11px]">
                {criticalAlerts.map(a => a.title).join(' | ')}
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('alerts')}
            className="px-3 py-1.5 rounded-sm bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold uppercase text-[10px] tracking-wider cursor-pointer flex-shrink-0 font-mono"
          >
            Review Alerts
          </button>
        </div>
      )}

      {/* Fleet Monitoring Grid (Full Width) */}
      <div className="cyber-card rounded-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-cyan-500/20 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-300 font-mono flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 glow-cyan"></span>
              <span>Fleet Monitoring Grid ({filteredFleet.length} Rakes)</span>
            </h2>
            {statusFilter !== 'ALL' && (
              <button
                onClick={() => setStatusFilter('ALL')}
                className="text-[10px] text-amber-400 hover:underline font-mono uppercase font-bold"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 font-mono">
            <div className="flex items-center bg-slate-950 border border-cyan-500/20 rounded-sm p-0.5 text-xs">
              <button
                onClick={() => setViewMode('tiles')}
                className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase flex items-center space-x-1 cursor-pointer transition-colors ${
                  viewMode === 'tiles' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-3 h-3" />
                <span>3D Tiles</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase flex items-center space-x-1 cursor-pointer transition-colors ${
                  viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3 h-3" />
                <span>Manifest</span>
              </button>
            </div>

            <button
              onClick={() => onNavigateTab('fleet')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold uppercase text-[10px] tracking-wider flex items-center space-x-1 cursor-pointer font-mono"
            >
              <span>Full Manifest</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {viewMode === 'tiles' ? (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-[500px] overflow-y-auto">
            {filteredFleet.map(train => {
              const rsExpired = train.certificates.rollingStock.isExpired;
              const sigExpired = train.certificates.signalling.isExpired;
              const telExpired = train.certificates.telecom.isExpired;

              let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
              let ledColor = "bg-emerald-400 glow-emerald";
              if (train.currentStatus === 'STANDBY') {
                badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/30";
                ledColor = "bg-amber-400";
              } else if (train.currentStatus === 'MAINTENANCE') {
                badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/30";
                ledColor = "bg-rose-500";
              }

              return (
                <div
                  key={train.id}
                  onClick={() => onSelectTrain(train)}
                  className="p-3 bg-slate-950/80 border border-cyan-500/20 hover:border-cyan-400/60 rounded-sm cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between space-y-2.5 font-mono group"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full ${ledColor} animate-pulse`}></span>
                      <span className="font-bold text-white group-hover:text-cyan-300 text-xs">
                        {train.id}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm uppercase border ${badgeColor}`}>
                      {train.currentStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-center space-x-1 bg-slate-900/90 py-2 px-1 rounded-sm border border-cyan-500/10">
                    <div className="w-5 h-4 bg-cyan-950 border border-cyan-500/40 rounded-l-md flex items-center justify-center text-[7px] text-cyan-300 font-bold">DM1</div>
                    <div className="w-6 h-4 bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-[7px] text-slate-400 font-bold">M</div>
                    <div className="w-5 h-4 bg-cyan-950 border border-cyan-500/40 rounded-r-md flex items-center justify-center text-[7px] text-cyan-300 font-bold">DM2</div>
                  </div>

                  <div className="text-[10px] space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Bay: <strong className="text-slate-200">{train.bay.bayName}</strong></span>
                      <span>{(train.mileageTotal / 1000).toFixed(0)}k km</span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] pt-1">
                      <span className="text-slate-500 uppercase">Certs:</span>
                      <div className="flex space-x-1">
                        <span className={`px-1 rounded-sm ${rsExpired ? 'bg-rose-500/30 text-rose-300 font-bold' : 'bg-emerald-500/20 text-emerald-300'}`}>RS</span>
                        <span className={`px-1 rounded-sm ${sigExpired ? 'bg-rose-500/30 text-rose-300 font-bold' : 'bg-emerald-500/20 text-emerald-300'}`}>SIG</span>
                        <span className={`px-1 rounded-sm ${telExpired ? 'bg-rose-500/30 text-rose-300 font-bold' : 'bg-emerald-500/20 text-emerald-300'}`}>TEL</span>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-left border-collapse font-mono">
              <thead className="bg-slate-950/95 sticky top-0 z-10 border-b border-cyan-500/20">
                <tr className="text-[10px] uppercase text-cyan-400/80 font-bold">
                  <th className="p-3.5">Train ID</th>
                  <th className="p-3.5">Stabling Bay</th>
                  <th className="p-3.5">Mileage</th>
                  <th className="p-3.5">Certificates</th>
                  <th className="p-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-800/50">
                {filteredFleet.map(train => {
                  let statusBadge = "px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase rounded-sm glow-emerald";
                  if (train.currentStatus === 'STANDBY') {
                    statusBadge = "px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase rounded-sm";
                  } else if (train.currentStatus === 'MAINTENANCE') {
                    statusBadge = "px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase rounded-sm";
                  }

                  return (
                    <tr
                      key={train.id}
                      onClick={() => onSelectTrain(train)}
                      className="border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors cursor-pointer"
                    >
                      <td className="p-3.5 font-bold text-cyan-300">
                        {train.id} <span className="text-slate-400 font-sans font-normal text-[11px]">({train.name.split(' ')[1] || train.name})</span>
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {train.bay.bayName} <span className="text-[10px] text-slate-500 font-mono">(Cost {train.bay.shuntingCost})</span>
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {(train.mileageTotal / 1000).toFixed(0)}k km
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1">
                          <span className={`w-2 h-2 rounded-full ${train.certificates.rollingStock.isExpired ? 'bg-rose-500' : 'bg-emerald-400'}`} title="RS Cert"></span>
                          <span className={`w-2 h-2 rounded-full ${train.certificates.signalling.isExpired ? 'bg-rose-500' : 'bg-emerald-400'}`} title="SIG Cert"></span>
                          <span className={`w-2 h-2 rounded-full ${train.certificates.telecom.isExpired ? 'bg-rose-500' : 'bg-emerald-400'}`} title="TEL Cert"></span>
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <span className={statusBadge}>
                          {train.currentStatus.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
