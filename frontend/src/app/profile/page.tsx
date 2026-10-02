'use client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProfileView } from '@/features/dashboard/ProfileView';

export default function ProfilePage() {
  return <DashboardLayout title="Profile">{(user) => <ProfileView user={user} />}</DashboardLayout>;
}
