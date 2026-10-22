import React, { useState } from 'react';
import { Trainset, TrainStatus, DepotBay } from '../types';
import { Search, Filter, ArrowUpDown, ChevronRight, Plus, Edit3, Save, X, Train, CheckCircle2, ShieldCheck, Wrench, AlertTriangle } from 'lucide-react';

interface FleetViewProps {
  fleet: Trainset[];
  onSelectTrain: (train: Trainset) => void;
  onAddRake?: (newRake: Trainset) => void;
  onUpdateRake?: (updatedRake: Trainset) => void;
}

const SAMPLE_BAYS: DepotBay[] = [
  { bayId: 101, bayName: "Stabling Line 1 - Spot A", zone: "Stabling", shuntingCost: 1 },
  { bayId: 102, bayName: "Stabling Line 1 - Spot B", zone: "Stabling", shuntingCost: 3 },
  { bayId: 103, bayName: "Stabling Line 2 - Spot A", zone: "Stabling", shuntingCost: 2 },
  { bayId: 104, bayName: "Stabling Line 2 - Spot B", zone: "Stabling", shuntingCost: 4 },
  { bayId: 105, bayName: "Stabling Line 3 - Spot A", zone: "Stabling", shuntingCost: 2 },
  { bayId: 201, bayName: "IBL Inspection Pit 1", zone: "Inspection", shuntingCost: 7 },
  { bayId: 202, bayName: "IBL Inspection Pit 2", zone: "Inspection", shuntingCost: 8 },
  { bayId: 301, bayName: "Heavy Overhaul Bay 1", zone: "Heavy Overhaul", shuntingCost: 10 },
  { bayId: 401, bayName: "Automatic Wash Plant Line", zone: "Wash Plant", shuntingCost: 5 },
];

