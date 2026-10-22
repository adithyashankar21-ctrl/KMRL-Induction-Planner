import React, { useState } from 'react';
import { Trainset, JobCard, InspectionChecklist } from '../types';
import { Wrench, ShieldCheck, Sparkles, AlertOctagon, Gauge, Plus, CheckCircle2, XCircle, Clock, CheckSquare, Search, Filter, AlertTriangle, Upload, FileText, Bot, FileCheck, ArrowRight, RefreshCw, CheckCircle } from 'lucide-react';

interface MaintenanceHubViewProps {
  fleet: Trainset[];
  inspections: Record<string, InspectionChecklist>;
  onUpdateInspection: (trainId: string, updated: InspectionChecklist) => void;
  onUpdateCleaning: (trainId: string, status: 'done' | 'pending' | 'overdue') => void;
  onAddJobCard: (trainId: string, jobCard: JobCard) => void;
  onResolveJobCard: (trainId: string, jobCardId: string) => void;
  onSelectTrain: (train: Trainset) => void;
}

export interface DocumentAnalysisResult {
  documentName: string;
  docType: string;
  detectedTrainId: string;
  inspectorName: string;
  inspectionDate: string;
  expiryDate: string;
  severity: 'critical' | 'major' | 'minor' | 'compliant';
  complianceStatus: 'FULLY_COMPLIANT' | 'ATTENTION_REQUIRED' | 'NON_COMPLIANT';
  summary: string;
  keyFindings: string[];
  actionRecommendation: string;
  suggestedJobCard?: {
    title: string;
    category: JobCard['category'];
    severity: JobCard['severity'];
    description: string;
    assignedTechnician: string;
  } | null;
}

