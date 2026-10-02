'use client';
import { API_BASE } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MapPin, Filter, Loader2, AlertCircle, List, Map as MapIcon } from 'lucide-react';
import Link from 'next/link';
import { haversineMeters, formatDistance } from '@/lib/statusMeta';
import { StatusBadge } from '@/features/issues/Badges';

const IssueMap = dynamic(() => import('@/components/map/IssueMap'), { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-lg bg-gray-100" /> });

const CATEGORIES = ['All', 'Garbage', 'Drainage', 'Road Damage', 'Pothole', 'Streetlight', 'Water Leakage', 'Waterlogging', 'Sanitation', 'Public Infrastructure', 'Other'];
const STATUSES = ['All', 'REPORTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];
const STATUS_LABELS: Record<string, string> = { All: 'All', REPORTED: 'Reported', UNDER_REVIEW: 'Under review', ASSIGNED: 'Assigned', IN_PROGRESS: 'In progress', RESOLVED: 'Resolved' };

interface Issue {
  id: string;
  category: string;
  description: string;
  imageUrl?: string;
  latitude: number;
  longitude: number;
  status: string;
  upvotes: number;
  createdAt: string;
}

export default function NearbyIssuesPage() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [radius, setRadius] = useState('500');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [locationError, setLocationError] = useState('');

  // Get user's location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationError('');
      },
      (err) => {
        setLocationError('Please enable location services to view nearby issues');
      }
    );
  }, []);

  // Fetch nearby issues
  const { data: issuesData, isLoading } = useQuery({
    queryKey: ['nearbyIssues', latitude, longitude, radius, selectedCategory, selectedStatus],
    queryFn: async () => {
      if (latitude === null || longitude === null) return null;

      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius,
        ...(selectedCategory !== 'All' && { category: selectedCategory }),
        ...(selectedStatus !== 'All' && { status: selectedStatus }),
      });

      const res = await fetch(`${API_BASE}/issues/nearby/search?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch nearby issues');
      return res.json();
    },
    enabled: latitude !== null && longitude !== null,
  });

  const issues = issuesData?.data?.issues || [];
  const [view, setView] = useState<'list' | 'map'>('list');

  return (
    <DashboardLayout roles={['CITIZEN']}>
      {(user) => (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nearby Issues</h1>
              <p className="text-gray-600 mt-1">Issues reported in your area</p>
            </div>
            <div className="flex rounded-lg border border-gray-200 bg-white p-1">
              <button onClick={() => setView('list')} aria-pressed={view === 'list'} className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium ${view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}><List className="h-4 w-4" />List</button>
              <button onClick={() => setView('map')} aria-pressed={view === 'map'} className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium ${view === 'map' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}><MapIcon className="h-4 w-4" />Map</button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">Filter Results</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Radius */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Radius (meters)</label>
                <select
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="250">250 meters</option>
                  <option value="500">500 meters</option>
                  <option value="1000">1 km</option>
                  <option value="2000">2 km</option>
                  <option value="5000">5 km</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location Error */}
          {locationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800">{locationError}</p>
            </div>
          )}

          {/* Issues List */}
          {view === 'list' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No civic issues have been reported nearby yet.</p>
                <Link
                  href="/report"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Report One Now
                </Link>
              </div>
            ) : (
              issues.map((issue: Issue) => (
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
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {issue.category}
                        </span>
                        <StatusBadge status={issue.status as any} />
                      </div>
                      <p className="text-gray-900 font-medium mb-2">{issue.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {latitude !== null && longitude !== null && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {formatDistance(haversineMeters(latitude, longitude, issue.latitude, issue.longitude))} away
                          </span>
                        )}
                        <span>👍 {issue.upvotes} upvotes</span>
                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          )}

          {view === 'map' && (
            latitude !== null && longitude !== null ? (
              <IssueMap
                center={[latitude, longitude]}
                userLocation={[latitude, longitude]}
                issues={issues.map((i: Issue) => ({ id: i.id, category: i.category, description: i.description, status: i.status as any, upvotes: i.upvotes, imageUrl: i.imageUrl, latitude: i.latitude, longitude: i.longitude }))}
                issueHref={(id) => `/issues/${id}`}
                height={480}
              />
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600">{locationError || 'Waiting for your location…'}</p>
              </div>
            )
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
