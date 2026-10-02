'use client';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IssueListView } from '@/features/staff/IssueListView';

export default function AssignedIssuesPage() {
  const { user } = useAuth();
  return (
    <DashboardLayout roles={['PUBLIC_SERVANT']} title="Assigned to me">
      {() => <IssueListView baseFilters={{ assignedTo: user?._id }} emptyLabel="Nothing is assigned to you right now." />}
    </DashboardLayout>
  );
}
