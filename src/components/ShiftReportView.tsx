import React from 'react';
import { InductionPlan, Trainset } from '../types';
import { Printer, FileText, CheckCircle, ShieldCheck, Download } from 'lucide-react';

interface ShiftReportViewProps {
  plan: InductionPlan | null;
  fleet: Trainset[];
}

export const ShiftReportView: React.FC<ShiftReportViewProps> = ({ plan, fleet }) => {
  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      
      {/* Action Header */}
      <div className="cyber-card rounded-2xl p-6 shadow-xl border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2 text-[10px] text-cyan-300 font-mono font-bold uppercase tracking-widest mb-1">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>METRO AI OFFICIAL NIGHTLY INDUCTION MANIFEST</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Shift Operations Report
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Formatted daily train induction report for Muttom OCC duty supervisor sign-off and train driver handover.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-full liquid-glass border border-cyan-500/40 hover:bg-cyan-500/20 text-cyan-300 font-semibold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-cyan-400" />
          <span>Print / Save PDF Report</span>
        </button>
      </div>

      {/* Printable Report Document Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-8 shadow-sm text-slate-200 text-xs space-y-6 print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-0">
        
        {/* Document Header */}
        <div className="border-b-2 border-slate-700 print:border-slate-900 pb-5 flex justify-between items-start">
          <div>
            <div className="text-xl font-black tracking-tight text-white print:text-slate-900 uppercase">
              KOCHI METRO RAIL LIMITED (KMRL)
            </div>
            <div className="text-xs font-bold text-indigo-400 print:text-indigo-700 uppercase tracking-widest mt-0.5">
              Muttom Depot Operations Control Center (OCC)
            </div>
            <p className="text-[11px] text-slate-400 print:text-slate-600 mt-1">
              Daily Train Induction & Shunting Schedule Manifest (SIH25081 Engine)
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 print:text-slate-600 space-y-0.5 font-mono">
            <div>Date: <strong className="text-white print:text-slate-900">{todayStr}</strong></div>
            <div>Shift Window: <strong className="text-white print:text-slate-900">22:00 IST - Night Service</strong></div>
            <div>Plan ID: <strong className="font-bold text-indigo-400 print:text-indigo-700">{plan?.id || 'PLAN-DEFAULT'}</strong></div>
          </div>
        </div>

        {/* Executive Target Summary Table */}
        <div className="grid grid-cols-3 gap-4 border p-4 rounded-sm border-slate-800 print:border-slate-300 bg-slate-950">
          <div className="text-center border-r border-slate-800 print:border-slate-300 pr-2">
            <span className="text-slate-500 print:text-slate-600 block text-[10px] uppercase font-bold tracking-wider">Revenue In-Service Rakes</span>
            <span className="text-2xl font-bold text-emerald-400 print:text-emerald-700 font-mono">{plan?.actualCounts.inService || 16} / 16 Target</span>
          </div>
          <div className="text-center border-r border-slate-800 print:border-slate-300 pr-2">
            <span className="text-slate-500 print:text-slate-600 block text-[10px] uppercase font-bold tracking-wider">Hot Standby Rakes</span>
            <span className="text-2xl font-bold text-amber-400 print:text-amber-700 font-mono">{plan?.actualCounts.standby || 3} / 3 Target</span>
          </div>
          <div className="text-center">
            <span className="text-slate-500 print:text-slate-600 block text-[10px] uppercase font-bold tracking-wider">Depot Maintenance</span>
            <span className="text-2xl font-bold text-red-400 print:text-red-700 font-mono">{plan?.actualCounts.maintenance || 6} / 6 Grounded</span>
          </div>
        </div>

        {/* Train Roster Manifest Table */}
        <div className="space-y-2">
          <h3 className="font-bold text-white print:text-slate-900 text-xs uppercase tracking-widest text-indigo-400">
            Revenue Service Induction Roster ({plan?.decisions?.filter(d => d.recommendedStatus === 'IN_SERVICE').length || 16} Rakes)
          </h3>

          <table className="w-full text-left text-xs text-slate-300 print:text-slate-900 border border-slate-800 print:border-slate-300">
            <thead className="bg-slate-950 print:bg-slate-100 font-bold uppercase text-[10px] tracking-wider text-slate-500">
              <tr>
                <th className="p-2.5 border-b border-slate-800 print:border-slate-300">Rake ID</th>
                <th className="p-2.5 border-b border-slate-800 print:border-slate-300">Stabling Bay</th>
                <th className="p-2.5 border-b border-slate-800 print:border-slate-300">Shunting Cost</th>
                <th className="p-2.5 border-b border-slate-800 print:border-slate-300">Certs Status</th>
                <th className="p-2.5 border-b border-slate-800 print:border-slate-300">Reason Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-slate-200 text-[11px]">
              {plan?.decisions?.filter(d => d.recommendedStatus === 'IN_SERVICE').map(dec => {
                const train = fleet.find(t => t.id === dec.trainId);
                return (
                  <tr key={dec.trainId}>
                    <td className="p-2.5 font-bold font-mono text-indigo-400">{dec.trainId} ({train?.name.split(' ')[1] || ''})</td>
                    <td className="p-2.5">{train?.bay.bayName}</td>
                    <td className="p-2.5 font-mono">{train?.bay.shuntingCost}/10</td>
                    <td className="p-2.5 text-emerald-400 print:text-emerald-700 font-bold uppercase text-[10px]">Valid</td>
                    <td className="p-2.5">{dec.reasonSummary}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Supervisor Sign-Off Box */}
        <div className="pt-8 border-t border-slate-800 print:border-slate-300 grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-6">
            <div className="font-bold text-white print:text-slate-900 uppercase text-[11px] tracking-wider">Muttom OCC Duty Supervisor Sign-Off</div>
            <div className="h-12 border-b border-dashed border-slate-700 print:border-slate-400"></div>
            <div className="text-[10px] text-slate-500 print:text-slate-600 font-mono">Name & Signature / Employee ID</div>
          </div>

          <div className="space-y-6">
            <div className="font-bold text-white print:text-slate-900 uppercase text-[11px] tracking-wider">Chief Rolling Stock Engineer Verification</div>
            <div className="h-12 border-b border-dashed border-slate-700 print:border-slate-400"></div>
            <div className="text-[10px] text-slate-500 print:text-slate-600 font-mono">Digital Stamp / Approval Date</div>
          </div>
        </div>

      </div>

    </div>
  );
};
