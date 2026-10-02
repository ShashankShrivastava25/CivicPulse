'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { applyServerError } from '@/hooks/useServerErrors';
import { forgotPasswordSchema, resetPasswordSchema } from '@/lib/validators';
import { authService } from '@/services/authService';
import { AuthLink, FormAlert } from './AuthShell';

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, setError: setFieldError, formState: { errors, isSubmitting } } =
    useForm<{ email: string }>({ resolver: zodResolver(forgotPasswordSchema) });
  if (done) return <FormAlert tone="success">If an account exists for that email, a reset link has been sent. Check your inbox.</FormAlert>;
  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit(async (d) => {
      setError('');
      try { await authService.forgotPassword(d.email); setDone(true); } catch (e) { setError(applyServerError(e, setFieldError)); }
    })}>
      {error && <FormAlert>{error}</FormAlert>}
      <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Button type="submit" className="w-full" loading={isSubmitting}>Send reset link</Button>
    </form>
  );
}

type ResetValues = { token: string; password: string; confirmPassword: string };
export function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? '';
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, setError: setFieldError, formState: { errors, isSubmitting } } =
    useForm<ResetValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { token } });
  if (!token) return <FormAlert>This reset link is missing its token. Request a new one from <AuthLink href="/forgot-password">forgot password</AuthLink>.</FormAlert>;
  if (done) return <><FormAlert tone="success">Password updated.</FormAlert><Button href="/login" className="w-full">Go to login</Button></>;
  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit(async (d) => {
      setError('');
      try { await authService.resetPassword(d); setDone(true); } catch (e) { setError(applyServerError(e, setFieldError)); }
    })}>
      {error && <FormAlert>{error}</FormAlert>}
      <input type="hidden" {...register('token')} />
      <Field label="New password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
      <Field label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      <Button type="submit" className="w-full" loading={isSubmitting}>Update password</Button>
    </form>
  );
}
