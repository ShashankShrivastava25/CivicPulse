'use client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IssueListView } from '@/features/staff/IssueListView';

export default function AllIssuesPage() {
  return (
    <DashboardLayout roles={['PUBLIC_SERVANT']} title="All issues">
      {() => <IssueListView baseFilters={{}} emptyLabel="No issues match your filters right now." />}
    </DashboardLayout>
  );
}
