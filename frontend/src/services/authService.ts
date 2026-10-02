import { api } from '@/lib/api';
import type { User } from '@/types';
import type { CitizenRegisterInput, LoginInput, ResetPasswordInput, ServantRegisterInput, UpdateProfileInput } from '@/lib/validators';

export const authService = {
  me: () => api<{ user: User }>('/auth/me').then((d) => d.user),
  login: (b: LoginInput) => api<{ user: User }>('/auth/login', { method: 'POST', body: b }).then((d) => d.user),
  register: (b: CitizenRegisterInput | ServantRegisterInput) => api<{ user: User }>('/auth/register', { method: 'POST', body: b }).then((d) => d.user),
  logout: () => api('/auth/logout', { method: 'POST' }),
  forgotPassword: (email: string) => api('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (b: ResetPasswordInput) => api('/auth/reset-password', { method: 'POST', body: b }),
  updateProfile: (b: UpdateProfileInput) => api<{ user: User }>('/users/me', { method: 'PATCH', body: b }).then((d) => d.user),
};
