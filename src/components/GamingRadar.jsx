import React, { useState, useEffect, useCallback } from 'react';
import { Gamepad2, RotateCw, Activity, Wifi, Zap } from 'lucide-react';

/**
 * GamingRadar — Pro Dark Card · Synchronized with SpeedTestHero Design System
 *
 * Layout mirrors SpeedTestHero:
 *   - bento-card-dark background (carbon #121316)
 *   - Same 4-tile metric grid as SpeedTestHero
 *   - Same neon glow border activation on active probe
 *   - Same phase progress bar (1→6 servers) with cyan/lime/amber gradient
 *   - Same font-mono metric values (font-black, 2xl-3xl)
 *   - PerformanceResourceTiming probe — minimum RTT across 4 samples
 *   - MAD jitter calculation (not random)
 */

const GAME_SERVERS = [
  {
    id: 'valo_tr',
    nameKey: 'gameValorantTr',
    label: 'Valorant',
    region: 'İstanbul · TR',
    endpoint: 'https://speed.cloudflare.com/__down?bytes=1',
    corsEnabled: true,
    color: { border: '#88E724', shadow: 'rgba(136,231,36,0.28)', text: 'text-[#88E724]', icon: '🎯' }
  },
  {
    id: 'valo_eu',
    nameKey: 'gameValorantEu',
    label: 'Valorant EU',
    region: 'Frankfurt · DE',
    endpoint: 'https://dynamodb.eu-central-1.amazonaws.com/ping',
    corsEnabled: false,
    color: { border: '#88E724', shadow: 'rgba(136,231,36,0.22)', text: 'text-[#88E724]', icon: '🎯' }
  },
  {
    id: 'cs2_vie',
    nameKey: 'gameCS2',
    label: 'CS2',
    region: 'Zürih · CH',
    // gstatic.com is anycast — it resolves to the nearest Google edge (İstanbul,
    // ~13ms) and never measured Vienna. AWS regional endpoints are region-pinned,
    // so eu-central-2 gives a real Central-Europe round-trip.
    endpoint: 'https://dynamodb.eu-central-2.amazonaws.com/ping',
    corsEnabled: false,
    color: { border: '#FF9900', shadow: 'rgba(255,153,0,0.25)', text: 'text-[#FF9900]', icon: '💥' }
  },
  {
    id: 'lol_euw',
    nameKey: 'gameLoL',
    label: 'LoL',
    region: 'Amsterdam · EUW',
    endpoint: 'https://dynamodb.eu-west-1.amazonaws.com/ping',
    corsEnabled: false,
    color: { border: '#00D4FF', shadow: 'rgba(0,212,255,0.25)', text: 'text-[#00D4FF]', icon: '⚔️' }
  },
  {
    id: 'fortnite',
    nameKey: 'gameFortnite',
    label: 'Fortnite',
    region: 'Paris · EU-W',
    endpoint: 'https://dynamodb.eu-west-3.amazonaws.com/ping',
    corsEnabled: false,
    color: { border: '#a855f7', shadow: 'rgba(168,85,247,0.25)', text: 'text-purple-400', icon: '🌀' }
  },
  {
    id: 'apex_lon',
    nameKey: 'gameApex',
    label: 'Apex',
    region: 'Londra · UK',
    endpoint: 'https://dynamodb.eu-west-2.amazonaws.com/ping',
    corsEnabled: false,
    color: { border: '#FF3B30', shadow: 'rgba(255,59,48,0.25)', text: 'text-rose-400', icon: '🔥' }
  },
];

const SAMPLE_COUNT = 4;
const SAMPLE_GAP_MS = 60;

/**
 * Subtracts server-side processing out of a wall-clock probe.
 *
 * Cloudflare's speed endpoints report their own Worker/edge time back in
 * `Server-Timing`; without removing it a probe reads ~40ms when the wire RTT is
 * ~3ms, which is what made the İstanbul target score worse than Vienna. Targets
 * that cannot report it are measured wall-clock and flagged as such.
 */
function correctForServerTime(header, wall) {
  if (!header) return { rtt: wall, corrected: false };

  let serverMs = 0;
  let sawDuration = false;

  for (const part of header.split(',')) {
    if (part.includes('cfL4')) {
      const minRtt = part.match(/min_rtt=(\d+)/);
      // Kernel-measured round-trip in microseconds — the most accurate value available
      if (minRtt) return { rtt: +minRtt[1] / 1000, corrected: true };
      continue;
    }
    const dur = part.match(/dur=([0-9.]+)/);
    if (dur) {
      serverMs += parseFloat(dur[1]);
      sawDuration = true;
    }
  }

  if (!sawDuration) return { rtt: wall, corrected: false };
  const rtt = wall - serverMs;
  return rtt > 0 ? { rtt, corrected: true } : { rtt: wall, corrected: false };
}

