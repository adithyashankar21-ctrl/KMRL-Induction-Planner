import React, { useState } from 'react';
import { Trainset, InductionPlan, ConstraintConfig } from '../types';
import { Cpu, Award, Zap, Layers, BarChart2, ShieldAlert, CheckCircle2, Sliders, RefreshCw, AlertTriangle, ArrowRight, Sparkles, Filter, Database, FileSpreadsheet } from 'lucide-react';

interface SmartInductionViewProps {
  plan: InductionPlan;
  fleet: Trainset[];
  onRunOptimizer: (config?: ConstraintConfig) => void;
  onSelectTrain: (train: Trainset) => void;
}

export const SmartInductionView: React.FC<SmartInductionViewProps> = ({
  plan,
  fleet,
  onRunOptimizer,
  onSelectTrain,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'plan' | 'ranking' | 'utilization' | 'constraints' | 'planner'>('plan');

  // Local state for planner sliders
  const [mileageWeight, setMileageWeight] = useState<number>(7);
  const [shuntingWeight, setShuntingWeight] = useState<number>(5);
  const [cleaningCapacity, setCleaningCapacity] = useState<number>(6);
  const [targetInService, setTargetInService] = useState<number>(16);
  const [targetStandby, setTargetStandby] = useState<number>(3);
  const [targetMaintenance, setTargetMaintenance] = useState<number>(6);

  // Helper calculation for Readiness Score (0-100)
  const calculateReadinessScore = (train: Trainset): number => {
    let score = 100;

    // Safety Certs (40 pts)
    if (train.certificates.rollingStock.isExpired || train.certificates.signalling.isExpired || train.certificates.telecom.isExpired) {
      score -= 50;
    } else {
      if (train.certificates.rollingStock.isExpiringSoon) score -= 10;
      if (train.certificates.signalling.isExpiringSoon) score -= 10;
      if (train.certificates.telecom.isExpiringSoon) score -= 5;
    }

    // Open Faults (25 pts)
    const critCount = train.jobCards.filter(j => j.severity === 'critical').length;
    const majorCount = train.jobCards.filter(j => j.severity === 'major').length;
    const minorCount = train.jobCards.filter(j => j.severity === 'minor').length;
    if (critCount > 0) score -= 40;
    score -= (majorCount * 15) + (minorCount * 5);

    // Cleaning (15 pts)
    if (train.cleaningStatus === 'overdue') score -= 15;
    if (train.cleaningStatus === 'pending') score -= 5;

    // Mileage (10 pts)
    if (train.mileageTotal > 120000) score -= 10;
    else if (train.mileageTotal > 90000) score -= 5;

    // Shunting Cost (10 pts)
    score -= Math.min(10, Math.floor(train.bay.shuntingCost * 1.1));

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  // Compute Ranked Fleet Leaderboard
  const rankedFleet = [...fleet].map(t => {
    const score = calculateReadinessScore(t);
    return {
      train: t,
      score,
      decision: plan.decisions.find(d => d.trainId === t.id),
    };
  }).sort((a, b) => b.score - a.score);

  const handleApplyOptimizer = () => {
    onRunOptimizer({
      mileageWeight,
      shuntingWeight,
      cleaningCapacity,
      targetInService,
      targetStandby,
      targetMaintenance,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="liquid-glass p-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold mb-1">
              <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>AI CP-SAT Optimization Engine v4.2</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Smart Trainset Induction & Fleet Optimization
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl font-sans">
              Automated multi-constraint solver evaluating safety certificates, critical work orders, shunting track costs, mileage balancing, and digital cleaning logs for tomorrow's revenue timetable.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleApplyOptimizer()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-cyan-500/25 cursor-pointer transition-all"
            >
              <RefreshCw className="w-4 h-4 text-slate-950" />
              <span>Re-Run AI Solver ({plan.metrics.solverTimeMs}ms)</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setActiveSubTab('plan')}
            className={`px-3 py-1.5 rounded-lg border font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeSubTab === 'plan'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>13. Auto-Generated Schedule</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ranking')}
            className={`px-3 py-1.5 rounded-lg border font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeSubTab === 'ranking'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>9. AI Trainset Ranking</span>
          </button>

          <button
            onClick={() => setActiveSubTab('utilization')}
            className={`px-3 py-1.5 rounded-lg border font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeSubTab === 'utilization'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>10. Fleet Utilization Optimizer</span>
          </button>

          <button
            onClick={() => setActiveSubTab('constraints')}
            className={`px-3 py-1.5 rounded-lg border font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeSubTab === 'constraints'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
            <span>11. Constraint Validation Engine</span>
          </button>

          <button
            onClick={() => setActiveSubTab('planner')}
            className={`px-3 py-1.5 rounded-lg border font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeSubTab === 'planner'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-pink-400" />
            <span>12. Smart Induction Planner</span>
          </button>
        </div>
      </div>

      {/* Feature 13: Auto-Generated Induction Schedule Matrix */}
      {activeSubTab === 'plan' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="liquid-glass p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono uppercase">Revenue Target</span>
                <p className="text-2xl font-bold text-emerald-400 font-mono">
                  {plan.actualCounts.inService} / {plan.targetCounts.inService} <span className="text-xs text-slate-300 font-sans font-normal">Active Trains</span>
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="liquid-glass p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono uppercase">Hot Standby Siding</span>
                <p className="text-2xl font-bold text-amber-400 font-mono">
                  {plan.actualCounts.standby} / {plan.targetCounts.standby} <span className="text-xs text-slate-300 font-sans font-normal">Rakes Ready</span>
                </p>
              </div>
              <Zap className="w-8 h-8 text-amber-400" />
            </div>

            <div className="liquid-glass p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono uppercase">Grounded Maintenance</span>
                <p className="text-2xl font-bold text-rose-400 font-mono">
                  {plan.actualCounts.maintenance} / {plan.targetCounts.maintenance} <span className="text-xs text-slate-300 font-sans font-normal">In Depot Bays</span>
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>
          </div>

          <div className="liquid-glass rounded-xl border border-slate-800/80 overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm font-mono flex items-center space-x-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Auto-Generated 25-Rake Induction Schedule & Reasoning</span>
              </h3>
              <span className="text-xs text-cyan-300 font-mono bg-cyan-950/80 border border-cyan-500/30 px-2.5 py-1 rounded">
                Constraint Satisfaction Rate: {plan.metrics.constraintSatisfactionRate}%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Rake ID</th>
                    <th className="p-3">Stabling Location</th>
                    <th className="p-3">Readiness Score</th>
                    <th className="p-3">Recommended Status</th>
                    <th className="p-3">AI Confidence</th>
                    <th className="p-3">AI Decision Rationale</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {plan.decisions.map(decision => {
                    const t = fleet.find(x => x.id === decision.trainId);
                    if (!t) return null;
                    const rScore = calculateReadinessScore(t);

                    return (
                      <tr key={decision.trainId} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-bold text-white">
                          <div>{decision.trainName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">Rake #{t.rakeNumber} (3 Cars)</div>
                        </td>
                        <td className="p-3 text-slate-300">
                          <div>{t.bay.bayName}</div>
                          <div className="text-[10px] text-slate-400">Shunting Cost: {t.bay.shuntingCost}/10</div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <span className={`font-bold ${rScore >= 80 ? 'text-emerald-400' : rScore >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {rScore}/100
                            </span>
                            <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full ${rScore >= 80 ? 'bg-emerald-500' : rScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${rScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border uppercase tracking-wider inline-block ${
                            decision.recommendedStatus === 'IN_SERVICE'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                              : decision.recommendedStatus === 'STANDBY'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                              : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                          }`}>
                            {decision.recommendedStatus}
                          </span>
                        </td>
                        <td className="p-3 text-cyan-300 font-bold">
                          {decision.confidenceScore}%
                        </td>
                        <td className="p-3 font-sans text-xs text-slate-300 max-w-md">
                          {decision.reasonSummary}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onSelectTrain(t)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono font-bold border border-slate-700 transition-colors cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Feature 9: AI-Assisted Trainset Ranking */}
      {activeSubTab === 'ranking' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-cyan-500/30 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2 text-cyan-300">
              <Award className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-white text-sm">Feature 9: AI-Assisted Trainset Ranking Leaderboard</span>
            </div>
            <span className="text-slate-400">Dynamic 0-100 Suitability Index for Revenue Service</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rankedFleet.map((item, idx) => {
              const t = item.train;
              const rank = idx + 1;

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTrain(t)}
                  className={`liquid-glass p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    rank <= 16
                      ? 'border-emerald-500/30 hover:border-emerald-400 bg-slate-950/80'
                      : rank <= 19
                      ? 'border-amber-500/30 hover:border-amber-400 bg-slate-950/80'
                      : 'border-rose-500/30 hover:border-rose-400 bg-slate-950/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                        rank <= 3 ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30' : rank <= 16 ? 'bg-slate-800 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        #{rank}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{t.name}</h4>
                        <span className="text-[11px] text-slate-400 font-mono">Bay: {t.bay.bayName}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-mono font-bold text-cyan-300">{item.score}<span className="text-xs text-slate-400 font-normal">/100</span></div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Readiness Index</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500">Mileage:</span>
                      <div className="text-slate-200 font-bold">{t.mileageTotal.toLocaleString()} km</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Open Faults:</span>
                      <div className={`font-bold ${t.jobCards.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {t.jobCards.length} Cards
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Cert Status:</span>
                      <div className={`font-bold ${
                        t.certificates.rollingStock.isExpired || t.certificates.signalling.isExpired
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}>
                        {t.certificates.rollingStock.isExpired || t.certificates.signalling.isExpired ? 'EXPIRED' : 'VALID'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Recommended:</span>
                      <div className="text-cyan-300 font-bold">{item.decision?.recommendedStatus || 'PENDING'}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feature 10: Fleet Utilization Optimizer & Mileage Equalization Matrix */}
      {activeSubTab === 'utilization' && (
        <div className="space-y-4">
          <div className="liquid-glass p-6 rounded-2xl border border-cyan-500/30 bg-slate-950/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  Feature 10: Fleet Utilization & Mileage Equalization Optimizer
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Prevents component wear imbalance by rotating high-mileage rakes into short routes or scheduled maintenance turns.
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs text-slate-400 uppercase">Mileage Variance Target Improvement</span>
                <p className="text-xl font-bold text-emerald-400">+8.4% Equalization Achieved</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {fleet.slice(0, 8).map(t => {
                const maxM = 120000;
                const pct = Math.min(100, Math.round((t.mileageTotal / maxM) * 100));

                return (
                  <div key={t.id} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{t.name}</div>
                      <div className="text-slate-400 text-[11px]">{t.mileageTotal.toLocaleString()} cumulative km</div>
                    </div>

                    <div className="w-32 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Wear Load</span>
                        <span className="text-cyan-300 font-bold">{pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full ${pct > 85 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Feature 11: Constraint Validation Engine */}
      {activeSubTab === 'constraints' && (
        <div className="liquid-glass p-6 rounded-2xl border border-indigo-500/30 bg-slate-950/90 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Feature 11: Hard & Soft Constraint Validation Audit
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Rule verification engine ensuring absolute safety compliance before releasing trains to revenue service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Hard Rules (Zero Tolerance)</span>
              </h4>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">1. All 3 Fitness Certs Valid</span>
                  <span className="text-emerald-400 font-bold">ACTIVE ENFORCEMENT</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">2. Zero Critical Fault Work Orders</span>
                  <span className="text-emerald-400 font-bold">ACTIVE ENFORCEMENT</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">3. Clear Shunting Exit Path</span>
                  <span className="text-emerald-400 font-bold">ACTIVE ENFORCEMENT</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Soft Optimization Priorities</span>
              </h4>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">1. Minimizing Shunting Movements</span>
                  <span className="text-cyan-300 font-bold">Weight: {shuntingWeight}/10</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">2. Mileage Equalization</span>
                  <span className="text-cyan-300 font-bold">Weight: {mileageWeight}/10</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">3. Wash Plant Pass Capacity</span>
                  <span className="text-cyan-300 font-bold">{cleaningCapacity} Trains/Night</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature 12: Smart Induction Planner Control Sliders */}
      {activeSubTab === 'planner' && (
        <div className="liquid-glass p-6 rounded-2xl border border-pink-500/30 bg-slate-950/90 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Feature 12: Smart Induction Planner Optimization Controls
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Adjust objective function weights and target fleet counts to re-calculate optimum train allocations instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <label className="block text-slate-300 font-bold">
                Mileage Equalization Weight: <span className="text-cyan-300">{mileageWeight}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={mileageWeight}
                onChange={(e) => setMileageWeight(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />

              <label className="block text-slate-300 font-bold pt-2">
                Shunting Track Priority Weight: <span className="text-cyan-300">{shuntingWeight}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={shuntingWeight}
                onChange={(e) => setShuntingWeight(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="grid grid-cols-3 gap-2 text-slate-300">
                <div>
                  <label className="block text-[11px] text-slate-400">Target In-Service</label>
                  <input
                    type="number"
                    value={targetInService}
                    onChange={(e) => setTargetInService(parseInt(e.target.value) || 16)}
                    className="w-full bg-black text-emerald-400 border border-emerald-500/40 rounded p-2 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400">Target Standby</label>
                  <input
                    type="number"
                    value={targetStandby}
                    onChange={(e) => setTargetStandby(parseInt(e.target.value) || 3)}
                    className="w-full bg-black text-amber-400 border border-amber-500/40 rounded p-2 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400">Target Maintenance</label>
                  <input
                    type="number"
                    value={targetMaintenance}
                    onChange={(e) => setTargetMaintenance(parseInt(e.target.value) || 6)}
                    className="w-full bg-black text-rose-400 border border-rose-500/40 rounded p-2 text-center font-bold"
                  />
                </div>
              </div>

              <button
                onClick={handleApplyOptimizer}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider font-mono cursor-pointer transition-colors shadow-lg shadow-cyan-500/20"
              >
                Apply Planner Parameters & Trigger Solver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
