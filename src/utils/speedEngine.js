/**
 * NetMeter Gigabit Measurement Engine — Fast.com Architecture
 * Dual-Stack IPv4 & IPv6 Live Resolver with Zero Caching
 * Configurable Parallel Streams (1-30) & Test Duration (5-30s)
 */

const PING_ENDPOINT = 'https://speed.cloudflare.com/__down?bytes=0';
const DOWNLOAD_ENDPOINT = 'https://speed.cloudflare.com/__down?bytes=';
const UPLOAD_ENDPOINT = 'https://speed.cloudflare.com/__up';

/**
 * Parses Cloudflare's `Server-Timing` response header.
 *
 * A raw TTFB against speed.cloudflare.com is NOT the network round-trip: the
 * Worker that serves __down adds 25-600ms of its own processing time, which
 * dwarfs the actual wire latency. Cloudflare reports that processing time back
 * to us so it can be subtracted out:
 *
 *   cfSpeedEdge;dur=8, cfSpeedWorker;dur=23,
 *   cfL4;desc="?proto=TCP&rtt=2634&min_rtt=2117&..."
 *
 * - `dur=` values are server-side processing → subtract from TTFB.
 * - `cfL4` carries the kernel's own TCP stats in MICROSECONDS. `min_rtt` is the
 *   lowest round-trip the kernel has observed on this connection (the unloaded
 *   ping) and `rtt` is the current smoothed round-trip (rises under load, which
 *   is exactly what bufferbloat is).
 */
function parseServerTiming(headerValue) {
  const result = { serverMs: null, minRttMs: null, rttMs: null, rttVarMs: null };
  if (!headerValue) return result;

  let serverMs = 0;
  let sawDuration = false;

  for (const part of headerValue.split(',')) {
    if (part.includes('cfL4')) {
      const minRtt = part.match(/min_rtt=(\d+)/);
      const rtt = part.match(/[?&]rtt=(\d+)/);
      const rttVar = part.match(/rtt_var=(\d+)/);
      if (minRtt) result.minRttMs = +minRtt[1] / 1000;
      if (rtt) result.rttMs = +rtt[1] / 1000;
      if (rttVar) result.rttVarMs = +rttVar[1] / 1000;
      continue;
    }
    const dur = part.match(/dur=([0-9.]+)/);
    if (dur) {
      serverMs += parseFloat(dur[1]);
      sawDuration = true;
    }
  }

  if (sawDuration) result.serverMs = serverMs;
  return result;
}

// Server-Timing is also mirrored onto the resource entry (TAO-gated). Used when
// the header itself is not readable through CORS.
function parseServerTimingEntry(entry) {
  const result = { serverMs: null, minRttMs: null, rttMs: null, rttVarMs: null };
  if (!entry || !Array.isArray(entry.serverTiming) || entry.serverTiming.length === 0) return result;

  let serverMs = 0;
  let sawDuration = false;

  for (const st of entry.serverTiming) {
    if (st.name === 'cfL4') {
      const desc = String(st.description || '');
      const minRtt = desc.match(/min_rtt=(\d+)/);
      const rtt = desc.match(/[?&]rtt=(\d+)/);
      const rttVar = desc.match(/rtt_var=(\d+)/);
      if (minRtt) result.minRttMs = +minRtt[1] / 1000;
      if (rtt) result.rttMs = +rtt[1] / 1000;
      if (rttVar) result.rttVarMs = +rttVar[1] / 1000;
      continue;
    }
    if (typeof st.duration === 'number' && st.duration > 0) {
      serverMs += st.duration;
      sawDuration = true;
    }
  }

  if (sawDuration) result.serverMs = serverMs;
  return result;
}

// Reads the true time-to-first-byte for a completed request. The resource entry
// lands asynchronously, so this is only called after the probe gap has elapsed.
function readTtfb(url) {
  try {
    const entries = performance.getEntriesByName(url, 'resource');
    const entry = entries[entries.length - 1];
    if (!entry) return { ttfb: null, entry: null };
    if (entry.requestStart > 0 && entry.responseStart >= entry.requestStart) {
      return { ttfb: entry.responseStart - entry.requestStart, entry };
    }
    return { ttfb: null, entry };
  } catch {
    return { ttfb: null, entry: null };
  }
}

