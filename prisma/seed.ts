import { PrismaClient, Role, ReportStatus, WorkflowStepStatus, VoteType } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting StreetWatch database seeding...");

  // 1. Clean existing records (in reverse dependency order)
  await prisma.auditLog.deleteMany({});
  await prisma.workflowStepLog.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.verification.deleteMany({});
  await prisma.aIAnalysis.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  console.log("🧹 Cleaned existing tables.");

  // 2. Seed Departments
  const deptRoads = await prisma.department.create({
    data: {
      name: "Roads & Highways",
      slaHours: 48,
      isActive: true,
    },
  });

  const deptElectric = await prisma.department.create({
    data: {
      name: "Electrical & Lighting",
      slaHours: 12,
      isActive: true,
    },
  });

  const deptWater = await prisma.department.create({
    data: {
      name: "Water & Drainage",
      slaHours: 24,
      isActive: true,
    },
  });

  const deptWaste = await prisma.department.create({
    data: {
      name: "Waste & Sanitation",
      slaHours: 24,
      isActive: true,
    },
  });

  console.log("🏢 Seeded 4 Departments.");

  // 3. Seed Categories
  const catManhole = await prisma.category.create({
    data: {
      name: "Open Manhole",
      slug: "open-manhole",
      departmentId: deptWater.id,
      baseRiskWeight: 1.5,
    },
  });

  const catWire = await prisma.category.create({
    data: {
      name: "Exposed Live Wire",
      slug: "exposed-live-wire",
      departmentId: deptElectric.id,
      baseRiskWeight: 1.5,
    },
  });

  const catPothole = await prisma.category.create({
    data: {
      name: "Deep Pothole",
      slug: "deep-pothole",
      departmentId: deptRoads.id,
      baseRiskWeight: 1.2,
    },
  });

  const catWaterlogging = await prisma.category.create({
    data: {
      name: "Severe Waterlogging",
      slug: "severe-waterlogging",
      departmentId: deptWater.id,
      baseRiskWeight: 1.3,
    },
  });

  const catStreetlight = await prisma.category.create({
    data: {
      name: "Broken Streetlight",
      slug: "broken-streetlight",
      departmentId: deptElectric.id,
      baseRiskWeight: 1.0,
    },
  });

  const catGarbage = await prisma.category.create({
    data: {
      name: "Garbage Overflow",
      slug: "garbage-overflow",
      departmentId: deptWaste.id,
      baseRiskWeight: 1.1,
    },
  });

  console.log("🏷️ Seeded 6 Categories.");

  // 4. Seed Demo Users
  const passwordHash = await bcrypt.hash("Demo@1234", 10);

  const citizen1 = await prisma.user.create({
    data: {
      name: "Tanvir Ahmed",
      email: "citizen@streetwatch.demo",
      passwordHash,
      role: Role.CITIZEN,
      phone: "+8801711000001",
      ward: "Ward 4",
      location: "Dhaka North",
      address: "Mirpur Sector 10, Road 12",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      trustScore: 1.5,
    },
  });

  const citizen2 = await prisma.user.create({
    data: {
      name: "Sarah Kabir",
      email: "sarah@streetwatch.demo",
      passwordHash,
      role: Role.CITIZEN,
      phone: "+8801711000002",
      ward: "Ward 15",
      location: "Dhaka South",
      address: "Dhanmondi Road 27",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      trustScore: 1.2,
    },
  });

  const authorityAdmin = await prisma.user.create({
    data: {
      name: "Engr. Farhana Yasmin",
      email: "admin@streetwatch.demo",
      passwordHash,
      role: Role.AUTHORITY,
      phone: "+8801711000099",
      ward: "DNCC HQ",
      location: "Dhaka Metropolitan",
      address: "Nagar Bhaban Command Desk",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      trustScore: 2.0,
    },
  });

  // Field Worker 1 (Electrical - Maxed out at 3/3 capacity for A02 testing!)
  const worker1 = await prisma.user.create({
    data: {
      name: "Rafiqul Islam (Electrical Lead)",
      email: "worker1@streetwatch.demo",
      passwordHash,
      role: Role.FIELD_WORKER,
      phone: "+8801711000101",
      ward: "Ward 4",
      location: "Dhaka North",
      address: "Mirpur Operations Depot",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      departmentId: deptElectric.id,
      workerCapacity: 3,
      activeTaskCount: 3, // At maximum capacity to demonstrate A02 conflict handling!
      trustScore: 1.8,
    },
  });

  // Field Worker 2 (Roads - 1 active task)
  const worker2 = await prisma.user.create({
    data: {
      name: "Kamal Hossain (Roads Specialist)",
      email: "worker2@streetwatch.demo",
      passwordHash,
      role: Role.FIELD_WORKER,
      phone: "+8801711000102",
      ward: "Ward 9",
      location: "Dhaka North",
      address: "Gulshan-Badda Maintenance Unit",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      departmentId: deptRoads.id,
      workerCapacity: 3,
      activeTaskCount: 1,
      trustScore: 1.6,
    },
  });

  // Field Worker 3 (Drainage - 0 active tasks)
  const worker3 = await prisma.user.create({
    data: {
      name: "Arif Chowdhury (Drainage Crew)",
      email: "worker3@streetwatch.demo",
      passwordHash,
      role: Role.FIELD_WORKER,
      phone: "+8801711000103",
      ward: "Ward 15",
      location: "Dhaka South",
      address: "Dhanmondi Drainage Sub-Station",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      departmentId: deptWater.id,
      workerCapacity: 3,
      activeTaskCount: 0,
      trustScore: 1.4,
    },
  });

  console.log("👥 Seeded 6 Demo Users across Citizen, Authority, and Field Worker roles.");

  // 5. Seed 6 Realistic Reports Across Workflow Lifecycle

  // Report 1: Exposed Live Wire (Status: ASSIGNED, Critical 94/100)
  const report1 = await prisma.report.create({
    data: {
      title: "Exposed Live Wire Near Primary School",
      description: "Downed high-voltage cable sparking dangerously across the wet pedestrian walkway right in front of the elementary school gate.",
      imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
      latitude: 23.7812,
      longitude: 90.3814,
      address: "Road 12, Mirpur Sector 10 (Opposite St. Peter School)",
      wardZone: "Ward 4",
      categoryId: catWire.id,
      reporterId: citizen1.id,
      status: ReportStatus.ASSIGNED,
      severityScore: 95.0,
      priorityScore: 94.2,
      verificationCount: 18,
      flagCount: 0,
      isDuplicate: false,
      beforeProofUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    },
  });

  await prisma.aIAnalysis.create({
    data: {
      reportId: report1.id,
      detectedCategory: "Electrical Hazard",
      confidenceScore: 0.98,
      severityReasoning: "Critical exposed live wire situated in high-foot-traffic school zone during wet conditions.",
      priorityBreakdown: {
        severityWeight: 40.0,
        locationRiskWeight: 25.0,
        communityConsensusWeight: 18.2,
        slaDecayWeight: 11.0,
        capacityPenalty: 0.0,
        formula: "Score = 40.0 + 25.0 + 18.2 + 11.0 = 94.2 (Critical)",
      },
      recommendedDepartment: "Electrical & Lighting",
      optimizationNote: "Assigned to Rafiqul Islam. Note: Electrical department is now at 100% capacity.",
    },
  });

  await prisma.verification.create({
    data: {
      reportId: report1.id,
      userId: citizen2.id,
      voteType: VoteType.CONFIRM,
      comment: "Confirmed in person, sparks visible on pavement. Children passing nearby.",
    },
  });

  await prisma.assignment.create({
    data: {
      reportId: report1.id,
      workerId: worker1.id,
      assignedById: authorityAdmin.id,
      isAutoAssigned: true,
      overrideReason: null,
    },
  });

  // Workflow steps for Report 1
  await prisma.workflowStepLog.createMany({
    data: [
      { reportId: report1.id, stepName: "STEP_1_INGEST", status: WorkflowStepStatus.SUCCESS, attemptCount: 1 },
      { reportId: report1.id, stepName: "STEP_2_AI_TRIAGE", status: WorkflowStepStatus.SUCCESS, attemptCount: 1 },
      { reportId: report1.id, stepName: "STEP_3_COMMUNITY_GATE", status: WorkflowStepStatus.SUCCESS, attemptCount: 1 },
      { reportId: report1.id, stepName: "STEP_4_PRIORITY_OPTIMIZE", status: WorkflowStepStatus.SUCCESS, attemptCount: 1 },
      { reportId: report1.id, stepName: "STEP_5_DISPATCH", status: WorkflowStepStatus.SUCCESS, attemptCount: 1 },
    ],
  });

  // Report 2: Deep Pothole (Status: IN_PROGRESS, Score 82/100)
  const report2 = await prisma.report.create({
    data: {
      title: "Severe Road Cave-In and Crater on Main Arterial",
      description: "Deep pothole spanning approximately 1.5 meters causing sudden vehicle braking and two motorcycle skid incidents.",
      imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
      latitude: 23.7925,
      longitude: 90.4078,
      address: "Gulshan-Badda Link Road, Ward 9",
      wardZone: "Ward 9",
      categoryId: catPothole.id,
      reporterId: citizen2.id,
      status: ReportStatus.IN_PROGRESS,
      severityScore: 80.0,
      priorityScore: 82.5,
      verificationCount: 9,
      beforeProofUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    },
  });

  await prisma.aIAnalysis.create({
    data: {
      reportId: report2.id,
      detectedCategory: "Road Void / Crater",
      confidenceScore: 0.94,
      severityReasoning: "Severe vehicular hazard on high-speed dual carriageway.",
      priorityBreakdown: {
        severityWeight: 35.0,
        locationRiskWeight: 22.0,
        communityConsensusWeight: 12.5,
        slaDecayWeight: 13.0,
        formula: "Score = 35.0 + 22.0 + 12.5 + 13.0 = 82.5",
      },
      recommendedDepartment: "Roads & Highways",
    },
  });

  await prisma.assignment.create({
    data: {
      reportId: report2.id,
      workerId: worker2.id,
      assignedById: authorityAdmin.id,
      isAutoAssigned: true,
    },
  });

  await prisma.workflowStepLog.createMany({
    data: [
      { reportId: report2.id, stepName: "STEP_1_INGEST", status: WorkflowStepStatus.SUCCESS },
      { reportId: report2.id, stepName: "STEP_2_AI_TRIAGE", status: WorkflowStepStatus.SUCCESS },
      { reportId: report2.id, stepName: "STEP_3_COMMUNITY_GATE", status: WorkflowStepStatus.SUCCESS },
      { reportId: report2.id, stepName: "STEP_4_PRIORITY_OPTIMIZE", status: WorkflowStepStatus.SUCCESS },
      { reportId: report2.id, stepName: "STEP_5_DISPATCH", status: WorkflowStepStatus.SUCCESS },
      { reportId: report2.id, stepName: "STEP_6_FIELD_RESOLVE", status: WorkflowStepStatus.RETRIED, attemptCount: 2 },
    ],
  });

  // Report 3: Resolved & Citizen Verified (Status: CITIZEN_VERIFIED)
  const report3 = await prisma.report.create({
    data: {
      title: "Hazardous Open Manhole Cover Replaced",
      description: "Missing circular sewer manhole cover replaced with heavy-duty reinforced iron lid.",
      imageUrl: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
      latitude: 23.7461,
      longitude: 90.3742,
      address: "Dhanmondi Road 27, Ward 15",
      wardZone: "Ward 15",
      categoryId: catManhole.id,
      reporterId: citizen1.id,
      status: ReportStatus.CITIZEN_VERIFIED,
      severityScore: 90.0,
      priorityScore: 89.0,
      verificationCount: 22,
      beforeProofUrl: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
      afterProofUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    },
  });

  await prisma.aIAnalysis.create({
    data: {
      reportId: report3.id,
      detectedCategory: "Open Manhole",
      confidenceScore: 0.99,
      severityReasoning: "Fatal pedestrian fall hazard.",
      priorityBreakdown: {
        severityWeight: 40.0,
        locationRiskWeight: 20.0,
        communityConsensusWeight: 19.0,
        slaDecayWeight: 10.0,
        formula: "Resolved (Final Sign-off completed)",
      },
      recommendedDepartment: "Water & Drainage",
    },
  });

  await prisma.assignment.create({
    data: {
      reportId: report3.id,
      workerId: worker3.id,
      assignedById: authorityAdmin.id,
      isAutoAssigned: true,
      completedAt: new Date(),
    },
  });

  // Report 4: Freshly Reported (Status: REPORTED)
  await prisma.report.create({
    data: {
      title: "Broken Streetlight Dark Spot Near Transit Stop",
      description: "Two consecutive sodium street lamps completely non-functional creating a dangerous dark alleyway.",
      imageUrl: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
      latitude: 23.7508,
      longitude: 90.3934,
      address: "Farmgate Metro Exit 2, Ward 26",
      wardZone: "Ward 26",
      categoryId: catStreetlight.id,
      reporterId: citizen2.id,
      status: ReportStatus.REPORTED,
      severityScore: 45.0,
      priorityScore: 48.0,
      verificationCount: 2,
    },
  });

  // Report 5: Community Verified (Status: COMMUNITY_VERIFIED)
  await prisma.report.create({
    data: {
      title: "Flooded Storm Drain Causing Street Waterlogging",
      description: "Blocked drainage catch-basin causing knee-deep stagnant runoff after moderate rain.",
      imageUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80",
      latitude: 23.8223,
      longitude: 90.3654,
      address: "Pallabi Main Road, Ward 2",
      wardZone: "Ward 2",
      categoryId: catWaterlogging.id,
      reporterId: citizen1.id,
      status: ReportStatus.COMMUNITY_VERIFIED,
      severityScore: 68.0,
      priorityScore: 71.5,
      verificationCount: 11,
    },
  });

  // Report 6: Garbage Dump Overflow (Status: PRIORITY_SCORED)
  await prisma.report.create({
    data: {
      title: "Overflowing Commercial Dumpster Spilling into Street",
      description: "Uncollected municipal refuse blocking half of secondary road and emitting pungent fumes.",
      imageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
      latitude: 23.7745,
      longitude: 90.3621,
      address: "Mohammadpur Town Hall Market, Ward 31",
      wardZone: "Ward 31",
      categoryId: catGarbage.id,
      reporterId: citizen2.id,
      status: ReportStatus.PRIORITY_SCORED,
      severityScore: 55.0,
      priorityScore: 62.0,
      verificationCount: 7,
    },
  });

  console.log("📝 Seeded 6 realistic civic reports across diverse statuses with AI analyses.");

  // 6. Seed Audit Logs
  await prisma.auditLog.create({
    data: {
      actorId: authorityAdmin.id,
      action: "SYSTEM_INITIALIZE_SEED",
      entityType: "System",
      entityId: "seed-run",
      metadata: {
        environment: "development",
        seedVersion: "1.0.0",
        message: "Demo seed completed successfully for Hack the Vibe 2026.",
      },
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
