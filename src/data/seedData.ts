import { Trainset, DepotBay, JobCard, AlertItem } from '../types';

export const INITIAL_DEPOT_BAYS: DepotBay[] = [
  { bayId: 1, bayName: "Stabling Line 1 (Spot A)", zone: "Stabling", shuntingCost: 1, isBlockedByBay: [] },
  { bayId: 2, bayName: "Stabling Line 1 (Spot B)", zone: "Stabling", shuntingCost: 2, isBlockedByBay: [1] },
  { bayId: 3, bayName: "Stabling Line 2 (Spot A)", zone: "Stabling", shuntingCost: 1, isBlockedByBay: [] },
  { bayId: 4, bayName: "Stabling Line 2 (Spot B)", zone: "Stabling", shuntingCost: 3, isBlockedByBay: [3] },
  { bayId: 5, bayName: "Stabling Line 3 (Spot A)", zone: "Stabling", shuntingCost: 2, isBlockedByBay: [] },
  { bayId: 6, bayName: "Stabling Line 3 (Spot B)", zone: "Stabling", shuntingCost: 4, isBlockedByBay: [5] },
  { bayId: 7, bayName: "Stabling Line 4 (Spot A)", zone: "Stabling", shuntingCost: 2, isBlockedByBay: [] },
  { bayId: 8, bayName: "Stabling Line 4 (Spot B)", zone: "Stabling", shuntingCost: 5, isBlockedByBay: [7] },
  { bayId: 9, bayName: "Stabling Line 5 (Spot A)", zone: "Stabling", shuntingCost: 3, isBlockedByBay: [] },
  { bayId: 10, bayName: "Stabling Line 5 (Spot B)", zone: "Stabling", shuntingCost: 6, isBlockedByBay: [9] },
  { bayId: 11, bayName: "Inspection Bay 6", zone: "Inspection", shuntingCost: 4, isBlockedByBay: [] },
  { bayId: 12, bayName: "Inspection Bay 7", zone: "Inspection", shuntingCost: 4, isBlockedByBay: [] },
  { bayId: 13, bayName: "Inspection Bay 8", zone: "Inspection", shuntingCost: 5, isBlockedByBay: [] },
  { bayId: 14, bayName: "Heavy Overhaul Bay 9", zone: "Heavy Overhaul", shuntingCost: 8, isBlockedByBay: [] },
  { bayId: 15, bayName: "Heavy Overhaul Bay 10", zone: "Heavy Overhaul", shuntingCost: 9, isBlockedByBay: [] },
  { bayId: 16, bayName: "Wash Plant Line 11", zone: "Wash Plant", shuntingCost: 3, isBlockedByBay: [] },
  { bayId: 17, bayName: "Pit Line 12", zone: "Pit Line", shuntingCost: 7, isBlockedByBay: [] },
  { bayId: 18, bayName: "Pit Line 13", zone: "Pit Line", shuntingCost: 7, isBlockedByBay: [] },
  { bayId: 19, bayName: "Pit Line 14", zone: "Pit Line", shuntingCost: 8, isBlockedByBay: [] },
  { bayId: 20, bayName: "Stabling Line 15 (Exit North)", zone: "Stabling", shuntingCost: 1, isBlockedByBay: [] },
  { bayId: 21, bayName: "Stabling Line 15 (Spot B)", zone: "Stabling", shuntingCost: 3, isBlockedByBay: [20] },
  { bayId: 22, bayName: "Stabling Line 16 (Spot A)", zone: "Stabling", shuntingCost: 2, isBlockedByBay: [] },
  { bayId: 23, bayName: "Stabling Line 16 (Spot B)", zone: "Stabling", shuntingCost: 4, isBlockedByBay: [22] },
  { bayId: 24, bayName: "Stabling Line 17 (Spot A)", zone: "Stabling", shuntingCost: 2, isBlockedByBay: [] },
  { bayId: 25, bayName: "Stabling Line 17 (Spot B)", zone: "Stabling", shuntingCost: 5, isBlockedByBay: [24] },
];

