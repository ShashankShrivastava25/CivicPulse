import { User } from '../models';
import { AppError } from '../utils/AppError';
import type { UpdateProfileInput } from '../validators/auth';

export async function getById(id: string) {
  const user = await User.findById(id);
  if (!user) throw new AppError(404, 'Account not found');
  return user;
}

export async function updateProfile(id: string, input: UpdateProfileInput) {
  const user = await User.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true });
  if (!user) throw new AppError(404, 'Account not found');
  return user;
}
