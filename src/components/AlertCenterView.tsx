import React, { useState } from 'react';
import { AlertItem, Trainset } from '../types';
import { AlertTriangle, ShieldAlert, Wrench, CheckCircle2, Filter, Plus, X, BellPlus } from 'lucide-react';

interface AlertCenterViewProps {
  alerts: AlertItem[];
  fleet: Trainset[];
  onSelectTrain: (train: Trainset) => void;
  onCreateAlert?: (alert: AlertItem) => void;
}

export const AlertCenterView: React.FC<AlertCenterViewProps> = ({
  alerts,
  fleet,
  onSelectTrain,
  onCreateAlert,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [trainId, setTrainId] = useState('');
  const [category, setCategory] = useState<'Certificate' | 'Maintenance' | 'Cleaning' | 'Shunting'>('Maintenance');
  const [severity, setSeverity] = useState<'critical' | 'warning' | 'info'>('warning');
  const [message, setMessage] = useState('');

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  const handleSubmitNewAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const newAlert: AlertItem = {
      id: `custom-alert-${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      severity,
      category,
      trainId: trainId || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today',
    };

    if (onCreateAlert) {
      onCreateAlert(newAlert);
    }

    // Reset Form
    setTitle('');
    setTrainId('');
    setMessage('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="cyber-card rounded-2xl p-6 shadow-xl border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] text-cyan-300 font-mono font-bold uppercase tracking-widest mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>METRO AI SAFETY & COMPLIANCE MONITOR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Alert & Compliance Center
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Real-time tracking of fitness certificate expiries, critical work orders, and overdue washing cycles. Create custom warnings for OCC controllers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-full liquid-glass border border-cyan-500/40 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            <Plus className="w-4 h-4 text-cyan-300" />
            <span>Create Alert / Warning</span>
          </button>

          <div className="flex items-center space-x-2 liquid-glass border border-white/10 rounded-full px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-cyan-400 ml-1" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-mono font-bold uppercase tracking-wider focus:outline-none pr-2 cursor-pointer"
            >
              <option value="ALL" className="bg-slate-950">Severity: All ({alerts.length})</option>
              <option value="critical" className="bg-slate-950">Critical Only</option>
              <option value="warning" className="bg-slate-950">Warning Only</option>
              <option value="info" className="bg-slate-950">Info Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alert Feed List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-md p-8 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="font-bold text-white uppercase text-xs tracking-wider">No Active Alerts</p>
            <p className="text-xs text-slate-500 mt-1">All fleet safety certificates and operational metrics are clear.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const train = fleet.find(t => t.id === alert.trainId);

            let borderClass = "border-slate-800 bg-slate-900";
            let badgeClass = "bg-slate-800 text-slate-300 border-slate-700";

            if (alert.severity === 'critical') {
              borderClass = "border-red-900/60 bg-red-950/20";
              badgeClass = "bg-red-500/10 text-red-400 border-red-500/20 font-bold";
            } else if (alert.severity === 'warning') {
              borderClass = "border-amber-900/60 bg-amber-950/20";
              badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold";
            }

            return (
              <div
                key={alert.id}
                className={`border rounded-2xl p-5 transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${borderClass}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex-shrink-0 mt-0.5">
                    {alert.category === 'Certificate' && <ShieldAlert className="w-4 h-4 text-red-400" />}
                    {alert.category === 'Maintenance' && <Wrench className="w-4 h-4 text-amber-400" />}
                    {alert.category === 'Cleaning' && <AlertTriangle className="w-4 h-4 text-slate-400" />}
                    {alert.category === 'Shunting' && <BellPlus className="w-4 h-4 text-cyan-400" />}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold border ${badgeClass}`}>
                        {alert.severity}
                      </span>
                      <h3 className="font-semibold text-white text-sm tracking-tight">{alert.title}</h3>
                      {alert.trainId && (
                        <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
                          {alert.trainId}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-xs mt-1 leading-relaxed font-sans">{alert.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1.5 block font-mono">Category: {alert.category} • Created: {alert.timestamp}</span>
                  </div>
                </div>

                {train && (
                  <button
                    onClick={() => onSelectTrain(train)}
                    className="px-4 py-2 rounded-full liquid-glass border border-white/10 hover:border-cyan-400/50 text-slate-200 text-xs font-mono font-semibold uppercase tracking-wider self-end md:self-center cursor-pointer flex-shrink-0"
                  >
                    Inspect {train.id}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Alert Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass bg-slate-950/90 border border-cyan-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative font-sans space-y-4">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2 text-cyan-300">
                <BellPlus className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  Create OCC Safety Warning / Alert
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewAlert} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-300 font-mono font-semibold mb-1 uppercase tracking-wider text-[10px]">Alert Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brake Pad Threshold Limit Exceeded or Platform Gate Maintenance"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-mono font-semibold mb-1 uppercase tracking-wider text-[10px]">Target Rake (Optional)</label>
                  <select
                    value={trainId}
                    onChange={(e) => setTrainId(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-sans cursor-pointer"
                  >
                    <option value="">System Wide / Station Alert</option>
                    {fleet.map(t => (
                      <option key={t.id} value={t.id} className="bg-slate-950">{t.id} - {t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-mono font-semibold mb-1 uppercase tracking-wider text-[10px]">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-sans cursor-pointer"
                  >
                    <option value="Maintenance" className="bg-slate-950">Maintenance</option>
                    <option value="Certificate" className="bg-slate-950">Certificate Expiry</option>
                    <option value="Cleaning" className="bg-slate-950">Cleaning & Wash</option>
                    <option value="Shunting" className="bg-slate-950">Shunting / Yard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-mono font-semibold mb-1 uppercase tracking-wider text-[10px]">Severity Level</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSeverity('critical')}
                    className={`py-2 rounded-xl text-center font-mono font-bold uppercase tracking-wider border cursor-pointer ${
                      severity === 'critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' : 'bg-black/30 text-slate-400 border-white/10'
                    }`}
                  >
                    Critical
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity('warning')}
                    className={`py-2 rounded-xl text-center font-mono font-bold uppercase tracking-wider border cursor-pointer ${
                      severity === 'warning' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-black/30 text-slate-400 border-white/10'
                    }`}
                  >
                    Warning
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity('info')}
                    className={`py-2 rounded-xl text-center font-mono font-bold uppercase tracking-wider border cursor-pointer ${
                      severity === 'info' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-black/30 text-slate-400 border-white/10'
                    }`}
                  >
                    Info
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-mono font-semibold mb-1 uppercase tracking-wider text-[10px]">Message Details *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter detailed compliance or safety warning note for KMRL shift operators..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-black/40 border border-white/10 hover:bg-white/10 text-slate-300 font-mono font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-mono font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  Post Alert to OCC
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
