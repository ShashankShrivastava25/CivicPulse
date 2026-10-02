import mongoose from 'mongoose';
import { connectDb } from '../config/db';
import { User } from '../models';
import { hashPassword } from '../services/authService';
import { emailSchema, passwordSchema } from '../validators/auth';

async function main() {
  const email = emailSchema.parse(process.env.SEED_ADMIN_EMAIL);
  const password = passwordSchema.parse(process.env.SEED_ADMIN_PASSWORD);
  await connectDb();
  if (await User.exists({ email })) { console.log('Admin already exists. Nothing to do.'); return; }
  await User.create({
    fullName: process.env.SEED_ADMIN_NAME || 'System Administrator', email,
    passwordHash: await hashPassword(password), role: 'ADMIN', accountStatus: 'ACTIVE',
  });
  console.log(`Admin created: ${email}`);
}
main().catch((e) => { console.error(e.message ?? e); process.exitCode = 1; }).finally(() => mongoose.disconnect());
