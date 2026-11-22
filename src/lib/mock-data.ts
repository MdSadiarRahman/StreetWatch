import { Role, ReportStatus, WorkflowStepStatus } from "@prisma/client";

export interface MockDepartment {
  id: string;
  name: string;
  slaHours: number;
  isActive: boolean;
}

export interface MockCategory {
  id: string;
  name: string;
  slug: string;
  departmentId: string;
  baseRiskWeight: number;
  department?: MockDepartment;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
  workerCapacity: number;
  activeTaskCount: number;
  trustScore: number;
}

export interface MockReport {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  address: string;
  wardZone: string;
  categoryId: string;
  reporterId: string;
  status: ReportStatus;
  severityScore: number;
  priorityScore: number;
  verificationCount: number;
  flagCount: number;
  isDuplicate: boolean;
  beforeProofUrl: string | null;
  afterProofUrl: string | null;
  createdAt: string;
  updatedAt: string;
  category: MockCategory;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  aiAnalysis?: {
    detectedCategory: string;
    confidenceScore: number;
    severityReasoning: string;
    recommendedDepartment: string;
    priorityBreakdown?: Record<string, unknown>;
  };
  assignments?: Array<{
    id: string;
    workerId: string;
    assignedAt: string;
    completedAt: string | null;
    worker: {
      id: string;
      name: string;
      email: string;
      department?: { name: string };
    };
  }>;
}

// In-Memory Departments
export const MOCK_DEPARTMENTS: MockDepartment[] = [
  { id: "dept-roads", name: "Roads & Highways", slaHours: 48, isActive: true },
  { id: "dept-elec", name: "Electrical & Lighting", slaHours: 12, isActive: true },
  { id: "dept-water", name: "Water & Drainage", slaHours: 24, isActive: true },
  { id: "dept-waste", name: "Waste & Sanitation", slaHours: 24, isActive: true },
];

// In-Memory Categories
export const MOCK_CATEGORIES: MockCategory[] = [
  {
    id: "cat-wire",
    name: "Exposed Live Wire",
    slug: "exposed-live-wire",
    departmentId: "dept-elec",
    baseRiskWeight: 1.5,
    department: MOCK_DEPARTMENTS[1],
  },
  {
    id: "cat-manhole",
    name: "Open Manhole",
    slug: "open-manhole",
    departmentId: "dept-water",
    baseRiskWeight: 1.5,
    department: MOCK_DEPARTMENTS[2],
  },
  {
    id: "cat-pothole",
    name: "Deep Pothole",
    slug: "deep-pothole",
    departmentId: "dept-roads",
    baseRiskWeight: 1.2,
    department: MOCK_DEPARTMENTS[0],
  },
  {
    id: "cat-waterlogging",
    name: "Severe Waterlogging",
    slug: "severe-waterlogging",
    departmentId: "dept-water",
    baseRiskWeight: 1.3,
    department: MOCK_DEPARTMENTS[2],
  },
  {
    id: "cat-streetlight",
    name: "Broken Streetlight",
    slug: "broken-streetlight",
    departmentId: "dept-elec",
    baseRiskWeight: 1.0,
    department: MOCK_DEPARTMENTS[1],
  },
  {
    id: "cat-waste",
    name: "Garbage Overflow",
    slug: "garbage-overflow",
    departmentId: "dept-waste",
    baseRiskWeight: 1.1,
    department: MOCK_DEPARTMENTS[3],
  },
];

