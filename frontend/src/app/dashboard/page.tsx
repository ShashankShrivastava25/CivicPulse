'use client';
import { API_BASE } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ThumbsUp,
  MapPin,
  Calendar,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

interface Issue {
  id: string;
  category: string;
  description: string;
  status: string;
  upvotes: number;
  createdAt: string;
}

interface DashboardStats {
  myReports: number;
  openReports: number;
  inProgress: number;
  resolved: number;
  upvotesReceived: number;
}

export default function CitizenDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    myReports: 0,
    openReports: 0,
    inProgress: 0,
    resolved: 0,
    upvotesReceived: 0,
  });

  // Fetch user's reports
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['myReports', 1],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/issues/my-reports/list?page=1&limit=5`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    },
  });

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/issues/my-reports/list?page=1&limit=100`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const issues = data.data?.issues || [];
          
          const myReports = issues.length;
          const openReports = issues.filter((i: Issue) => i.status === 'OPEN').length;
          const inProgress = issues.filter((i: Issue) => i.status === 'IN_PROGRESS').length;
          const resolved = issues.filter((i: Issue) => i.status === 'RESOLVED').length;
          const upvotesReceived = issues.reduce((sum: number, i: Issue) => sum + i.upvotes, 0);

          setStats({
            myReports,
            openReports,
            inProgress,
            resolved,
            upvotesReceived,
          });
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'My Reports', value: stats.myReports, icon: FileText, color: 'bg-blue-50' },
    { label: 'Open Reports', value: stats.openReports, icon: AlertCircle, color: 'bg-red-50' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'bg-yellow-50' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'bg-green-50' },
    { label: 'Upvotes Received', value: stats.upvotesReceived, icon: ThumbsUp, color: 'bg-purple-50' },
  ];

  return (
    <DashboardLayout roles={['CITIZEN']}>
      {(user) => (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Welcome back, {user.fullName.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground">
              Help improve your community by reporting civic issues
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/report"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FileText className="w-5 h-5" />
              Report New Issue
            </Link>
            <Link
              href="/nearby"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              <MapPin className="w-5 h-5" />
              View Nearby Issues
            </Link>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {statCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <div
                  key={card.label}
                  className={`${card.color} p-6 rounded-lg border border-gray-200`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{card.label}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                    </div>
                    <IconComponent className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">Recent Reports</h2>
              </div>
              <Link
                href="/my-reports"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>

            {reportsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading reports...</div>
            ) : reportsData?.data?.issues?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No reports yet</p>
                <Link
                  href="/report"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <FileText className="w-4 h-4" />
                  Report First Issue
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reportsData?.data?.issues?.map((issue: Issue) => (
                  <Link
                    key={issue.id}
                    href={`/issues/${issue.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                            {issue.category}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              issue.status === 'OPEN'
                                ? 'bg-red-100 text-red-700'
                                : issue.status === 'IN_PROGRESS'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {issue.status}
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium">{issue.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            {issue.upvotes} upvotes
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Issue Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Issue Status Overview
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Open</span>
                    <span className="text-sm font-bold text-gray-900">{stats.openReports}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: stats.myReports > 0 ? `${(stats.openReports / stats.myReports) * 100}%` : '0%',
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">In Progress</span>
                    <span className="text-sm font-bold text-gray-900">{stats.inProgress}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: stats.myReports > 0 ? `${(stats.inProgress / stats.myReports) * 100}%` : '0%',
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Resolved</span>
                    <span className="text-sm font-bold text-gray-900">{stats.resolved}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: stats.myReports > 0 ? `${(stats.resolved / stats.myReports) * 100}%` : '0%',
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/report"
                  className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition text-gray-900 font-medium"
                >
                  Report New Issue
                </Link>
                <Link
                  href="/nearby"
                  className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition text-gray-900 font-medium"
                >
                  Find Nearby Issues
                </Link>
                <Link
                  href="/my-reports"
                  className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition text-gray-900 font-medium"
                >
                  View My Reports
                </Link>
                <Link
                  href="/notifications"
                  className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition text-gray-900 font-medium"
                >
                  Notifications
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
