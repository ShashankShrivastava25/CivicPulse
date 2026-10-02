'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';

interface Issue {
  id: string;
  category: string;
  description: string;
  imageUrl?: string;
  status: string;
  upvotes: number;
  createdAt: string;
}

export default function MyReportsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['myReports', page],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/issues/my-reports/list?page=${page}&limit=${limit}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    },
  });

  const issues = reportsData?.data?.issues || [];
  const pagination = reportsData?.data?.pagination;

  return (
    <DashboardLayout roles={['CITIZEN']}>
      {(user) => (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
              <p className="text-gray-600 mt-1">View and manage all your reported issues</p>
            </div>
            <Link
              href="/report"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Report New Issue
            </Link>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">You haven't reported any issues yet</p>
                <Link
                  href="/report"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Report Your First Issue
                </Link>
              </div>
            ) : (
              <>
                {issues.map((issue: Issue) => (
                  <Link
                    key={issue.id}
                    href={`/issues/${issue.id}`}
                    className="block bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition"
                  >
                    <div className="flex gap-4">
                      {issue.imageUrl && (
                        <img
                          src={issue.imageUrl}
                          alt="Issue"
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
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
                        <p className="text-gray-900 font-medium mb-2">{issue.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>👍 {issue.upvotes} upvotes</span>
                          <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
                    >
                      Previous
                    </button>
                    <div className="text-gray-600 text-sm">
                      Page {page} of {pagination.pages}
                    </div>
                    <button
                      onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                      disabled={page === pagination.pages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