const PROBE_GAP_MS = 80;

// 1. True Wire Latency Engine — TTFB corrected by server-reported processing time
export async function measureRealPing(onProgress) {
  const PROBE_COUNT = 10;
  const probes = [];

  // HTTP/2 connection & TLS warmup so probes measure a live connection, not a handshake
  try {
    await fetch(`${PING_ENDPOINT}&_w=${Date.now()}`, { mode: 'cors', cache: 'no-store' });
  } catch {}

  for (let i = 0; i < PROBE_COUNT; i++) {
    const probeUrl = `${PING_ENDPOINT}&_probe=${i}_${Date.now()}`;
    const t0 = performance.now();
    let header = null;

    try {
      const res = await fetch(probeUrl, { method: 'GET', mode: 'cors', cache: 'no-store' });
      header = res.headers.get('server-timing');
      await res.arrayBuffer(); // 0 bytes; finalises the resource timing entry
    } catch {
      await new Promise((r) => setTimeout(r, PROBE_GAP_MS));
      continue; // a failed probe is dropped, never replaced with a made-up number
    }

    const wall = performance.now() - t0;
    const timing = parseServerTiming(header);
    probes.push({ url: probeUrl, wall, timing });

    if (onProgress) {
      // Live estimate from wall-clock (TTFB entry has not landed yet)
      const live = timing.minRttMs ?? (timing.serverMs != null ? wall - timing.serverMs : wall);
      if (live > 0) onProgress(Math.max(1, Math.round(live)));
    }

    await new Promise((r) => setTimeout(r, PROBE_GAP_MS));
  }

  if (probes.length === 0) {
    return { minPing: null, avgPing: null, jitter: null, wireRtt: null };
  }

  // Resolve each probe now that every resource entry has landed
  const samples = [];
  const wireRtts = [];
  const wireVars = [];

  for (const probe of probes) {
    const { ttfb, entry } = readTtfb(probe.url);
    let timing = probe.timing;
    if (timing.serverMs == null && timing.minRttMs == null) {
      timing = parseServerTimingEntry(entry);
    }

    if (timing.minRttMs != null && timing.minRttMs > 0) wireRtts.push(timing.minRttMs);
    if (timing.rttMs != null && timing.rttMs > 0) wireVars.push(timing.rttMs);

    const base = ttfb != null && ttfb > 0 ? ttfb : probe.wall;
    const corrected = timing.serverMs != null ? base - timing.serverMs : base;
    // A negative result means the clocks disagree — drop it rather than clamp it
    if (corrected > 0) samples.push(corrected);
  }

  if (samples.length === 0) {
    return { minPing: null, avgPing: null, jitter: null, wireRtt: null };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const avgPing = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);

  // Prefer the kernel's own min_rtt when Cloudflare reports it: it is the
  // unloaded wire round-trip and tracks ICMP ping to within ~1ms.
  const wireRtt = wireRtts.length > 0 ? Math.min(...wireRtts) : null;
  const minPing = wireRtt != null ? Math.max(1, Math.round(wireRtt)) : Math.max(1, Math.round(sorted[0]));

  // Jitter has to come from the same layer as the ping, or the two contradict
  // each other. When the kernel stats are available, jitter is the mean deviation
  // of the smoothed round-trip from that floor — a wire-level figure that tracks
  // ICMP jitter. (`rtt_var` is deliberately not used: it is inflated on young,
  // low-traffic connections and reads several ms high.) The RFC 3393 fallback
  // over corrected TTFBs still carries browser scheduling noise.
  let jitter;
  if (wireRtt != null && wireVars.length > 0) {
    const deviation = wireVars.reduce((acc, rtt) => acc + Math.abs(rtt - wireRtt), 0) / wireVars.length;
    jitter = +deviation.toFixed(1);
  } else {
    let jitterSum = 0;
    for (let i = 1; i < samples.length; i++) {
      jitterSum += Math.abs(samples[i] - samples[i - 1]);
    }
    jitter = samples.length > 1 ? +(jitterSum / (samples.length - 1)).toFixed(1) : 0;
  }

  return {
    minPing,
    avgPing: Math.max(minPing, avgPing),
    jitter,
    wireRtt
  };
}

