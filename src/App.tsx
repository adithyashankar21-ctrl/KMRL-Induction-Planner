import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { FleetView } from './components/FleetView';
import { TrainDetailModal } from './components/TrainDetailModal';
import { DepotMapView } from './components/DepotMapView';
import { MileageHeatmapView } from './components/MileageHeatmapView';
import { AlertCenterView } from './components/AlertCenterView';
import { ShiftReportView } from './components/ShiftReportView';
import { LiveMetroMapView } from './components/LiveMetroMapView';
import { SmartInductionView } from './components/SmartInductionView';
import { MaintenanceHubView } from './components/MaintenanceHubView';
import { OperationsHubView } from './components/OperationsHubView';
import { BackgroundVideo } from './components/BackgroundVideo';
import { AICopilotBox } from './components/AICopilotBox';
import { WindowFrame } from './components/WindowFrame';
import { LauncherHub } from './components/LauncherHub';
import { CommandDock } from './components/CommandDock';
import {
  LayoutDashboard,
  Navigation,
  Cpu,
  Wrench,
  Users,
  Train,
  Map,
  AlertTriangle,
  FileText
} from 'lucide-react';
import {
  Trainset,
  AlertItem,
  ConstraintConfig,
  InductionPlan,
  UserRole,
  TrainStatus,
  ActiveTab,
  CrewMember,
  PlatformAssignment,
  InspectionChecklist,
  NotificationLog,
  JobCard
} from './types';
import { DEFAULT_CONFIG } from './engine/solver';
import { INITIAL_CREW, INITIAL_PLATFORMS, INITIAL_NOTIFICATIONS, generateInitialInspections } from './data/operationalData';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab | 'launcher'>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('planner');
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  
  const [fleet, setFleet] = useState<Trainset[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [config, setConfig] = useState<ConstraintConfig>(DEFAULT_CONFIG);
  const [depotBays, setDepotBays] = useState<any[]>([]);
  const [plan, setPlan] = useState<InductionPlan | null>(null);

  // Operational State
  const [crew, setCrew] = useState<CrewMember[]>(INITIAL_CREW);
  const [platforms, setPlatforms] = useState<PlatformAssignment[]>(INITIAL_PLATFORMS);
  const [inspections, setInspections] = useState<Record<string, InspectionChecklist>>({});
  const [notifications, setNotifications] = useState<NotificationLog[]>(INITIAL_NOTIFICATIONS);

  // Stations operational status override by date
  const [dateStationsStatus, setDateStationsStatus] = useState<Record<string, Record<string, { isOperational: boolean; reason?: string }>>>({});

  const [selectedTrain, setSelectedTrain] = useState<Trainset | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial Data Load & Initial Optimizer Execution
  const fetchFleet = async () => {
    try {
      const res = await fetch('/api/fleet');
      const data = await res.json();
      setFleet(data.fleet);
      setAlerts(data.alerts);
      setConfig(data.config);
      setDepotBays(data.depotBays);
      setInspections(generateInitialInspections(data.fleet.map((t: Trainset) => t.id)));

      // Auto-run initial optimizer for tonight's plan
      const optRes = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: data.config, plannerName: 'Senior Planner (Muttom OCC)' }),
      });
      const optData = await optRes.json();
      setPlan(optData.plan);
    } catch (err) {
      console.error('Error fetching fleet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  // Run Optimizer Trigger
  const handleRunOptimizer = async (customConfig?: ConstraintConfig) => {
    const targetConfig = customConfig || config;
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: targetConfig, plannerName: `Duty ${userRole}` }),
      });
      const data = await res.json();
      setPlan(data.plan);
      setConfig(targetConfig);
    } catch (err) {
      console.error('Error running optimizer:', err);
    }
  };

  // Reset Fleet Data
  const handleResetFleet = async () => {
    try {
      const res = await fetch('/api/fleet/reset', { method: 'POST' });
      const data = await res.json();
      setFleet(data.fleet);
      setAlerts(data.alerts);
      setDateStationsStatus({});
      setInspections(generateInitialInspections(data.fleet.map((t: Trainset) => t.id)));
      handleRunOptimizer();
    } catch (err) {
      console.error('Error resetting fleet:', err);
    }
  };

  // Apply Manual Override
  const handleApplyOverride = async (trainId: string, forcedStatus: TrainStatus | 'CLEAR', reason: string) => {
    try {
      const res = await fetch('/api/fleet/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainId, forcedStatus, reason, plannerName: `Supervisor (${userRole})` }),
      });
      const data = await res.json();
      
      // Update local fleet state
      setFleet(prev => prev.map(t => t.id === trainId ? data.train : t));
      if (selectedTrain && selectedTrain.id === trainId) {
        setSelectedTrain(data.train);
      }

      // Re-run optimizer to recalculate induction plan
      handleRunOptimizer();
    } catch (err) {
      console.error('Error overriding train status:', err);
    }
  };

  // Maintenance & Inspection Handlers
  const handleUpdateInspection = (trainId: string, updated: InspectionChecklist) => {
    setInspections(prev => ({ ...prev, [trainId]: updated }));
  };

  const handleUpdateCleaning = (trainId: string, status: 'done' | 'pending' | 'overdue') => {
    setFleet(prev => prev.map(t => t.id === trainId ? { ...t, cleaningStatus: status } : t));
  };

  const handleAddJobCard = (trainId: string, jobCard: JobCard) => {
    setFleet(prev => prev.map(t => t.id === trainId ? { ...t, jobCards: [jobCard, ...t.jobCards] } : t));
    handleRunOptimizer();
  };

  const handleResolveJobCard = (trainId: string, jobCardId: string) => {
    setFleet(prev => prev.map(t => t.id === trainId ? { ...t, jobCards: t.jobCards.filter(j => j.id !== jobCardId) } : t));
    handleRunOptimizer();
  };

  // Fleet Add / Edit Handlers
  const handleAddRake = async (newRake: Trainset) => {
    try {
      const res = await fetch('/api/fleet/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRake),
      });
      const data = await res.json();
      if (data.success && data.fleet) {
        setFleet(data.fleet);
        handleRunOptimizer();
      }
    } catch (err) {
      console.error('Error adding new rake:', err);
      setFleet(prev => [newRake, ...prev]);
      handleRunOptimizer();
    }
  };

  const handleUpdateRake = async (updatedRake: Trainset) => {
    try {
      const res = await fetch('/api/fleet/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRake),
      });
      const data = await res.json();
      if (data.success && data.fleet) {
        setFleet(data.fleet);
        handleRunOptimizer();
      }
    } catch (err) {
      console.error('Error updating rake:', err);
      setFleet(prev => prev.map(t => t.id === updatedRake.id ? updatedRake : t));
      handleRunOptimizer();
    }
  };

  // Operations Handlers
  const handleToggleCrewStatus = (crewId: string) => {
    setCrew(prev => prev.map(c => {
      if (c.id === crewId) {
        const nextStatus = c.status === 'On-Duty' ? 'Standby' : c.status === 'Standby' ? 'Off-Duty' : 'On-Duty';
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const handleAssignPlatform = (platformId: string, trainId: string | undefined) => {
    const targetTrain = fleet.find(t => t.id === trainId);
    setPlatforms(prev => prev.map(p => {
      if (p.platformId === platformId) {
        return {
          ...p,
          assignedTrainId: trainId,
          assignedTrainName: targetTrain ? targetTrain.name : undefined,
          status: trainId ? 'Occupied' : 'Available',
        };
      }
      return p;
    }));
  };

  const handleSendNotification = (notif: NotificationLog) => {
    setNotifications(prev => [notif, ...prev]);
  };

  const handleToggleStationStatusDate = (dateStr: string, stationId: string, isOperational: boolean, reason?: string) => {
    setDateStationsStatus(prev => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] || {}),
        [stationId]: { isOperational, reason },
      },
    }));
  };

  const handleCreateAlert = (newAlert: AlertItem) => {
    setAlerts(prev => [newAlert, ...prev]);
  };

  const handleAskAI = (trainId: string) => {
    setIsCopilotOpen(true);
  };

  const handleOpenChatbot = () => {
    setIsCopilotOpen(true);
  };

  const inServiceCount = fleet.filter(t => t.currentStatus === 'IN_SERVICE').length;
  const standbyCount = fleet.filter(t => t.currentStatus === 'STANDBY').length;
  const maintenanceCount = fleet.filter(t => t.currentStatus === 'MAINTENANCE').length;
  const criticalAlertCount = alerts.filter(a => a.severity === 'critical').length;

  const TAB_METADATA: Record<string, { title: string; subtitle?: string; icon: any; badge?: string }> = {
    dashboard: { title: 'Operations Overview', subtitle: 'Real-time telemetry, 22:00 IST induction targets & fleet KPI cards', icon: LayoutDashboard },
    livemap: { title: 'Active Metro Line Map', subtitle: 'Real-time 25-station Aluva-Thrippunithura map with zoom controls', icon: Navigation, badge: '25 Stations' },
    induction: { title: 'Smart AI Induction Hub', subtitle: 'CP-SAT optimization solver engine with certificate & mileage rules', icon: Cpu, badge: 'CP-SAT' },
    maintenance: { title: 'Maintenance & Fitness Hub', subtitle: 'Job card tracker, 30-item daily inspection checklists & cleaning logs', icon: Wrench },
    operations: { title: 'Crew & Track Dispatch', subtitle: 'Loco pilot duty rosters, Muttom platform tracks & broadcast system', icon: Users },
    fleet: { title: 'Fleet Manager (25 Rakes)', subtitle: 'Detailed rake inspector, wheel diameter, cert validity & manual overrides', icon: Train, badge: '25 Rakes' },
    depot: { title: 'Digital Twin Depot Map', subtitle: 'Muttom Depot track layout, stabling lines, inspection bays & IBL/EBL', icon: Map, badge: 'Muttom' },
    alerts: { title: 'Alert & Compliance Center', subtitle: 'Critical safety violations, expiring certificates & rule overrides', icon: AlertTriangle, badge: criticalAlertCount > 0 ? `${criticalAlertCount} Critical` : undefined },
    report: { title: 'Shift Report Generator', subtitle: 'Generate printable shift handover reports & PDF export summaries', icon: FileText, badge: 'Handover PDF' },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white space-y-4 relative overflow-hidden">
        <BackgroundVideo />
        <div className="w-12 h-12 border-2 border-cyan-400 border-t-emerald-400 rounded-full animate-spin glow-cyan z-10"></div>
        <div className="text-center z-10 liquid-glass rounded-xl p-4 border border-cyan-500/30">
          <p className="text-xs font-mono text-cyan-300 font-bold uppercase tracking-widest text-glow-cyan">Initializing Metro AI Engine</p>
          <p className="text-[10px] text-slate-300 font-mono mt-1">Calibrating 25 Trainset Models & Telemetry Stream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black text-slate-100 font-sans flex flex-col overflow-hidden select-none relative">
      
      {/* Background Video Stream with Mux HLS */}
      <BackgroundVideo />

      {/* App Navbar */}
      <div className="relative z-30">
        <Navbar
          userRole={userRole}
          setUserRole={setUserRole}
          alerts={alerts}
          onOpenCopilot={handleOpenChatbot}
          onResetFleet={handleResetFleet}
          fleetCount={{ inService: inServiceCount, standby: standbyCount, maintenance: maintenanceCount }}
        />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden z-10">
        
        {/* Left Sidebar Nav */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          criticalAlertCount={criticalAlertCount}
        />

        {/* Primary Content Area: Windowed Workspace over Video Background */}
        <main className={`flex-1 overflow-y-auto pb-24 ${isMaximized ? 'p-2 sm:p-4' : 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto'} w-full transition-all duration-300`}>
          
          {activeTab === 'launcher' ? (
            <LauncherHub
              onOpenTab={(tab) => setActiveTab(tab)}
              onOpenChatbot={handleOpenChatbot}
              criticalAlertCount={criticalAlertCount}
              fleetCount={{ inService: inServiceCount, standby: standbyCount, maintenance: maintenanceCount }}
            />
          ) : (
            <WindowFrame
              title={TAB_METADATA[activeTab]?.title || 'KMRL Window'}
              subtitle={TAB_METADATA[activeTab]?.subtitle}
              icon={TAB_METADATA[activeTab]?.icon || LayoutDashboard}
              badge={TAB_METADATA[activeTab]?.badge}
              badgeColor={activeTab === 'alerts' && criticalAlertCount > 0 ? 'rose' : 'cyan'}
              isMaximized={isMaximized}
              onToggleMaximize={() => setIsMaximized(!isMaximized)}
              onMinimize={() => setActiveTab('launcher')}
              onClose={() => setActiveTab('launcher')}
            >
              {activeTab === 'dashboard' && (
                <DashboardView
                  fleet={fleet}
                  alerts={alerts}
                  plan={plan}
                  onRunOptimizer={() => handleRunOptimizer()}
                  onSelectTrain={(t) => setSelectedTrain(t)}
                  onNavigateTab={(t) => setActiveTab(t)}
                />
              )}

              {activeTab === 'induction' && plan && (
                <SmartInductionView
                  plan={plan}
                  fleet={fleet}
                  onRunOptimizer={handleRunOptimizer}
                  onSelectTrain={(t) => setSelectedTrain(t)}
                />
              )}

              {activeTab === 'maintenance' && (
                <MaintenanceHubView
                  fleet={fleet}
                  inspections={inspections}
                  onUpdateInspection={handleUpdateInspection}
                  onUpdateCleaning={handleUpdateCleaning}
                  onAddJobCard={handleAddJobCard}
                  onResolveJobCard={handleResolveJobCard}
                  onSelectTrain={(t) => setSelectedTrain(t)}
                />
              )}

              {activeTab === 'operations' && (
                <OperationsHubView
                  fleet={fleet}
                  crew={crew}
                  platforms={platforms}
                  notifications={notifications}
                  onToggleCrewStatus={handleToggleCrewStatus}
                  onAssignPlatform={handleAssignPlatform}
                  onSendNotification={handleSendNotification}
                />
              )}

              {activeTab === 'livemap' && (
                <LiveMetroMapView
                  fleet={fleet}
                  onSelectTrain={(t) => setSelectedTrain(t)}
                  dateStationsStatus={dateStationsStatus}
                  onToggleStationStatusDate={handleToggleStationStatusDate}
                />
              )}

              {activeTab === 'fleet' && (
                <FleetView
                  fleet={fleet}
                  onSelectTrain={(t) => setSelectedTrain(t)}
                  onAddRake={handleAddRake}
                  onUpdateRake={handleUpdateRake}
                />
              )}

              {activeTab === 'depot' && (
                <DepotMapView
                  fleet={fleet}
                  bays={depotBays}
                  onSelectTrain={(t) => setSelectedTrain(t)}
                />
              )}

              {activeTab === 'alerts' && (
                <AlertCenterView
                  alerts={alerts}
                  fleet={fleet}
                  onSelectTrain={(t) => setSelectedTrain(t)}
                  onCreateAlert={handleCreateAlert}
                />
              )}

              {activeTab === 'report' && (
                <ShiftReportView
                  plan={plan}
                  fleet={fleet}
                />
              )}
            </WindowFrame>
          )}

        </main>
      </div>

      {/* Floating Cyber Command Dock */}
      <CommandDock
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenChatbot={handleOpenChatbot}
        isCopilotOpen={isCopilotOpen}
        criticalAlertCount={criticalAlertCount}
      />



      {/* Train Detail Inspector Modal */}
      <TrainDetailModal
        train={selectedTrain}
        onClose={() => setSelectedTrain(null)}
        onApplyOverride={handleApplyOverride}
        onAskAI={handleAskAI}
      />

      {/* KMRL Floating AI Chatbot Popup (Accessible across all views in same window) */}
      <AICopilotBox
        plan={plan}
        fleet={fleet}
        alerts={alerts}
        stationsStatus={dateStationsStatus[new Date().toISOString().split('T')[0]] || {}}
        isOpen={isCopilotOpen}
        onOpen={() => setIsCopilotOpen(true)}
        onClose={() => setIsCopilotOpen(false)}
      />

    </div>
  );
}