export const MaintenanceHubView: React.FC<MaintenanceHubViewProps> = ({
  fleet,
  inspections,
  onUpdateInspection,
  onUpdateCleaning,
  onAddJobCard,
  onResolveJobCard,
  onSelectTrain,
}) => {
  const [activeTab, setActiveTab] = useState<'records' | 'inspections' | 'cleaning' | 'faults' | 'readiness' | 'docs'>('records');

  // AI Document Analyzer State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<DocumentAnalysisResult | null>(null);
  const [analyzedHistory, setAnalyzedHistory] = useState<DocumentAnalysisResult[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // New Work Order form modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTrainId, setSelectedTrainId] = useState(fleet[0]?.id || 'TS-01');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<JobCard['category']>('Mechanical');
  const [newSeverity, setNewSeverity] = useState<JobCard['severity']>('minor');
  const [newTech, setNewTech] = useState('Rajesh Kumar (Sr. Tech)');
  const [newDesc, setNewDesc] = useState('');

  // Selected train for Readiness Score Engine detailed breakdown
  const [selectedReadinessTrainId, setSelectedReadinessTrainId] = useState<string>(fleet[0]?.id || 'TS-01');

  // Document Upload & Analysis Handler
  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    setSelectedFileName(file.name);
    setActionMessage(null);

    let textContent = '';
    try {
      if (file.type.includes('text') || file.type.includes('json') || file.type.includes('csv') || file.name.endsWith('.txt')) {
        textContent = await file.text();
      }
    } catch (e) {
      console.warn('Text extraction fallback:', e);
    }

    try {
      const res = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'application/pdf',
          textContent: textContent || `Extracted metadata for document ${file.name} (Size: ${file.size} bytes)`
        })
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setCurrentAnalysis(data.analysis);
        setAnalyzedHistory(prev => [data.analysis, ...prev]);
      } else {
        throw new Error(data.error || 'Failed to analyze document');
      }
    } catch (err: any) {
      console.error('Document analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSampleDocument = (fileName: string, sampleText: string) => {
    const dummyFile = new File([sampleText], fileName, { type: 'text/plain' });
    handleFileUpload(dummyFile);
  };

  const handleApplySuggestedJobCard = (analysis: DocumentAnalysisResult) => {
    if (!analysis.suggestedJobCard) return;

    const jc: JobCard = {
      id: `JC-AI-${Math.floor(1000 + Math.random() * 9000)}`,
      title: analysis.suggestedJobCard.title,
      category: analysis.suggestedJobCard.category,
      severity: analysis.suggestedJobCard.severity,
      loggedDate: new Date().toISOString().split('T')[0],
      estimatedHours: analysis.suggestedJobCard.severity === 'critical' ? 8 : 4,
      assignedTechnician: analysis.suggestedJobCard.assignedTechnician,
      description: `${analysis.suggestedJobCard.description} (Source: ${analysis.documentName})`,
    };

    onAddJobCard(analysis.detectedTrainId, jc);
    setActionMessage(`Successfully generated Job Card ${jc.id} for ${analysis.detectedTrainId} from ${analysis.documentName}!`);
    setTimeout(() => setActionMessage(null), 5000);
  };

  // Compute Readiness Score (0-100)
  const calculateReadinessScore = (train: Trainset) => {
    let score = 100;
    const certsExp = train.certificates.rollingStock.isExpired || train.certificates.signalling.isExpired || train.certificates.telecom.isExpired;
    if (certsExp) score -= 50;

    const crit = train.jobCards.filter(j => j.severity === 'critical').length;
    const maj = train.jobCards.filter(j => j.severity === 'major').length;
    const min = train.jobCards.filter(j => j.severity === 'minor').length;
    if (crit > 0) score -= 40;
    score -= (maj * 15) + (min * 5);

    if (train.cleaningStatus === 'overdue') score -= 15;
    if (train.cleaningStatus === 'pending') score -= 5;

    if (train.mileageTotal > 120000) score -= 10;
    score -= Math.min(10, Math.floor(train.bay.shuntingCost * 1.1));

    return {
      total: Math.max(0, Math.min(100, Math.round(score))),
      certPts: certsExp ? 0 : 40,
      faultPts: crit > 0 ? 0 : Math.max(0, 25 - (maj * 10 + min * 3)),
      cleanPts: train.cleaningStatus === 'done' ? 15 : train.cleaningStatus === 'pending' ? 10 : 0,
      mileagePts: train.mileageTotal < 90000 ? 10 : 5,
      shuntingPts: Math.max(0, 10 - train.bay.shuntingCost),
    };
  };

  const handleCreateJobCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const jc: JobCard = {
      id: `JC-${Math.floor(1000 + Math.random() * 9000)}`,
      title: newTitle,
      category: newCategory,
      severity: newSeverity,
      loggedDate: new Date().toISOString().split('T')[0],
      estimatedHours: newSeverity === 'critical' ? 8 : newSeverity === 'major' ? 4 : 2,
      assignedTechnician: newTech,
      description: newDesc || 'Routine operational maintenance logged by supervisor.',
    };

    onAddJobCard(selectedTrainId, jc);
    setNewTitle('');
    setNewDesc('');
    setIsAddModalOpen(false);
  };

  const allJobCards = fleet.flatMap(t => t.jobCards.map(j => ({ ...j, train: t })));

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="liquid-glass p-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold mb-1">
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>Unified Maintenance & Quality Assurance Hub</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Maintenance, Inspections & Readiness Score Center
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl font-sans">
              Centralized quality assurance suite collecting maintenance records, automated pre-service inspection validation, digital wash plant readiness, real-time fault logging, and composite 0–100 trainset fitness scores.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-emerald-500/25 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Log Maintenance Work Order</span>
          </button>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-3.5 py-1.5 rounded-lg border font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'records'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>1. Unified Maintenance Records</span>
          </button>

          <button
            onClick={() => setActiveTab('inspections')}
            className={`px-3.5 py-1.5 rounded-lg border font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'inspections'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Inspection Validation</span>
          </button>

          <button
            onClick={() => setActiveTab('cleaning')}
            className={`px-3.5 py-1.5 rounded-lg border font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'cleaning'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>3. Digital Readiness Status</span>
          </button>

          <button
            onClick={() => setActiveTab('faults')}
            className={`px-3.5 py-1.5 rounded-lg border font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'faults'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>4. Real-time Fault Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('readiness')}
            className={`px-3.5 py-1.5 rounded-lg border font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'readiness'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span>5. Readiness Score Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3.5 py-1.5 rounded-lg border font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span>6. AI Document Inspector & Vault</span>
          </button>
        </div>
      </div>

      {/* Feature 1: Unified Maintenance Dashboard */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {/* Quick AI Document Ingest Quick-Strip */}
          <div className="liquid-glass p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Bot className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <span className="font-bold text-white block">AI Document & Certificate Ingestion Engine</span>
                <span className="text-[11px] text-slate-400 font-sans">Upload physical inspection PDFs or certificates for AI extraction & automated work order creation.</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('docs')}
              className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap shadow-md"
            >
              <Upload className="w-4 h-4 text-white" />
              <span>Upload & Analyze Document</span>
            </button>
          </div>

          <div className="liquid-glass rounded-xl border border-slate-800/80 overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm font-mono flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <span>Active Work Orders & Maintenance History Log ({allJobCards.length} Total)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">Real-time Synchronization</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Work Order ID</th>
                    <th className="p-3">Trainset</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Issue Description</th>
                    <th className="p-3">Assigned Technician</th>
                    <th className="p-3">Logged Date</th>
                    <th className="p-3 text-right">Resolution Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {allJobCards.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        No active work orders or pending defects logged. All 25 trainsets clear.
                      </td>
                    </tr>
                  ) : (
                    allJobCards.map(jc => (
                      <tr key={jc.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-bold text-cyan-300">{jc.id}</td>
                        <td className="p-3 text-white font-bold">{jc.train.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] uppercase font-bold">
                            {jc.category}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            jc.severity === 'critical'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              : jc.severity === 'major'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {jc.severity}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 font-sans max-w-xs">{jc.description}</td>
                        <td className="p-3 text-emerald-300 font-sans">{jc.assignedTechnician || 'Unassigned'}</td>
                        <td className="p-3 text-slate-400">{jc.loggedDate}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onResolveJobCard(jc.train.id, jc.id)}
                            className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/40 transition-colors cursor-pointer"
                          >
                            Resolve & Sign Off
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Feature 2: Automatic Inspection Validation */}
      {activeTab === 'inspections' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fleet.map(t => {
              const insp = inspections[t.id] || {
                trainId: t.id,
                brakeCheck: true,
                doorSensorCheck: true,
                pantographCheck: true,
                cbtcTest: true,
                hvacCheck: true,
                status: 'PASSED',
                verifiedAt: 'Today, 21:00 IST',
                verifiedBy: 'Quality Inspector',
              };

              const isPassed = insp.status === 'PASSED';

              return (
                <div key={t.id} className={`liquid-glass p-4 rounded-xl border ${isPassed ? 'border-emerald-500/30' : 'border-rose-500/30'} bg-slate-950/80 space-y-3 font-mono text-xs`}>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">{t.name}</h4>
                      <span className="text-[10px] text-slate-400">Inspector: {insp.verifiedBy}</span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                      isPassed ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                    }`}>
                      {insp.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Air Brake & Reservoir Pressure:</span>
                      {insp.brakeCheck ? <span className="text-emerald-400 font-bold">✓ PASS</span> : <span className="text-rose-400 font-bold">✕ FAIL</span>}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Passenger Door Safety Sensors:</span>
                      {insp.doorSensorCheck ? <span className="text-emerald-400 font-bold">✓ PASS</span> : <span className="text-rose-400 font-bold">✕ FAIL</span>}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Pantograph High Voltage Line:</span>
                      {insp.pantographCheck ? <span className="text-emerald-400 font-bold">✓ PASS</span> : <span className="text-rose-400 font-bold">✕ FAIL</span>}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">CBTC Signalling Loop:</span>
                      {insp.cbtcTest ? <span className="text-emerald-400 font-bold">✓ PASS</span> : <span className="text-rose-400 font-bold">✕ FAIL</span>}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Verified: {insp.verifiedAt}</span>
                    <button
                      onClick={() => {
                        const newStatus = isPassed ? 'FAILED' : 'PASSED';
                        onUpdateInspection(t.id, {
                          ...insp,
                          status: newStatus,
                          brakeCheck: newStatus === 'PASSED',
                          doorSensorCheck: newStatus === 'PASSED',
                          cbtcTest: newStatus === 'PASSED',
                        });
                      }}
                      className="text-cyan-300 hover:underline cursor-pointer"
                    >
                      Toggle Inspection
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feature 3: Digital Readiness & Cleaning Status */}
      {activeTab === 'cleaning' && (
        <div className="space-y-4">
          <div className="liquid-glass p-6 rounded-2xl border border-blue-500/30 bg-slate-950/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  Feature 3: Digital Cleaning & Wash Plant Readiness Status
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Monitors automated exterior wash plant passes and interior deep sanitization cycles before morning rollout.
                </p>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs text-slate-400 uppercase">Wash Plant Line 11 Capacity</span>
                <p className="text-xl font-bold text-cyan-300">6 Passes / Night</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fleet.map(t => (
                <div key={t.id} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs">
                  <div>
                    <h4 className="font-bold text-white">{t.name}</h4>
                    <span className="text-[10px] text-slate-400">Last Washed: {t.lastCleanedDate}</span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase inline-block ${
                      t.cleaningStatus === 'done'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : t.cleaningStatus === 'pending'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                    }`}>
                      {t.cleaningStatus}
                    </span>

                    <div>
                      <button
                        onClick={() => {
                          const nextStatus = t.cleaningStatus === 'done' ? 'pending' : t.cleaningStatus === 'pending' ? 'overdue' : 'done';
                          onUpdateCleaning(t.id, nextStatus);
                        }}
                        className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                      >
                        Trigger Wash Cycle
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feature 4: Real-time Fault Dashboard */}
      {activeTab === 'faults' && (
        <div className="space-y-4">
          <div className="liquid-glass p-6 rounded-2xl border border-rose-500/30 bg-slate-950/90 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  Feature 4: Real-Time Active Fault Log Stream
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Live sensor diagnostics and crew telemetry streaming from all 25 Metro trainsets.
                </p>
              </div>

              <div className="flex items-center space-x-2 font-mono text-xs">
                <span className="px-3 py-1 rounded bg-rose-950 border border-rose-500/40 text-rose-300 font-bold">
                  {allJobCards.filter(j => j.severity === 'critical').length} Critical Faults
                </span>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {allJobCards.map(j => (
                <div key={j.id} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{j.train.name}</span>
                      <span className="text-cyan-300">[{j.id}]</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] uppercase">
                        {j.category}
                      </span>
                    </div>
                    <p className="text-slate-300 font-sans text-xs">{j.description}</p>
                    <div className="text-[10px] text-slate-500">
                      Logged: {j.loggedDate} | Assigned: {j.assignedTechnician || 'Unassigned'}
                    </div>
                  </div>

                  <button
                    onClick={() => onResolveJobCard(j.train.id, j.id)}
                    className="px-3 py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 cursor-pointer font-bold transition-all"
                  >
                    Clear Fault
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feature 5: Readiness Score Engine */}
      {activeTab === 'readiness' && (
        <div className="liquid-glass p-6 rounded-2xl border border-amber-500/30 bg-slate-950/90 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Feature 5: Trainset Readiness Score Engine (0-100 Mathematical Model)
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Composite readiness scoring evaluating Safety Certs (40%), Open Faults (25%), Washing (15%), Mileage (10%), and Shunting Access (10%).
              </p>
            </div>

            <div className="flex items-center space-x-2 font-mono text-xs">
              <span className="text-slate-400">Inspect Rake:</span>
              <select
                value={selectedReadinessTrainId}
                onChange={(e) => setSelectedReadinessTrainId(e.target.value)}
                className="bg-slate-900 text-cyan-300 border border-cyan-500/40 rounded px-3 py-1.5 font-bold focus:outline-none"
              >
                {fleet.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {(() => {
            const tr = fleet.find(t => t.id === selectedReadinessTrainId) || fleet[0];
            const breakdown = calculateReadinessScore(tr);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
                <div className="lg:col-span-1 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
                  <span className="text-slate-400 uppercase text-xs">Composite Fitness Score</span>
                  <div className="text-6xl font-bold text-cyan-300">{breakdown.total}</div>
                  <span className="text-slate-400 font-sans text-xs">Out of 100 Points</span>

                  <div className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-left space-y-1 text-[11px]">
                    <div className="text-slate-300 font-bold">{tr.name}</div>
                    <div className="text-slate-400">Rake #{tr.rakeNumber} | Bay: {tr.bay.bayName}</div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                  <h4 className="font-bold text-white text-sm uppercase text-cyan-400 border-b border-slate-800 pb-2">
                    Scoring Component Breakdown
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>1. Safety Certificates (40 pts)</span>
                        <span className="font-bold text-cyan-300">{breakdown.certPts} / 40</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-cyan-400" style={{ width: `${(breakdown.certPts / 40) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>2. Fault-Free Operations (25 pts)</span>
                        <span className="font-bold text-emerald-400">{breakdown.faultPts} / 25</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-400" style={{ width: `${(breakdown.faultPts / 25) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>3. Digital Cleaning Status (15 pts)</span>
                        <span className="font-bold text-blue-400">{breakdown.cleanPts} / 15</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-blue-400" style={{ width: `${(breakdown.cleanPts / 15) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>4. Mileage Balance Load (10 pts)</span>
                        <span className="font-bold text-amber-400">{breakdown.mileagePts} / 10</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-amber-400" style={{ width: `${(breakdown.mileagePts / 10) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>5. Shunting Track Access (10 pts)</span>
                        <span className="font-bold text-indigo-400">{breakdown.shuntingPts} / 10</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-indigo-400" style={{ width: `${(breakdown.shuntingPts / 10) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Feature 6: AI Document Inspector & Vault */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="liquid-glass p-6 rounded-2xl border border-purple-500/30 bg-slate-950/90 shadow-xl space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Metro AI Document Intelligence & Technical Certificate Vault
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40 text-[10px] font-bold uppercase">
                AI OCR & Ingestion Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Upload physical fitness certificates, maintenance work logs, wheel lathe reports, or OEM diagnostic sheets. The AI Engine automatically parses technical content, extracts target trainset IDs, identifies defect severity, and generates actionable job cards.
            </p>
          </div>

          {actionMessage && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-xs flex items-center space-x-2 shadow-lg animate-pulse">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* Upload Area & Sample Documents Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
            {/* Upload Zone */}
            <div className="lg:col-span-2 liquid-glass p-6 rounded-2xl border border-cyan-500/30 bg-slate-950/90 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-cyan-300 uppercase tracking-wider text-xs flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Document Ingestion Zone</span>
                </span>
                <span className="text-[10px] text-slate-400">PDF, TXT, DOC, PNG, JPG, CSV</span>
              </div>

              <div className="relative border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-xl p-8 text-center bg-slate-900/60 hover:bg-cyan-950/20 transition-all cursor-pointer group">
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx,.csv,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                <div className="flex flex-col items-center space-y-3 pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                    {isAnalyzing ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                    ) : (
                      <Upload className="w-6 h-6 text-cyan-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">
                      {isAnalyzing ? 'AI Engine Scanning Document...' : 'Drag & Drop Certificate or Maintenance Log Here'}
                    </p>
                    <p className="text-slate-400 text-xs mt-1 font-sans">
                      or click to browse local files on your computer
                    </p>
                  </div>
                  {selectedFileName && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                      Selected: {selectedFileName}
                    </span>
                  )}
                </div>
              </div>

              {/* Sample Documents for Instant One-Click Demo */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Or Test Instant Pre-Set Sample Documents:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSampleDocument(
                      'TS-04 Traction Inverter Critical Defect.pdf',
                      'INSPECTION REPORT - TS-04 (Rake 4)\nInspector: Er. K. V. Suresh\nDate: 2026-08-06\nFindings: Critical phase fault in Traction Inverter Unit 2. Overheating observed during test run at Muttom Depot. Recommend grounding immediately.'
                    )}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500 text-left rounded text-[11px] flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <div className="truncate">
                      <div className="text-rose-300 font-bold truncate">TS-04 Traction Inverter Defect.pdf</div>
                      <div className="text-[9px] text-slate-400">Critical Fault • Inverter Phase Shock</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSampleDocument(
                      'TS-01 CBTC Signalling Fitness Cert.pdf',
                      'CBTC SIGNALLING FITNESS CERTIFICATE - TS-01\nIssuer: Alstom Rail Safety Dept\nDate: 2026-08-06\nStatus: FULLY COMPLIANT. All trackside ATC antenna and odometry units calibrated. Valid for 90 days.'
                    )}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 text-left rounded text-[11px] flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div className="truncate">
                      <div className="text-emerald-300 font-bold truncate">TS-01 Signalling Fitness Cert.pdf</div>
                      <div className="text-[9px] text-slate-400">Compliant • CBTC Antenna Passed</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSampleDocument(
                      'TS-12 Wheel Lathe Measurement.txt',
                      'Muttom Depot Wheel Shop - TS-12\nInspector: S. Unnikrishnan\nFlange thickness: 29.8mm (Limit: 28.5mm).\nTread profile within RDSO limits. Scheduled re-profiling in 15 days.'
                    )}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-left rounded text-[11px] flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div className="truncate">
                      <div className="text-amber-300 font-bold truncate">TS-12 Wheel Lathe Report.txt</div>
                      <div className="text-[9px] text-slate-400">Major • Wheel Wear Advisory</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSampleDocument(
                      'TS-05 Saloon HVAC Calibration Log.csv',
                      'Trainset,System,Parameter,Status,Value\nTS-05,HVAC,Compressor Pressure,Warning,Low Freon Gas Level\nInspector,R. Nair\nAction,Refill coolant before peak revenue service.'
                    )}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-left rounded text-[11px] flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div className="truncate">
                      <div className="text-cyan-300 font-bold truncate">TS-05 Saloon HVAC Audit.csv</div>
                      <div className="text-[9px] text-slate-400">Minor • Saloon Cooling Warning</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* AI Analysis Result Display Card */}
            <div className="liquid-glass p-6 rounded-2xl border border-purple-500/30 bg-slate-950/90 flex flex-col justify-between space-y-4">
              <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                <span className="font-bold text-purple-300 uppercase tracking-wider text-xs flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>AI Document Analysis</span>
                </span>
                {currentAnalysis && (
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${
                    currentAnalysis.complianceStatus === 'FULLY_COMPLIANT'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      : currentAnalysis.complianceStatus === 'ATTENTION_REQUIRED'
                      ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                      : 'bg-rose-950 text-rose-300 border-rose-500/40'
                  }`}>
                    {currentAnalysis.complianceStatus.replace('_', ' ')}
                  </span>
                )}
              </div>

              {isAnalyzing ? (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
                  <p className="text-purple-300 font-bold text-xs">Extracting Technical Data & OCR Processing...</p>
                  <p className="text-[10px] text-slate-400 font-sans">Evaluating RDSO safety standards and KMRL maintenance rules</p>
                </div>
              ) : currentAnalysis ? (
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-900/90 p-3 rounded border border-slate-800 space-y-1">
                    <div className="text-slate-400 text-[10px]">DOCUMENT & TARGET TRAINSET</div>
                    <div className="font-bold text-white text-sm flex items-center justify-between">
                      <span>{currentAnalysis.documentName}</span>
                      <span className="text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30 font-mono text-xs">
                        {currentAnalysis.detectedTrainId}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      Category: <span className="text-slate-200">{currentAnalysis.docType}</span> • Inspector: <span className="text-emerald-300">{currentAnalysis.inspectorName}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Executive AI Findings:</span>
                    <ul className="space-y-1 text-[11px] font-sans">
                      {currentAnalysis.keyFindings.map((finding, idx) => (
                        <li key={idx} className="flex items-start space-x-1.5 text-slate-300">
                          <span className="text-purple-400 mt-0.5">•</span>
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-purple-950/40 border border-purple-500/30 p-3 rounded space-y-1">
                    <div className="text-[10px] text-purple-300 font-bold uppercase">AI Operational Directive:</div>
                    <div className="text-slate-200 font-sans text-xs">{currentAnalysis.actionRecommendation}</div>
                  </div>

                  {currentAnalysis.suggestedJobCard && (
                    <button
                      onClick={() => handleApplySuggestedJobCard(currentAnalysis)}
                      className="w-full py-2.5 rounded bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold uppercase tracking-wider text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-md transition-all"
                    >
                      <Plus className="w-4 h-4 text-slate-950" />
                      <span>Auto-Generate Maintenance Work Order</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Bot className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs">No document selected for AI analysis.</p>
                  <p className="text-[10px] text-slate-600 font-sans">Upload a file or choose a sample document on the left to begin.</p>
                </div>
              )}
            </div>
          </div>

          {/* Document Ingestion Vault History */}
          {analyzedHistory.length > 0 && (
            <div className="liquid-glass rounded-xl border border-slate-800/80 overflow-hidden font-mono text-xs space-y-2 p-4">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Session Uploaded Documents Vault ({analyzedHistory.length} Scanned)</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Document Name</th>
                      <th className="p-2.5">Target Train</th>
                      <th className="p-2.5">Document Category</th>
                      <th className="p-2.5">Inspector</th>
                      <th className="p-2.5">Compliance Status</th>
                      <th className="p-2.5 text-right">Action Executed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {analyzedHistory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="p-2.5 font-bold text-white">{item.documentName}</td>
                        <td className="p-2.5 font-bold text-cyan-300">{item.detectedTrainId}</td>
                        <td className="p-2.5 text-slate-300">{item.docType}</td>
                        <td className="p-2.5 text-emerald-300">{item.inspectorName}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            item.complianceStatus === 'FULLY_COMPLIANT'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                          }`}>
                            {item.complianceStatus}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          {item.suggestedJobCard ? (
                            <button
                              onClick={() => handleApplySuggestedJobCard(item)}
                              className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 font-bold text-[10px]"
                            >
                              Create Work Order
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Archived in Vault</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Job Card Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass bg-slate-950 border border-cyan-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl font-sans space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Log Maintenance Work Order</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white font-mono text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateJobCard} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Select Trainset:</label>
                <select
                  value={selectedTrainId}
                  onChange={(e) => setSelectedTrainId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:outline-none"
                >
                  {fleet.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Issue Title:</label>
                <input
                  type="text"
                  placeholder="e.g. HVAC Compressor Pressure Fluctuation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:outline-none font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as JobCard['category'])}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:outline-none"
                  >
                    <option value="Mechanical">Mechanical</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Signalling">Signalling</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Brake">Brake</option>
                    <option value="Telecom">Telecom</option>
                    <option value="Interior">Interior</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Severity Level:</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as JobCard['severity'])}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:outline-none"
                  >
                    <option value="minor">Minor</option>
                    <option value="major">Major</option>
                    <option value="critical">Critical (Grounded)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assigned Senior Technician:</label>
                <input
                  type="text"
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Technical Description:</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Details of logged fault..."
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:outline-none font-sans"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Save Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
