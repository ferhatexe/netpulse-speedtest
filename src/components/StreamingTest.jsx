import React from 'react';
import { MonitorPlay, CheckCircle, AlertCircle, Play, Tv, Gamepad2, Sparkles } from 'lucide-react';

export default function StreamingTest({ t, downloadSpeed = 0 }) {
  const speed = downloadSpeed;

  const checks = [
    {
      title: t.yt4kTitle,
      icon: Play,
      req: '25 Mbps',
      isOk: speed >= 25,
      desc: t.yt4kDesc
    },
    {
      title: t.yt8kTitle,
      icon: Sparkles,
      req: '80 Mbps',
      isOk: speed >= 80,
      desc: t.yt8kDesc
    },
    {
      title: t.twitchTitle,
      icon: Tv,
      req: '15 Mbps',
      isOk: speed >= 15,
      desc: t.twitchDesc
    },
    {
      title: t.cloudGamingTitle,
      icon: Gamepad2,
      req: '45 Mbps',
      isOk: speed >= 45,
      desc: t.cloudGamingDesc
    }
  ];

  return (
    <div id="streaming" className="bento-card p-6 sm:p-7 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 shrink-0">
            <MonitorPlay className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
              {t.streamTitle}
            </h2>
            <p className="text-xs text-neutral-500 font-medium hidden sm:block">
              {t.streamSubtitle}
            </p>
          </div>
        </div>

        {/* Clean, spacious 2-column or list cards with zero text overlap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {checks.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-neutral-50/90 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all flex flex-col justify-between gap-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-neutral-500 dark:text-neutral-400 bg-white dark:bg-white/10 px-2 py-0.5 rounded-full border border-black/5 dark:border-white/10 shrink-0">
                    {item.req}
                  </span>
                </div>

                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  {item.desc}
                </p>

                <div className="pt-1.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                    {item.isOk ? '100% Bitrate' : 'Buffer'}
                  </span>
                  {item.isOk ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold">
                      <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{t.statusReady}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 text-[10px] font-bold">
                      <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{t.statusWarning}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