// In-Memory Demo Users
export const MOCK_USERS: MockUser[] = [
  {
    id: "usr-citizen-1",
    name: "Tanvir Ahmed",
    email: "citizen1@streetwatch.demo",
    role: Role.CITIZEN,
    departmentId: null,
    workerCapacity: 0,
    activeTaskCount: 0,
    trustScore: 1.5,
  },
  {
    id: "usr-citizen-2",
    name: "Tanvir Ahmed",
    email: "citizen@streetwatch.demo",
    role: Role.CITIZEN,
    departmentId: null,
    workerCapacity: 0,
    activeTaskCount: 0,
    trustScore: 1.5,
  },
  {
    id: "usr-authority-1",
    name: "Engr. Farhana Yasmin",
    email: "authority@streetwatch.demo",
    role: Role.AUTHORITY,
    departmentId: null,
    workerCapacity: 0,
    activeTaskCount: 0,
    trustScore: 2.0,
  },
  {
    id: "usr-authority-2",
    name: "Engr. Farhana Yasmin",
    email: "admin@streetwatch.demo",
    role: Role.AUTHORITY,
    departmentId: null,
    workerCapacity: 0,
    activeTaskCount: 0,
    trustScore: 2.0,
  },
  {
    id: "usr-worker-1",
    name: "Rafiqul Islam (Electrical Lead)",
    email: "worker1@streetwatch.demo",
    role: Role.FIELD_WORKER,
    departmentId: "dept-elec",
    workerCapacity: 3,
    activeTaskCount: 3, // At 100% capacity for A02 saturation demo!
    trustScore: 1.8,
  },
  {
    id: "usr-worker-2",
    name: "Kamal Hossain (Roads Specialist)",
    email: "worker2@streetwatch.demo",
    role: Role.FIELD_WORKER,
    departmentId: "dept-roads",
    workerCapacity: 3,
    activeTaskCount: 1,
    trustScore: 1.6,
  },
];

