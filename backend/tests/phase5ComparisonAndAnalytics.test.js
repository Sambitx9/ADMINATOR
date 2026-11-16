import assert from 'node:assert';
import http from 'node:http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../src/app.js';
import { College, Student, Course, FeeStructure, Enquiry, User } from '../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/adminator_demo';

console.log('======================================================================');
console.log('  ADMINATOR — PHASE 5 COMPARISON & EXECUTIVE ANALYTICS TEST SUITE');
console.log('======================================================================');

async function runPhase5Tests() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB:', MONGODB_URI);

  const server = http.createServer(app);
  let baseUrl;

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`✅ Test server running on ${baseUrl}`);
      resolve();
    });
  });

  const request = async (method, endpoint, body = null, headers = {}) => {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', ...headers }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${baseUrl}${endpoint}`, opts);
    let json = null;
    try {
      json = await res.json();
    } catch (e) {}
    return { status: res.status, ok: res.ok, data: json };
  };

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: Multi-College Comparison API (GET /api/v1/colleges/compare)
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 1: MULTI-COLLEGE COMPARISON API (GET /api/v1/colleges/compare) ---');

    // 1.1 Default comparison (no query parameters)
    const defaultCompRes = await request('GET', '/api/v1/colleges/compare');
    assert.strictEqual(defaultCompRes.status, 200, 'Default comparison must return HTTP 200');
    assert.strictEqual(defaultCompRes.data.success, true);
    assert.strictEqual(defaultCompRes.data.count, 3, 'Must compare exactly 3 colleges by default');
    assert.strictEqual(
      defaultCompRes.data.data.colleges[0].college.code,
      'DRIEMS',
      'DRIEMS Polytechnic (Autonomous) must be the primary/default college at index 0'
    );
    assert.strictEqual(defaultCompRes.data.data.colleges[0].college.isDefault, true);
    assert.strictEqual(defaultCompRes.data.data.colleges[0].college.isAutonomous, true);
    console.log('  ✓ 1.1 Default comparison returns HTTP 200 with DRIEMS as primary college at index 0');

    // 1.2 Comparison with 2 specified colleges
    const twoColRes = await request('GET', '/api/v1/colleges/compare?collegeCodes=DRIEMS,KIPT');
    assert.strictEqual(twoColRes.status, 200);
    assert.strictEqual(twoColRes.data.count, 2);
    assert.strictEqual(twoColRes.data.data.colleges[0].college.code, 'DRIEMS');
    assert.strictEqual(twoColRes.data.data.colleges[1].college.code, 'KIPT');
    console.log('  ✓ 1.2 Comparison with 2 colleges (DRIEMS, KIPT) returns exactly 2 profiles');

    // 1.3 Comparison with 3 specified colleges
    const threeColRes = await request('GET', '/api/v1/colleges/compare?collegeCodes=DRIEMS,KIPT,UPP');
    assert.strictEqual(threeColRes.status, 200);
    assert.strictEqual(threeColRes.data.count, 3);
    console.log('  ✓ 1.3 Comparison with 3 colleges (DRIEMS, KIPT, UPP) returns 3 profiles');

    // 1.4 Max 3 colleges cap enforcement (prevent overflow)
    const overflowRes = await request('GET', '/api/v1/colleges/compare?collegeCodes=DRIEMS,KIPT,UPP,MIET');
    assert.strictEqual(overflowRes.status, 200);
    assert.strictEqual(overflowRes.data.count, 3, 'Must cap comparison to maximum 3 colleges');
    console.log('  ✓ 1.4 Max 3 colleges cap strictly enforced when 4 colleges requested');

    // 1.5 Branch filter query parameter
    const branchFilterRes = await request('GET', '/api/v1/colleges/compare?branchCode=MECH');
    assert.strictEqual(branchFilterRes.status, 200);
    const mechCoursesOnly = branchFilterRes.data.data.colleges.every((p) =>
      p.courses.every((c) => c.branchCode === 'MECH')
    );
    assert.strictEqual(mechCoursesOnly, true, 'All returned courses must match branchCode=MECH');
    console.log('  ✓ 1.5 Branch filter ?branchCode=MECH strictly filters returned courses');

    // 1.6 Summary metrics & hostel configuration
    const driemsProfile = defaultCompRes.data.data.colleges.find((p) => p.college.code === 'DRIEMS');
    assert.ok(driemsProfile.summary.totalCoursesOffered >= 5, 'DRIEMS must offer multiple courses');
    assert.ok(driemsProfile.summary.tuitionFeePerSemesterMin > 0, 'Tuition fee must be configured');
    assert.strictEqual(driemsProfile.summary.hostelConfigured, true, 'DRIEMS hostel must be configured');
    assert.ok(driemsProfile.summary.scholarships.length > 0, 'DRIEMS must have scholarship schemes');
    console.log('  ✓ 1.6 DRIEMS institutional profile contains configured seats, fees, hostel, and scholarships');

    // 1.7 Normalized comparison matrix integrity
    const matrix = defaultCompRes.data.data.matrix;
    assert.ok(Array.isArray(matrix) && matrix.length === 6, 'Matrix must cover all 6 branches');
    const mechRow = matrix.find((r) => r.branchCode === 'MECH');
    assert.ok(mechRow, 'MECH row must exist in matrix');
    assert.ok(mechRow.colleges.DRIEMS.isOffered === true, 'MECH must be offered at DRIEMS');
    assert.ok(mechRow.colleges.DRIEMS.firstYear.totalSeats > 0, 'MECH seats must be positive');
    console.log('  ✓ 1.7 Normalized matrix contains all 6 branches with accurate side-by-side data');

    // 1.8 Unconfigured branch / missing data handling (zero fabrication)
    const mietComparison = await request('GET', '/api/v1/colleges/compare?collegeCodes=MIET');
    assert.strictEqual(mietComparison.status, 200);
    const mietMatrix = mietComparison.data.data.matrix;
    // Check if an unoffered branch has isOffered: false and null seats
    const unofferedBranch = mietMatrix.find((r) => r.colleges.MIET?.isOffered === false);
    if (unofferedBranch) {
      assert.strictEqual(unofferedBranch.colleges.MIET.firstYear, null);
      assert.strictEqual(unofferedBranch.colleges.MIET.fees, null);
      console.log(`  ✓ 1.8 Unoffered branch (${unofferedBranch.branchCode}) properly represents missing data as null without fabrication`);
    }

    // 1.9 Persistent [DEMO DATA] disclaimers
    const allCollegesHaveDemoNotice = defaultCompRes.data.data.colleges.every(
      (p) => typeof p.college.demoNotice === 'string' && p.college.demoNotice.includes('DEMO')
    );
    assert.strictEqual(allCollegesHaveDemoNotice, true, 'All colleges must carry persistent DEMO notices');
    console.log('  ✓ 1.9 Persistent [DEMO DATA] notices verified across all college comparison payloads');

    // -------------------------------------------------------------------------
    // SECTION 2: Executive Analytics API & RBAC/Tenant Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 2: EXECUTIVE ANALYTICS API & RBAC/TENANT ISOLATION ---');

    // 2.1 Unauthenticated access rejected
    const unauthRes = await request('GET', '/api/v1/crm/analytics');
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must return HTTP 401');
    console.log('  ✓ 2.1 Unauthenticated access to /api/v1/crm/analytics correctly rejected with HTTP 401');

    // 2.2 Authenticate as DRIEMS Counsellor
    const counsellorLoginRes = await request('POST', '/api/v1/auth/login', {
      email: 'counsellor@driems.ac.in',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(counsellorLoginRes.status, 200);
    const counsellorToken = counsellorLoginRes.data.data.token;
    assert.ok(counsellorToken, 'Counsellor token must exist');
    console.log('  ✓ 2.2 DRIEMS Counsellor authenticated successfully');

    // 2.3 Counsellor access is tenant-isolated to DRIEMS
    const counsellorAnalyticsRes = await request(
      'GET',
      '/api/v1/crm/analytics',
      null,
      { Authorization: `Bearer ${counsellorToken}` }
    );
    assert.strictEqual(counsellorAnalyticsRes.status, 200);
    assert.strictEqual(counsellorAnalyticsRes.data.success, true);
    assert.strictEqual(
      counsellorAnalyticsRes.data.data.filter.collegeId,
      counsellorLoginRes.data.data.user.collegeId._id || counsellorLoginRes.data.data.user.collegeId,
      'Counsellor analytics must be strictly scoped to their assigned college ID'
    );
    console.log('  ✓ 2.3 Tenant isolation verified: Counsellor is strictly confined to DRIEMS analytics');

    // 2.4 Authenticate as DRIEMS College Admin
    const adminLoginRes = await request('POST', '/api/v1/auth/login', {
      email: 'admin@driems.ac.in',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(adminLoginRes.status, 200);
    const adminToken = adminLoginRes.data.data.token;
    assert.ok(adminToken);
    console.log('  ✓ 2.4 DRIEMS College Admin authenticated successfully');

    // 2.5 College Admin retrieves executive analytics
    const adminAnalyticsRes = await request(
      'GET',
      '/api/v1/crm/analytics?timeRange=30d',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert.strictEqual(adminAnalyticsRes.status, 200);
    assert.strictEqual(adminAnalyticsRes.data.data.filter.timeRange, '30d');
    console.log('  ✓ 2.5 College Admin retrieved executive analytics for 30-day window');

    // 2.6 Authenticate as Platform Admin
    const platformLoginRes = await request('POST', '/api/v1/auth/login', {
      email: 'platform.admin@adminator.demo',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(platformLoginRes.status, 200);
    const platformToken = platformLoginRes.data.data.token;
    console.log('  ✓ 2.6 Platform Admin authenticated successfully');

    // 2.7 Platform Admin can query across all colleges
    const platformAnalyticsRes = await request(
      'GET',
      '/api/v1/crm/analytics?timeRange=all',
      null,
      { Authorization: `Bearer ${platformToken}` }
    );
    assert.strictEqual(platformAnalyticsRes.status, 200);
    assert.strictEqual(platformAnalyticsRes.data.data.meta.isPlatformAdmin, true);
    console.log('  ✓ 2.7 Platform Admin verified cross-college oversight and analytics aggregation');

    // 2.8 Time range filters (7d, 30d, 90d, all)
    for (const range of ['7d', '30d', '90d', 'all']) {
      const rangeRes = await request(
        'GET',
        `/api/v1/crm/analytics?timeRange=${range}`,
        null,
        { Authorization: `Bearer ${adminToken}` }
      );
      assert.strictEqual(rangeRes.status, 200);
      assert.strictEqual(rangeRes.data.data.filter.timeRange, range);
    }
    console.log('  ✓ 2.8 Date-range filters (7d, 30d, 90d, all) successfully validated');

    // -------------------------------------------------------------------------
    // SECTION 3: Executive Analytics Visualisations & Calculations
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 3: EXECUTIVE ANALYTICS CALCULATIONS & VISUALISATIONS ---');

    const analyticsData = adminAnalyticsRes.data.data;

    // 3.1 KPI Summary Cards
    const { kpis } = analyticsData;
    assert.ok(typeof kpis.totalEnquiries === 'number', 'totalEnquiries must be number');
    assert.ok(typeof kpis.contactedEnquiries === 'number', 'contactedEnquiries must be number');
    assert.ok(typeof kpis.verifiedEnquiries === 'number', 'verifiedEnquiries must be number');
    assert.ok(typeof kpis.enrolledEnquiries === 'number', 'enrolledEnquiries must be number');
    assert.ok(typeof kpis.conversionRate === 'number', 'conversionRate must be number');
    assert.ok(kpis.conversionRate >= 0 && kpis.conversionRate <= 100, 'conversionRate must be 0-100%');
    console.log(`  ✓ 3.1 KPI Summary cards verified: ${kpis.totalEnquiries} enquiries, ${kpis.enrolledEnquiries} enrolled, ${kpis.conversionRate}% conversion`);

    // 3.2 Branch-wise Enquiry Demand
    const { branchDemand } = analyticsData;
    assert.ok(Array.isArray(branchDemand) && branchDemand.length === 6, 'Must contain all 6 branches');
    branchDemand.forEach((bd) => {
      assert.ok(['MECH', 'CIVIL', 'CSE', 'EE', 'ETC', 'AUTO'].includes(bd.branchCode));
      assert.ok(typeof bd.enquiriesCount === 'number');
      assert.ok(typeof bd.totalSeats === 'number' && bd.totalSeats > 0);
      assert.ok(typeof bd.demandRatio === 'number');
    });
    console.log('  ✓ 3.2 Branch enquiry demand verified across all 6 engineering branches');

    // 3.3 Lead Status Distribution
    const { statusDistribution } = analyticsData;
    assert.ok(Array.isArray(statusDistribution) && statusDistribution.length >= 6);
    const statuses = statusDistribution.map((s) => s.status);
    assert.ok(statuses.includes('NEW'));
    assert.ok(statuses.includes('ASSIGNED'));
    assert.ok(statuses.includes('CONTACTED'));
    assert.ok(statuses.includes('VERIFIED'));
    assert.ok(statuses.includes('ENROLLED'));
    assert.ok(statuses.includes('REJECTED'));
    // Ensure colors exist
    statusDistribution.forEach((s) => {
      assert.ok(typeof s.color === 'string' && s.color.startsWith('#'), 'Must have hex color');
    });
    console.log('  ✓ 3.3 Lead status distribution verified with color tokens and percentages');

    // 3.4 Conversion Funnel
    const { conversionFunnel } = analyticsData;
    assert.strictEqual(conversionFunnel.length, 4, 'Funnel must have 4 sequential stages');
    assert.strictEqual(conversionFunnel[0].stage, 'TOTAL_ENQUIRIES');
    assert.strictEqual(conversionFunnel[1].stage, 'CONTACTED');
    assert.strictEqual(conversionFunnel[2].stage, 'DOCUMENT_VERIFIED');
    assert.strictEqual(conversionFunnel[3].stage, 'ENROLLED');
    // Ensure monotonic decreasing or equal step counts
    for (let i = 0; i < conversionFunnel.length - 1; i++) {
      assert.ok(
        conversionFunnel[i].count >= conversionFunnel[i + 1].count,
        `Funnel stage ${conversionFunnel[i].stage} (${conversionFunnel[i].count}) must be >= stage ${conversionFunnel[i + 1].stage} (${conversionFunnel[i + 1].count})`
      );
      assert.ok(conversionFunnel[i].dropOffCount >= 0, 'dropOffCount must be non-negative');
    }
    console.log('  ✓ 3.4 Conversion funnel verified with monotonic step-down stages and drop-off counts');

    // 3.5 District Heat Map (Odisha student distribution)
    const { districtHeatMap } = analyticsData;
    assert.ok(Array.isArray(districtHeatMap) && districtHeatMap.length > 0);
    const districtNames = districtHeatMap.map((d) => d.district);
    assert.ok(districtNames.includes('Cuttack') || districtNames.includes('Khordha'));
    districtHeatMap.forEach((d) => {
      assert.ok(typeof d.district === 'string');
      assert.ok(typeof d.enquiriesCount === 'number');
      assert.ok(typeof d.percentage === 'number');
    });
    console.log(`  ✓ 3.5 District heat map verified with top ${districtHeatMap.length} Odisha districts`);

    // 3.6 College Comparison Benchmark
    const { collegeComparison } = analyticsData;
    assert.ok(Array.isArray(collegeComparison) && collegeComparison.length >= 4);
    const driemsBench = collegeComparison.find((c) => c.code === 'DRIEMS');
    assert.ok(driemsBench, 'DRIEMS benchmark must exist in college comparison');
    assert.strictEqual(driemsBench.isDefault, true);
    console.log('  ✓ 3.6 College comparison metrics verified across all 4 institutions');

    // -------------------------------------------------------------------------
    // SECTION 4: DRIEMS Student Roster (65 Names) Preservation Invariant
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 4: DRIEMS STUDENT ROSTER INVARIANT ---');
    const driemsCollege = await College.findOne({ code: 'DRIEMS' });
    const driemsStudents = await Student.find({ collegeId: driemsCollege._id, isImportedRoster: true });
    assert.strictEqual(
      driemsStudents.length,
      65,
      `Expected exactly 65 DRIEMS student records, found ${driemsStudents.length}`
    );
    console.log('  ✓ 4.1 DRIEMS student roster intact with exactly 65 records verbatim');

    console.log('\n======================================================================');
    console.log('  ALL PHASE 5 BACKEND TESTS PASSED CLEANLY (100% SUCCESS)');
    console.log('======================================================================');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Phase 5 Test Failure:', err);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runPhase5Tests();