/**
 * Throughput accounting for the transfer tests.
 *
 * Reported speed is bytes actually moved divided by the time they took — nothing
 * else. Two details matter for that number to be both honest and fair:
 *
 * - TCP slow start means the first seconds run below line rate. Including them
 *   under-reports a fast link, so the opening ramp is excluded from the window
 *   (but only when enough test time remains for the rest to be meaningful).
 * - Nothing is ever taken from the peak. A percentile of the instantaneous
 *   samples is a measure of the best moment, not of throughput, and reporting it
 *   inflated this test by ~45% against its own byte counter.
 */
const RAMP_UP_SEC = 1.5;
const MIN_WINDOW_SEC = 3;

/**
 * Live rate for the gauge, measured over a trailing window rather than a single
 * tick.
 *
 * A per-tick delta reads zero whenever no bytes landed in that particular 75ms
 * slice — which happens constantly: the main thread stalls under render load,
 * and uploads only account bytes when a whole chunk finishes. Those zeros made
 * the needle collapse. Averaging over the last ~900ms removes them without
 * putting a floor under the reading, so a genuine stall still shows as a drop.
 */
function createLiveRateMeter(windowMs = 900) {
  const samples = [];

  return {
    push(now, totalBytes) {
      samples.push({ t: now, bytes: totalBytes });
      const cutoff = now - windowMs;
      while (samples.length > 2 && samples[0].t < cutoff) samples.shift();
    },
    rate() {
      if (samples.length < 2) return null;
      const first = samples[0];
      const last = samples[samples.length - 1];
      const sec = (last.t - first.t) / 1000;
      if (sec <= 0) return null;
      return ((last.bytes - first.bytes) * 8) / (sec * 1000000);
    }
  };
}

function createThroughputWindow(startTime, durationMs) {
  const totalSec = durationMs / 1000;
  // Only skip the ramp when the remaining window stays long enough to be stable
  const skipRamp = totalSec - RAMP_UP_SEC >= MIN_WINDOW_SEC;
  let windowStartTime = startTime;
  let windowStartBytes = 0;
  let armed = !skipRamp;

  return {
    mark(now, totalBytes) {
      if (armed) return;
      if ((now - startTime) / 1000 >= RAMP_UP_SEC) {
        windowStartTime = now;
        windowStartBytes = totalBytes;
        armed = true;
      }
    },
    result(now, totalBytes) {
      const elapsedSec = (now - windowStartTime) / 1000;
      const bytes = totalBytes - windowStartBytes;
      if (elapsedSec <= 0 || bytes <= 0) return 0;
      return +((bytes * 8) / (elapsedSec * 1000000)).toFixed(1);
    }
  };
}

// 2. Real Download Test (Configurable Streams & Duration)
export async function measureRealDownload(durationMs = 6500, streamsCount = 8, onUpdate) {
  // Every new __down request pays the Cloudflare Worker's 25-600ms startup stall
  // before the first byte arrives. At gigabit a 25MB chunk drains in ~2s, so each
  // stream kept re-paying that stall and the link never stayed saturated. Large
  // chunks mean roughly one request per stream for the whole run; the unread tail
  // is aborted at the end and costs nothing.
  const chunkSize = 200000000;
  let totalBytesLoaded = 0;
  let isRunning = true;
  const startTime = performance.now();
  const controller = new AbortController();

  let smoothedSpeed = 0;

  const worker = async () => {
    while (isRunning) {
      try {
        const response = await fetch(`${DOWNLOAD_ENDPOINT}${chunkSize}&_t=${Math.random()}`, {
          signal: controller.signal,
          cache: 'no-store',
          mode: 'cors'
        });

        if (response.body && response.body.getReader) {
          const reader = response.body.getReader();
          while (isRunning) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value && value.length) {
              totalBytesLoaded += value.length;
            }
          }
        } else {
          const blob = await response.blob();
          if (blob) totalBytesLoaded += blob.size;
        }
      } catch (err) {
        if (err && err.name === 'AbortError') break;
        await new Promise((r) => setTimeout(r, 50));
      }
    }
  };

  Promise.all([...Array(Math.max(1, streamsCount))].map(() => worker())).catch(() => {});

  const window = createThroughputWindow(startTime, durationMs);
  const live = createLiveRateMeter();

  const interval = setInterval(() => {
    const now = performance.now();
    const elapsedTotalSec = (now - startTime) / 1000;

    window.mark(now, totalBytesLoaded);
    live.push(now, totalBytesLoaded);

    if (elapsedTotalSec > 0.15) {
      const rate = live.rate();
      if (rate != null) {
        // Light EWMA on top of the trailing average, purely to keep the needle
        // from stepping; it cannot bias the reported result, which is computed
        // from the byte counter independently of anything shown here
        smoothedSpeed = smoothedSpeed === 0 ? rate : 0.6 * rate + 0.4 * smoothedSpeed;
      }

      const displayMbps = +Math.max(0, smoothedSpeed).toFixed(1);
      const totalMB = +(totalBytesLoaded / (1024 * 1024)).toFixed(0);
      const progressPercent = Math.min(100, Math.round((elapsedTotalSec / (durationMs / 1000)) * 100));

      if (onUpdate) onUpdate(displayMbps, progressPercent, totalMB);
    }
  }, 75);

  await new Promise((resolve) => setTimeout(resolve, durationMs));
  isRunning = false;
  try { controller.abort(); } catch (e) {}
  clearInterval(interval);

  const totalMB = +(totalBytesLoaded / (1024 * 1024)).toFixed(0);
  const speed = window.result(performance.now(), totalBytesLoaded);

  return { speed, totalMB };
}