// In-Memory Seed Reports
export const MOCK_REPORTS: MockReport[] = [
  {
    id: "rep-001",
    title: "Exposed Live Wire Near Primary School",
    description: "Downed high-voltage cable sparking dangerously across the wet pedestrian walkway right in front of the elementary school gate.",
    imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    latitude: 23.7812,
    longitude: 90.3814,
    address: "Road 12, Mirpur Sector 10 (Opposite St. Peter School)",
    wardZone: "Ward 4",
    categoryId: "cat-wire",
    reporterId: "usr-citizen-1",
    status: ReportStatus.ASSIGNED,
    severityScore: 95.0,
    priorityScore: 94.2,
    verificationCount: 18,
    flagCount: 0,
    isDuplicate: false,
    beforeProofUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    afterProofUrl: null,
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    category: MOCK_CATEGORIES[0],
    reporter: { id: "usr-citizen-1", name: "Tanvir Ahmed", email: "citizen1@streetwatch.demo" },
    aiAnalysis: {
      detectedCategory: "Electrical Hazard",
      confidenceScore: 0.98,
      severityReasoning: "Critical exposed live wire situated in high-foot-traffic school zone during wet conditions.",
      recommendedDepartment: "Electrical & Lighting",
      priorityBreakdown: {
        severityWeight: 40.0,
        locationRiskWeight: 25.0,
        communityConsensusWeight: 18.2,
        slaDecayWeight: 11.0,
      },
    },
    assignments: [
      {
        id: "asgn-001",
        workerId: "usr-worker-1",
        assignedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        completedAt: null,
        worker: {
          id: "usr-worker-1",
          name: "Rafiqul Islam (Electrical Lead)",
          email: "worker1@streetwatch.demo",
          department: { name: "Electrical & Lighting" },
        },
      },
    ],
  },
  {
    id: "rep-002",
    title: "Uncovered Deep Drainage Manhole",
    description: "Concrete manhole slab missing entirely on central avenue. Open 8-foot drop posing severe life hazard for motorbikes and pedestrians.",
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    latitude: 23.7935,
    longitude: 90.4042,
    address: "Banani 11, Block C, Crossing Avenue",
    wardZone: "Ward 19",
    categoryId: "cat-manhole",
    reporterId: "usr-citizen-1",
    status: ReportStatus.AI_TRIAGED,
    severityScore: 92.0,
    priorityScore: 91.5,
    verificationCount: 14,
    flagCount: 0,
    isDuplicate: false,
    beforeProofUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    afterProofUrl: null,
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    category: MOCK_CATEGORIES[1],
    reporter: { id: "usr-citizen-1", name: "Tanvir Ahmed", email: "citizen1@streetwatch.demo" },
    aiAnalysis: {
      detectedCategory: "Open Manhole",
      confidenceScore: 0.96,
      severityReasoning: "Fatal hazard on busy commercial thoroughfare without warning barriers.",
      recommendedDepartment: "Water & Drainage",
    },
  },
  {
    id: "rep-003",
    title: "Severe Road Crater & Pothole Cluster",
    description: "Multiple connected deep potholes spanning 15 meters. Caused minor vehicle axle damage and heavy traffic bottlenecks during rush hours.",
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    latitude: 23.7511,
    longitude: 90.3922,
    address: "Panthapath Main Road near Square Hospital",
    wardZone: "Ward 16",
    categoryId: "cat-pothole",
    reporterId: "usr-citizen-1",
    status: ReportStatus.IN_PROGRESS,
    severityScore: 78.0,
    priorityScore: 82.0,
    verificationCount: 22,
    flagCount: 1,
    isDuplicate: false,
    beforeProofUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    afterProofUrl: null,
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    category: MOCK_CATEGORIES[2],
    reporter: { id: "usr-citizen-1", name: "Tanvir Ahmed", email: "citizen1@streetwatch.demo" },
    assignments: [
      {
        id: "asgn-002",
        workerId: "usr-worker-1",
        assignedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        completedAt: null,
        worker: {
          id: "usr-worker-1",
          name: "Rafiqul Islam (Electrical Lead)",
          email: "worker1@streetwatch.demo",
          department: { name: "Electrical & Lighting" },
        },
      },
    ],
  },
  {
    id: "rep-004",
    title: "Damaged Transformer Sparking Intermittently",
    description: "Pole-mounted transformer leaking fluid and sparking every 5 minutes during light rain.",
    imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    latitude: 23.7745,
    longitude: 90.3654,
    address: "Kallayanpur Bus Stand, Ward 11",
    wardZone: "Ward 11",
    categoryId: "cat-wire",
    reporterId: "usr-citizen-1",
    status: ReportStatus.ASSIGNED,
    severityScore: 88.0,
    priorityScore: 89.0,
    verificationCount: 9,
    flagCount: 0,
    isDuplicate: false,
    beforeProofUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    afterProofUrl: null,
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    category: MOCK_CATEGORIES[0],
    reporter: { id: "usr-citizen-1", name: "Tanvir Ahmed", email: "citizen1@streetwatch.demo" },
    assignments: [
      {
        id: "asgn-003",
        workerId: "usr-worker-1",
        assignedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        completedAt: null,
        worker: {
          id: "usr-worker-1",
          name: "Rafiqul Islam (Electrical Lead)",
          email: "worker1@streetwatch.demo",
          department: { name: "Electrical & Lighting" },
        },
      },
    ],
  },
  {
    id: "rep-005",
    title: "Overflowing Garbage Dump Blocking Alleyway",
    description: "Uncollected municipal waste blocking fire lane access for 4 days.",
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80",
    latitude: 23.7421,
    longitude: 90.3812,
    address: "Dhanmondi 8/A, Lakeview Alley",
    wardZone: "Ward 15",
    categoryId: "cat-waste",
    reporterId: "usr-citizen-1",
    status: ReportStatus.RESOLVED,
    severityScore: 65.0,
    priorityScore: 71.0,
    verificationCount: 16,
    flagCount: 0,
    isDuplicate: false,
    beforeProofUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80",
    afterProofUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    category: MOCK_CATEGORIES[5],
    reporter: { id: "usr-citizen-1", name: "Tanvir Ahmed", email: "citizen1@streetwatch.demo" },
  },
];
