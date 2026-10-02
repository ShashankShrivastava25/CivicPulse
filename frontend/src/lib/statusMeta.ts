import type { Priority, IssueStatus } from '@/types';

export const STATUS_LABEL: Record<IssueStatus, string> = {
  REPORTED: 'Reported', UNDER_REVIEW: 'Under review', ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress', RESOLVED: 'Resolved', REJECTED: 'Rejected',
};

export const STATUS_TONE: Record<IssueStatus, 'neutral' | 'info' | 'primary' | 'warning' | 'success' | 'danger'> = {
  REPORTED: 'neutral', UNDER_REVIEW: 'info', ASSIGNED: 'primary',
  IN_PROGRESS: 'warning', RESOLVED: 'success', REJECTED: 'danger',
};

export const PRIORITY_LABEL: Record<Priority, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' };
export const PRIORITY_TONE: Record<Priority, 'neutral' | 'info' | 'warning' | 'danger'> = {
  LOW: 'neutral', MEDIUM: 'info', HIGH: 'warning', CRITICAL: 'danger',
};

export const CATEGORIES = ['Garbage', 'Drainage', 'Road Damage', 'Pothole', 'Streetlight', 'Water Leakage', 'Waterlogging', 'Sanitation', 'Public Infrastructure', 'Other'];

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function refName(v: unknown, fallback = 'Unassigned'): string {
  if (!v) return fallback;
  if (typeof v === 'string') return v;
  const r = v as { name?: string; fullName?: string };
  return r.fullName ?? r.name ?? fallback;
}

/** Great-circle distance between two lat/lng points, in meters (Haversine formula). */
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
}
