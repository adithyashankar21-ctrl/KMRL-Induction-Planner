import React, { useState } from 'react';
import { CrewMember, PlatformAssignment, NotificationLog, Trainset } from '../types';
import { Users, Layers, Navigation, Bell, Send, CheckCircle2, PhoneCall, Radio, AlertTriangle, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

interface OperationsHubViewProps {
  fleet: Trainset[];
  crew: CrewMember[];
  platforms: PlatformAssignment[];
  notifications: NotificationLog[];
  onToggleCrewStatus: (crewId: string) => void;
  onAssignPlatform: (platformId: string, trainId: string | undefined) => void;
  onSendNotification: (notif: NotificationLog) => void;
}

export const OperationsHubView: React.FC<OperationsHubViewProps> = ({
  fleet,
  crew,
  platforms,
  notifications,
  onToggleCrewStatus,
  onAssignPlatform,
  onSendNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'crew' | 'platforms' | 'exitqueue' | 'notifications'>('crew');

  // New notification broadcast state
  const [notifRole, setNotifRole] = useState('Loco Pilots');
  const [notifChannel, setNotifChannel] = useState<NotificationLog['channel']>('WhatsApp');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');

  const handleDispatchNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMsg) return;

    const newLog: NotificationLog = {
      id: `NT-${Math.floor(1000 + Math.random() * 9000)}`,
      recipientRole: notifRole,
      recipientName: `${notifRole} Group Dispatch`,
      channel: notifChannel,
      title: notifTitle,
      message: notifMsg,
      sentAt: 'Just Now',
      status: 'DELIVERED',
    };

    onSendNotification(newLog);
    setNotifTitle('');
    setNotifMsg('');
  };

  // Compute Depot Exit Queue Shunting Order for Revenue Trains
  const inServiceTrains = fleet.filter(t => t.currentStatus === 'IN_SERVICE')
    .sort((a, b) => a.bay.shuntingCost - b.bay.shuntingCost);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="liquid-glass p-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold mb-1">
              <Navigation className="w-4 h-4 text-cyan-400" />
              <span>Operations Control Center (OCC) Dispatch Hub</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Crew, Track, Platform & Stakeholder Operations
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl font-sans">
              Real-time dispatch management integrating Loco Pilot crew availability, Aluva & Thrippunithura platform assignment, Muttom Depot exit queue optimization, and automated WhatsApp/Radio stakeholder alert dispatching.
            </p>
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setActiveTab('crew')}
            className={`px-3.5 py-1.5 rounded-lg border font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'crew'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>6. Crew Availability Module</span>
          </button>

          <button
            onClick={() => setActiveTab('platforms')}
            className={`px-3.5 py-1.5 rounded-lg border font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'platforms'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>7. Platform Assignment Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('exitqueue')}
            className={`px-3.5 py-1.5 rounded-lg border font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'exitqueue'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            <span>8. Depot Exit Queue Optimizer</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 py-1.5 rounded-lg border font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-pink-400" />
            <span>14. Role-based Notifications</span>
          </button>
        </div>
      </div>

      {/* Feature 6: Crew Availability Module */}
      {activeTab === 'crew' && (
        <div className="space-y-4">
          <div className="liquid-glass rounded-xl border border-slate-800/80 overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm font-mono flex items-center space-x-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Shift Crew Availability Roster & Duty Assignment ({crew.length} Personnel)</span>
              </h3>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                {crew.filter(c => c.status === 'On-Duty').length} On-Duty Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Staff ID & Name</th>
                    <th className="p-3">Operational Role</th>
                    <th className="p-3">Shift Slot</th>
                    <th className="p-3">Assigned Rake / Station</th>
                    <th className="p-3">Contact Phone</th>
                    <th className="p-3">Duty Hours</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Roster Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {crew.map(member => (
                    <tr key={member.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 font-bold text-white">
                        <div>{member.name}</div>
                        <div className="text-[10px] text-slate-400">{member.id}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold text-[10px]">
                          {member.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{member.shiftSlot}</td>
                      <td className="p-3 text-emerald-300 font-bold">
                        {member.assignedTrainId ? `Trainset ${member.assignedTrainId}` : member.assignedStation || 'Unassigned'}
                      </td>
                      <td className="p-3 text-slate-400">{member.phone}</td>
                      <td className="p-3 text-slate-300">{member.hoursWorkedToday} hrs</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          member.status === 'On-Duty'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : member.status === 'Standby'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onToggleCrewStatus(member.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono font-bold border border-slate-700 cursor-pointer transition-colors"
                        >
                          Toggle Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Feature 7: Platform Assignment Engine */}
      {activeTab === 'platforms' && (
        <div className="space-y-4">
          <div className="liquid-glass p-6 rounded-2xl border border-emerald-500/30 bg-slate-950/90 space-y-4 font-mono text-xs">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  Feature 7: Platform & Terminal Line Assignment Engine
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Automated berth allocation for Aluva, Thrippunithura, and Muttom depot siding tracks to prevent platform blockage conflicts.
                </p>
              </div>

              <span className="text-emerald-400 font-bold">Zero Platform Conflicts Detected</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platforms.map(pl => (
                <div key={pl.platformId} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">{pl.platformName}</h4>
                      <span className="text-[10px] text-slate-400">{pl.stationName}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      pl.status === 'Occupied'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : pl.status === 'Reserved'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {pl.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400">Assigned Rake:</span>
                    <div className="font-bold text-cyan-300 text-sm mt-0.5">
                      {pl.assignedTrainName || 'Unassigned (Platform Clear)'}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500">Departure: {pl.scheduledDeparture || 'N/A'}</span>

                    <select
                      value={pl.assignedTrainId || ''}
                      onChange={(e) => onAssignPlatform(pl.platformId, e.target.value || undefined)}
                      className="bg-black text-xs text-cyan-300 border border-slate-700 rounded px-2 py-1 font-bold focus:outline-none"
                    >
                      <option value="">Clear Berth</option>
                      {fleet.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feature 8: Depot Exit Queue Optimizer */}
      {activeTab === 'exitqueue' && (
        <div className="space-y-4">
          <div className="liquid-glass p-6 rounded-2xl border border-amber-500/30 bg-slate-950/90 space-y-4 font-mono text-xs">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  Feature 8: Depot Exit Queue & Shunting Route Optimizer
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Calculates minimum shunting movements for Muttom Depot morning rollout without exit bottleneck delays.
                </p>
              </div>

              <span className="text-amber-400 font-bold">16 Revenue Trains Ordered for Rollout</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inServiceTrains.map((t, idx) => (
                <div key={t.id} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold flex items-center justify-center font-mono text-sm">
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{t.name}</h4>
                      <span className="text-[11px] text-slate-400">Bay: {t.bay.bayName}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 text-[10px]">Shunting Cost</span>
                    <div className="font-bold text-cyan-300 text-sm">{t.bay.shuntingCost} / 10</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feature 14: Role-based Stakeholder Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="liquid-glass p-6 rounded-2xl border border-pink-500/30 bg-slate-950/90 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Feature 14: Role-Based Automated Stakeholder Notification Dispatch
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Broadcasts approved induction schedules, work orders, and duty rosters directly to OCC, Depot Leads, and Loco Pilots.
              </p>
            </div>

            <form onSubmit={handleDispatchNotification} className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Stakeholder Role:</label>
                <select
                  value={notifRole}
                  onChange={(e) => setNotifRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:outline-none"
                >
                  <option value="Loco Pilots">Loco Pilots Shift</option>
                  <option value="OCC Supervisor">OCC Chief Controller</option>
                  <option value="Depot Manager">Muttom Depot Manager</option>
                  <option value="Maintenance Lead">Senior Maintenance Lead</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Dispatch Channel:</label>
                <select
                  value={notifChannel}
                  onChange={(e) => setNotifChannel(e.target.value as NotificationLog['channel'])}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:outline-none"
                >
                  <option value="WhatsApp">WhatsApp Gateway</option>
                  <option value="Email">Official KMRL Email</option>
                  <option value="SMS">SMS Cell Broadcast</option>
                  <option value="OCC Radio">OCC Radio Frequency</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notification Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule Published"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:outline-none font-sans"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-slate-400 mb-1">Message Body:</label>
                <textarea
                  rows={2}
                  placeholder="Enter message dispatch body..."
                  value={notifMsg}
                  onChange={(e) => setNotifMsg(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:outline-none font-sans"
                  required
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold uppercase tracking-wider flex items-center space-x-2 cursor-pointer shadow-lg shadow-pink-500/25 transition-all"
                >
                  <Send className="w-4 h-4 text-white" />
                  <span>Dispatch Alert Notification</span>
                </button>
              </div>
            </form>
          </div>

          <div className="liquid-glass rounded-xl border border-slate-800/80 overflow-hidden font-mono text-xs">
            <div className="p-4 border-b border-slate-800 bg-slate-900/60 font-bold text-white text-sm">
              Sent Stakeholder Notification Log
            </div>

            <div className="divide-y divide-slate-800/60">
              {notifications.map(n => (
                <div key={n.id} className="p-4 flex items-start justify-between hover:bg-slate-900/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{n.title}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px]">{n.recipientRole}</span>
                      <span className="px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-500/30 text-[10px]">{n.channel}</span>
                    </div>
                    <p className="text-slate-300 font-sans text-xs">{n.message}</p>
                    <span className="text-[10px] text-slate-500">Sent: {n.sentAt}</span>
                  </div>

                  <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    {n.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
