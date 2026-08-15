import React from 'react';
import { Sparkles, ExternalLink, ShieldCheck, Wifi } from 'lucide-react';

export default function AdBanner({ type = 'leaderboard' }) {
  if (type === 'leaderboard') {
    return (
      <div className="w-full bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 text-white rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm my-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#88E724]/20 text-[#88E724] flex items-center justify-center shrink-0 border border-[#88E724]/30">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
                Önerilen Donanım
              </span>
              <h4 className="text-sm font-bold text-white">
                WiFi 6 & Cat8 Gigabit Router Fırsatları
              </h4>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Bufferbloat ve ping dalgalanmalarını engelleyen profesyonel oyuncu router'ları %35 indirimde.
            </p>
          </div>
        </div>

        <a
          href="https://amazon.com.tr"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-tactile px-4 py-2 rounded-xl bg-[#88E724] hover:bg-[#74DB00] text-black text-xs font-black shrink-0 flex items-center gap-1.5 shadow"
        >
          <span>Modelleri İncele</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="bento-card p-6 bg-gradient-to-br from-neutral-900 to-neutral-950 text-white border-white/10 flex flex-col justify-between">
      <div>
        <span className="badge-pill bg-white/10 text-neutral-300 text-[10px] mb-3">
          REKLAM ALANI (ADSENSE)
        </span>
        <h4 className="text-base font-bold text-white mb-1">
          1000 Mbps Taahhütsüz Fiber İnternet
        </h4>
        <p className="text-xs text-neutral-400 leading-relaxed mb-4">
          Bölgenizdeki gerçek fiber altyapısını sorgulayın ve ilk ay ücretsiz geçiş yapın.
        </p>
      </div>

      <a
        href="#"
        className="btn-tactile w-full py-2.5 rounded-xl bg-white text-neutral-950 text-xs font-bold hover:bg-neutral-100 flex items-center justify-center gap-1.5"
      >
        <span>Altyapını Sorgula</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