// 3. Real Upload Test (Configurable Streams & Duration)
export async function measureRealUpload(durationMs = 5000, streamsCount = 8, onUpdate, knownDownMbps = 0) {
  // Chunk size only affects how often the Worker's startup stall is re-paid; the
  // byte accounting below no longer depends on it. Still scaled to the line so a
  // slow connection is not stuck on one enormous request.
  const payloadSize = knownDownMbps > 300 ? 16 * 1024 * 1024
                    : knownDownMbps > 50  ? 4 * 1024 * 1024
                    : 1024 * 1024;
  const dummyData = new Uint8Array(payloadSize);
  for (let i = 0; i < dummyData.length; i += 2048) {
    dummyData[i] = Math.floor(Math.random() * 255);
  }
  const payloadBlob = new Blob([dummyData], { type: 'application/octet-stream' });

  let totalBytesSent = 0;
  let isRunning = true;
  const startTime = performance.now();
  let smoothedSpeed = 0;
  const inFlight = new Set();

  /**
   * Uploads go through XMLHttpRequest rather than fetch because only XHR reports
   * upload progress. With fetch, a chunk is credited only when the whole POST
   * resolves, so up to streams x chunkSize (256MB at 16x16MB) sits in flight
   * uncounted at each window edge — nearly 30% of the run. That quantisation is
   * what made upload read ~18% above its own byte counter while download read
   * within 1%. `upload.onprogress` credits bytes as they go out, matching the
   * download reader's granularity.
   */
  const worker = () =>
    new Promise((resolve) => {
      const pump = () => {
        if (!isRunning) return resolve();

        const xhr = new XMLHttpRequest();
        inFlight.add(xhr);
        let credited = 0;

        xhr.upload.onprogress = (e) => {
          if (e.loaded > credited) {
            totalBytesSent += e.loaded - credited;
            credited = e.loaded;
          }
        };
        xhr.onloadend = () => {
          inFlight.delete(xhr);
          if (isRunning) pump();
          else resolve();
        };

        try {
          xhr.open('POST', `${UPLOAD_ENDPOINT}?_t=${Math.random()}`);
          xhr.send(payloadBlob);
        } catch {
          inFlight.delete(xhr);
          setTimeout(() => (isRunning ? pump() : resolve()), 50);
        }
      };
      pump();
    });

  Promise.all([...Array(Math.max(1, streamsCount))].map(() => worker())).catch(() => {});

  const window = createThroughputWindow(startTime, durationMs);
  const live = createLiveRateMeter(900);

  const interval = setInterval(() => {
    const now = performance.now();
    const elapsedTotalSec = (now - startTime) / 1000;

    window.mark(now, totalBytesSent);
    live.push(now, totalBytesSent);

    if (elapsedTotalSec > 0.15) {
      const rate = live.rate();
      if (rate != null) {
        smoothedSpeed = smoothedSpeed === 0 ? rate : 0.5 * rate + 0.5 * smoothedSpeed;
      }

      const displayMbps = +Math.max(0, smoothedSpeed).toFixed(1);
      const totalMB = +(totalBytesSent / (1024 * 1024)).toFixed(0);
      const progressPercent = Math.min(100, Math.round((elapsedTotalSec / (durationMs / 1000)) * 100));

      if (onUpdate) onUpdate(displayMbps, progressPercent, totalMB);
    }
  }, 75);

  await new Promise((resolve) => setTimeout(resolve, durationMs));
  isRunning = false;
  clearInterval(interval);

  // Snapshot before aborting: bytes already on the wire are real and counted,
  // and aborting must not race the final reading
  const endTime = performance.now();
  const finalBytes = totalBytesSent;
  for (const xhr of inFlight) {
    try { xhr.abort(); } catch {}
  }
  inFlight.clear();

  const totalMB = +(finalBytes / (1024 * 1024)).toFixed(0);
  const speed = window.result(endTime, finalBytes);

  return { speed, totalMB };
}

