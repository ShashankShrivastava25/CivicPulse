'use client';
import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import type { LeafletEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, MapPin, Search } from 'lucide-react';
import { ensureLeafletIcons, userLocationIcon } from './leaflet-setup';
import { Button } from '@/components/ui/Button';
import { useT } from '@/lib/i18n/I18nProvider';

export interface PickedLocation { latitude: number; longitude: number; address: string }

interface Props {
  value: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
  height?: number;
}

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // India, used only until a real location is known

/** Reverse-geocodes via OSM Nominatim (free, no key). Best-effort: falls back to raw coordinates on failure. */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('reverse geocode failed');
    const data = await res.json();
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

/**
 * Report-flow location input: current-location button, free-text search (Nominatim), click-to-place,
 * and a draggable marker so the citizen can fine-tune the pin before submitting.
 */
export default function LocationPicker({ value, onChange, height = 320 }: Props) {
  const t = useT();
  const [center, setCenter] = useState<[number, number]>(value ? [value.latitude, value.longitude] : DEFAULT_CENTER);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);

  useEffect(() => { ensureLeafletIcons(); }, []);

  const place = async (lat: number, lng: number) => {
    setCenter([lat, lng]);
    const address = await reverseGeocode(lat, lng);
    onChange({ latitude: lat, longitude: lng, address });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationError(t('map.locationDenied')); return; }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { place(pos.coords.latitude, pos.coords.longitude).finally(() => setLocating(false)); },
      () => { setLocationError(t('map.locationDenied')); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`, { headers: { Accept: 'application/json' } });
      const results = await res.json();
      if (results[0]) await place(Number(results[0].lat), Number(results[0].lon));
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={useCurrentLocation} loading={locating}><Crosshair className="h-3.5 w-3.5" />{t('map.useCurrentLocation')}</Button>
        <div className="flex flex-1 min-w-[200px] gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())}
            placeholder={t('map.searchLocation')}
            aria-label={t('map.searchLocation')}
            className="h-9 flex-1 rounded border border-line bg-surface px-3 text-sm"
          />
          <Button type="button" variant="secondary" size="sm" onClick={search} loading={searching}><Search className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {locationError && <p role="alert" className="text-xs text-danger">{locationError}</p>}

      <div style={{ height }} className="overflow-hidden rounded-lg border border-line">
        <MapContainer center={center} zoom={value ? 16 : 5} scrollWheelZoom className="h-full w-full">
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickToPlace onPick={place} />
          {value && (
            <Marker
              position={[value.latitude, value.longitude]}
              icon={userLocationIcon()}
              draggable
              eventHandlers={{
                dragend: (e: LeafletEvent) => {
                  const m = e.target as import('leaflet').Marker;
                  const pos = m.getLatLng();
                  place(pos.lat, pos.lng);
                },
              }}
              ref={markerRef}
            />
          )}
        </MapContainer>
      </div>
      <p className="flex items-center gap-1 text-xs text-muted"><MapPin className="h-3 w-3" aria-hidden />{t('map.dragMarker')}</p>

      {value && (
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div><p className="text-xs text-muted">{t('map.latitude')}</p><p>{value.latitude.toFixed(6)}</p></div>
          <div><p className="text-xs text-muted">{t('map.longitude')}</p><p>{value.longitude.toFixed(6)}</p></div>
          <div className="col-span-2 sm:col-span-1"><p className="text-xs text-muted">{t('map.address')}</p><p className="truncate">{value.address}</p></div>
        </div>
      )}
    </div>
  );
}
