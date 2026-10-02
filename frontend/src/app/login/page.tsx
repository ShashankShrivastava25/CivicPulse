import { AuthLink, AuthShell } from '@/features/auth/AuthShell';
import { LoginForm } from '@/features/auth/LoginForm';

export default function Page() {
  return (
    <AuthShell title="Welcome back" subtitle="Log in to report and track civic issues."
      footer={<>New to CivicPulse? <AuthLink href="/register">Create an account</AuthLink></>}>
      <LoginForm />
    </AuthShell>
  );
}
