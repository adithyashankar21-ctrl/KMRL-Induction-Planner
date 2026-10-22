import { CrewMember, PlatformAssignment, InspectionChecklist, NotificationLog } from '../types';

export const INITIAL_CREW: CrewMember[] = [
  { id: 'LP-101', name: 'Ragesh Varma', role: 'Loco Pilot', status: 'On-Duty', shiftSlot: 'Morning (06:00 - 14:00)', assignedTrainId: 'TS-01', phone: '+91 98470 11223', hoursWorkedToday: 4.5 },
  { id: 'LP-102', name: 'Anish Kurien', role: 'Loco Pilot', status: 'On-Duty', shiftSlot: 'Morning (06:00 - 14:00)', assignedTrainId: 'TS-02', phone: '+91 98470 22334', hoursWorkedToday: 5.0 },
  { id: 'LP-103', name: 'Deepak Menon', role: 'Loco Pilot', status: 'On-Duty', shiftSlot: 'Morning (06:00 - 14:00)', assignedTrainId: 'TS-05', phone: '+91 98470 33445', hoursWorkedToday: 3.8 },
  { id: 'LP-104', name: 'Sidharth S', role: 'Loco Pilot', status: 'Standby', shiftSlot: 'Morning (06:00 - 14:00)', assignedTrainId: 'TS-10', phone: '+91 98470 44556', hoursWorkedToday: 2.0 },
  { id: 'LP-105', name: 'Karthik N', role: 'Loco Pilot', status: 'On-Duty', shiftSlot: 'Evening (14:00 - 22:00)', assignedTrainId: 'TS-08', phone: '+91 98470 55667', hoursWorkedToday: 0.0 },
  { id: 'SM-201', name: 'Biju Joseph', role: 'Station Master', status: 'On-Duty', shiftSlot: 'Morning (06:00 - 14:00)', assignedStation: 'Aluva (SN-01)', phone: '+91 98471 66778', hoursWorkedToday: 6.0 },
  { id: 'SM-202', name: 'Firoz Khan', role: 'Station Master', status: 'On-Duty', shiftSlot: 'Morning (06:00 - 14:00)', assignedStation: 'Muttom (SN-05)', phone: '+91 98471 77889', hoursWorkedToday: 6.2 },
  { id: 'SM-203', name: 'Lekshmi Nair', role: 'Station Master', status: 'On-Duty', shiftSlot: 'Morning (06:00 - 14:00)', assignedStation: 'Thrippunithura (SN-25)', phone: '+91 98471 88990', hoursWorkedToday: 5.5 },
  { id: 'MT-301', name: 'Rajesh Kumar (Sr. Tech)', role: 'Maintenance Tech', status: 'On-Duty', shiftSlot: 'Night (22:00 - 06:00)', assignedTrainId: 'TS-07', phone: '+91 98472 99001', hoursWorkedToday: 7.0 },
  { id: 'MT-302', name: 'Sujith Nair', role: 'Maintenance Tech', status: 'On-Duty', shiftSlot: 'Night (22:00 - 06:00)', assignedTrainId: 'TS-14', phone: '+91 98472 00112', hoursWorkedToday: 6.8 },
  { id: 'OCC-401', name: 'Chief Controller Thomas', role: 'OCC Supervisor', status: 'On-Duty', shiftSlot: 'Morning (06:00 - 14:00)', phone: '+91 98473 11223', hoursWorkedToday: 6.5 },
];