// 4. Real Loaded Latency (Bufferbloat Benchmark)
// Fires a background download saturation stream then measures TTFB under load.
export async function measureLoadedLatency(idlePing = 2, onProgress) {
  const sessionToken = Date.now().toString(36);
  const PROBE_BASE = 'https://speed.cloudflare.com/__down?bytes=0';
  const LOAD_URL   = `https://speed.cloudflare.com/__down?bytes=15000000&_load=${sessionToken}`;
  const controller = new AbortController();
  const probes = [];

  // Start background saturation stream and drain it, otherwise backpressure
  // stalls the transfer and the link never actually saturates
  fetch(LOAD_URL, { cache: 'no-store', mode: 'cors', signal: controller.signal })
    .then(async (res) => {
      if (!res.body?.getReader) return;
      const reader = res.body.getReader();
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    })
    .catch(() => {});

  // Wait for saturation to ramp up
  await new Promise((r) => setTimeout(r, 300));

  for (let i = 0; i < 5; i++) {
    const probeUrl = `${PROBE_BASE}&_lp=${i}&_s=${sessionToken}&_t=${Date.now()}`;
    const t0 = performance.now();
    let header = null;

    try {
      const res = await fetch(probeUrl, { cache: 'no-store', mode: 'cors' });
      header = res.headers.get('server-timing');
      await res.arrayBuffer();
    } catch {
      await new Promise((r) => setTimeout(r, PROBE_GAP_MS));
      continue; // dropped, not substituted
    }

    const wall = performance.now() - t0;
    const timing = parseServerTiming(header);
    probes.push({ url: probeUrl, wall, timing });

    if (onProgress) {
      const live = timing.rttMs ?? (timing.serverMs != null ? wall - timing.serverMs : wall);
      if (live > 0) onProgress(Math.max(1, Math.round(live)), Math.max(0, Math.round(live - idlePing)));
    }

    await new Promise((r) => setTimeout(r, PROBE_GAP_MS));
  }

  try { controller.abort(); } catch {}

  if (probes.length === 0) {
    return { loadedPing: null, delta: null, grade: null };
  }

  // Same correction as the idle ping, so idle and loaded are directly comparable.
  // cfL4 `rtt` is the kernel's smoothed round-trip on the saturated connection —
  // the most direct bufferbloat signal available.
  const samples = [];
  for (const probe of probes) {
    if (probe.timing.rttMs != null && probe.timing.rttMs > 0) {
      samples.push(probe.timing.rttMs);
      continue;
    }
    const { ttfb, entry } = readTtfb(probe.url);
    const timing = probe.timing.serverMs != null ? probe.timing : parseServerTimingEntry(entry);
    const base = ttfb != null && ttfb > 0 ? ttfb : probe.wall;
    const corrected = timing.serverMs != null ? base - timing.serverMs : base;
    if (corrected > 0) samples.push(corrected);
  }

  if (samples.length === 0) {
    return { loadedPing: null, delta: null, grade: null };
  }

  samples.sort((a, b) => a - b);
  const loadedPing = Math.max(1, Math.round(samples[Math.floor(samples.length / 2)]));
  const delta = Math.max(0, loadedPing - idlePing);

  let grade;
  if (delta > 35) grade = 'D';
  else if (delta > 20) grade = 'C';
  else if (delta > 8)  grade = 'B';
  else                 grade = 'A+';

  return { loadedPing, delta, grade };
}

