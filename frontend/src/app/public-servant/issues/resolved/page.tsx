'use client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IssueListView } from '@/features/staff/IssueListView';

export default function ResolvedIssuesPage() {
  return (
    <DashboardLayout roles={['PUBLIC_SERVANT']} title="Resolved">
      {() => <IssueListView baseFilters={{ status: 'RESOLVED' }} emptyLabel="No resolved issues yet." />}
    </DashboardLayout>
  );
}