export const FleetView: React.FC<FleetViewProps> = ({ fleet, onSelectTrain, onAddRake, onUpdateRake }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [certFilter, setCertFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'rake' | 'mileage' | 'shunting'>('rake');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTrain, setEditingTrain] = useState<Trainset | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Adding New Rake
  const nextRakeNum = fleet.length + 1;
  const [addForm, setAddForm] = useState({
    id: `TS-${nextRakeNum < 10 ? '0' + nextRakeNum : nextRakeNum}`,
    name: `Trainset ${nextRakeNum < 10 ? '0' + nextRakeNum : nextRakeNum} (Metropolitan)`,
    rakeNumber: nextRakeNum,
    carCount: 3,
    mileageTotal: 125000,
    mileageSinceService: 2800,
    currentStatus: 'STANDBY' as TrainStatus,
    cleaningStatus: 'done' as 'done' | 'pending' | 'overdue',
    bayName: SAMPLE_BAYS[0].bayName,
    rsDaysRemaining: 30,
    sigDaysRemaining: 45,
    telDaysRemaining: 60,
  });

  // Form State for Editing Existing Rake
  const [editForm, setEditForm] = useState<{
    id: string;
    name: string;
    rakeNumber: number;
    carCount: number;
    mileageTotal: number;
    mileageSinceService: number;
    currentStatus: TrainStatus;
    cleaningStatus: 'done' | 'pending' | 'overdue';
    bayName: string;
    rsDaysRemaining: number;
    sigDaysRemaining: number;
    telDaysRemaining: number;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAddModal = () => {
    const nextNum = fleet.length + 1;
    setAddForm({
      id: `TS-${nextNum < 10 ? '0' + nextNum : nextNum}`,
      name: `Trainset ${nextNum < 10 ? '0' + nextNum : nextNum} (Metropolitan)`,
      rakeNumber: nextNum,
      carCount: 3,
      mileageTotal: 120000,
      mileageSinceService: 2500,
      currentStatus: 'STANDBY',
      cleaningStatus: 'done',
      bayName: SAMPLE_BAYS[0].bayName,
      rsDaysRemaining: 30,
      sigDaysRemaining: 45,
      telDaysRemaining: 60,
    });
    setIsAddModalOpen(true);
  };

  const handleSaveNewRake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddRake) return;

    const selectedBay = SAMPLE_BAYS.find(b => b.bayName === addForm.bayName) || {
      bayId: 999,
      bayName: addForm.bayName,
      zone: 'Stabling' as const,
      shuntingCost: 3,
    };

    const today = new Date();

    const makeCert = (type: 'rolling_stock' | 'signalling' | 'telecom', name: string, days: number) => {
      const exp = new Date(today.getTime() + days * 86400000);
      return {
        type,
        name,
        expiryDate: exp.toISOString().split('T')[0],
        daysRemaining: days,
        isExpired: days <= 0,
        isExpiringSoon: days > 0 && days <= 5,
      };
    };

    const newTrainset: Trainset = {
      id: addForm.id,
      name: addForm.name,
      rakeNumber: Number(addForm.rakeNumber),
      carCount: Number(addForm.carCount),
      mileageTotal: Number(addForm.mileageTotal),
      mileageSinceService: Number(addForm.mileageSinceService),
      currentStatus: addForm.currentStatus,
      cleaningStatus: addForm.cleaningStatus,
      lastCleanedDate: new Date().toISOString().split('T')[0],
      bay: selectedBay,
      certificates: {
        rollingStock: makeCert('rolling_stock', 'Rolling Stock Fitness Certificate', Number(addForm.rsDaysRemaining)),
        signalling: makeCert('signalling', 'CBTC Signalling Fitness Certificate', Number(addForm.sigDaysRemaining)),
        telecom: makeCert('telecom', 'Train Telecom System Fitness', Number(addForm.telDaysRemaining)),
      },
      jobCards: [],
    };

    onAddRake(newTrainset);
    setIsAddModalOpen(false);
    showToast(`Successfully added new rake ${newTrainset.id} (${newTrainset.name}) to the fleet!`);
  };

  const handleOpenEditModal = (train: Trainset, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTrain(train);
    setEditForm({
      id: train.id,
      name: train.name,
      rakeNumber: train.rakeNumber,
      carCount: train.carCount || 3,
      mileageTotal: train.mileageTotal,
      mileageSinceService: train.mileageSinceService,
      currentStatus: train.currentStatus,
      cleaningStatus: train.cleaningStatus,
      bayName: train.bay.bayName,
      rsDaysRemaining: train.certificates.rollingStock.daysRemaining,
      sigDaysRemaining: train.certificates.signalling.daysRemaining,
      telDaysRemaining: train.certificates.telecom.daysRemaining,
    });
  };

  const handleSaveEditRake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrain || !editForm || !onUpdateRake) return;

    const selectedBay = SAMPLE_BAYS.find(b => b.bayName === editForm.bayName) || editingTrain.bay;
    const today = new Date();

    const updateCert = (type: 'rolling_stock' | 'signalling' | 'telecom', name: string, days: number) => {
      const exp = new Date(today.getTime() + days * 86400000);
      return {
        type,
        name,
        expiryDate: exp.toISOString().split('T')[0],
        daysRemaining: days,
        isExpired: days <= 0,
        isExpiringSoon: days > 0 && days <= 5,
      };
    };

    const updatedTrainset: Trainset = {
      ...editingTrain,
      name: editForm.name,
      rakeNumber: Number(editForm.rakeNumber),
      carCount: Number(editForm.carCount),
      mileageTotal: Number(editForm.mileageTotal),
      mileageSinceService: Number(editForm.mileageSinceService),
      currentStatus: editForm.currentStatus,
      cleaningStatus: editForm.cleaningStatus,
      bay: selectedBay,
      certificates: {
        rollingStock: updateCert('rolling_stock', 'Rolling Stock Fitness Certificate', Number(editForm.rsDaysRemaining)),
        signalling: updateCert('signalling', 'CBTC Signalling Fitness Certificate', Number(editForm.sigDaysRemaining)),
        telecom: updateCert('telecom', 'Train Telecom System Fitness', Number(editForm.telDaysRemaining)),
      },
    };

    onUpdateRake(updatedTrainset);
    setEditingTrain(null);
    setEditForm(null);
    showToast(`Successfully updated details for rake ${updatedTrainset.id}!`);
  };

  const filteredFleet = fleet.filter(t => {
    // Search
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'ALL' || t.currentStatus === statusFilter;

    // Cert filter
    let matchesCert = true;
    const hasExpired = t.certificates.rollingStock.isExpired || t.certificates.signalling.isExpired || t.certificates.telecom.isExpired;
    const hasSoon = t.certificates.rollingStock.isExpiringSoon || t.certificates.signalling.isExpiringSoon || t.certificates.telecom.isExpiringSoon;

    if (certFilter === 'EXPIRED') matchesCert = hasExpired;
    if (certFilter === 'EXPIRING_SOON') matchesCert = hasSoon;
    if (certFilter === 'VALID') matchesCert = !hasExpired && !hasSoon;

    return matchesSearch && matchesStatus && matchesCert;
  });

  // Sort
  filteredFleet.sort((a, b) => {
    if (sortBy === 'rake') return a.rakeNumber - b.rakeNumber;
    if (sortBy === 'mileage') return b.mileageTotal - a.mileageTotal;
    if (sortBy === 'shunting') return a.bay.shuntingCost - b.bay.shuntingCost;
    return 0;
  });

  return (
    <div className="space-y-4">
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-mono text-xs flex items-center space-x-2 shadow-lg animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search & Filter Header */}
      <div className="cyber-card rounded-2xl p-5 shadow-xl border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Metro AI Fleet Manager <span className="text-xs font-mono text-cyan-300 font-normal">({filteredFleet.length} / {fleet.length} Rakes)</span>
          </h1>
          <p className="text-xs text-slate-300 font-sans mt-0.5">Manage rake details, certificate status, depot bays, and operational readiness</p>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search train ID or name..."
            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-full text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-sans"
          />
        </div>

        {/* Filters & Add Rake Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 bg-slate-950/80 border border-cyan-500/20 rounded-sm p-1 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-cyan-400 ml-1.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-cyan-300 text-xs font-bold focus:outline-none pr-1 cursor-pointer"
            >
              <option value="ALL" className="bg-slate-950">Status: All ({fleet.length})</option>
              <option value="IN_SERVICE" className="bg-slate-950">In Service</option>
              <option value="STANDBY" className="bg-slate-950">Standby</option>
              <option value="MAINTENANCE" className="bg-slate-950">Maintenance</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950/80 border border-cyan-500/20 rounded-sm p-1 text-xs font-mono">
            <select
              value={certFilter}
              onChange={(e) => setCertFilter(e.target.value)}
              className="bg-transparent text-cyan-300 text-xs font-bold focus:outline-none pr-1 cursor-pointer"
            >
              <option value="ALL" className="bg-slate-950">Certs: All</option>
              <option value="VALID" className="bg-slate-950">Valid Only</option>
              <option value="EXPIRING_SOON" className="bg-slate-950">Expiring Soon (≤5d)</option>
              <option value="EXPIRED" className="bg-slate-950">Expired</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950/80 border border-cyan-500/20 rounded-sm p-1 text-xs font-mono">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400 ml-1.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-cyan-300 text-xs font-bold focus:outline-none pr-1 cursor-pointer"
            >
              <option value="rake" className="bg-slate-950">Sort: Rake #</option>
              <option value="mileage" className="bg-slate-950">Sort: Highest Mileage</option>
              <option value="shunting" className="bg-slate-950">Sort: Low Shunting Cost</option>
            </select>
          </div>

          {/* Add New Rake Button */}
          {onAddRake && (
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 rounded bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold flex items-center space-x-1.5 transition-all text-xs font-mono cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Add New Rake</span>
            </button>
          )}
        </div>
      </div>

      {/* Fleet Data Table */}
      <div className="cyber-card rounded-sm overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead className="bg-slate-950/90 border-b border-cyan-500/20 text-cyan-400/80 font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Rake ID & Name</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3">Depot Bay & Shunting</th>
                <th className="px-4 py-3">Fitness Certificates</th>
                <th className="px-4 py-3">Open Work Orders</th>
                <th className="px-4 py-3">Mileage</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {filteredFleet.map(t => {
                const rsExpired = t.certificates.rollingStock.isExpired;
                const sigExpired = t.certificates.signalling.isExpired;
                const telExpired = t.certificates.telecom.isExpired;

                const critCards = t.jobCards.filter(j => j.severity === 'critical');

                let statusBadge = "px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase rounded-sm glow-emerald";
                if (t.currentStatus === 'STANDBY') statusBadge = "px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase rounded-sm";
                if (t.currentStatus === 'MAINTENANCE') statusBadge = "px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase rounded-sm";

                return (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTrain(t)}
                    className="hover:bg-cyan-500/5 transition-colors cursor-pointer group border-b border-cyan-500/10"
                  >
                    <td className="px-4 py-3.5 font-bold">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-7 h-7 rounded-sm bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 flex items-center justify-center font-mono text-xs font-bold">
                          {t.id.replace('TS-', '')}
                        </span>
                        <div>
                          <div className="font-bold text-white group-hover:text-cyan-300 transition-colors font-mono">{t.id}</div>
                          <div className="text-[10px] text-slate-400 font-sans">{t.name}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={statusBadge}>
                        {t.currentStatus.replace('_', ' ')}
                      </span>
                      {t.manualOverride && (
                        <div className="text-[9px] text-amber-400 mt-1 font-bold uppercase tracking-wider">
                          Overridden
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-200">{t.bay.bayName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Cost Penalty: {t.bay.shuntingCost}/10
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-1">
                        <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-bold ${rsExpired ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-950 text-emerald-400 border border-emerald-500/20'}`} title="Rolling Stock">
                          RS:{t.certificates.rollingStock.daysRemaining}d
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-bold ${sigExpired ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-950 text-emerald-400 border border-emerald-500/20'}`} title="Signalling">
                          SIG:{t.certificates.signalling.daysRemaining}d
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-bold ${telExpired ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-950 text-emerald-400 border border-emerald-500/20'}`} title="Telecom">
                          TEL:{t.certificates.telecom.daysRemaining}d
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {t.jobCards.length === 0 ? (
                        <span className="text-[10px] text-slate-500">0 pending</span>
                      ) : (
                        <div className="flex items-center space-x-1">
                          {critCards.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded-sm bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold text-[10px]">
                              {critCards.length} Critical
                            </span>
                          )}
                          <span className="text-slate-400 text-[10px] font-mono">({t.jobCards.length} total)</span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-slate-200">
                      {(t.mileageTotal / 1000).toFixed(0)}k km
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {onUpdateRake && (
                          <button
                            onClick={(e) => handleOpenEditModal(t, e)}
                            className="p-1.5 rounded bg-slate-900 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white transition-colors cursor-pointer"
                            title="Edit Rake Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onSelectTrain(t)}
                          className="p-1.5 rounded bg-slate-950 border border-cyan-500/20 hover:border-cyan-400/50 text-cyan-300 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Rake */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass border border-cyan-500/30 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl font-mono text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Train className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Add New Trainset / Rake to Fleet
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRake} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Trainset ID
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.id}
                    onChange={(e) => setAddForm({ ...addForm, id: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                    placeholder="TS-26"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Rake Number
                  </label>
                  <input
                    type="number"
                    required
                    value={addForm.rakeNumber}
                    onChange={(e) => setAddForm({ ...addForm, rakeNumber: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                  Name / Alias
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                  placeholder="TS-26 (Pamba)"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Current Status
                  </label>
                  <select
                    value={addForm.currentStatus}
                    onChange={(e) => setAddForm({ ...addForm, currentStatus: e.target.value as TrainStatus })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none cursor-pointer"
                  >
                    <option value="IN_SERVICE">In Service</option>
                    <option value="STANDBY">Standby</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Stabling Depot Bay
                  </label>
                  <select
                    value={addForm.bayName}
                    onChange={(e) => setAddForm({ ...addForm, bayName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none cursor-pointer"
                  >
                    {SAMPLE_BAYS.map((b) => (
                      <option key={b.bayId} value={b.bayName}>
                        {b.bayName} (Shunting {b.shuntingCost})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Cleaning Status
                  </label>
                  <select
                    value={addForm.cleaningStatus}
                    onChange={(e) => setAddForm({ ...addForm, cleaningStatus: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none cursor-pointer"
                  >
                    <option value="done">Done</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Total Mileage (km)
                  </label>
                  <input
                    type="number"
                    required
                    value={addForm.mileageTotal}
                    onChange={(e) => setAddForm({ ...addForm, mileageTotal: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Mileage Since Service (km)
                  </label>
                  <input
                    type="number"
                    required
                    value={addForm.mileageSinceService}
                    onChange={(e) => setAddForm({ ...addForm, mileageSinceService: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Certificates days remaining */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-2">
                <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block">
                  Fitness Certificates Validity (Days Remaining)
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase">Rolling Stock</label>
                    <input
                      type="number"
                      value={addForm.rsDaysRemaining}
                      onChange={(e) => setAddForm({ ...addForm, rsDaysRemaining: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase">CBTC Signalling</label>
                    <input
                      type="number"
                      value={addForm.sigDaysRemaining}
                      onChange={(e) => setAddForm({ ...addForm, sigDaysRemaining: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase">Train Telecom</label>
                    <input
                      type="number"
                      value={addForm.telDaysRemaining}
                      onChange={(e) => setAddForm({ ...addForm, telDaysRemaining: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold hover:from-cyan-400 hover:to-emerald-400 cursor-pointer flex items-center space-x-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Save New Rake</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Rake Details */}
      {editingTrain && editForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass border border-amber-500/30 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl font-mono text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Modify Rake Details: <span className="text-amber-300">{editingTrain.id}</span>
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingTrain(null);
                  setEditForm(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRake} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Trainset ID (Read-only)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editForm.id}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-400 font-mono text-xs cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Rake Number
                  </label>
                  <input
                    type="number"
                    required
                    value={editForm.rakeNumber}
                    onChange={(e) => setEditForm({ ...editForm, rakeNumber: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                  Name / Alias
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Current Status
                  </label>
                  <select
                    value={editForm.currentStatus}
                    onChange={(e) => setEditForm({ ...editForm, currentStatus: e.target.value as TrainStatus })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    <option value="IN_SERVICE">In Service</option>
                    <option value="STANDBY">Standby</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Stabling Depot Bay
                  </label>
                  <select
                    value={editForm.bayName}
                    onChange={(e) => setEditForm({ ...editForm, bayName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    {SAMPLE_BAYS.map((b) => (
                      <option key={b.bayId} value={b.bayName}>
                        {b.bayName} (Shunting {b.shuntingCost})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Cleaning Status
                  </label>
                  <select
                    value={editForm.cleaningStatus}
                    onChange={(e) => setEditForm({ ...editForm, cleaningStatus: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    <option value="done">Done</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Total Mileage (km)
                  </label>
                  <input
                    type="number"
                    required
                    value={editForm.mileageTotal}
                    onChange={(e) => setEditForm({ ...editForm, mileageTotal: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Mileage Since Service (km)
                  </label>
                  <input
                    type="number"
                    required
                    value={editForm.mileageSinceService}
                    onChange={(e) => setEditForm({ ...editForm, mileageSinceService: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Certificates days remaining */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-2">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                  Fitness Certificates Validity (Days Remaining)
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase">Rolling Stock</label>
                    <input
                      type="number"
                      value={editForm.rsDaysRemaining}
                      onChange={(e) => setEditForm({ ...editForm, rsDaysRemaining: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase">CBTC Signalling</label>
                    <input
                      type="number"
                      value={editForm.sigDaysRemaining}
                      onChange={(e) => setEditForm({ ...editForm, sigDaysRemaining: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase">Train Telecom</label>
                    <input
                      type="number"
                      value={editForm.telDaysRemaining}
                      onChange={(e) => setEditForm({ ...editForm, telDaysRemaining: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTrain(null);
                    setEditForm(null);
                  }}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold hover:from-amber-400 hover:to-orange-400 cursor-pointer flex items-center space-x-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Rake</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
