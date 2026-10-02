import L from 'leaflet';

/**
 * Leaflet's default marker icons reference image files via relative URLs that don't resolve under
 * Next.js bundling. We rebuild them from the same package assets so the stock blue pin still works,
 * and additionally expose small colored dot icons used for issue markers by status.
 */
let patched = false;
export function ensureLeafletIcons() {
  if (patched) return;
  patched = true;
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const DOT_COLORS: Record<string, string> = {
  REPORTED: '#94a3b8', UNDER_REVIEW: '#38bdf8', ASSIGNED: '#6366f1',
  IN_PROGRESS: '#f59e0b', RESOLVED: '#22c55e', REJECTED: '#ef4444',
};

/** A small colored circle marker icon, built as inline SVG (no external image request). */
export function statusDotIcon(status: string): L.DivIcon {
  const color = DOT_COLORS[status] ?? '#94a3b8';
  return L.divIcon({
    className: 'cp-marker',
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

export function userLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: 'cp-marker',
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 0 0 4px rgba(37,99,235,.25)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}
