import { Bell, BarChart3, Bot, Building2, CheckCircle2, ClipboardList, FileText, Flag, Home, Landmark, ListChecks, LogOut, LucideIcon, Map, MapPin, PlusCircle, ScrollText, Settings, User, Users, UserCheck, Loader } from 'lucide-react';
import type { Role } from '@/types';

export interface NavItem { label: string; tKey: string; icon: LucideIcon; href?: string; action?: 'logout' }
// Items without href are planned for later phases and render as "Soon".
// `label` is the English fallback; `tKey` looks up the live translation (see lib/i18n).

export const NAV: Record<Role, NavItem[]> = {
  CITIZEN: [
    { label: 'Dashboard', tKey: 'nav.dashboard', icon: Home, href: '/dashboard' },
    { label: 'Report an Issue', tKey: 'nav.reportIssue', icon: PlusCircle, href: '/report' },
    { label: 'Nearby Issues', tKey: 'nav.nearbyIssues', icon: MapPin, href: '/nearby' },
    { label: 'My Reports', tKey: 'nav.myReports', icon: FileText, href: '/my-reports' },
    { label: 'Notifications', tKey: 'nav.notifications', icon: Bell, href: '/notifications' },
    { label: 'Profile', tKey: 'nav.profile', icon: User, href: '/profile' },
    { label: 'Settings', tKey: 'nav.settings', icon: Settings, href: '/settings' },
    { label: 'Logout', tKey: 'nav.logout', icon: LogOut, action: 'logout' },
  ],
  PUBLIC_SERVANT: [
    { label: 'Dashboard', tKey: 'nav.dashboard', icon: Home, href: '/public-servant/dashboard' },
    { label: 'Priority Queue', tKey: 'nav.priorityQueue', icon: Flag, href: '/public-servant/priority-queue' },
    { label: 'All Issues', tKey: 'nav.allIssues', icon: ClipboardList, href: '/public-servant/issues' },
    { label: 'Assigned Issues', tKey: 'nav.assignedIssues', icon: ListChecks, href: '/public-servant/issues/assigned' },
    { label: 'In Progress', tKey: 'nav.inProgress', icon: Loader, href: '/public-servant/issues/in-progress' },
    { label: 'Resolved', tKey: 'nav.resolved', icon: CheckCircle2, href: '/public-servant/issues/resolved' },
    { label: 'Map', tKey: 'nav.map', icon: Map, href: '/public-servant/map' },
    { label: 'Notifications', tKey: 'nav.notifications', icon: Bell, href: '/notifications' },
    { label: 'Profile', tKey: 'nav.profile', icon: User, href: '/profile' },
    { label: 'Logout', tKey: 'nav.logout', icon: LogOut, action: 'logout' },
  ],
  ADMIN: [
    { label: 'Dashboard', tKey: 'nav.dashboard', icon: Home, href: '/admin/dashboard' },
    { label: 'Users', tKey: 'nav.users', icon: Users, href: '/admin/users' },
    { label: 'Public Servants', tKey: 'nav.publicServants', icon: UserCheck, href: '/admin/public-servants' },
    { label: 'Issues', tKey: 'nav.issues', icon: ClipboardList, href: '/admin/issues' },
    { label: 'Municipalities', tKey: 'nav.municipalities', icon: Landmark, href: '/admin/municipalities' },
    { label: 'Departments', tKey: 'nav.departments', icon: Building2, href: '/admin/departments' },
    { label: 'Analytics', tKey: 'nav.analytics', icon: BarChart3, href: '/admin/analytics' },
    { label: 'AI Configuration', tKey: 'nav.aiConfiguration', icon: Bot, href: '/admin/ai-configuration' },
    { label: 'Audit Logs', tKey: 'nav.auditLogs', icon: ScrollText, href: '/admin/audit-logs' },
    { label: 'Map', tKey: 'nav.map', icon: Map, href: '/admin/map' },
    { label: 'Notifications', tKey: 'nav.notifications', icon: Bell, href: '/notifications' },
    { label: 'Settings', tKey: 'nav.settings', icon: Settings, href: '/settings' },
    { label: 'Logout', tKey: 'nav.logout', icon: LogOut, action: 'logout' },
  ],
};
