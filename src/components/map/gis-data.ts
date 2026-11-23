/**
 * Dhaka Metropolitan Municipal GIS Operational Data
 * Corridors, municipal crews, ward facilities, and incident density hotspot zones.
 */

export interface RoadCorridor {
  id: string;
  name: string;
  type: "arterial" | "expressway" | "connector";
  coordinates: [number, number][];
}

export interface MunicipalCrewLocation {
  id: string;
  name: string;
  department: string;
  status: "dispatched" | "on_site" | "available";
  activeTask?: string;
  coordinates: [number, number];
}

export interface PublicFacility {
  id: string;
  name: string;
  type: "ward_hq" | "fire_station" | "hospital" | "police";
  ward: string;
  coordinates: [number, number];
}

export interface HotspotDensityZone {
  id: string;
  name: string;
  riskLevel: "CRITICAL" | "HIGH" | "ELEVATED";
  incidentCount: number;
  radiusMeters: number;
  center: [number, number];
}

// 1. Major Dhaka Transit Corridors (Arterial Roads)
export const DHAKA_ROAD_CORRIDORS: RoadCorridor[] = [
  {
    id: "road-mirpur",
    name: "Mirpur Arterial Road (Sector 10 - Science Lab)",
    type: "arterial",
    coordinates: [
      [23.8055, 90.3685],
      [23.7802, 90.3712],
      [23.7540, 90.3790],
      [23.7385, 90.3830],
      [23.7180, 90.3860],
    ],
  },
  {
    id: "road-rokeya",
    name: "Begum Rokeya Sarani (Mirpur 10 - Farmgate)",
    type: "arterial",
    coordinates: [
      [23.8062, 90.3680],
      [23.7890, 90.3750],
      [23.7680, 90.3840],
      [23.7570, 90.3900],
    ],
  },
  {
    id: "road-pragati",
    name: "Pragati Sarani Corridor (Kuril - Rampura)",
    type: "arterial",
    coordinates: [
      [23.8220, 90.4210],
      [23.7980, 90.4260],
      [23.7750, 90.4240],
      [23.7600, 90.4180],
    ],
  },
  {
    id: "road-nazrul",
    name: "Kazi Nazrul Islam Ave (Shahbagh - Mohakhali)",
    type: "arterial",
    coordinates: [
      [23.7370, 90.3950],
      [23.7550, 90.3920],
      [23.7780, 90.4020],
    ],
  },
];

// 2. Active Municipal Crews in Field
export const DHAKA_MUNICIPAL_CREWS: MunicipalCrewLocation[] = [
  {
    id: "crew-01",
    name: "Public Works Crew Alpha",
    department: "Road Maintenance Dept",
    status: "on_site",
    activeTask: "Deep Crater Pothole Remediation",
    coordinates: [23.7845, 90.3748],
  },
  {
    id: "crew-02",
    name: "Drainage Rapid Response Delta",
    department: "Water & Sewerage Authority",
    status: "dispatched",
    activeTask: "Open Manhole Vault Clearing",
    coordinates: [23.7482, 90.3715],
  },
  {
    id: "crew-03",
    name: "Grid Utility Team Charlie",
    department: "Power Distribution Grid",
    status: "available",
    coordinates: [23.7935, 90.4060],
  },
  {
    id: "crew-04",
    name: "Waste & Sanitation Unit 07",
    department: "Waste Management Dept",
    status: "on_site",
    activeTask: "Illegal Dump Clearance",
    coordinates: [23.8020, 90.3620],
  },
];

// 3. Public Facilities & Municipal Emergency HQs
export const DHAKA_PUBLIC_FACILITIES: PublicFacility[] = [
  {
    id: "fac-ward-04",
    name: "Zone 4 Municipal Operations Center",
    type: "ward_hq",
    ward: "Ward 4",
    coordinates: [23.8070, 90.3695],
  },
  {
    id: "fac-ward-15",
    name: "Zone 15 Civic Services HQ",
    type: "ward_hq",
    ward: "Ward 15",
    coordinates: [23.7455, 90.3760],
  },
  {
    id: "fac-ward-09",
    name: "Zone 9 City Administration Center",
    type: "ward_hq",
    ward: "Ward 9",
    coordinates: [23.7915, 90.4160],
  },
  {
    id: "fac-fire-central",
    name: "Fire Service & Civil Defence Central HQ",
    type: "fire_station",
    ward: "Ward 26",
    coordinates: [23.7540, 90.3955],
  },
  {
    id: "fac-hospital-kurmitola",
    name: "Kurmitola Emergency Medical Center",
    type: "hospital",
    ward: "Ward 1",
    coordinates: [23.8270, 90.4110],
  },
];

// 4. Hotspot Density Buffers (Spatial Hazard Concentrations)
export const DHAKA_HOTSPOT_ZONES: HotspotDensityZone[] = [
  {
    id: "hotspot-mirpur10",
    name: "Mirpur 10 Inter-Ward Transit Node",
    riskLevel: "CRITICAL",
    incidentCount: 8,
    radiusMeters: 450,
    center: [23.8068, 90.3685],
  },
  {
    id: "hotspot-dhanmondi",
    name: "Dhanmondi Lake Drainage Basin",
    riskLevel: "HIGH",
    incidentCount: 5,
    radiusMeters: 380,
    center: [23.7465, 90.3745],
  },
  {
    id: "hotspot-badda",
    name: "Gulshan-Badda Connector Corridor",
    riskLevel: "CRITICAL",
    incidentCount: 6,
    radiusMeters: 420,
    center: [23.7830, 90.4220],
  },
  {
    id: "hotspot-farmgate",
    name: "Farmgate Pedestrian Interchange",
    riskLevel: "ELEVATED",
    incidentCount: 4,
    radiusMeters: 300,
    center: [23.7580, 90.3890],
  },
];
