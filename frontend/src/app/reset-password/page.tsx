import { Suspense } from 'react';
import { AuthLink, AuthShell } from '@/features/auth/AuthShell';
import { ResetPasswordForm } from '@/features/auth/RecoveryForms';

export default function Page() {
  return (
    <AuthShell title="Choose a new password" footer={<AuthLink href="/login">Back to login</AuthLink>}>
      <Suspense><ResetPasswordForm /></Suspense>
    </AuthShell>
  );
}
