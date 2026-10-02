'use client';
import { API_BASE } from '@/lib/api';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MapPin, Calendar, ThumbsUp, Share2, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface IssueDetail {
  id: string;
  category: string;
  description: string;
  imageUrl?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: string;
  priority: string;
  upvotes: number;
  hasUpvoted: boolean;
  reporter: any;
  assignedTo?: any;
  department?: any;
  createdAt: string;
  updatedAt: string;
  aiSuggestedCategory?: string;
  aiClassificationConfidence?: number;
}

export default function IssueDetailsPage() {
  const params = useParams();
  const issueId = params.id as string;
  const [hasUpvoted, setHasUpvoted] = useState(false);

  const { data: issueData, isLoading, error, refetch } = useQuery({
    queryKey: ['issue', issueId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/issues/${issueId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch issue');
      const data = await res.json();
      setHasUpvoted(data.data.issue.hasUpvoted);
      return data;
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: async () => {
      const method = hasUpvoted ? 'DELETE' : 'POST';
      const res = await fetch(`${API_BASE}/issues/${issueId}/upvote`, { method, credentials: 'include' });
      if (!res.ok) throw new Error('Failed to upvote');
      return res.json();
    },
    onSuccess: () => {
      setHasUpvoted(!hasUpvoted);
      refetch();
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout roles={['CITIZEN']}>
        {(user) => (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}
      </DashboardLayout>
    );
  }

  if (error || !issueData) {
    return (
      <DashboardLayout roles={['CITIZEN']}>
        {(user) => (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-red-900">Error loading issue</h2>
              <p className="text-red-800 text-sm mt-1">The issue could not be found or loaded.</p>
              <Link href="/my-reports" className="text-red-600 hover:text-red-700 font-medium text-sm mt-3 inline-block">
                Back to My Reports
              </Link>
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }

  const issue: IssueDetail = issueData.data.issue;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-700';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-700';
      case 'ASSIGNED':
        return 'bg-purple-100 text-purple-700';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-700';
      case 'RESOLVED':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'text-red-600 bg-red-50';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50';
      case 'LOW':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <DashboardLayout roles={['CITIZEN']}>
      {(user) => (
        <div className="space-y-6">
          {/* Back Button */}
          <Link href="/my-reports" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            ← Back to My Reports
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image */}
              {issue.imageUrl && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-hidden">
                  <img src={issue.imageUrl} alt="Issue" className="w-full rounded-lg max-h-96 object-cover" />
                </div>
              )}

              {/* Basic Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{issue.category}</h1>
                    <p className="text-gray-600 mt-1">{issue.description}</p>
                  </div>
                  <button
                    onClick={() => upvoteMutation.mutate()}
                    disabled={upvoteMutation.isPending}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                      hasUpvoted
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ThumbsUp className="w-5 h-5" />
                    {issue.upvotes} Upvotes
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Status</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded font-medium text-sm ${getStatusColor(issue.status)}`}>
                      {issue.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Priority</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded font-medium text-sm ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              {issue.aiSuggestedCategory && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-2">AI Analysis</h3>
                  <p className="text-blue-800 text-sm">
                    <strong>Suggested Category:</strong> {issue.aiSuggestedCategory}
                    {issue.aiClassificationConfidence && (
                      <> (Confidence: {(issue.aiClassificationConfidence * 100).toFixed(0)}%)</>
                    )}
                  </p>
                </div>
              )}

              {/* Timeline/History */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Issue Timeline</h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-600 mt-2"></div>
                      <div className="w-0.5 h-12 bg-gray-300"></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Reported</p>
                      <p className="text-sm text-gray-600">{new Date(issue.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${issue.status !== 'OPEN' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{issue.status}</p>
                      <p className="text-sm text-gray-600">Current status</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Location */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {issue.location.address || `${issue.location.latitude.toFixed(4)}°, ${issue.location.longitude.toFixed(4)}°`}
                </p>
                <a
                  href={`https://maps.google.com/?q=${issue.location.latitude},${issue.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-3 py-2 text-sm border border-gray-300 rounded-lg text-blue-600 hover:bg-blue-50 font-medium"
                >
                  View on Map
                </a>
              </div>

              {/* Reporter Info */}
              {issue.reporter && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Reporter</h3>
                  <p className="text-gray-900 font-medium">{issue.reporter.name}</p>
                  <p className="text-sm text-gray-600">{issue.reporter.email}</p>
                </div>
              )}

              {/* Department */}
              {issue.department && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Assigned To</h3>
                  <p className="text-gray-900 font-medium">{issue.department.name}</p>
                  {issue.assignedTo && (
                    <p className="text-sm text-gray-600">{issue.assignedTo.name}</p>
                  )}
                </div>
              )}

              {/* Share */}
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                <Share2 className="w-5 h-5" />
                Share Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
