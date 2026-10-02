'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { applyServerError } from '@/hooks/useServerErrors';
import { useAuth } from '@/hooks/useAuth';
import { homeForRole } from '@/lib/roles';
import { LoginInput, loginSchema } from '@/lib/validators';
import { authService } from '@/services/authService';
import { AuthLink, FormAlert } from './AuthShell';

export function LoginForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState('');
  const { register, handleSubmit, setError: setFieldError, formState: { errors, isSubmitting } } =
    useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (data) => {
    setError('');
    try { const user = await authService.login(data); setUser(user); router.replace(homeForRole(user.role)); }
    catch (e) { setError(applyServerError(e, setFieldError)); }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error && <FormAlert>{error}</FormAlert>}
      <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Field label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
      <div className="text-right text-sm"><AuthLink href="/forgot-password">Forgot password?</AuthLink></div>
      <Button type="submit" className="w-full" loading={isSubmitting}>Log in</Button>
    </form>
  );
}