async function probeLatency({ endpoint, corsEnabled }) {
  const samples = [];
  let anyCorrected = false;

  // Warmup probe: Establish TCP/TLS handshake so subsequent probes measure true wire RTT
  try {
    const warmUrl = `${endpoint}${endpoint.includes('?') ? '&' : '?'}_nc=warm_${Date.now()}`;
    const mode = corsEnabled ? 'cors' : 'no-cors';
    await fetch(warmUrl, { mode, cache: 'no-store' });
  } catch {}

  // Actual measurement probes
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}_nc=${Date.now()}-${i}`;
    const t0 = performance.now();
    try {
      const mode = corsEnabled ? 'cors' : 'no-cors';
      const res = await fetch(url, { mode, cache: 'no-store' });
      const header = corsEnabled ? res.headers.get('server-timing') : null;
      const wall = performance.now() - t0;

      const { rtt, corrected } = correctForServerTime(header, wall);
      if (corrected) anyCorrected = true;

      samples.push(Math.max(1, Math.round(rtt)));
    } catch {
      // If probe fails completely, record null
    }
    await new Promise((r) => setTimeout(r, SAMPLE_GAP_MS));
  }

  if (samples.length === 0) {
    return { ping: null, jitter: null, corrected: false };
  }

  // 1. RFC 3393 Jitter calculation on chronological samples before sorting
  let jitterAcc = 0;
  for (let i = 1; i < samples.length; i++) {
    jitterAcc += Math.abs(samples[i] - samples[i - 1]);
  }
  const jitter = samples.length > 1 ? +(jitterAcc / (samples.length - 1)).toFixed(1) : 0;

  // 2. Minimum latency (true network ping)
  const minPing = Math.min(...samples);

  return { ping: minPing, jitter, corrected: anyCorrected };
}

function getPingBadge(ping, t) {
  if (ping === null || ping === undefined) return { label: '—', grade: '?', cls: 'text-neutral-400 border-neutral-700 bg-neutral-800' };
  if (ping < 20)  return { label: t?.badgeESports || 'A+ E-Spor',    grade: 'A+', cls: 'text-[#88E724] border-[#88E724]/40 bg-[#88E724]/10' };
  if (ping < 40)  return { label: t?.badgeSmooth || 'A Akıcı',       grade: 'A',  cls: 'text-lime-400 border-lime-500/40 bg-lime-500/10' };
  if (ping < 65)  return { label: t?.badgePlayable || 'B Oynanabilir', grade: 'B',  cls: 'text-amber-400 border-amber-500/40 bg-amber-500/10' };
  return            { label: t?.badgeLag || 'C Gecikmeli',         grade: 'C',  cls: 'text-rose-400 border-rose-500/40 bg-rose-500/10' };
}

export default function GamingRadar({ t }) {
  const [probing, setProbing] = useState(false);
  const [activeIdx, setActiveIdx] = useState(null); // which server is currently being probed
  const [rows, setRows] = useState(() =>
    GAME_SERVERS.map((s) => ({ ...s, ping: null, jitter: null }))
  );
  const [progress, setProgress] = useState(0);

  const runProbes = useCallback(async () => {
    if (probing) return;
    setProbing(true);
    setProgress(0);
    setActiveIdx(null);

    // Reset all rows to loading state
    setRows(GAME_SERVERS.map((s) => ({ ...s, ping: null, jitter: null })));

    // Probe sequentially so the progress bar fills left-to-right (more legible UX)
    for (let idx = 0; idx < GAME_SERVERS.length; idx++) {
      setActiveIdx(idx);
      const server = GAME_SERVERS[idx];
      const result = await probeLatency(server);
      setRows((prev) => {
        const next = [...prev];
        next[idx] = { ...server, ping: result.ping, jitter: result.jitter, corrected: result.corrected };
        return next;
      });
      setProgress(idx + 1);
    }

    setActiveIdx(null);
    setProbing(false);
  }, [probing]);

  useEffect(() => {
    runProbes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progressPct = Math.round((progress / GAME_SERVERS.length) * 100);

  return (
    /* ── Same dark card shell as SpeedTestHero ── */
    <div id="gaming" className="bento-card-dark p-6 sm:p-8 h-full flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#74DB00]/20 to-[#88E724]/30 border border-[#88E724]/40 flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-[#88E724]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {t?.gamingTitle || 'Canlı Oyun Ping Radarı'}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-colors duration-300 ${
                  probing
                    ? 'bg-[#88E724]/20 text-[#88E724] border-[#88E724]/40 animate-pulse'
                    : 'bg-white/5 text-neutral-400 border-white/10'
                }`}
              >
                {probing ? `PROBE ${Math.min(progress + 1, GAME_SERVERS.length)}/${GAME_SERVERS.length}` : 'CANLI RTT'}
              </span>
            </h2>
            <p className="text-xs text-neutral-500">
              {t?.gamingSubtitle || 'Popüler rekabetçi oyunların sunucularına anlık gecikme simülasyonu.'}
            </p>
          </div>
        </div>

        <button
          onClick={runProbes}
          disabled={probing}
          className="btn-tactile px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold flex items-center gap-1.5 border border-white/10 active:scale-95 cursor-pointer disabled:opacity-40"
        >
          <RotateCw className={`w-3.5 h-3.5 ${probing ? 'animate-spin text-[#88E724]' : ''}`} />
          <span className="hidden sm:inline">{t?.pingRadarRefresh || 'Radarı Yenile'}</span>
        </button>
      </div>

      {/* ── 6-Tile Metric Grid — mirrors SpeedTestHero 4-tile layout ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-10 flex-1">
        {rows.map((item, idx) => {
          const badge = getPingBadge(item.ping, t);
          const label = t?.[item.nameKey] ?? item.label;
          const isActive = activeIdx === idx;
          const isLoading = item.ping === null;

          return (
            <div
              key={item.id}
              className="bg-neutral-900/90 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 border"
              style={{
                borderColor: isActive ? item.color.border : 'rgba(255,255,255,0.08)',
                boxShadow: isActive ? `0 0 18px ${item.color.shadow}` : 'none',
              }}
            >
              {/* Tile Header */}
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
                  <span className="text-sm leading-none">{item.color.icon}</span>
                  {label}
                </span>
                {isActive ? (
                  <Wifi className="w-4 h-4 text-[#88E724] animate-pulse" />
                ) : isLoading ? (
                  <Zap className="w-4 h-4 text-neutral-600" />
                ) : (
                  <Zap className={`w-4 h-4 ${item.color.text}`} />
                )}
              </div>

              {/* Ping Value — matches SpeedTestHero text-2xl / 3xl font-black font-mono */}
              <div>
                <div className="flex items-baseline gap-1 font-mono">
                  {isLoading ? (
                    <span className="text-2xl sm:text-3xl font-black text-neutral-600 animate-pulse">—</span>
                  ) : (
                    <>
                      <span className="text-2xl sm:text-3xl font-black text-white">{item.ping}</span>
                      <span className="text-xs text-neutral-400 font-medium">ms</span>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1 gap-1">
                  <span className="text-[10px] text-neutral-500 font-mono truncate">
                    {isLoading ? (
                      <span className="opacity-50 italic">{t?.measuring || 'measuring…'}</span>
                    ) : (
                      `±${item.jitter}ms · ${item.region}`
                    )}
                  </span>
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full border shrink-0 ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Progress Bar + Footer — exact same structure as SpeedTestHero ── */}
      <div className="pt-4 border-t border-white/10 relative z-10 space-y-3">
        {/* Phase Labels & Percent */}
        <div className="flex justify-between items-center font-mono font-bold uppercase tracking-wider h-4 gap-1">
          {GAME_SERVERS.map((s, idx) => (
            <span
              key={s.id}
              className={`text-[8px] sm:text-[10px] transition-colors duration-200 truncate ${
                activeIdx === idx
                  ? 'text-[#88E724] font-black'
                  : progress > idx
                  ? 'text-neutral-400'
                  : 'text-neutral-600'
              }`}
            >
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.label.slice(0, 3)}</span>
            </span>
          ))}
          <span className="text-[8px] sm:text-[10px] text-white font-black shrink-0">{progressPct}%</span>
        </div>

        {/* Full-Width Progress Track — identical gradient to SpeedTestHero */}
        <div className="w-full h-2.5 bg-neutral-800/90 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#00D4FF] via-[#88E724] to-[#FFB800] transition-all duration-300 relative"
            style={{ width: `${progressPct}%` }}
          >
            {progressPct > 0 && progressPct < 100 && (
              <span className="absolute right-0 top-0 bottom-0 w-3 bg-white rounded-full blur-[1px] shadow-[0_0_8px_#fff]" />
            )}
          </div>
        </div>

        {/* Footer Info Row — truncates gracefully on mobile */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-neutral-500 font-mono min-w-0">
            <Activity className="w-3.5 h-3.5 text-[#88E724] shrink-0" />
            <span className="truncate">
              <span className="hidden sm:inline">Cloudflare IST · AWS EU-C1 · EU-C2 · EU-W1 · EU-W2 · EU-W3</span>
              <span className="sm:hidden">CF IST · AWS EU</span>
            </span>
          </div>
          <span className="text-[#88E724] font-bold font-mono text-[9px] sm:text-[10px] shrink-0 whitespace-nowrap">
            Min-RTT · 4 Sample
          </span>
        </div>
      </div>
    </div>
  );
}
