/**
 * Comprehensive Portal & Flow Verification Script
 * Tests every single portal, role, and API endpoint end-to-end.
 */

async function testAllPortals() {
  const BASE_URL = "http://localhost:3000";
  console.log("===============================================================");
  console.log("🌐 TESTING ALL STREETWATCH PORTALS & API ENDPOINTS (E2E)");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  async function check(name: string, fn: () => Promise<boolean>) {
    try {
      const ok = await fn();
      if (ok) {
        console.log(`✅ [PASS] ${name}`);
        passed++;
      } else {
        console.log(`❌ [FAIL] ${name}`);
        failed++;
      }
    } catch (err: any) {
      console.log(`❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Categories
  await check("Portal 1: Public Map - Fetch Categories (/api/categories)", async () => {
    const res = await fetch(`${BASE_URL}/api/categories`);
    const json = await res.json();
    return res.status === 200 && json.success === true && json.data.categories.length > 0;
  });

  // 2. Reports
  await check("Portal 1: Public Map - Fetch Reports (/api/reports)", async () => {
    const res = await fetch(`${BASE_URL}/api/reports?limit=10`);
    const json = await res.json();
    return res.status === 200 && json.success === true && json.data.items.length > 0;
  });

  // 3. Report Details
  await check("Portal 1: Public Map - Report Details (/api/reports/rep-001)", async () => {
    const res = await fetch(`${BASE_URL}/api/reports/rep-001`);
    const json = await res.json();
    return res.status === 200 && json.success === true && json.data.report.id === "rep-001";
  });

  // 4. Duplicate Check
  await check("Portal 2: Citizen - Geospatial Duplicate Check (/api/reports/check-duplicate)", async () => {
    const res = await fetch(`${BASE_URL}/api/reports/check-duplicate?lat=23.7812&lng=90.3814`);
    const json = await res.json();
    return res.status === 200 && json.success === true;
  });

  // 5. Citizen Login
  let citizenCookie = "";
  await check("Portal 2: Citizen - 1-Click Demo Login (/api/auth/login)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "citizen1@streetwatch.demo", password: "P@ssw0rd2026!" }),
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) citizenCookie = setCookie.split(";")[0];
    const json = await res.json();
    return res.status === 200 && json.success === true && json.data.user.role === "CITIZEN";
  });

  // 6. Citizen Report Submission
  await check("Portal 2: Citizen - Issue Submission (/api/reports POST)", async () => {
    const res = await fetch(`${BASE_URL}/api/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: citizenCookie,
      },
      body: JSON.stringify({
        title: "Test Road Defect",
        description: "Dangerous open hole on secondary street near community center.",
        latitude: 23.7812,
        longitude: 90.3814,
        address: "Mirpur 10, Dhaka",
        wardZone: "Ward 4",
        categoryId: "cat-pothole",
      }),
    });
    const json = await res.json();
    return res.status === 201 && json.success === true;
  });

  // 7. Authority Login
  let authorityCookie = "";
  await check("Portal 3: Authority - 1-Click Demo Login (/api/auth/login)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "authority@streetwatch.demo", password: "P@ssw0rd2026!" }),
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) authorityCookie = setCookie.split(";")[0];
    const json = await res.json();
    return res.status === 200 && json.success === true && json.data.user.role === "AUTHORITY";
  });

  // 8. Authority Analytics
  await check("Portal 3: Authority - Bento Grid KPIs (/api/analytics/summary)", async () => {
    const res = await fetch(`${BASE_URL}/api/analytics/summary`, {
      headers: { Cookie: authorityCookie },
    });
    const json = await res.json();
    return res.status === 200 && json.success === true && json.data.totalReports > 0;
  });

  // 9. Authority A02 Optimize & Assign
  await check("Portal 3: Authority - A02 Saturation Conflict Detection (/api/admin/optimize-assign)", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/optimize-assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authorityCookie,
      },
      body: JSON.stringify({
        reportId: "rep-001",
        resolutionStrategy: "STRICT",
      }),
    });
    const json = await res.json();
    return res.status === 200 && json.success === true && (json.data.conflictDetected === true || json.data.assigned === true);
  });

  // 10. A07 Simulate Failure
  await check("Portal 3: Authority - A07 Mid-Workflow Failure Simulation (/api/workflow/rep-001/simulate-failure)", async () => {
    const res = await fetch(`${BASE_URL}/api/workflow/rep-001/simulate-failure`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authorityCookie,
      },
      body: JSON.stringify({
        stepName: "MATERIALS_STAGED",
        reason: "Hydraulic boom lift failed safety check",
      }),
    });
    const json = await res.json();
    return res.status === 200 && json.success === true && json.data.reportStatus === "NEEDS_REVISION";
  });

  // 11. A07 Self-Recovery
  await check("Portal 3: Authority - A07 Autonomous Recovery & +10 Priority (/api/workflow/rep-001/recover)", async () => {
    const res = await fetch(`${BASE_URL}/api/workflow/rep-001/recover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authorityCookie,
      },
    });
    const json = await res.json();
    return res.status === 200 && json.success === true && json.data.escalationPointsAdded === 10;
  });

  // 12. Worker Login
  let workerCookie = "";
  await check("Portal 4: Field Worker - 1-Click Demo Login (/api/auth/login)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "worker1@streetwatch.demo", password: "P@ssw0rd2026!" }),
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) workerCookie = setCookie.split(";")[0];
    const json = await res.json();
    return res.status === 200 && json.success === true && json.data.user.role === "FIELD_WORKER";
  });

  // 13. Worker Tasks
  await check("Portal 4: Field Worker - Mobile Terminal Tasks (/api/worker/tasks)", async () => {
    const res = await fetch(`${BASE_URL}/api/worker/tasks`, {
      headers: { Cookie: workerCookie },
    });
    const json = await res.json();
    return res.status === 200 && json.success === true && json.data.tasks.length > 0;
  });

  // 14. Worker Task Status Update
  await check("Portal 4: Field Worker - Status Transition to RESOLVED (/api/worker/tasks/rep-001/status)", async () => {
    const res = await fetch(`${BASE_URL}/api/worker/tasks/rep-001/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: workerCookie,
      },
      body: JSON.stringify({
        status: "RESOLVED",
        afterProofUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
        notes: "Power cables repaired and insulated with safety conduits.",
      }),
    });
    const json = await res.json();
    return res.status === 200 && json.success === true && json.data.status === "RESOLVED";
  });

  // 15. Citizen Sign-off
  await check("Portal 5: Citizen Final Sign-off - Approve Resolution (/api/reports/rep-001/signoff)", async () => {
    const res = await fetch(`${BASE_URL}/api/reports/rep-001/signoff`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: citizenCookie,
      },
      body: JSON.stringify({
        approved: true,
        satisfactionRating: 5,
        feedback: "Excellent rapid repair by the electrical team!",
      }),
    });
    const json = await res.json();
    return res.status === 200 && json.success === true;
  });

  console.log("\n===============================================================");
  console.log(`📊 PORTAL TEST SUMMARY: ${passed}/${passed + failed} PASSED (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("===============================================================");
}

testAllPortals();
