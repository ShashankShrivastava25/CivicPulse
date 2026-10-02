'use client';
import { Badge } from '@/components/ui/Card';
import { useT } from '@/lib/i18n/I18nProvider';
import type { IssueStatus, Priority } from '@/types';
import { STATUS_TONE, PRIORITY_TONE } from '@/lib/statusMeta';

export const StatusBadge = ({ status }: { status: IssueStatus }) => {
  const t = useT();
  return <Badge tone={STATUS_TONE[status]}>{t(`status.${status}`)}</Badge>;
};

export const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const t = useT();
  return <Badge tone={PRIORITY_TONE[priority]}>{t(`priority.${priority}`)}</Badge>;
};
