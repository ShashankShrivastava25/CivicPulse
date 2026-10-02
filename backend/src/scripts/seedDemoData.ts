import mongoose from 'mongoose';
import { connectDb } from '../config/db';
import { User, Municipality, Department, Issue, IssueUpdate, Notification } from '../models';
import { hashPassword } from '../services/authService';
import { computePriority } from '../services/PriorityService';

/**
 * Populates realistic DEMO data so the app is immediately explorable: demo citizens, a few approved
 * public servants, and a spread of issues across categories, statuses and priorities.
 *
 * Every account this script creates uses an @civicpulse.demo email and a name prefixed "Demo" so it
 * is obvious in the UI which accounts are sample data. CivicPulse is not affiliated with any real
 * government body — the municipality/department names here are generic placeholders, not real bodies.
 *
 * Safe to re-run: it skips any demo user that already exists.
 */

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'DemoPass123!';

const CITIES: { city: string; state: string; lat: number; lng: number }[] = [
  { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { city: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
];

const CATEGORIES = ['Garbage', 'Drainage', 'Pothole', 'Road Damage', 'Streetlight', 'Water Leakage', 'Waterlogging', 'Sanitation'];

const DESCRIPTIONS: Record<string, string[]> = {
  Garbage: ['Garbage has not been collected from this street for over a week.', 'Overflowing community bin attracting stray animals.'],
  Drainage: ['Open drain near the main road is clogged and overflowing.', 'Storm drain cover is missing, a safety hazard for pedestrians.'],
  Pothole: ['Large pothole causing traffic to swerve dangerously.', 'Deep pothole near the school gate, risk to children on bicycles.'],
  'Road Damage': ['Road surface has caved in after recent rain.', 'Cracked pavement stretching nearly 10 metres.'],
  Streetlight: ['Streetlight has been non-functional for two weeks, area is unsafe at night.', 'Flickering streetlight near the bus stop.'],
  'Water Leakage': ['Main water pipe leaking continuously onto the road.', 'Leaking pipeline wasting a large amount of water daily.'],
  Waterlogging: ['Heavy waterlogging after rain makes the lane impassable.', 'Stagnant water near the housing society entrance, mosquito breeding risk.'],
  Sanitation: ['Public toilet block in poor hygienic condition.', 'No handwashing facility at the community sanitation point.'],
};

function jitter(base: number, meters = 1500) {
  return base + (Math.random() - 0.5) * (meters / 111_000);
}

async function ensureUser(fullName: string, email: string, role: 'CITIZEN' | 'PUBLIC_SERVANT', extra: Record<string, unknown> = {}) {
  const existing = await User.findOne({ email });
  if (existing) return existing;
  return User.create({ fullName, email, passwordHash: await hashPassword(DEMO_PASSWORD), role, ...extra });
}

async function main() {
  await connectDb();

  const municipality = await Municipality.findOne().sort({ createdAt: 1 });
  if (!municipality) {
    console.log('No municipality found. Run `npm run seed:municipalities` first.');
    process.exitCode = 1;
    return;
  }
  const departments = await Department.find({ municipality: municipality._id });
  if (!departments.length) {
    console.log('Municipality has no departments. Run `npm run seed:municipalities` first.');
    process.exitCode = 1;
    return;
  }
  const deptByCategory = new Map(departments.flatMap((d) => d.categories.map((c) => [c, d])));

  // --- demo citizens ---
  const citizens = [];
  for (let i = 1; i <= 6; i++) {
    citizens.push(await ensureUser(`Demo Citizen ${i}`, `demo.citizen${i}@civicpulse.demo`, 'CITIZEN', {
      accountStatus: 'ACTIVE', city: CITIES[i % CITIES.length].city, state: CITIES[i % CITIES.length].state,
    }));
  }
  console.log(`Citizens ready: ${citizens.length} (password: ${DEMO_PASSWORD})`);

  // --- demo public servants, pre-approved into real departments ---
  const servants = [];
  for (let i = 0; i < Math.min(3, departments.length); i++) {
    const dept = departments[i];
    servants.push(await ensureUser(`Demo Officer ${i + 1}`, `demo.officer${i + 1}@civicpulse.demo`, 'PUBLIC_SERVANT', {
      accountStatus: 'APPROVED', municipalityId: municipality._id, departmentId: dept._id,
      department: dept.name, designation: 'Field Officer',
    }));
  }
  console.log(`Public servants ready: ${servants.length} (password: ${DEMO_PASSWORD})`);

  // Also leave one PENDING servant so the admin approval screen has something to show.
  await ensureUser('Demo Pending Officer', 'demo.pending@civicpulse.demo', 'PUBLIC_SERVANT', {
    accountStatus: 'PENDING', department: 'Sanitation', designation: 'Junior Engineer',
  });

  // --- demo issues ---
  const existingDemoIssues = await Issue.countDocuments({ reporterId: { $in: citizens.map((c) => c._id) } });
  if (existingDemoIssues > 0) {
    console.log(`Demo issues already present (${existingDemoIssues}). Skipping issue creation.`);
  } else {
    const statuses: Array<'REPORTED' | 'UNDER_REVIEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED'> = [
      'REPORTED', 'REPORTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'IN_PROGRESS', 'RESOLVED', 'RESOLVED',
    ];
    let created = 0;
    for (let i = 0; i < 20; i++) {
      const category = CATEGORIES[i % CATEGORIES.length];
      const place = CITIES[i % CITIES.length];
      const status = statuses[i % statuses.length];
      const reporter = citizens[i % citizens.length];
      const dept = deptByCategory.get(category);
      const servant = status !== 'REPORTED' && dept ? servants.find((s) => String(s.departmentId) === String(dept._id)) : undefined;
      const createdAt = new Date(Date.now() - (i + 1) * 36 * 60 * 60 * 1000); // staggered over the last ~30 days
      const upvoteCount = Math.floor(Math.random() * 18);

      const lat = jitter(place.lat);
      const lng = jitter(place.lng);
      const priority = await computePriority({ upvoteCount, category, createdAt, status, duplicateCandidateCount: 0 });

      const issue = await Issue.create({
        reporterId: reporter._id,
        category,
        description: DESCRIPTIONS[category][i % 2],
        imageUrl: undefined,
        location: { type: 'Point', coordinates: [lng, lat] },
        latitude: lat, longitude: lng,
        address: `${place.city}, ${place.state} (demo location)`,
        status, upvoteCount,
        priority: priority.level, priorityScore: priority.score, priorityReasons: priority.reasons,
        priorityBreakdown: priority.breakdown, priorityComputedAt: new Date(),
        municipalityId: municipality._id,
        departmentId: status !== 'REPORTED' ? dept?._id : undefined,
        assignedTo: servant?._id,
        assignedAt: servant ? createdAt : undefined,
        aiProcessingStatus: 'SKIPPED',
        createdAt, updatedAt: createdAt,
        ...(status === 'RESOLVED' ? {
          resolutionNotes: 'Issue has been resolved by the field team. Verified on-site.',
          resolutionDate: new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000),
          resolvedBy: servant?._id,
        } : {}),
      });

      await IssueUpdate.create({ issue: issue._id, authorRole: 'SYSTEM', kind: 'REPORTED', status: 'REPORTED', message: 'Issue reported', createdAt });
      if (servant) {
        await IssueUpdate.create({ issue: issue._id, author: servant._id, authorRole: 'PUBLIC_SERVANT', kind: 'ASSIGNED', status: 'ASSIGNED', message: `Assigned to ${servant.fullName}`, createdAt: new Date(createdAt.getTime() + 3600_000) });
      }
      if (status === 'IN_PROGRESS' || status === 'RESOLVED') {
        await IssueUpdate.create({ issue: issue._id, author: servant?._id, authorRole: 'PUBLIC_SERVANT', kind: 'ACTION_UPDATE', message: 'Inspection completed. Work has been scheduled.', createdAt: new Date(createdAt.getTime() + 2 * 3600_000) });
      }
      if (status === 'RESOLVED') {
        await IssueUpdate.create({ issue: issue._id, author: servant?._id, authorRole: 'PUBLIC_SERVANT', kind: 'RESOLVED', status: 'RESOLVED', message: 'Issue has been resolved by the field team. Verified on-site.', createdAt: new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000) });
        await Notification.create({ user: reporter._id, type: 'ISSUE_RESOLVED', message: 'Your reported issue has been marked resolved.', issue: issue._id, read: i % 3 === 0 });
      }
      created++;
    }
    console.log(`Demo issues created: ${created}`);
  }

  console.log('\nDemo data ready. All demo accounts are clearly named "Demo …" with @civicpulse.demo emails.');
  console.log(`Sign in as any demo account with password: ${DEMO_PASSWORD}`);
  console.log('CivicPulse is a student/portfolio project and is not affiliated with any real government body.');
}

main().catch((e) => { console.error(e.message ?? e); process.exitCode = 1; }).finally(() => mongoose.disconnect());
