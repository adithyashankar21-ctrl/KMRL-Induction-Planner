import React, { useState } from 'react';
import { Trainset, DepotBay } from '../types';
import { Map, Train, Layers, Info, Navigation, ArrowRight } from 'lucide-react';

interface DepotMapViewProps {
  fleet: Trainset[];
  bays: DepotBay[];
  onSelectTrain: (train: Trainset) => void;
}

export const DepotMapView: React.FC<DepotMapViewProps> = ({ fleet, bays, onSelectTrain }) => {
  const [selectedBayId, setSelectedBayId] = useState<number | null>(1);
  const [highlightShuntingPath, setHighlightShuntingPath] = useState(true);

  // Map train to bay
  const getTrainForBay = (bayId: number) => {
    return fleet.find(t => t.bay.bayId === bayId);
  };

  const selectedTrain = selectedBayId ? getTrainForBay(selectedBayId) : null;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="cyber-card rounded-2xl p-6 shadow-xl border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] text-cyan-300 font-mono font-bold uppercase tracking-widest mb-1">
            <Map className="w-3.5 h-3.5 text-cyan-400" />
            <span>METRO AI MUTTOM DEPOT DIGITAL TWIN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
            2D Stabling Yard Geometry & Shunting Map
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Real-time graphical model of 25 depot bays at Muttom OCC. Visualizes rake status, stabling line obstruction locks, and optimal pull-out shunting routes.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <label className="flex items-center space-x-2 text-slate-200 font-mono font-semibold uppercase text-[10px] tracking-wider cursor-pointer liquid-glass px-3 py-1.5 rounded-full border border-white/10">
            <input
              type="checkbox"
              checked={highlightShuntingPath}
              onChange={(e) => setHighlightShuntingPath(e.target.checked)}
              className="accent-cyan-400 rounded-sm cursor-pointer"
            />
            <span>Highlight Shunting Exit Routes</span>
          </label>
        </div>
      </div>

      {/* Main Map View & Info Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2D SVG Depot Map Canvas (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-md p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>Muttom Depot Stabling Yard Layout</span>
            </div>
            
            <div className="flex items-center space-x-3 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-sm bg-emerald-500"></span>
                <span className="text-slate-300">In Service</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-sm bg-amber-500"></span>
                <span className="text-slate-300">Standby</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-sm bg-red-500"></span>
                <span className="text-slate-300">Maintenance</span>
              </div>
            </div>
          </div>

          {/* Graphical Yard SVG Diagram */}
          <div className="relative w-full overflow-x-auto bg-slate-950 rounded-sm p-4 border border-slate-800">
            <svg viewBox="0 0 900 480" className="w-full h-auto min-w-[700px]">
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
                
                {/* Glowing Exit Track Line Gradient */}
                <linearGradient id="exitGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              <rect width="900" height="480" fill="#090d16" />
              <rect width="900" height="480" fill="url(#grid)" />

              {/* Main Line Exit Track */}
              <rect x="780" y="40" width="100" height="400" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
              <text x="830" y="240" fill="#6366f1" fontSize="11" fontWeight="bold" textAnchor="middle" transform="rotate(-90 830 240)">
                MAIN LINE EXIT (Aluva / Tripunithura)
              </text>

              {/* Shunting Main Spine Track */}
              <line x1="50" y1="240" x2="780" y2="240" stroke="#334155" strokeWidth="3" strokeDasharray="6 4" />
              <text x="400" y="232" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">
                MAIN DEPOT SHUNTING SPINE
              </text>

              {/* Stabling Line Tracks */}
              {[
                { line: 1, y: 70, label: "LINE 1: MAINTENANCE TRACK (SINGLE LINE)", color: "#f43f5e" },
                { line: 2, y: 135, label: "LINE 2: STANDBY TRACK (SINGLE LINE)", color: "#f59e0b" },
                { line: 3, y: 200, label: "LINE 3: OPERATIONAL REVENUE TRACK A", color: "#10b981" },
                { line: 4, y: 290, label: "LINE 4: OPERATIONAL REVENUE TRACK B", color: "#10b981" },
                { line: 5, y: 355, label: "LINE 5: OPERATIONAL REVENUE TRACK C", color: "#10b981" },
                { line: 6, y: 420, label: "LINE 6: OPERATIONAL REVENUE TRACK D", color: "#10b981" },
              ].map(st => (
                <g key={st.line}>
                  <line x1="160" y1={st.y} x2="760" y2={st.y} stroke="#1e293b" strokeWidth="3" />
                  <text x="10" y={st.y + 4} fill={st.color} fontSize="8.5" textAnchor="start" fontWeight="bold" fontFamily="monospace">{st.label}</text>
                </g>
              ))}

              {/* Render Rakes strictly grouped into designated lines */}
              {(() => {
                const maintenanceTrains = fleet.filter(t => t.currentStatus === 'MAINTENANCE');
                const standbyTrains = fleet.filter(t => t.currentStatus === 'STANDBY');
                const inServiceTrains = fleet.filter(t => t.currentStatus === 'IN_SERVICE');

                // Helper to render a train on a given line and slot
                const renderTrainSlot = (train: Trainset, lineIndex: number, slotIndex: number, yPos: number) => {
                  const isSelected = selectedTrain?.id === train.id;
                  const x = 170 + (slotIndex * 115);
                  const y = yPos - 22;

                  let fill = "#064e3b";
                  let stroke = "#10b981";
                  let badgeColor = "#34d399";

                  if (train.currentStatus === 'STANDBY') {
                    fill = "#78350f";
                    stroke = "#f59e0b";
                    badgeColor = "#fbbf24";
                  } else if (train.currentStatus === 'MAINTENANCE') {
                    fill = "#881337";
                    stroke = "#f43f5e";
                    badgeColor = "#fda4af";
                  }

                  return (
                    <g
                      key={train.id}
                      onClick={() => setSelectedBayId(train.bay.bayId)}
                      className="cursor-pointer transition-all hover:opacity-90"
                    >
                      <rect
                        x={x}
                        y={y}
                        width="105"
                        height="44"
                        rx="6"
                        fill={fill}
                        stroke={isSelected ? "#38bdf8" : stroke}
                        strokeWidth={isSelected ? "3" : "1.5"}
                      />

                      <text x={x + 8} y={y + 18} fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                        {train.id}
                      </text>
                      <text x={x + 8} y={y + 34} fill={badgeColor} fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                        {train.currentStatus.replace('_', ' ')}
                      </text>

                      <circle cx={x + 90} cy={y + 15} r="8" fill="#0f172a" stroke={stroke} strokeWidth="1" />
                      <text x={x + 90} y={y + 18} fill="#cbd5e1" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        {train.bay.bayId}
                      </text>

                      {highlightShuntingPath && isSelected && train.currentStatus === 'IN_SERVICE' && (
                        <path
                          d={`M ${x + 105} ${y + 22} Q ${x + 120} 240, 780 240`}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                          className="animate-pulse"
                        />
                      )}
                    </g>
                  );
                };

                return (
                  <>
                    {/* LINE 1: Maintenance Line */}
                    {maintenanceTrains.map((train, idx) => renderTrainSlot(train, 1, idx, 70))}
                    
                    {/* LINE 2: Standby Line */}
                    {standbyTrains.map((train, idx) => renderTrainSlot(train, 2, idx, 135))}

                    {/* LINES 3-6: Operational Lines (max 5 per line) */}
                    {inServiceTrains.map((train, idx) => {
                      const lineOffset = Math.floor(idx / 5);
                      const slotInLine = idx % 5;
                      const yPositions = [200, 290, 355, 420];
                      const yPos = yPositions[lineOffset] || 420;
                      return renderTrainSlot(train, 3 + lineOffset, slotInLine, yPos);
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* Bay Detail & Shunting Inspection Drawer (1 Column) */}
        <div className="bg-slate-900 border border-slate-800 rounded-md p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3">
            <Info className="w-4 h-4 text-indigo-400" />
            <span>Bay & Shunting Details</span>
          </div>

          {selectedTrain ? (
            <div className="space-y-4 text-xs">
              
              <div className="p-4 bg-slate-950 rounded-sm border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-indigo-400 font-mono">{selectedTrain.id}</span>
                  <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase border ${
                    selectedTrain.currentStatus === 'IN_SERVICE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    selectedTrain.currentStatus === 'STANDBY' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {selectedTrain.currentStatus}
                  </span>
                </div>
                <div className="text-slate-300 font-bold">{selectedTrain.name}</div>
                <div className="text-[11px] text-slate-400">Assigned Bay: <strong>{selectedTrain.bay.bayName}</strong></div>
              </div>

              {/* Shunting Metrics */}
              <div className="p-4 bg-slate-950 rounded-sm border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-white uppercase text-[10px] tracking-wider">
                  <Navigation className="w-4 h-4 text-indigo-400" />
                  <span>Shunting Route Analysis</span>
                </div>

                <div className="flex justify-between items-center pt-1 text-slate-300">
                  <span>Shunting Cost Index:</span>
                  <strong className="text-amber-400 text-xs font-mono">{selectedTrain.bay.shuntingCost} / 10</strong>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>Depot Zone:</span>
                  <strong className="text-white">{selectedTrain.bay.zone}</strong>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>Obstacle Rakes:</span>
                  <strong className="text-slate-400 font-mono">{selectedTrain.bay.isBlockedByBay?.length || 0} rakes ahead</strong>
                </div>
              </div>

              <button
                onClick={() => onSelectTrain(selectedTrain)}
                className="w-full py-2 rounded-sm bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                <span>Inspect Rake Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Select any bay rectangle on the map diagram to inspect its occupying trainset and shunting path.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
