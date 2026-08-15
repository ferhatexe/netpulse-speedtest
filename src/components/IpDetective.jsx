import React, { useState, useEffect } from 'react';
import { Network, MapPin, Wifi, Shield, Server, Cpu, Layers } from 'lucide-react';
import { fetchRealNetworkMeta } from '../utils/speedEngine';

/**
 * IpDetective — %100 Gerçek Veri
 *
 * - ISP / ASN / Şehir: fetchRealNetworkMeta() ile canlı çekilir
 * - Bağlantı Tipi: navigator.connection API (NetworkInformation) — yoksa bilinmiyor
 * - IPv6 Desteği: Cloudflare meta clientIp'e bakarak gerçek dual-stack tespiti
 * - MTU: navigator.connection.mtu veya bilinmiyor
 */

function detectConnectionType(t) {
  const conn = navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection;
  if (!conn) return null;

  const type = conn.type || '';           // 'wifi' | 'ethernet' | 'cellular' | 'none' | 'other'
  const effective = conn.effectiveType || ''; // 'slow-2g' | '2g' | '3g' | '4g'

  // Use hardware type first — most reliable
  if (type === 'ethernet') return t?.connEthernet || 'Ethernet / Fiber';
  if (type === 'wifi')     return t?.connWifi || 'WiFi';
  if (type === 'cellular') {
    // Only call it mobile if explicitly cellular
    if (effective === '4g') return t?.connMobileLte || 'Mobile 4G/LTE';
    if (effective === '3g') return t?.connMobile3g || 'Mobile 3G';
    if (effective === '2g') return t?.connMobile2g || 'Mobile 2G';
    return t?.connMobile || 'Mobile';
  }
  if (type === 'none') return t?.connOffline || 'Offline';

  // effectiveType alone — do NOT call it mobile; just describe speed.
  // Chrome reports '4g' for everything from decent DSL to 10G fibre, so this
  // must not be phrased as a link-speed claim.
  if (effective === '4g')    return t?.connFast || 'Fast connection (browser does not report link type)';
  if (effective === '3g')    return t?.connMedium || 'Medium speed (3G equivalent)';
  if (effective === '2g')    return t?.connSlow || 'Slow connection (2G)';
  if (effective === 'slow-2g') return t?.connVerySlow || 'Very slow connection';

  return null; // Unknown — better to show nothing than wrong info
}

export default function IpDetective({ t }) {
  const [meta, setMeta] = useState({
    isp: '—',
    asn: '—',
    city: '—',
    clientIp: '—',
    ipv4: null,
    ipv6: null,
  });
  const [connType, setConnType] = useState(null);

  useEffect(() => {
    // Detect connection type from browser API (no network needed)
    setConnType(detectConnectionType(t));

    // Fetch real network meta
    fetchRealNetworkMeta().then((data) => {
      if (data) setMeta(data);
    });
  }, [t]);

  // IPv6 support: if ipv6 field is non-empty string, dual-stack is active
  const hasIPv6 = meta.ipv6 && meta.ipv6.includes(':');
  const ipv6Label = hasIPv6
    ? `${t?.dualStackActive || 'Aktif · Dual-Stack'} (${meta.ipv6.length > 20 ? meta.ipv6.slice(0, 20) + '…' : meta.ipv6})`
    : (t?.ipv4Only || 'Yalnızca IPv4 (IPv6 tespit edilmedi)');

  const items = [
    {
      label: t.isp,
      value: meta.isp || '—',
      icon: Server,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      label: t.asn,
      value: meta.asn ? `${meta.asn} (Autonomous System)` : '—',
      icon: Cpu,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      label: t.city,
      value: meta.city || '—',
      icon: MapPin,
      color: 'text-amber-600 bg-amber-50'
    },
    {
      label: t.connectionType,
      value: connType || (t?.unknownApi || 'Bilinmiyor (API Desteklenmiyor)'),
      icon: Wifi,
      color: connType ? 'text-emerald-600 bg-emerald-50' : 'text-neutral-500 bg-neutral-100'
    },
    {
      label: t.ipv6Support,
      value: ipv6Label,
      icon: Shield,
      color: hasIPv6 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'
    },
    {
      // A browser cannot read the path MTU — this is the Ethernet default, not a measurement
      label: t.mtu,
      value: t?.standardMtu || '1500 Bytes (varsayılan — tarayıcıdan ölçülemez)',
      icon: Layers,
      color: 'text-neutral-500 bg-neutral-100'
    }
  ];

  return (
    <div id="ip-detective" className="bento-card p-6 sm:p-7 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 flex items-center justify-center border border-cyan-200 dark:border-cyan-500/20 shrink-0">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
              {t.ipTitle}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium hidden sm:block">
              {t.ipSubtitle}
            </p>
          </div>
        </div>

        {/* Clean 2-column spacious grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-neutral-50/90 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all shadow-2xs flex items-start gap-3"
              >
                <div className={`w-8 h-8 rounded-xl ${item.color} flex items-center justify-center shrink-0 border border-black/5 dark:border-white/10`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 block uppercase tracking-wider mb-0.5">
                    {item.label}
                  </span>
                  <div className="text-xs font-bold text-neutral-900 dark:text-white leading-snug break-words">
                    {item.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
