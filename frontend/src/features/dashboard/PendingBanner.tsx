import type { User } from '@/types';

export function ApprovalBanner({ user }: { user: User }) {
  if (user.role !== 'PUBLIC_SERVANT' || user.accountStatus === 'APPROVED') return null;
  const msg: Record<string, string> = {
    PENDING: 'Your account is waiting for administrator approval. Issue tools will unlock once you are approved.',
    REJECTED: 'Your registration was not approved. Contact your municipality administrator.',
    SUSPENDED: 'Your account is suspended.',
  };
  return <div role="status" className="mb-6 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">{msg[user.accountStatus]}</div>;
}
