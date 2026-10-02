'use client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IssueListView } from '@/features/staff/IssueListView';

export default function InProgressIssuesPage() {
  return (
    <DashboardLayout roles={['PUBLIC_SERVANT']} title="In progress">
      {() => <IssueListView baseFilters={{ status: 'IN_PROGRESS' }} emptyLabel="Nothing is in progress right now." />}
    </DashboardLayout>
  );
}
