import mongoose from 'mongoose';
import { connectDb } from '../config/db';
import { Municipality, Department, DEFAULT_DEPARTMENTS, CATEGORY_DEFAULT_DEPARTMENT } from '../models';

/**
 * Seeds a starter municipality with the default department set, so a fresh install has somewhere
 * to approve public servants into. Safe to re-run: it upserts by name+city+state / name+municipality.
 */
async function main() {
  await connectDb();
  const name = process.env.SEED_MUNICIPALITY_NAME || 'City Municipal Corporation';
  const city = process.env.SEED_MUNICIPALITY_CITY || 'Springfield';
  const state = process.env.SEED_MUNICIPALITY_STATE || 'State';
  const wards = (process.env.SEED_MUNICIPALITY_WARDS || 'Ward 1,Ward 2,Ward 3,Ward 4,Ward 5').split(',').map((w) => w.trim());

  const municipality = await Municipality.findOneAndUpdate(
    { name, city, state },
    { name, city, state, wards, type: 'OTHER', status: 'ACTIVE' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Municipality ready: ${municipality.name} (${municipality.id})`);

  const categoriesByDept: Record<string, string[]> = {};
  for (const [category, dept] of Object.entries(CATEGORY_DEFAULT_DEPARTMENT)) {
    (categoriesByDept[dept] ??= []).push(category);
  }

  for (const deptName of DEFAULT_DEPARTMENTS) {
    const categories = categoriesByDept[deptName] ?? [];
    const dept = await Department.findOneAndUpdate(
      { name: deptName, municipality: municipality._id },
      { name: deptName, municipality: municipality._id, categories, status: 'ACTIVE' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  Department ready: ${dept.name} (${dept.id})`);
  }

  console.log('\nDone. Approve public servants at /admin/public-servants using this municipality and one of its departments.');
}
main().catch((e) => { console.error(e.message ?? e); process.exitCode = 1; }).finally(() => mongoose.disconnect());
