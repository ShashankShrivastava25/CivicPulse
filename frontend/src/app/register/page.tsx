import { AuthLink, AuthShell } from '@/features/auth/AuthShell';
import { RegisterForm } from '@/features/auth/RegisterForm';

export default function Page() {
  return (
    <AuthShell wide title="Create your account" subtitle="Join as a citizen, or register as a public servant."
      footer={<>Already have an account? <AuthLink href="/login">Log in</AuthLink></>}>
      <RegisterForm />
    </AuthShell>
  );
}
