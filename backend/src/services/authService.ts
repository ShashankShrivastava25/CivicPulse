import bcrypt from 'bcryptjs';
import { PasswordResetToken, User } from '../models';
import { AppError } from '../utils/AppError';
import { randomToken, sha256 } from '../utils/token';
import { env } from '../config/env';
import type { CitizenRegisterInput, LoginInput, ResetPasswordInput, ServantRegisterInput } from '../validators/auth';

const ROUNDS = 12;
// Used to keep login timing similar whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync('civicpulse-dummy', ROUNDS);

export const hashPassword = (p: string) => bcrypt.hash(p, ROUNDS);

export async function register(input: CitizenRegisterInput | ServantRegisterInput) {
  const { accountType, confirmPassword: _c, password, ...rest } = input as ServantRegisterInput & { accountType: string };
  const passwordHash = await hashPassword(password);
  const isServant = accountType === 'PUBLIC_SERVANT';
  // Role and status are decided here on the server, never taken from the client.
  return User.create({
    ...rest,
    passwordHash,
    role: isServant ? 'PUBLIC_SERVANT' : 'CITIZEN',
    accountStatus: isServant ? 'PENDING' : 'ACTIVE',
  });
}

export async function login({ email, password }: LoginInput) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new AppError(401, 'Incorrect email or password');
  if (user.accountStatus === 'SUSPENDED') throw new AppError(403, 'This account has been suspended. Contact your administrator');
  if (user.accountStatus === 'REJECTED') throw new AppError(403, 'This registration was not approved');
  return user;
}

export async function createResetToken(email: string) {
  const user = await User.findOne({ email });
  if (!user) return null; // caller responds identically either way
  const token = randomToken();
  await PasswordResetToken.deleteMany({ user: user._id });
  await PasswordResetToken.create({ user: user._id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 30 * 60 * 1000) });
  return { token, link: `${env.CLIENT_URL}/reset-password?token=${token}` };
}

export async function resetPassword({ token, password }: ResetPasswordInput) {
  const record = await PasswordResetToken.findOne({ tokenHash: sha256(token), usedAt: null, expiresAt: { $gt: new Date() } });
  if (!record) throw new AppError(400, 'This reset link is invalid or has expired');
  await User.updateOne({ _id: record.user }, { passwordHash: await hashPassword(password) });
  await PasswordResetToken.deleteMany({ user: record.user });
}