export const INITIAL_PLATFORMS: PlatformAssignment[] = [
  { platformId: 'PL-ALV-1', stationName: 'Aluva (Terminal)', platformName: 'Platform 1 (North Main)', assignedTrainId: 'TS-01', assignedTrainName: 'TS-01 (Periyar)', status: 'Occupied', scheduledDeparture: '06:00 IST' },
  { platformId: 'PL-ALV-2', stationName: 'Aluva (Terminal)', platformName: 'Platform 2 (South Main)', assignedTrainId: 'TS-02', assignedTrainName: 'TS-02 (Pamba)', status: 'Occupied', scheduledDeparture: '06:08 IST' },
  { platformId: 'PL-MTM-1', stationName: 'Muttom Depot Siding', platformName: 'Siding Line 1 (Exit A)', assignedTrainId: 'TS-05', assignedTrainName: 'TS-05 (Nila)', status: 'Occupied', scheduledDeparture: '06:16 IST' },
  { platformId: 'PL-MTM-2', stationName: 'Muttom Depot Siding', platformName: 'Siding Line 2 (Hot Standby)', assignedTrainId: 'TS-10', assignedTrainName: 'TS-10 (Chaliyar)', status: 'Reserved', scheduledDeparture: 'Standby Ready' },
  { platformId: 'PL-MG-1', stationName: 'MG Road (SN-12)', platformName: 'Platform 1 (Down Line)', assignedTrainId: 'TS-08', assignedTrainName: 'TS-08 (Muvattupuzha)', status: 'Occupied', scheduledDeparture: '06:24 IST' },
  { platformId: 'PL-TPN-1', stationName: 'Thrippunithura (Terminal)', platformName: 'Platform 1 (Terminal Dock)', assignedTrainId: 'TS-06', assignedTrainName: 'TS-06 (Vembanad)', status: 'Occupied', scheduledDeparture: '06:32 IST' },
  { platformId: 'PL-TPN-2', stationName: 'Thrippunithura (Terminal)', platformName: 'Platform 2 (Turnback Siding)', assignedTrainId: undefined, status: 'Available' },
  { platformId: 'PL-JL-1', stationName: 'JLN Stadium (SN-10)', platformName: 'Platform 2 (Up Line)', assignedTrainId: undefined, status: 'Available' },
];

export function generateInitialInspections(fleetIds: string[]): Record<string, InspectionChecklist> {
  const result: Record<string, InspectionChecklist> = {};
  fleetIds.forEach((id, idx) => {
    const isFailed = id === 'TS-04' || id === 'TS-07' || id === 'TS-14' || id === 'TS-15';
    result[id] = {
      trainId: id,
      brakeCheck: !isFailed || id === 'TS-04',
      doorSensorCheck: !isFailed || id === 'TS-15',
      pantographCheck: true,
      cbtcTest: id !== 'TS-04',
      hvacCheck: true,
      status: isFailed ? 'FAILED' : 'PASSED',
      verifiedAt: 'Today, 21:00 IST',
      verifiedBy: isFailed ? 'Gokul V (Inspector)' : 'Sujith Nair (Quality Inspector)',
    };
  });
  return result;
}

export const INITIAL_NOTIFICATIONS: NotificationLog[] = [
  { id: 'NT-101', recipientRole: 'OCC Supervisor', recipientName: 'Chief Controller Thomas', channel: 'OCC Radio', title: 'Induction Plan Approved', message: '25-trainset induction schedule published for tomorrow morning service (16 Revenue, 3 Standby, 6 Maintenance).', sentAt: 'Today 21:45 IST', status: 'DELIVERED' },
  { id: 'NT-102', recipientRole: 'Depot Manager', recipientName: 'Er. Sreejith', channel: 'Email', title: 'Shunting Execution Plan', message: 'Line 1 maintenance isolation complete. TS-04, TS-07, TS-14, TS-15 positioned on heavy overhaul track.', sentAt: 'Today 21:30 IST', status: 'DELIVERED' },
  { id: 'NT-103', recipientRole: 'Loco Pilots', recipientName: 'Morning Duty Shift (16 Pilots)', channel: 'WhatsApp', title: 'Rake Roster Assignment', message: 'Rake roster dispatched. Duty pilots report to Aluva and Muttom exit sidings by 05:30 AM.', sentAt: 'Today 21:15 IST', status: 'DELIVERED' },
  { id: 'NT-104', recipientRole: 'Maintenance Lead', recipientName: 'Rajesh Kumar (Sr. Tech)', channel: 'SMS', title: 'Critical Job Card Work Order', message: 'Work Order JC-1071 assigned for TS-07 Traction Motor Inverter repair.', sentAt: 'Today 20:50 IST', status: 'DELIVERED' },
];
