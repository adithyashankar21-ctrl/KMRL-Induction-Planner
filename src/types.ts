export type TrainStatus = 'IN_SERVICE' | 'STANDBY' | 'MAINTENANCE';

export type CertificateType = 'rolling_stock' | 'signalling' | 'telecom';

export interface FitnessCertificate {
  type: CertificateType;
  name: string;
  expiryDate: string; // YYYY-MM-DD
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean; // <= 5 days
}

export interface JobCard {
  id: string;
  title: string;
  category: 'Mechanical' | 'Electrical' | 'Signalling' | 'HVAC' | 'Brake' | 'Telecom' | 'Interior';
  severity: 'minor' | 'major' | 'critical';
  loggedDate: string;
  estimatedHours: number;
  assignedTechnician?: string;
  description: string;
}

export interface DepotBay {
  bayId: number;
  bayName: string; // e.g. "Stabling Line 3 - Spot B"
  zone: 'Stabling' | 'Inspection' | 'Heavy Overhaul' | 'Wash Plant' | 'Pit Line';
  shuntingCost: number; // 1 to 10 (1 = exit adjacent, 10 = deep blocked)
  isBlockedByBay?: number[]; // bay IDs that must be cleared first
}

export interface Trainset {
  id: string;
  name: string; // e.g. "TS-01 (Periyar)"
  rakeNumber: number; // 1 - 25
  carCount: number; // 3
  mileageTotal: number; // km
  mileageSinceService: number; // km since last IBL/major service
  certificates: {
    rollingStock: FitnessCertificate;
    signalling: FitnessCertificate;
    telecom: FitnessCertificate;
  };
  jobCards: JobCard[];
  cleaningStatus: 'done' | 'pending' | 'overdue';
  lastCleanedDate: string;
  bay: DepotBay;
  currentStatus: TrainStatus;
  manualOverride?: {
    overriddenBy: string;
    reason: string;
    timestamp: string;
    forcedStatus: TrainStatus;
  };
}

export interface PlanDecision {
  trainId: string;
  trainName: string;
  recommendedStatus: TrainStatus;
  confidenceScore: number; // 0 - 100%
  reasonSummary: string;
  detailedReasons: {
    certificates: string;
    jobCards: string;
    mileage: string;
    shunting: string;
    cleaning: string;
  };
  hardConstraintViolations: string[];
  softPenaltyScore: number;
  shuntingSequenceNumber: number;
}

export interface InductionPlan {
  id: string;
  generatedAt: string;
  plannerName: string;
  targetCounts: {
    inService: number; // target: 16
    standby: number;   // target: 3
    maintenance: number; // target: 6
  };
  actualCounts: {
    inService: number;
    standby: number;
    maintenance: number;
  };
  decisions: PlanDecision[];
  metrics: {
    constraintSatisfactionRate: number; // e.g. 100%
    averageMileageVariance: number;
    totalShuntingCost: number;
    solverTimeMs: number;
  };
}

export interface ConstraintConfig {
  mileageWeight: number;    // 1 - 10
  shuntingWeight: number;   // 1 - 10
  cleaningCapacity: number; // e.g. 6 trains/night
  targetInService: number;  // 16
  targetStandby: number;    // 3
  targetMaintenance: number;// 6
}

export interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  trainId?: string;
  title: string;
  message: string;
  timestamp: string;
  category: 'Certificate' | 'Maintenance' | 'Cleaning' | 'Shunting';
}

export type ActiveTab = 'dashboard' | 'induction' | 'maintenance' | 'operations' | 'livemap' | 'fleet' | 'depot' | 'alerts' | 'report';

export type UserRole = 'planner' | 'supervisor' | 'viewer';

export interface CrewMember {
  id: string;
  name: string;
  role: 'Loco Pilot' | 'Station Master' | 'Maintenance Tech' | 'OCC Supervisor';
  status: 'On-Duty' | 'Standby' | 'Off-Duty';
  shiftSlot: 'Morning (06:00 - 14:00)' | 'Evening (14:00 - 22:00)' | 'Night (22:00 - 06:00)';
  assignedTrainId?: string;
  assignedStation?: string;
  phone: string;
  hoursWorkedToday: number;
}

export interface PlatformAssignment {
  platformId: string;
  stationName: string;
  platformName: string;
  assignedTrainId?: string;
  assignedTrainName?: string;
  status: 'Occupied' | 'Available' | 'Reserved';
  scheduledDeparture?: string;
}

export interface InspectionChecklist {
  trainId: string;
  brakeCheck: boolean;
  doorSensorCheck: boolean;
  pantographCheck: boolean;
  cbtcTest: boolean;
  hvacCheck: boolean;
  status: 'PASSED' | 'FAILED' | 'PENDING';
  verifiedAt: string;
  verifiedBy: string;
}

export interface NotificationLog {
  id: string;
  recipientRole: string;
  recipientName: string;
  channel: 'WhatsApp' | 'Email' | 'SMS' | 'OCC Radio';
  title: string;
  message: string;
  sentAt: string;
  status: 'DELIVERED' | 'SENT' | 'PENDING';
}
