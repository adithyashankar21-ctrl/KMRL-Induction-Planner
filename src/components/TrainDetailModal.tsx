import React, { useState } from 'react';
import { Trainset, TrainStatus } from '../types';
import { X, ShieldAlert, ShieldCheck, Wrench, MapPin, Gauge, Bot, Check, AlertTriangle, UserCheck } from 'lucide-react';

interface TrainDetailModalProps {
  train: Trainset | null;
  onClose: () => void;
  onApplyOverride: (trainId: string, status: TrainStatus | 'CLEAR', reason: string) => void;
  onAskAI: (trainId: string) => void;
}

export const TrainDetailModal: React.FC<TrainDetailModalProps> = ({
  train,
  onClose,
  onApplyOverride,
  onAskAI,
}) => {
  if (!train) return null;

  const [selectedTab, setSelectedTab] = useState<'certs' | 'jobcards' | 'stabling' | 'override'>('certs');
  const [overrideStatus, setOverrideStatus] = useState<TrainStatus>('MAINTENANCE');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideMessage, setOverrideMessage] = useState<string | null>(null);

  const rsExp = train.certificates.rollingStock.isExpired;
  const sigExp = train.certificates.signalling.isExpired;
  const telExp = train.certificates.telecom.isExpired;
  const hasExpiredCert = rsExp || sigExp || telExp;
  const criticalCards = train.jobCards.filter(j => j.severity === 'critical');

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (overrideStatus === 'IN_SERVICE' && (hasExpiredCert || criticalCards.length > 0)) {
      setOverrideMessage("⚠️ Warning: Safety Conflict! You are overriding a rake into IN_SERVICE despite expired certificates or critical work orders. Hard safety alerts logged.");
    } else {
      setOverrideMessage(null);
    }
    onApplyOverride(train.id, overrideStatus, overrideReason || "Manual Duty Supervisor Override");
  };

  const handleClearOverride = () => {
    onApplyOverride(train.id, 'CLEAR', '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="cyber-card rounded-sm w-full max-w-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col max-h-[90vh] font-mono">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-sm bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-sm font-mono font-bold text-cyan-300">
              {train.id}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">{train.name}</h2>
                <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${
                  train.currentStatus === 'IN_SERVICE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 glow-emerald' :
                  train.currentStatus === 'STANDBY' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {train.currentStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">3-Car Metropolis Rake • Muttom Depot Bay {train.bay.bayId}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onAskAI(train.id)}
              className="btn-neon-cyber flex items-center space-x-1.5 px-3 py-1.5 rounded-sm text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-slate-950" />
              <span>AI Analysis</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-sm bg-slate-900 border border-cyan-500/20 hover:border-cyan-400 text-cyan-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-cyan-500/20 bg-slate-950 text-xs font-bold uppercase tracking-wider text-slate-400 px-4 font-mono">
          <button
            onClick={() => setSelectedTab('certs')}
            className={`px-4 py-3 border-b-2 cursor-pointer transition-colors ${selectedTab === 'certs' ? 'border-cyan-400 text-cyan-300' : 'border-transparent hover:text-slate-200'}`}
          >
            Fitness Certs ({hasExpiredCert ? '⚠️ Issue' : 'Valid'})
          </button>
          <button
            onClick={() => setSelectedTab('jobcards')}
            className={`px-4 py-3 border-b-2 cursor-pointer transition-colors ${selectedTab === 'jobcards' ? 'border-cyan-400 text-cyan-300' : 'border-transparent hover:text-slate-200'}`}
          >
            Work Orders ({train.jobCards.length})
          </button>
          <button
            onClick={() => setSelectedTab('stabling')}
            className={`px-4 py-3 border-b-2 cursor-pointer transition-colors ${selectedTab === 'stabling' ? 'border-cyan-400 text-cyan-300' : 'border-transparent hover:text-slate-200'}`}
          >
            Depot & Mileage
          </button>
          <button
            onClick={() => setSelectedTab('override')}
            className={`px-4 py-3 border-b-2 cursor-pointer transition-colors ${selectedTab === 'override' ? 'border-amber-400 text-amber-300' : 'border-transparent hover:text-slate-200'}`}
          >
            Manual Override {train.manualOverride && '🟢 Active'}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {selectedTab === 'certs' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Safety Fitness Certificates Status</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Rolling Stock */}
                <div className={`p-3.5 rounded-sm border ${train.certificates.rollingStock.isExpired ? 'bg-red-950/20 border-red-800' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center justify-between font-bold text-white mb-1">
                    <span>Rolling Stock</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase border ${train.certificates.rollingStock.isExpired ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {train.certificates.rollingStock.isExpired ? 'EXPIRED' : 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">Mechanical & Bogie Safety</p>
                  <div className="text-slate-300 font-mono">Expiry: {train.certificates.rollingStock.expiryDate}</div>
                  <div className="text-slate-500 mt-0.5">{train.certificates.rollingStock.daysRemaining} days remaining</div>
                </div>

                {/* Signalling */}
                <div className={`p-3.5 rounded-sm border ${train.certificates.signalling.isExpired ? 'bg-red-950/20 border-red-800' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center justify-between font-bold text-white mb-1">
                    <span>CBTC Signalling</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase border ${train.certificates.signalling.isExpired ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {train.certificates.signalling.isExpired ? 'EXPIRED' : 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">Automatic Train Control</p>
                  <div className="text-slate-300 font-mono">Expiry: {train.certificates.signalling.expiryDate}</div>
                  <div className="text-slate-500 mt-0.5">{train.certificates.signalling.daysRemaining} days remaining</div>
                </div>

                {/* Telecom */}
                <div className={`p-3.5 rounded-sm border ${train.certificates.telecom.isExpired ? 'bg-red-950/20 border-red-800' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center justify-between font-bold text-white mb-1">
                    <span>Telecom & PIDS</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase border ${train.certificates.telecom.isExpired ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {train.certificates.telecom.isExpired ? 'EXPIRED' : 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">TETRA Radio & PIDS</p>
                  <div className="text-slate-300 font-mono">Expiry: {train.certificates.telecom.expiryDate}</div>
                  <div className="text-slate-500 mt-0.5">{train.certificates.telecom.daysRemaining} days remaining</div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'jobcards' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-indigo-400" />
                <span>Open Work Orders & Job Cards</span>
              </h3>

              {train.jobCards.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-sm text-slate-400">
                  <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="font-bold text-white uppercase text-xs tracking-wider">Zero Open Job Cards</p>
                  <p className="text-xs text-slate-500 mt-1">This rake has clean maintenance logs and is technically ready for service.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {train.jobCards.map(card => (
                    <div key={card.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{card.title}</span>
                          <span className="text-[10px] font-mono text-slate-500">({card.id})</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase border ${
                          card.severity === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          card.severity === 'major' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {card.severity}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs mt-1">{card.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800/60 font-mono">
                        <span>Category: <strong className="text-slate-300">{card.category}</strong></span>
                        <span>Est. Repairs: <strong className="text-slate-300">{card.estimatedHours}h</strong></span>
                        <span>Tech: <strong className="text-slate-300">{card.assignedTechnician || 'Unassigned'}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'stabling' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-sm space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-white text-xs uppercase tracking-wider">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    <span>Depot Stabling Geometry</span>
                  </div>
                  <div className="text-xs text-slate-200 font-bold">{train.bay.bayName}</div>
                  <div className="text-[11px] text-slate-500">Depot Zone: <strong className="text-white">{train.bay.zone}</strong></div>
                  <div className="text-[11px] text-slate-500">
                    Shunting Cost Index: <strong className="text-amber-400 font-mono">{train.bay.shuntingCost} / 10</strong> (1 = Exit adjacent, 10 = Deep blocked)
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-sm space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-white text-xs uppercase tracking-wider">
                    <Gauge className="w-4 h-4 text-indigo-400" />
                    <span>Fleet Mileage Accumulation</span>
                  </div>
                  <div className="text-xs text-slate-200 font-mono">Total Mileage: <strong>{train.mileageTotal.toLocaleString()} km</strong></div>
                  <div className="text-[11px] text-slate-500 font-mono">Since Last Service: <strong>{train.mileageSinceService.toLocaleString()} km</strong></div>
                  <div className="text-[11px] text-slate-500">Cleaning Status: <strong className="text-emerald-400 capitalize">{train.cleaningStatus}</strong></div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'override' && (
            <form onSubmit={handleOverrideSubmit} className="space-y-4">
              <div className="p-4 bg-amber-950/10 border border-amber-800/40 rounded-sm">
                <div className="flex items-center space-x-2 font-bold text-amber-400 uppercase text-xs tracking-wider mb-1">
                  <UserCheck className="w-4 h-4" />
                  <span>Planner Manual Duty Override</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Duty supervisors can manually force a train status. The system will re-calculate constraints and flag any hard safety violations in audit logs.
                </p>
              </div>

              {train.manualOverride && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-sm flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-400">Active Override: Forced to {train.manualOverride.forcedStatus}</span>
                    <p className="text-[11px] text-slate-500 font-mono">Applied by {train.manualOverride.overriddenBy}: "{train.manualOverride.reason}"</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearOverride}
                    className="px-3 py-1.5 rounded-sm bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Clear Override
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Force Target Status:</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value as TrainStatus)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-sm text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="IN_SERVICE">IN_SERVICE (Revenue Main Line)</option>
                  <option value="STANDBY">STANDBY (Hot Backup Siding)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Inspection / Overhaul Pit Line)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Justification / Reason:</label>
                <textarea
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Enter supervisor operational reason (e.g., Urgent track test, special VIP rake)..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-sm text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {overrideMessage && (
                <div className="p-3 rounded-sm bg-red-950/40 border border-red-800 text-red-300 text-xs">
                  {overrideMessage}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-sm bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                Apply Manual Status Override
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