// 5. Zero-Cache Live Dual-Stack Resolver (Detects instant VPN disconnects/connects)
export async function fetchRealNetworkMeta() {
  let resolvedIPv4 = null;
  let resolvedIPv6 = null;
  const cacheBuster = `_t=${Date.now()}&_r=${Math.random()}`;

  // Step 1: Query IPv4 — no custom headers (avoids CORS preflight)
  try {
    const ip4Res = await fetch(`https://api.ipify.org?format=json&${cacheBuster}`, {
      cache: 'no-store'
      // NOTE: Do NOT add Cache-Control/Pragma headers — they trigger CORS preflight
      // which api.ipify.org does not support. URL cachebuster is sufficient.
    });
    if (ip4Res.ok) {
      const d4 = await ip4Res.json();
      if (d4 && d4.ip && !d4.ip.includes(':')) {
        resolvedIPv4 = d4.ip.trim();
      }
    }
  } catch (e) {}

  // Step 2: Cloudflare Edge Meta — no custom headers (avoids CORS preflight)
  try {
    const res = await fetch(`https://speed.cloudflare.com/meta?${cacheBuster}`, {
      cache: 'no-store'
      // NOTE: cache-control header triggers preflight which Cloudflare /meta rejects
    });
    if (res && res.ok) {
      const data = await res.json();
      if (data) {
        if (data.clientIp && data.clientIp.includes(':')) {
          resolvedIPv6 = data.clientIp.trim();
        } else if (data.clientIp && !resolvedIPv4) {
          resolvedIPv4 = data.clientIp.trim();
        }

        let cityName = 'İstanbul';
        if (typeof data.city === 'string') {
          cityName = data.city;
        } else if (data.city && typeof data.city === 'object') {
          cityName = data.city.city || data.city.region || 'İstanbul';
        }
        
        let countryCode = 'TR';
        if (typeof data.country === 'string') {
          countryCode = data.country;
        } else if (data.city && typeof data.city === 'object' && data.city.cca2) {
          countryCode = data.city.cca2;
        }

        const ispName = typeof data.asOrganization === 'string' 
          ? data.asOrganization 
          : (typeof data.isp === 'string' ? data.isp : null);
          
        const asnCode = data.asn ? `AS${data.asn}` : null;
        const colo = data.colo;
        const coloCode = typeof colo === 'string' ? colo : (colo?.iata || 'IST');

        const primaryIp = resolvedIPv4 || data.clientIp || null;

        // Cloudflare reports both endpoints of the test: the client's approximate
        // location and the edge datacentre that actually served it
        const num = (v) => {
          const n = typeof v === 'string' ? parseFloat(v) : v;
          return Number.isFinite(n) ? n : null;
        };

        return {
          clientIp: primaryIp || '—',
          ipv4: primaryIp || '—',
          ipv6: resolvedIPv6 || '',
          isp: ispName || '—',
          asn: asnCode || '—',
          city: cityName ? `${cityName}, ${countryCode}` : '—',
          colo: coloCode || '—',
          lat: num(data.latitude),
          lon: num(data.longitude),
          coloCity: colo && typeof colo === 'object' ? colo.city || null : null,
          coloLat: colo && typeof colo === 'object' ? num(colo.lat) : null,
          coloLon: colo && typeof colo === 'object' ? num(colo.lon) : null
        };
      }
    }
  } catch (e) {}

  // Fallback: if ipify succeeded but Cloudflare failed
  if (resolvedIPv4) {
    return {
      clientIp: resolvedIPv4,
      ipv4: resolvedIPv4,
      ipv6: resolvedIPv6 || '',
      isp: '—',
      asn: '—',
      city: '—',
      colo: '—'
    };
  }

  // Full fallback — all APIs failed (offline / strict CORS environment)
  return {
    clientIp: '—',
    ipv4: '—',
    ipv6: '',
    isp: '—',
    asn: '—',
    city: '—',
    colo: '—'
  };
}
