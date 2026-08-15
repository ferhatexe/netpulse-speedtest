import React, { useState } from 'react';
import { Shield, CheckCircle2, Copy, Check, ExternalLink, Sparkles, Lock } from 'lucide-react';

export default function AffiliateNordCard({ t }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText('NETPULSE74');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bento-card p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden h-full border-[#88E724]/20 bg-gradient-to-b from-white to-[#F9FAF4]">
      {/* Top Banner Tag */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="badge-pill bg-[#121316] text-[#88E724] border border-black/10">
            <Sparkles className="w-3 h-3 text-[#88E724]" />
            {t.sponsorBadge}
          </span>
          <span className="text-[11px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            {t.vpnDiscount}
          </span>
        </div>

        <h3 className="text-xl font-extrabold text-neutral-900 tracking-tight mb-2">
          {t.vpnTitle}
        </h3>
        <p className="text-xs text-neutral-600 leading-relaxed mb-4">
          {t.vpnSubtitle}
        </p>

        {/* Feature List */}
        <div className="space-y-2.5 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
            <CheckCircle2 className="w-4 h-4 text-[#74DB00] shrink-0" />
            <span>{t.vpnFeature1}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
            <CheckCircle2 className="w-4 h-4 text-[#74DB00] shrink-0" />
            <span>{t.vpnFeature2}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
            <CheckCircle2 className="w-4 h-4 text-[#74DB00] shrink-0" />
            <span>{t.vpnFeature3}</span>
          </div>
        </div>
      </div>

      {/* Action Area & Copy Coupon */}
      <div>
        {/* Promo code copy strip */}
        <div className="bg-neutral-100/80 rounded-xl p-2 flex items-center justify-between border border-black/5 mb-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono-code font-bold text-neutral-700">
            <Lock className="w-3.5 h-3.5 text-neutral-500" />
            <span>Kupon: <strong className="text-neutral-900">NETPULSE74</strong></span>
          </div>
          <button
            onClick={handleCopyCode}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-50 text-[10px] font-bold text-neutral-800 border border-black/10 flex items-center gap-1 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Kopyalandı</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-neutral-500" />
                <span>Kopyala</span>
              </>
            )}
          </button>
        </div>

        {/* Affiliate Link CTA */}
        <a
          href="https://nordvpn.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-tactile btn-lime w-full py-3.5 px-4 text-xs font-black tracking-wide uppercase flex items-center justify-center gap-2 shadow-lg group"
        >
          <span>{t.vpnCta}</span>
          <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
}