const TRAIN_NAMES = [
  "TS-01 (Periyar)", "TS-02 (Pamba)", "TS-03 (Kabini)", "TS-04 (Chalakudy)",
  "TS-05 (Nila)", "TS-06 (Vembanad)", "TS-07 (Bhavani)", "TS-08 (Muvattupuzha)",
  "TS-09 (Meenachil)", "TS-10 (Chaliyar)", "TS-11 (Achenkoil)", "TS-12 (Kallada)",
  "TS-13 (Valapattanam)", "TS-14 (Irikkur)", "TS-15 (Chandragiri)", "TS-16 (Kadalundi)",
  "TS-17 (Karamana)", "TS-18 (Neyyar)", "TS-19 (Mayyazhi)", "TS-20 (Mogral)",
  "TS-21 (Vamanapuram)", "TS-22 (Chittari)", "TS-23 (Manimala)", "TS-24 (Kariyangode)",
  "TS-25 (Shiriyur)"
];

export function generateSeedFleet(): Trainset[] {
  // Fixed reference date: 2026-08-05
  return TRAIN_NAMES.map((name, idx) => {
    const rakeNumber = idx + 1;
    const trainId = `TS-${rakeNumber < 10 ? '0' + rakeNumber : rakeNumber}`;
    const bay = INITIAL_DEPOT_BAYS[idx];

    // Seed mileage realistically
    const mileageTotal = Math.floor(60000 + (idx * 5432) + (idx % 3 * 12000));
    const mileageSinceService = Math.floor(1200 + (idx * 340) % 7500);

    // Seed certificate expiries (in days from 2026-08-05)
    // Make TS-04 have an expired signalling cert, TS-09 expiring soon, TS-15 expired rolling stock cert
    let rsDays = 30 + (idx * 7) % 120;
    let sigDays = 25 + (idx * 11) % 90;
    let telDays = 40 + (idx * 5) % 150;

    if (rakeNumber === 4) sigDays = -1; // EXPIRED
    if (rakeNumber === 15) rsDays = 0;   // EXPIRED
    if (rakeNumber === 9) sigDays = 2;   // EXPIRING SOON
    if (rakeNumber === 18) telDays = 4;  // EXPIRING SOON

    const formatDate = (days: number) => {
      const d = new Date('2026-08-05');
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    // Seed Job Cards
    const jobCards: JobCard[] = [];
    if (rakeNumber === 7) {
      jobCards.push({
        id: "JC-1071",
        title: "Traction Motor Inverter Fault",
        category: "Electrical",
        severity: "critical",
        loggedDate: "2026-08-04",
        estimatedHours: 8,
        assignedTechnician: "Rajesh Kumar (Sr. Tech)",
        description: "Phase U IGBT overcurrent trigger logged during stabling move."
      });
    }
    if (rakeNumber === 14) {
      jobCards.push({
        id: "JC-1088",
        title: "Air Brake Compressor Pressure Drop",
        category: "Brake",
        severity: "critical",
        loggedDate: "2026-08-05",
        estimatedHours: 6,
        assignedTechnician: "Sujith Nair",
        description: "Auxiliary reservoir pressure leaking below 6.5 bar cutoff."
      });
    }
    if (rakeNumber === 3) {
      jobCards.push({
        id: "JC-1055",
        title: "HVAC Saloon Temperature Sensor Drift",
        category: "HVAC",
        severity: "minor",
        loggedDate: "2026-08-03",
        estimatedHours: 2,
        assignedTechnician: "Anand M",
        description: "Car 2 temp reading 3°C warmer than target setpoint."
      });
    }
    if (rakeNumber === 11) {
      jobCards.push({
        id: "JC-1062",
        title: "Passenger Saloon Door 4 Re-open Sensor",
        category: "Mechanical",
        severity: "major",
        loggedDate: "2026-08-04",
        estimatedHours: 4,
        assignedTechnician: "Gokul V",
        description: "Obstacle detection light barrier sensitive to dust."
      });
    }

    // Seed cleaning status
    let cleaningStatus: 'done' | 'pending' | 'overdue' = 'done';
    if (idx % 4 === 1) cleaningStatus = 'pending';
    if (idx % 6 === 2) cleaningStatus = 'overdue';

    // Initial Status baseline
    let currentStatus: 'IN_SERVICE' | 'STANDBY' | 'MAINTENANCE' = 'IN_SERVICE';
    if (rakeNumber === 4 || rakeNumber === 7 || rakeNumber === 14 || rakeNumber === 15) {
      currentStatus = 'MAINTENANCE';
    } else if (idx % 5 === 0) {
      currentStatus = 'STANDBY';
    }

    return {
      id: trainId,
      name,
      rakeNumber,
      carCount: 3,
      mileageTotal,
      mileageSinceService,
      certificates: {
        rollingStock: {
          type: 'rolling_stock',
          name: 'Rolling Stock Safety Cert',
          expiryDate: formatDate(rsDays),
          daysRemaining: rsDays,
          isExpired: rsDays <= 0,
          isExpiringSoon: rsDays > 0 && rsDays <= 5,
        },
        signalling: {
          type: 'signalling',
          name: 'CBTC Signalling Cert',
          expiryDate: formatDate(sigDays),
          daysRemaining: sigDays,
          isExpired: sigDays <= 0,
          isExpiringSoon: sigDays > 0 && sigDays <= 5,
        },
        telecom: {
          type: 'telecom',
          name: 'TETRA Telecom & PIDS Cert',
          expiryDate: formatDate(telDays),
          daysRemaining: telDays,
          isExpired: telDays <= 0,
          isExpiringSoon: telDays > 0 && telDays <= 5,
        },
      },
      jobCards,
      cleaningStatus,
      lastCleanedDate: formatDate(-1 * (idx % 4)),
      bay,
      currentStatus,
    };
  });
}

export function generateInitialAlerts(fleet: Trainset[]): AlertItem[] {
  const alerts: AlertItem[] = [];

  fleet.forEach(train => {
    // Check certs
    if (train.certificates.rollingStock.isExpired) {
      alerts.push({
        id: `ALT-RS-${train.id}`,
        severity: 'critical',
        trainId: train.id,
        title: `RS Cert Expired - ${train.name}`,
        message: `Rolling Stock Certificate expired on ${train.certificates.rollingStock.expiryDate}. Prohibited from service.`,
        timestamp: 'Today, 21:30 IST',
        category: 'Certificate'
      });
    } else if (train.certificates.rollingStock.isExpiringSoon) {
      alerts.push({
        id: `ALT-RS-SOON-${train.id}`,
        severity: 'warning',
        trainId: train.id,
        title: `RS Cert Expiring Soon (${train.certificates.rollingStock.daysRemaining}d) - ${train.name}`,
        message: `RS Cert expires on ${train.certificates.rollingStock.expiryDate}. Schedule inspection line renewal.`,
        timestamp: 'Today, 20:15 IST',
        category: 'Certificate'
      });
    }

    if (train.certificates.signalling.isExpired) {
      alerts.push({
        id: `ALT-SIG-${train.id}`,
        severity: 'critical',
        trainId: train.id,
        title: `Signalling Cert Expired - ${train.name}`,
        message: `CBTC Signalling Cert expired on ${train.certificates.signalling.expiryDate}. Cannot enter main line.`,
        timestamp: 'Today, 21:00 IST',
        category: 'Certificate'
      });
    }

    // Check critical job cards
    const critCard = train.jobCards.find(j => j.severity === 'critical');
    if (critCard) {
      alerts.push({
        id: `ALT-JC-${train.id}`,
        severity: 'critical',
        trainId: train.id,
        title: `Critical Work Order (${critCard.title}) - ${train.name}`,
        message: `${critCard.description} Technician assigned: ${critCard.assignedTechnician || 'Unassigned'}.`,
        timestamp: 'Today, 19:45 IST',
        category: 'Maintenance'
      });
    }

    // Check overdue cleaning
    if (train.cleaningStatus === 'overdue') {
      alerts.push({
        id: `ALT-CLN-${train.id}`,
        severity: 'info',
        trainId: train.id,
        title: `Overdue Washing Cycle - ${train.name}`,
        message: `Rake due for automatic wash plant exterior & saloon deep sanitization.`,
        timestamp: 'Today, 17:00 IST',
        category: 'Cleaning'
      });
    }
  });

  return alerts;
}
