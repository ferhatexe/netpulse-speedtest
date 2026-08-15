import React, { useState, useEffect } from 'react';
import { MapPin, Server, Route, Play, Shield } from 'lucide-react';
import { fetchRealNetworkMeta } from '../utils/speedEngine';

/**
 * Shows both ends of the test: the client's approximate location and the
 * Cloudflare edge that actually served the measurement, with the great-circle
 * distance between them — which is the physical floor under the ping.
 *
 * The interactive OpenStreetMap embed is NOT loaded on page load. Doing so would
 * hand the visitor's IP to a third-party tile server before they asked for it,
 * which contradicts both the consent banner and the point of a privacy tool.
 * The preview is drawn locally and the embed loads only on an explicit click.
 */

// Great-circle distance in km
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Equirectangular projection into the preview viewBox
const projX = (lon) => ((lon + 180) / 360) * 100;
const projY = (lat) => ((90 - lat) / 180) * 100;

export default function LocationMap({ t }) {
  const [meta, setMeta] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchRealNetworkMeta().then((d) => {
      if (alive && d) setMeta(d);
    });
    return () => {
      alive = false;
    };
  }, []);

  const hasClient = Number.isFinite(meta?.lat) && Number.isFinite(meta?.lon);
  const hasEdge = Number.isFinite(meta?.coloLat) && Number.isFinite(meta?.coloLon);
  const distanceKm =
    hasClient && hasEdge ? haversineKm(meta.lat, meta.lon, meta.coloLat, meta.coloLon) : null;

  // Light-speed floor: fibre carries light at ~2/3 c, and the ping is a round trip
  const theoreticalMinMs = distanceKm != null ? (distanceKm * 2) / 200 : null;

  const embedSrc = hasClient
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${meta.lon - 0.6}%2C${meta.lat - 0.4}%2C${meta.lon + 0.6}%2C${meta.lat + 0.4}&layer=mapnik&marker=${meta.lat}%2C${meta.lon}`
    : null;

  const stat = (icon, label, value, accent) => (
    <div className="p-3.5 rounded-2xl border bg-neutral-50/90 border-black/5 dark:bg-white/5 dark:border-white/10">
      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5 mb-1">
        {icon}
        {label}
      </span>
      <div className={`text-sm font-black font-mono break-words ${accent || 'text-neutral-900 dark:text-white'}`}>
        {value}
      </div>
    </div>
  );

  return (
    <div id="map" className="bento-card p-6 sm:p-7">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
            {t?.mapTitle || 'Your location'}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            {meta?.city && meta.city !== '—' ? meta.city : '—'}
            {meta?.colo && meta.colo !== '—' ? ` · ${meta.colo} POP` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Map panel */}
        <div className="lg:col-span-3 relative rounded-2xl overflow-hidden border border-black/5 dark:border-white/10 min-h-[260px] bg-[#0F1620]">
          {mapLoaded && embedSrc ? (
            <iframe
              title={t?.mapTitle || 'Map'}
              src={embedSrc}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full absolute inset-0 border-0"
              style={{ minHeight: 260 }}
            />
          ) : (
            <>
              {/* Locally drawn preview — no third-party request */}
              <svg viewBox="0 0 100 56" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                <defs>
                  <linearGradient id="mapBg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#122031" />
                    <stop offset="100%" stopColor="#0C1119" />
                  </linearGradient>
                </defs>
                <rect width="100" height="56" fill="url(#mapBg)" />
                {[...Array(11)].map((_, i) => (
                  <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="56" stroke="rgba(136,231,36,0.09)" strokeWidth="0.15" />
                ))}
                {[...Array(7)].map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={i * 9.33} x2="100" y2={i * 9.33} stroke="rgba(136,231,36,0.09)" strokeWidth="0.15" />
                ))}

                {hasClient && hasEdge && (
                  <line
                    x1={projX(meta.lon)}
                    y1={projY(meta.lat) * 0.62}
                    x2={projX(meta.coloLon)}
                    y2={projY(meta.coloLat) * 0.62}
                    stroke="#88E724"
                    strokeWidth="0.4"
                    strokeDasharray="1.2 0.8"
                  />
                )}
                {hasEdge && (
                  <circle cx={projX(meta.coloLon)} cy={projY(meta.coloLat) * 0.62} r="1.1" fill="#00D4FF" />
                )}
                {hasClient && (
                  <>
                    <circle cx={projX(meta.lon)} cy={projY(meta.lat) * 0.62} r="2.4" fill="#88E724" opacity="0.25" />
                    <circle cx={projX(meta.lon)} cy={projY(meta.lat) * 0.62} r="1.1" fill="#88E724" />
                  </>
                )}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 bg-black/40 border border-white/10 rounded-full px-2.5 py-1">
                  <Shield className="w-3 h-3 text-[#88E724]" />
                  OpenStreetMap
                </span>
                <button
                  onClick={() => setMapLoaded(true)}
                  disabled={!embedSrc}
                  className="px-4 py-2 rounded-xl bg-[#88E724] hover:bg-[#74DB00] disabled:opacity-40 text-black text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  {t?.mapLoad || 'Load interactive map'}
                </button>
                <p className="text-[10px] text-neutral-400 max-w-xs leading-relaxed">
                  {t?.mapPrivacyNote ||
                    'Loading the map contacts OpenStreetMap, which will see your IP address. Nothing is requested until you click.'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Facts derived from the same lookup */}
        <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-1 gap-3">
          {stat(<MapPin className="w-3 h-3" />, t?.city || 'Location',
            hasClient ? `${meta.lat.toFixed(3)}, ${meta.lon.toFixed(3)}` : '—')}
          {stat(<Server className="w-3 h-3" />, t?.testServer || 'Edge',
            meta?.coloCity ? `${meta.coloCity} (${meta.colo})` : meta?.colo || '—',
            'text-[#00D4FF]')}
          {stat(<Route className="w-3 h-3" />, t?.mapDistance || 'Distance to edge',
            distanceKm != null ? `${Math.round(distanceKm)} km` : '—',
            'text-[#88E724]')}
          {stat(<Route className="w-3 h-3" />, t?.mapLightFloor || 'Physical ping floor',
            theoreticalMinMs != null ? `~${theoreticalMinMs.toFixed(1)} ms` : '—')}
        </div>
      </div>
    </div>
  );
}
