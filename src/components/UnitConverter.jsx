import React, { useState } from 'react';
import { Calculator, Copy, Check } from 'lucide-react';

export default function UnitConverter({ t }) {
  const [mbpsValue, setMbpsValue] = useState(100);
  const [copied, setCopied] = useState(false);

  const mbsValue = +(mbpsValue / 8).toFixed(2);
  const gbpsValue = +(mbpsValue / 1000).toFixed(3);
  const kbsValue = +(mbpsValue * 125).toFixed(0);

  const copyResult = () => {
    navigator.clipboard.writeText(`${mbpsValue} Mbps = ${mbsValue} MB/s (${gbpsValue} Gbps)`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="converter" className="bento-card p-6 sm:p-7 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-500/20 shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                {t.converterTitle}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium hidden sm:block">
                {t.mbpsToMbs}
              </p>
            </div>
          </div>

          <button
            onClick={copyResult}
            className="btn-tactile px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 border border-black/5 dark:border-white/10"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t.copied : t.copy}</span>
          </button>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
          {t.converterDesc}
        </p>

        {/* Input Slider */}
        <div className="mb-4 bg-neutral-50/90 dark:bg-white/5 p-3.5 rounded-2xl border border-black/5 dark:border-white/10">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{t.enterValue}</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                aria-label={t.enterValue}
                min="1"
                max="10000"
                value={mbpsValue}
                onChange={(e) => setMbpsValue(Math.max(1, +e.target.value))}
                className="w-20 px-2.5 py-0.5 text-xs font-mono font-bold bg-white dark:bg-white/10 text-neutral-900 dark:text-white border border-black/15 dark:border-white/15 rounded-lg text-right focus:outline-none focus:border-[#88E724] shadow-2xs"
              />
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Mbps</span>
            </div>
          </div>
          <input
            type="range"
            aria-label={t.enterValue}
            min="5"
            max="1000"
            value={mbpsValue}
            onChange={(e) => setMbpsValue(+e.target.value)}
            className="w-full cursor-pointer"
          />
        </div>

        {/* Live Converted Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center font-mono">
          <div className="p-3 rounded-2xl bg-neutral-50/90 dark:bg-white/5 border border-black/5 dark:border-white/10">
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold block mb-0.5">
              MegaByte (MB/s)
            </span>
            <span className="text-xl font-black text-neutral-900 dark:text-white">{mbsValue}</span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block mt-0.5">{t.unitMbPerSec}</span>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-50/90 dark:bg-white/5 border border-black/5 dark:border-white/10">
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold block mb-0.5">
              Gigabit (Gbps)
            </span>
            <span className="text-xl font-black text-neutral-900 dark:text-white">{gbpsValue}</span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block mt-0.5">{t.unitGbps}</span>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-50/90 dark:bg-white/5 border border-black/5 dark:border-white/10">
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold block mb-0.5">
              KiloByte (KB/s)
            </span>
            <span className="text-xl font-black text-neutral-900 dark:text-white">{kbsValue}</span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block mt-0.5">{t.unitKbPerSec}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
