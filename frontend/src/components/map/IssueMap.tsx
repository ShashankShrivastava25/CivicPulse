'use client';
import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import { ensureLeafletIcons, statusDotIcon, userLocationIcon } from './leaflet-setup';
import { StatusBadge } from '@/features/issues/Badges';
import { useT } from '@/lib/i18n/I18nProvider';
import type { IssueStatus } from '@/types';

export interface MapIssue {
  id: string; category: string; description: string; status: IssueStatus;
  upvotes: number; imageUrl?: string; latitude: number; longitude: number;
}

interface Props {
  issues: MapIssue[];
  center: [number, number];
  zoom?: number;
  userLocation?: [number, number] | null;
  height?: string | number;
  issueHref?: (id: string) => string;
  onBoundsChanged?: (center: { lat: number; lng: number }, radiusMeters: number) => void;
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center); }, [center, map]);
  return null;
}

function BoundsWatcher({ onChange }: { onChange: Props['onBoundsChanged'] }) {
  const map = useMap();
  useEffect(() => {
    if (!onChange) return;
    const handler = () => {
      const c = map.getCenter();
      const bounds = map.getBounds();
      const radius = c.distanceTo(bounds.getNorthEast());
      onChange({ lat: c.lat, lng: c.lng }, Math.round(radius));
    };
    map.on('moveend', handler);
    return () => { map.off('moveend', handler); };
  }, [map, onChange]);
  return null;
}

/** Shared Leaflet map for citizen/public-servant/admin issue views. Mount only via next/dynamic(ssr:false). */
export default function IssueMap({ issues, center, zoom = 14, userLocation, height = 420, issueHref, onBoundsChanged }: Props) {
  const t = useT();
  useEffect(() => { ensureLeafletIcons(); }, []);

  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border border-line">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Recenter center={center} />
        <BoundsWatcher onChange={onBoundsChanged} />
        {userLocation && <Marker position={userLocation} icon={userLocationIcon()} />}
        {issues.map((issue) => (
          <Marker key={issue.id} position={[issue.latitude, issue.longitude]} icon={statusDotIcon(issue.status)}>
            <Popup minWidth={200}>
              <div className="space-y-1.5">
                {issue.imageUrl && <img src={issue.imageUrl} alt="" className="h-24 w-full rounded object-cover" />}
                <p className="text-sm font-semibold">{issue.category}</p>
                <p className="line-clamp-2 text-xs text-slate-600">{issue.description}</p>
                <div className="flex items-center justify-between pt-0.5">
                  <StatusBadge status={issue.status} />
                  <span className="text-xs text-slate-500">{issue.upvotes} ▲</span>
                </div>
                {issueHref && (
                  <Link href={issueHref(issue.id)} className="mt-1 block rounded bg-slate-900 px-2 py-1 text-center text-xs font-medium text-white hover:bg-slate-700">
                    {t('map.viewIssue')}
                  </Link>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
