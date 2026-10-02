'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Field, SelectField } from '@/components/ui/Field';
import { applyServerError } from '@/hooks/useServerErrors';
import { useAuth } from '@/hooks/useAuth';
import { homeForRole } from '@/lib/roles';
import { LANGUAGES, citizenRegisterSchema, servantRegisterSchema } from '@/lib/validators';
import { authService } from '@/services/authService';
import { cn } from '@/utils/cn';
import { FormAlert } from './AuthShell';

type Type = 'CITIZEN' | 'PUBLIC_SERVANT';
// Union of both shapes so one form component can render either account type.
type FormValues = Record<string, string>;

function TypeToggle({ value, onChange }: { value: Type; onChange: (t: Type) => void }) {
  const opts: [Type, string][] = [['CITIZEN', 'Citizen'], ['PUBLIC_SERVANT', 'Public servant']];
  return (
    <div role="tablist" aria-label="Account type" className="mb-6 grid grid-cols-2 rounded bg-sunken p-1">
      {opts.map(([v, l]) => (
        <button key={v} type="button" role="tab" aria-selected={value === v} onClick={() => onChange(v)}
          className={cn('h-9 rounded text-sm font-medium transition', value === v ? 'bg-surface shadow-card' : 'text-muted hover:text-fg')}>{l}</button>
      ))}
    </div>
  );
}

function Form({ type }: { type: Type }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState('');
  const servant = type === 'PUBLIC_SERVANT';
  const { register, handleSubmit, setError: setFieldError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(servant ? servantRegisterSchema : citizenRegisterSchema) as never,
    defaultValues: { accountType: type, preferredLanguage: 'en' },
  });
  const f = (name: string, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) =>
    <Field label={label} error={errors[name]?.message as string | undefined} {...extra} {...register(name)} />;

  const onSubmit = handleSubmit(async (data) => {
    setError('');
    try {
      const user = await authService.register(data as never);
      setUser(user); router.replace(homeForRole(user.role));
    } catch (e) { setError(applyServerError(e, setFieldError)); }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error && <FormAlert>{error}</FormAlert>}
      {servant && <p className="rounded bg-info/10 px-3 py-2 text-sm text-info">Public servant accounts start as pending and need administrator approval before they can act on reports.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {f('fullName', 'Full name', { autoComplete: 'name', className: 'sm:col-span-2' })}
        {f('email', servant ? 'Official email' : 'Email', { type: 'email', autoComplete: 'email' })}
        {f('phone', 'Phone', { type: 'tel', autoComplete: 'tel', placeholder: '9876543210' })}
        {servant && <>
          {f('department', 'Department')}
          {f('designation', 'Designation')}
          {f('municipalityName', 'Municipality / Nagar Nigam / Nagar Palika', { className: 'sm:col-span-2' })}
          {f('ward', 'Ward')}
          {f('officialId', 'Official ID')}
        </>}
        {f('city', 'City')}
        {f('state', 'State')}
        <SelectField label="Preferred language" error={errors.preferredLanguage?.message as string | undefined} {...register('preferredLanguage')}>
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </SelectField>
        <div className="hidden sm:block" />
        {f('password', 'Password', { type: 'password', autoComplete: 'new-password' })}
        {f('confirmPassword', 'Confirm password', { type: 'password', autoComplete: 'new-password' })}
      </div>
      <p className="text-xs text-muted">Password: at least 8 characters with upper case, lower case and a number.</p>
      <Button type="submit" className="w-full" loading={isSubmitting}>Create account</Button>
    </form>
  );
}

export function RegisterForm() {
  const [type, setType] = useState<Type>('CITIZEN');
  return <><TypeToggle value={type} onChange={setType} /><Form key={type} type={type} /></>;
}
