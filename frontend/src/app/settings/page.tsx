'use client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SettingsView } from '@/features/dashboard/SettingsView';

export default function SettingsPage() {
  return <DashboardLayout title="Settings">{(user) => <SettingsView user={user} />}</DashboardLayout>;
}
