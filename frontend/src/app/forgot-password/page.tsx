import { AuthLink, AuthShell } from '@/features/auth/AuthShell';
import { ForgotPasswordForm } from '@/features/auth/RecoveryForms';

export default function Page() {
  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we will send you a reset link."
      footer={<AuthLink href="/login">Back to login</AuthLink>}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
