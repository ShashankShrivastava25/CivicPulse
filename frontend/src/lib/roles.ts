import type { Role } from '@/types';

export const homeForRole = (role: Role) =>
  role === 'ADMIN' ? '/admin/dashboard' : role === 'PUBLIC_SERVANT' ? '/public-servant/dashboard' : '/dashboard';

export const roleLabel: Record<Role, string> = { CITIZEN: 'Citizen', PUBLIC_SERVANT: 'Public servant', ADMIN: 'Administrator' };
