import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, ArrowDown, ArrowUp, Zap, Share2, Server, ShieldCheck, CheckCircle2, HardDrive, Shield, Settings, Sliders, X, Check, RefreshCw } from 'lucide-react';
import {
  measureRealPing,
  measureRealDownload,
  measureRealUpload,
  measureLoadedLatency,
  fetchRealNetworkMeta
} from '../utils/speedEngine';

/**
 * Progress allocation per phase. These are the single source of truth: the run
 * advances `progress` through these ranges and the track below renders one
 * segment per phase sized to the same range, so the label, the bar and the
 * percentage can never drift apart.
 */
const PHASES = [
  { key: 'ping',        labelKey: 'ping',        fallback: 'PING',        start: 0,  end: 15,  color: '#00D4FF' },
  { key: 'download',    labelKey: 'download',    fallback: 'DOWNLOAD',    start: 15, end: 60,  color: '#88E724' },
  { key: 'upload',      labelKey: 'upload',      fallback: 'UPLOAD',      start: 60, end: 90,  color: '#FFB800' },
  { key: 'bufferbloat', labelKey: 'bufferbloat', fallback: 'BUFFERBLOAT', start: 90, end: 100, color: '#88E724' }
];

export default function SpeedTestHero({ t, onOpenShare, onSpeedUpdate }) {
  const [testState, setTestState] = useState('idle'); // 'idle' | 'ping' | 'download' | 'upload' | 'bufferbloat' | 'completed'
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [progress, setProgress] = useState(0);
  const [peakSpeed, setPeakSpeed] = useState(0);
  const [downloadMB, setDownloadMB] = useState(0);
  const [uploadMB, setUploadMB] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isUpdatingIp, setIsUpdatingIp] = useState(false);

  const fireworksActiveRef = useRef(false);
  // Holds the lazily imported canvas-confetti module so reset() can reach it
  const confettiRef = useRef(null);

  // Fast.com Advanced Config State (Paced for realistic Gigabit measurement)
  const [config, setConfig] = useState({
    minStreams: 1,
    maxStreams: 16,
    minDuration: 12,
    maxDuration: 25,
    measureLoadedDuringUpload: true,
    alwaysShowMetrics: true
  });

  const [networkMeta, setNetworkMeta] = useState({
    isp: null,
    city: null,
    colo: null,
    clientIp: null
  });

  const [metrics, setMetrics] = useState({
    download: 0,
    upload: 0,
    ping: 0,
    jitter: 0,
    idlePing: 0,
    loadedPing: 0,
    // No grade until a bufferbloat run has actually produced one
    bufferbloatGrade: null
  });

  // Live Auto-Detection of VPN / Network Change
  // ONLY updates when test is idle or completed — never mid-test to avoid flickering
  const refreshNetworkMeta = async (force = false) => {
    // Skip if test is actively running (prevents ISP name flickering during test)
    if (!force && testState !== 'idle' && testState !== 'completed') return;
    try {
      setIsUpdatingIp(true);
      const meta = await fetchRealNetworkMeta();
      if (meta && meta.clientIp && meta.clientIp !== '—') {
        setNetworkMeta(meta);
      }
    } catch (e) {
    } finally {
      setTimeout(() => setIsUpdatingIp(false), 300);
    }
  };

  useEffect(() => {
    refreshNetworkMeta();

    const handleFocus = () => refreshNetworkMeta(); // respects idle-only guard
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshNetworkMeta();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 6s is sufficient for VPN change detection; CORS headers removed so no preflight floods
    const interval = setInterval(() => {
      if (testState === 'idle' || testState === 'completed') {
        refreshNetworkMeta();
      }
    }, 6000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [testState]);

  // Haptic Feedback strictly for mobile ONLY on complete
  const triggerHaptic = (pattern = [30]) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  };

  // Multi-Angle Fireworks Celebration (Controlled).
  // canvas-confetti is imported on demand: it only ever runs after a test
  // finishes, so shipping it in the initial bundle costs every visitor bytes
  // they may never use.
  const launchFireworks = async () => {
    let confetti;
    try {
      ({ default: confetti } = await import('canvas-confetti'));
    } catch {
      return; // the celebration is decorative; never let it break the result
    }
    confettiRef.current = confetti;

    fireworksActiveRef.current = true;
    const end = Date.now() + 1400;
    const colors = ['#88E724', '#74DB00', '#FFFFFF', '#FFB800', '#00D4FF'];

    (function frame() {
      if (!fireworksActiveRef.current) return;
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors
      });
      if (Date.now() < end && fireworksActiveRef.current) {
        requestAnimationFrame(frame);
      }
    }());
  };

  // Stop & Clear Confetti
  const clearFireworks = () => {
    fireworksActiveRef.current = false;
    try {
      confettiRef.current?.reset();
    } catch (e) {}
  };

  const testActiveRef = useRef(false);

  // 100% Real Speed Test Execution (Fast.com Paced Gigabit Standard)
  const runSpeedTest = async () => {
    // Guard against duplicate / concurrent runs
    if (testActiveRef.current) return;
    testActiveRef.current = true;

    clearFireworks();
    // Fetch fresh meta BEFORE test starts, then freeze it for the test duration
    await refreshNetworkMeta(true); // force=true bypasses idle guard

    setTestState('ping');
    setProgress(5);
    setCurrentSpeed(0);
    setPeakSpeed(0);
    setDownloadMB(0);
    setUploadMB(0);

    try {
      // 1. Real Ping & Jitter measurement (~200ms)
      const pingResult = await measureRealPing((livePing) => {
        setCurrentSpeed(livePing);
        setMetrics((prev) => ({ ...prev, ping: livePing }));
      });

      setMetrics((prev) => ({
        ...prev,
        ping: pingResult.minPing ?? 0,
        idlePing: pingResult.minPing ?? 0,
        jitter: pingResult.jitter ?? 0
      }));
      if (pingResult.minPing != null) setCurrentSpeed(pingResult.minPing);
      setProgress(15);

      // 2. Real Download (Configured with minDuration & maxStreams)
      setTestState('download');
      let maxDl = 0;
      // Duration respects user configuration (minDuration to maxDuration seconds)
      const effectiveDlDurationMs = Math.max(5000, Math.min(60000, (config.minDuration || 10) * 1000));
      const effectiveDlStreams = Math.max(1, Math.min(30, config.maxStreams || 16));

      const dlResult = await measureRealDownload(effectiveDlDurationMs, effectiveDlStreams, (liveMbps, pct, totalMB) => {
        setCurrentSpeed(liveMbps);
        if (liveMbps > maxDl) maxDl = liveMbps;
        setPeakSpeed(maxDl);
        setDownloadMB(totalMB);
        setProgress(15 + Math.round((pct / 100) * 45)); // 15% to 60%
      });

      const finalDownload = dlResult.speed;
      setDownloadMB(dlResult.totalMB);
      setMetrics((prev) => ({ ...prev, download: finalDownload }));
      if (onSpeedUpdate) onSpeedUpdate(finalDownload);
      setProgress(60);

      // 3. Real Upload (Configured with minDuration & maxStreams)
      setTestState('upload');
      const effectiveUpDurationMs = Math.max(4000, Math.min(60000, (config.minDuration || 8) * 800));
      const effectiveUpStreams = Math.max(1, Math.min(30, config.maxStreams || 16));

      const upResult = await measureRealUpload(effectiveUpDurationMs, effectiveUpStreams, (liveMbps, pct, totalMB) => {
        setCurrentSpeed(liveMbps);
        setUploadMB(totalMB);
        setProgress(60 + Math.round((pct / 100) * 30)); // 60% to 90%
      }, finalDownload);

      const finalUpload = upResult.speed;
      setUploadMB(upResult.totalMB);
      setMetrics((prev) => ({ ...prev, upload: finalUpload }));
      setProgress(90);

      // 4. Real Loaded Latency & Bufferbloat Benchmark (~600ms)
      setTestState('bufferbloat');
      const idleBaseline = pingResult.minPing ?? 0;
      setCurrentSpeed(idleBaseline);
      const bufferbloatResult = await measureLoadedLatency(idleBaseline, (liveLoaded) => {
        setCurrentSpeed(liveLoaded);
        setMetrics((prev) => ({
          ...prev,
          loadedPing: liveLoaded
        }));
      });

      setMetrics((prev) => ({
        ...prev,
        loadedPing: bufferbloatResult.loadedPing,
        bufferbloatGrade: bufferbloatResult.grade
      }));

      // Seamless Transition to Completed State — ONLY NOW fire celebration
      setProgress(100);
      setCurrentSpeed(finalDownload);
      setTestState('completed');

      triggerHaptic([60, 40, 80]);
      launchFireworks();
    } catch (err) {
      console.error('Speed test error:', err);
      setTestState('completed');
    } finally {
      testActiveRef.current = false;
    }
  };

  // Dynamic Phase Color Schemes
  const getPhaseTheme = () => {
    switch (testState) {
      case 'ping':
        return {
          gradientId: 'pingCyanGradient',
          glow: '#00D4FF',
          beadColor: '#00F0FF',
          textColor: 'text-[#00D4FF]',
          borderColor: 'border-[#00D4FF]',
          unit: 'ms',
          label: t?.phasePing || 'MEASURING: PING & JITTER'
        };
      case 'upload':
        return {
          gradientId: 'uploadAmberGradient',
          glow: '#FFB800',
          beadColor: '#FFB800',
          textColor: 'text-[#FFB800]',
          borderColor: 'border-[#FFB800]',
          unit: 'Mbps',
          label: t?.phaseUpload || 'MEASURING: REAL UPLOAD SPEED'
        };
      case 'bufferbloat':
        return {
          gradientId: 'bufferbloatGradient',
          glow: '#88E724',
          beadColor: '#88E724',
          textColor: 'text-[#88E724]',
          borderColor: 'border-[#88E724]',
          unit: 'Gecikme',
          label: t?.phaseBufferbloat || 'MEASURING: BUFFERBLOAT'
        };
      default: // 'download' | 'completed' | 'idle'
        return {
          gradientId: 'cyberNeonGradient',
          glow: '#88E724',
          beadColor: '#88E724',
          textColor: 'text-[#88E724]',
          borderColor: 'border-[#88E724]',
          unit: 'Mbps',
          label: t?.phaseDownload || 'MEASURING: REAL DOWNLOAD SPEED'
        };
    }
  };

  const currentTheme = getPhaseTheme();

  // Calibrated Smooth Monotonic Speed Gauge Geometry (260° Sweep)
  const displaySpeed = testState === 'completed' ? metrics.download : currentSpeed;
  
  // Smooth adaptive ceiling: only expands upward, never shrinks mid-test to prevent jumping
  let maxScale = 100;
  if (testState === 'ping') {
    maxScale = 50;
  } else if (testState === 'bufferbloat') {
    maxScale = 100;
  } else {
    const highestSeen = Math.max(peakSpeed, displaySpeed, metrics.download, 100);
    if (highestSeen > 1000) maxScale = 1500;
    else if (highestSeen > 500) maxScale = 1000;
    else if (highestSeen > 200) maxScale = 500;
    else maxScale = 200;
  }

  let fillRatio = 0;
  if (testState === 'ping') {
    // 1ms = 92% full arc, 50ms = 10%
    const normalizedPing = Math.max(1, Math.min(50, displaySpeed > 0 ? displaySpeed : 2));
    fillRatio = Math.max(0.08, Math.min(0.92, (50 - normalizedPing) / 50));
  } else {
    fillRatio = Math.min(0.96, Math.max(0.02, displaySpeed / maxScale));
  }

  // Equalizer cadence is driven by the same fillRatio that drives the needle, so
  // the bars and the gauge always describe the same moment. Idle ~1.15s per cycle,
  // saturated ~0.24s. During the ping phase fillRatio is inverted (low ping fills
  // the arc), which is still the right signal: a fast line animates fast.
  const equalizerCycleSec = +(1.15 - Math.min(1, Math.max(0, fillRatio)) * 0.91).toFixed(2);

  const cx = 130;
  const cy = 130;
  const r = 94;
  const circumference = 2 * Math.PI * r;
  const arcLength = circumference * (260 / 360);
  const strokeOffset = arcLength * (1 - fillRatio);

  const currentAngleDeg = 140 + fillRatio * 260;
  const currentAngleRad = (currentAngleDeg * Math.PI) / 180;
  const tipX = cx + r * Math.cos(currentAngleRad);
  const tipY = cy + r * Math.sin(currentAngleRad);

  return (
    <div id="speedtest" className="w-full">
      {/* Stable fixed-height card container */}
      <div className="bento-card-dark p-6 sm:p-9 rounded-3xl relative overflow-hidden transition-all backdrop-blur-xl bg-[#121316]/90 border border-white/10 min-h-[510px] flex flex-col justify-between">
        
        {/* Dynamic Ambient Glow Orbs */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-500 will-change-transform"
          style={{
            backgroundColor: `${currentTheme.glow}18`
          }}
        />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header (Client IP, Server POP & Settings Button - Pinned Top Right) */}
        <div className="flex items-center justify-between gap-3 relative z-10 w-full mb-2 sm:mb-0">
          {/* Left: Dynamic Test State / ISP Indicator */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: currentTheme.glow }}
              ></span>
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ backgroundColor: currentTheme.glow }}
              ></span>
            </span>
            <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider font-mono truncate ${currentTheme.textColor}`}>
              {testState === 'idle' && `${networkMeta?.isp || '—'} (${networkMeta?.city || '—'})`}
              {testState !== 'idle' && testState !== 'completed' && currentTheme.label}
              {testState === 'completed' && (t?.testComplete || 'TEST TAMAMLANDI')}
            </span>
          </div>

          {/* Right: IP, Server POP & Settings Controls - Always Pinned Right */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono shrink-0 ml-auto">
            {/* Live Client Public IPv4 Badge with Click to Refresh */}
            {networkMeta?.clientIp && (
              <button
                onClick={() => refreshNetworkMeta(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 text-[11px] font-mono shadow-xs transition-colors cursor-pointer group shrink-0"
                title={t?.refreshIp || 'Refresh IP'}
              >
                <Shield className="w-3 h-3 text-[#88E724] shrink-0" />
                <span className="font-bold">{networkMeta.clientIp}</span>
                <RefreshCw className={`w-2.5 h-2.5 text-neutral-500 group-hover:text-white transition-transform shrink-0 ${isUpdatingIp ? 'animate-spin text-[#88E724]' : ''}`} />
              </button>
            )}

            {downloadMB > 0 && (
              <span className="hidden lg:inline-flex items-center gap-1 text-neutral-300 shrink-0">
                <HardDrive className="w-3.5 h-3.5 text-[#88E724]" />
                {downloadMB}MB ↓ {uploadMB > 0 ? `| ${uploadMB}MB ↑` : ''}
              </span>
            )}
            
            {/* Server Badge */}
            <div className="hidden xs:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-neutral-300 shrink-0">
              <Server className="w-3 h-3 text-[#88E724] shrink-0" />
              <span className="hidden sm:inline">Cloudflare Edge · </span>
              <span className="font-bold">{networkMeta?.colo || 'IST'} POP</span>
            </div>

            {/* Settings Toggle Button */}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors border border-white/10 cursor-pointer shrink-0"
              title={t?.settingsTitle || 'Test Settings'}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Fast.com Style Interactive Settings Modal / Accordion */}
        {settingsOpen && (
          <div className="relative z-20 my-3 p-5 rounded-2xl bg-neutral-900/95 border border-white/15 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#88E724]" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  {t?.settingsHeading || 'Advanced Speed Test Configuration'}
                </h4>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-neutral-300">
              {/* Parallel Streams */}
              <div className="space-y-1.5">
                <span className="font-bold text-white block">{t?.streamsLabel || 'Parallel Connections'}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1">
                    <span className="text-neutral-400">{t?.minShort || 'Min.:'}</span>
                    <input
                      type="number"
                      value={config.minStreams}
                      onChange={(e) => setConfig({ ...config, minStreams: Math.max(1, +e.target.value) })}
                      className="w-14 px-2 py-1 rounded bg-black/40 border border-white/20 text-white font-bold text-center"
                      min="1"
                      max="10"
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    <span className="text-neutral-400">{t?.maxShort || 'Max.:'}</span>
                    <input
                      type="number"
                      value={config.maxStreams}
                      onChange={(e) => setConfig({ ...config, maxStreams: Math.max(1, Math.min(30, +e.target.value)) })}
                      className="w-14 px-2 py-1 rounded bg-black/40 border border-white/20 text-[#88E724] font-bold text-center"
                      min="1"
                      max="30"
                    />
                  </label>
                </div>
              </div>

              {/* Test Duration */}
              <div className="space-y-1.5">
                <span className="font-bold text-white block">{t?.durationLabel || 'Test Duration (seconds)'}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1">
                    <span className="text-neutral-400">{t?.minShort || 'Min.:'}</span>
                    <input
                      type="number"
                      value={config.minDuration}
                      onChange={(e) => setConfig({ ...config, minDuration: Math.max(5, +e.target.value) })}
                      className="w-14 px-2 py-1 rounded bg-black/40 border border-white/20 text-white font-bold text-center"
                      min="5"
                      max="30"
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    <span className="text-neutral-400">{t?.maxShort || 'Max.:'}</span>
                    <input
                      type="number"
                      value={config.maxDuration}
                      onChange={(e) => setConfig({ ...config, maxDuration: Math.max(10, Math.min(60, +e.target.value)) })}
                      className="w-14 px-2 py-1 rounded bg-black/40 border border-white/20 text-[#88E724] font-bold text-center"
                      min="10"
                      max="60"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Checkboxes & Action Buttons */}
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={config.measureLoadedDuringUpload}
                  onChange={(e) => setConfig({ ...config, measureLoadedDuringUpload: e.target.checked })}
                  className="rounded bg-black border-white/20 text-[#88E724] focus:ring-0"
                />
                <span>{t?.measureLoadedLabel || 'Measure loaded latency during upload'}</span>
              </label>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setConfig({ minStreams: 1, maxStreams: 16, minDuration: 12, maxDuration: 25, measureLoadedDuringUpload: true, alwaysShowMetrics: true })}
                  className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold"
                >
                  {t?.resetBtn || 'Reset'}
                </button>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="px-3.5 py-1 rounded-lg bg-[#88E724] hover:bg-[#74DB00] text-black text-xs font-black flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t?.saveBtn || 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Speedometer & Metrics Row */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 my-4 relative z-10">
          
          {/* Calibrated Speedometer */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center shrink-0">
            <svg className="w-full h-full will-change-transform" viewBox="0 0 260 260">
              <defs>
                <linearGradient id="cyberNeonGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#74DB00" />
                  <stop offset="70%" stopColor="#88E724" />
                  <stop offset="100%" stopColor="#00D4FF" />
                </linearGradient>

                <linearGradient id="pingCyanGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0077FF" />
                  <stop offset="60%" stopColor="#00D4FF" />
                  <stop offset="100%" stopColor="#00F0FF" />
                </linearGradient>

                <linearGradient id="uploadAmberGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF6600" />
                  <stop offset="70%" stopColor="#FF9900" />
                  <stop offset="100%" stopColor="#FFB800" />
                </linearGradient>

                <linearGradient id="bufferbloatGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#74DB00" />
                  <stop offset="100%" stopColor="#00D4FF" />
                </linearGradient>

                <filter id="cyberLaserGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background Arc */}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="12"
                strokeDasharray={`${arcLength} ${circumference}`}
                transform={`rotate(140 ${cx} ${cy})`}
                strokeLinecap="round"
              />

              {/* Scale Ticks */}
              {[...Array(17)].map((_, i) => {
                const tickAngleDeg = 140 + i * (260 / 16);
                const tickAngleRad = (tickAngleDeg * Math.PI) / 180;
                const isMajor = i % 4 === 0;
                const rInner = isMajor ? r - 14 : r - 10;
                const rOuter = r - 4;
                const x1 = cx + rInner * Math.cos(tickAngleRad);
                const y1 = cy + rInner * Math.sin(tickAngleRad);
                const x2 = cx + rOuter * Math.cos(tickAngleRad);
                const y2 = cy + rOuter * Math.sin(tickAngleRad);
                const isLit = (i / 16) <= fillRatio;

                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isLit ? currentTheme.glow : 'rgba(255, 255, 255, 0.18)'}
                    strokeWidth={isMajor ? '2' : '1'}
                    className="transition-colors duration-300"
                  />
                );
              })}

              {/* Scale end-markers — without these the axis silently rescales
                  from 500 to 1000 and the arc looks like it lost ground */}
              {testState !== 'idle' && testState !== 'ping' && testState !== 'bufferbloat' && (
                <>
                  <text
                    x={cx - r * 0.78}
                    y={cy + r * 0.80}
                    textAnchor="middle"
                    className="fill-neutral-600 font-mono"
                    style={{ fontSize: '9px', fontWeight: 700 }}
                  >
                    0
                  </text>
                  <text
                    x={cx + r * 0.78}
                    y={cy + r * 0.80}
                    textAnchor="middle"
                    className="fill-neutral-600 font-mono"
                    style={{ fontSize: '9px', fontWeight: 700 }}
                  >
                    {maxScale >= 1000 ? `${maxScale / 1000}G` : maxScale}
                  </text>
                </>
              )}

              {/* Active Neon Progress Arc */}
              {fillRatio > 0 && testState !== 'idle' && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={`url(#${currentTheme.gradientId})`}
                  strokeWidth="12"
                  strokeDasharray={`${arcLength} ${circumference}`}
                  strokeDashoffset={strokeOffset}
                  transform={`rotate(140 ${cx} ${cy})`}
                  strokeLinecap="round"
                  filter="url(#cyberLaserGlow)"
                  style={{
                    // Long enough to absorb a scale change (500 → 1000) as a glide
                    // rather than the needle snapping backwards mid-run
                    transition: 'stroke-dashoffset 0.32s cubic-bezier(0.22, 1, 0.36, 1)'
                  }}
                />
              )}

              {/* Laser Tip Bead — Locked to exact arc tip */}
              {fillRatio > 0.01 && testState !== 'idle' && (
                <g style={{ transition: 'all 0.32s cubic-bezier(0.22, 1, 0.36, 1)' }}>
                  <circle
                    cx={tipX}
                    cy={tipY}
                    r="7"
                    fill={currentTheme.beadColor}
                    opacity="0.5"
                  />
                  <circle
                    cx={tipX}
                    cy={tipY}
                    r="4"
                    fill="#FFFFFF"
                    stroke={currentTheme.beadColor}
                    strokeWidth="2"
                    style={{
                      filter: `drop-shadow(0 0 6px ${currentTheme.glow})`
                    }}
                  />
                </g>
              )}
            </svg>

            {/* Stable Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 select-none">
              {testState === 'idle' ? (
                <button
                  onClick={runSpeedTest}
                  className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#74DB00] to-[#88E724] text-black font-extrabold text-lg flex flex-col items-center justify-center gap-1 shadow-2xl hover:scale-105 active:scale-95 transition-transform group cursor-pointer border-4 border-black/15"
                  style={{
                    boxShadow: '0 0 45px rgba(136, 231, 36, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.6)'
                  }}
                >
                  <Play className="w-8 h-8 fill-black group-hover:translate-x-0.5 transition-transform" />
                  <span className="text-xs font-mono font-black tracking-widest">{t?.startTest || 'TESTİ BAŞLAT'}</span>
                </button>
              ) : (
                <div className="flex flex-col items-center w-full">
                  {/* Waveform / Phase Indicator */}
                  <div className="h-6 flex items-center justify-center mb-1">
                    {testState === 'completed' ? (
                      <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">
                        {t?.download || 'İndirme'}
                      </span>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 h-4 mb-1.5">
                          {[1, 2, 3, 4, 5, 6, 7].map((idx) => (
                            <span
                              key={idx}
                              className={`w-1 rounded-full animate-equalizer-${idx}`}
                              style={{
                                backgroundColor: currentTheme.glow,
                                // Cycle time tracks the live reading, so the bars
                                // visibly race on a fast link and idle on a slow one
                                animationDuration: `${equalizerCycleSec}s`,
                                '--eq-cycle': `${equalizerCycleSec}s`
                              }}
                            />
                          ))}
                        </div>
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${currentTheme.textColor}`}>
                          {testState === 'download' && '↓ ' + (t?.download || 'İndirme')}
                          {testState === 'upload' && '↑ ' + (t?.upload || 'Yükleme')}
                          {testState === 'ping' && '⚡ ' + (t?.ping || 'Ping')}
                          {testState === 'bufferbloat' && '🎯 ' + (t?.bufferbloat || 'Bufferbloat')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Main Speed Value (Fast.com formatting) */}
                  <div className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight my-0.5 h-16 flex items-center justify-center">
                    {displaySpeed >= 1000 && testState !== 'ping' && testState !== 'bufferbloat'
                      ? (displaySpeed / 1000).toFixed(1)
                      : displaySpeed}
                  </div>

                  {/* Unit Badge */}
                  <div className="h-6 flex items-center justify-center mt-1">
                    {testState === 'completed' ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#88E724]/20 border border-[#88E724]/30 text-[#88E724] text-xs font-mono font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#88E724]" />
                        <span>{metrics.download >= 1000 ? 'Gbps' : 'Mbps'}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-neutral-400 font-mono">
                        {testState === 'ping' ? 'ms' : testState === 'bufferbloat' ? (t?.loadedLatencyUnit || 'ms (loaded)') : currentSpeed >= 1000 ? 'Gbps' : 'Mbps'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metric Tiles (Fast.com structure) */}
          <div className="w-full lg:w-3/5 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Download Card */}
            <div className={`bg-neutral-900/90 border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 ${testState === 'download' ? 'border-[#88E724] shadow-[0_0_15px_rgba(136,231,36,0.25)]' : 'border-white/10'}`}>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-semibold">{t?.download || 'İndirme (Download)'}</span>
                <ArrowDown className={`w-4 h-4 ${testState === 'download' ? 'text-[#88E724] animate-bounce' : 'text-neutral-500'}`} />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {testState === 'download'
                    ? (currentSpeed >= 1000 ? (currentSpeed / 1000).toFixed(1) : currentSpeed)
                    : (metrics.download >= 1000 ? (metrics.download / 1000).toFixed(1) : (metrics.download || '—'))}
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">
                  {testState === 'download'
                    ? (currentSpeed >= 1000 ? 'Gbps' : 'Mbps')
                    : (metrics.download >= 1000 ? 'Gbps' : 'Mbps')} {downloadMB > 0 ? `(${downloadMB} MB)` : ''}
                </span>
              </div>
            </div>

            {/* Upload Card */}
            <div className={`bg-neutral-900/90 border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 ${testState === 'upload' ? 'border-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.25)]' : 'border-white/10'}`}>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-semibold">{t?.upload || 'Yükleme (Upload)'}</span>
                <ArrowUp className={`w-4 h-4 ${testState === 'upload' ? 'text-[#FFB800] animate-bounce' : 'text-neutral-500'}`} />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {testState === 'upload'
                    ? (currentSpeed >= 1000 ? (currentSpeed / 1000).toFixed(1) : currentSpeed)
                    : (metrics.upload >= 1000 ? (metrics.upload / 1000).toFixed(1) : (metrics.upload || '—'))}
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">
                  {testState === 'upload'
                    ? (currentSpeed >= 1000 ? 'Gbps' : 'Mbps')
                    : (metrics.upload >= 1000 ? 'Gbps' : 'Mbps')} {uploadMB > 0 ? `(${uploadMB} MB)` : ''}
                </span>
              </div>
            </div>

            {/* Latency (Ping & Jitter) */}
            <div className={`bg-neutral-900/90 border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 ${testState === 'ping' ? 'border-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.25)]' : 'border-white/10'}`}>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-semibold">{t?.ping || 'Ping (Gecikme)'}</span>
                <Zap className={`w-4 h-4 ${testState === 'ping' ? 'text-[#00D4FF] animate-pulse' : 'text-neutral-500'}`} />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {metrics.ping || (testState === 'ping' ? currentSpeed : '—')}{' '}
                  <span className="text-xs font-normal text-neutral-400">ms</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium block">
                  Jitter: {metrics.jitter ? `${metrics.jitter}ms` : '—'}
                </span>
              </div>
            </div>

            {/* Bufferbloat */}
            <div className={`bg-neutral-900/90 border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 ${testState === 'bufferbloat' ? 'border-[#88E724] shadow-[0_0_15px_rgba(136,231,36,0.25)]' : 'border-white/10'}`}>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-semibold">{t?.bufferbloat || 'Bufferbloat'}</span>
                <ShieldCheck className="w-4 h-4 text-[#88E724]" />
              </div>
              <div>
                <div className={`text-2xl sm:text-3xl font-black font-mono ${metrics.bufferbloatGrade ? 'text-[#88E724]' : 'text-neutral-600'}`}>
                  {metrics.bufferbloatGrade || '—'}
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">
                  {metrics.loadedPing ? `+${Math.max(0, metrics.loadedPing - metrics.idlePing)}ms ${t?.loadedPingDiff || 'fark'}` : (t?.gamingLatency || 'Oyun Gecikmesi')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Progress Bar & Action Row */}
        <div className="pt-4 border-t border-white/10 relative z-10 space-y-3">
          {/* Segmented track: each phase owns a slice sized to its share of the
              run, so a label always sits directly above the bar it describes */}
          {/* Below sm the four labels share a ~340px row, so every one of them
              hits `truncate` — "1. PİNG (GE…", "4. BUF…". One label for the
              phase that is actually running says more than four cut-off ones.
              Fixed height so the row does not jump when the test starts. */}
          <div className="sm:hidden h-4">
            {(() => {
              const idx = PHASES.findIndex((p) => p.key === testState);
              if (idx < 0) return null;
              const phase = PHASES[idx];
              return (
                <div
                  className="font-mono font-bold uppercase tracking-wider text-[10px] truncate"
                  style={{ color: phase.color }}
                >
                  {idx + 1}. {t?.[phase.labelKey] || phase.fallback}
                </div>
              );
            })()}
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1 flex items-stretch gap-1.5 min-w-0">
              {PHASES.map((phase, idx) => {
                const span = phase.end - phase.start;
                const fillPct = Math.max(0, Math.min(100, ((progress - phase.start) / span) * 100));
                const isActive = testState === phase.key;
                const isDone = fillPct >= 100;

                return (
                  <div key={phase.key} className="min-w-0 space-y-1.5" style={{ flexGrow: span, flexBasis: 0 }}>
                    <div
                      className={`hidden sm:block font-mono font-bold uppercase tracking-wider text-[10px] truncate transition-colors duration-200 ${
                        isActive ? 'font-black' : isDone ? 'text-neutral-400' : 'text-neutral-600'
                      }`}
                      style={isActive ? { color: phase.color } : undefined}
                    >
                      {idx + 1}. {t?.[phase.labelKey] || phase.fallback}
                    </div>
                    <div className="h-2.5 rounded-full bg-neutral-800/90 border border-white/5 p-0.5 overflow-hidden">
                      <div
                        className="h-full rounded-full relative transition-[width] duration-150 ease-linear"
                        style={{
                          width: `${fillPct}%`,
                          backgroundColor: phase.color,
                          boxShadow: fillPct > 0 ? `0 0 8px ${phase.color}66` : 'none'
                        }}
                      >
                        {isActive && fillPct > 0 && fillPct < 100 && (
                          <span className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full blur-[1px] shadow-[0_0_8px_#fff]" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <span className="font-mono font-black text-[9px] sm:text-[10px] text-white shrink-0 pb-0.5 tabular-nums w-9 text-right">
              {progress}%
            </span>
          </div>

          {/* Client Info Row */}
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-start sm:justify-between">

            {/* Network metadata — stacked on mobile, inline on desktop */}
            <div className="font-mono text-[10px] sm:text-xs leading-[1.7] min-w-0">
              {/* Row 1: City + Country */}
              <div className="text-neutral-400">
                <span className="text-white font-semibold">{networkMeta?.city || '—'}</span>
              </div>
              {/* Row 2: IP (always full, never truncated) */}
              <div>
                <span className="text-neutral-500">IP: </span>
                <span className="text-[#88E724] font-bold tracking-wide">{networkMeta?.clientIp || '—'}</span>
              </div>
              {/* Row 3: ISP + POP — hidden on very small screens, shown from 360px+ */}
              <div className="text-neutral-500">
                {networkMeta?.isp || '—'}
                <span className="mx-1">·</span>
                <span className="text-white font-semibold">{networkMeta?.colo || 'IST'} POP</span>
              </div>
            </div>

            {/* Action buttons */}
            <div
              className={`flex items-center gap-2 shrink-0 transition-opacity duration-300 ${
                testState === 'completed' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
            >
              <button
                onClick={runSpeedTest}
                className="btn-tactile flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-white/10 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>{t?.retest || 'Tekrar Test Et'}</span>
              </button>
              <button
                onClick={() => onOpenShare && onOpenShare({
                  ...metrics,
                  isp: networkMeta?.isp,
                  city: networkMeta?.city,
                  colo: networkMeta?.colo
                })}
                className="btn-tactile flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#74DB00] to-[#88E724] text-black text-xs font-black flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(136,231,36,0.4)] hover:brightness-110 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span>{t?.shareScorecard || 'Hız Kartını Paylaş'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
