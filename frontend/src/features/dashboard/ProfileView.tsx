'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Badge, Card } from '@/components/ui/Card';
import { Field, SelectField } from '@/components/ui/Field';
import { FormAlert } from '@/features/auth/AuthShell';
import { applyServerError } from '@/hooks/useServerErrors';
import { useAuth } from '@/hooks/useAuth';
import { roleLabel } from '@/lib/roles';
import { LANGUAGES, UpdateProfileInput, updateProfileSchema } from '@/lib/validators';
import { authService } from '@/services/authService';
import type { User } from '@/types';
import { ApprovalBanner } from './PendingBanner';

const Row = ({ k, v }: { k: string; v?: React.ReactNode }) => (
  <div className="flex justify-between gap-4 py-2 text-sm"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v || '—'}</dd></div>
);

export function ProfileView({ user }: { user: User }) {
  const { setUser } = useAuth();
  const [msg, setMsg] = useState<{ tone: 'danger' | 'success'; text: string } | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting, isDirty } } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { fullName: user.fullName, phone: user.phone ?? '', city: user.city ?? '', state: user.state ?? '', preferredLanguage: user.preferredLanguage },
  });
  const servant = user.role === 'PUBLIC_SERVANT';

  const save = handleSubmit(async (data) => {
    setMsg(null);
    try { setUser(await authService.updateProfile(data)); setMsg({ tone: 'success', text: 'Profile saved.' }); }
    catch (e) { setMsg({ tone: 'danger', text: applyServerError(e, setError) }); }
  });

  return (
    <div className="space-y-6">
      <ApprovalBanner user={user} />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Edit details</h2>
          {msg && <FormAlert tone={msg.tone}>{msg.text}</FormAlert>}
          <form onSubmit={save} noValidate className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" className="sm:col-span-2" error={errors.fullName?.message} {...register('fullName')} />
            <Field label="Email" value={user.email} disabled readOnly hint="Email cannot be changed here." />
            <Field label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
            <Field label="City" error={errors.city?.message} {...register('city')} />
            <Field label="State" error={errors.state?.message} {...register('state')} />
            <SelectField label="Preferred language" className="sm:col-span-2" error={errors.preferredLanguage?.message} {...register('preferredLanguage')}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </SelectField>
            <div className="sm:col-span-2"><Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save changes</Button></div>
          </form>
        </Card>
        <Card className="h-fit p-6">
          <div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">Account</h2><Badge tone="primary">{roleLabel[user.role]}</Badge></div>
          <dl className="divide-y divide-line">
            <Row k="Status" v={user.accountStatus} />
            {servant && <>
              <Row k="Department" v={user.department} /><Row k="Designation" v={user.designation} />
              <Row k="Municipality" v={user.municipalityName} /><Row k="Ward" v={user.ward} /><Row k="Official ID" v={user.officialId} />
            </>}
          </dl>
          <p className="mt-3 text-xs text-muted">Role and official details can only be changed by an administrator.</p>
        </Card>
      </div>
    </div>
  );
}
