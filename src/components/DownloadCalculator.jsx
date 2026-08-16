import React, { useState } from 'react';
import { HardDrive, Clock } from 'lucide-react';

export default function DownloadCalculator({ t, speedMbps = 0 }) {
  const [fileSizeGB, setFileSizeGB] = useState(120);
  const [customSpeed, setCustomSpeed] = useState(speedMbps || 100);

  // Update custom speed if speedMbps updates
  React.useEffect(() => {
    if (speedMbps > 0) {
      setCustomSpeed(speedMbps);
    }
  }, [speedMbps]);

  // Calculate download time in seconds: (GB * 1024 * 8) / Mbps
  const totalSeconds = Math.max(1, Math.round((fileSizeGB * 1024 * 8) / (customSpeed || 1)));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const presets = [
    { label: t.presetGTA, size: 120 },
    { label: t.presetCOD, size: 150 },
    { label: t.presetCyberpunk, size: 70 },
    { label: t.presetMovie, size: 25 },
    { label: t.presetGameUpdate, size: 15 }
  ];

  return (
    <div id="calculator" className="bento-card p-6 sm:p-7 h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-500/20 shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
              {t.calcTitle}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium hidden sm:block">
              {t.calcSubtitle}
            </p>
          </div>
        </div>

        {/* Preset Quick Buttons */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {presets.map((p) => (
            <button
              key={p.size}
              onClick={() => setFileSizeGB(p.size)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                fileSizeGB === p.size
                  ? 'bg-[#121316] dark:bg-[#88E724] text-[#88E724] dark:text-black shadow-xs'
                  : 'bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/20'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {/* File Size Slider */}
          <div className="bg-neutral-50/90 dark:bg-white/5 p-3.5 rounded-2xl border border-black/5 dark:border-white/10">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{t.fileSize}</label>
              <span className="text-xs font-black font-mono text-neutral-900 dark:text-white bg-white dark:bg-white/10 px-2 py-0.5 rounded-lg border border-black/10 dark:border-white/10">
                {fileSizeGB} GB
              </span>
            </div>
            <input
              type="range"
              aria-label={t.fileSize}
              min="1"
              max="300"
              step="1"
              value={fileSizeGB}
              onChange={(e) => setFileSizeGB(+e.target.value)}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-1">
              <span>1 GB</span>
              <span>150 GB</span>
              <span>300 GB</span>
            </div>
          </div>

          {/* Speed Slider */}
          <div className="bg-neutral-50/90 dark:bg-white/5 p-3.5 rounded-2xl border border-black/5 dark:border-white/10">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{t.currentSpeed}</label>
              <span className="text-xs font-black font-mono text-neutral-900 dark:text-white bg-white dark:bg-white/10 px-2 py-0.5 rounded-lg border border-black/10 dark:border-white/10">
                {customSpeed} Mbps
              </span>
            </div>
            <input
              type="range"
              aria-label={t.currentSpeed}
              min="5"
              max="1000"
              step="5"
              value={customSpeed}
              onChange={(e) => setCustomSpeed(+e.target.value)}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-1">
              <span>5 Mbps</span>
              <span>100 Mbps</span>
              <span>1000 Mbps</span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Display Box */}
      <div className="bg-[#121316] text-white p-4 rounded-2xl flex flex-col gap-3 shadow-md">
        {/* Time Result */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 text-[#88E724] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              {t.estimatedTime}
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-[#88E724] leading-tight">
              {hours > 0 && `${hours} ${t.hours} `}
              {minutes > 0 && `${minutes} ${t.minutes} `}
              {`${seconds} ${t.seconds}`}
            </div>
          </div>
        </div>

        {/* Transfer Speed — always on its own row, never overlaps */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-neutral-400 font-mono">{t.speedPerSec}</span>
          <strong className="text-white font-bold font-mono text-sm">
            {+(customSpeed / 8).toFixed(2)} MB/s
          </strong>
        </div>
      </div>
    </div>
  );
}
