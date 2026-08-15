import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function SeoFaqSection({ t }) {
  const [openIdx, setOpenIdx] = useState(0);

  const faqList = t?.faqs || [];

  return (
    <section id="faq" className="mt-12">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="badge-pill bg-[#121316] text-[#88E724] border border-white/10 text-[10px] mb-2">
          {t?.faqBadge || 'REHBER & BİLGİ MERKEZİ'}
        </span>
        <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight transition-colors">
          {t?.faqTitle || 'İnternet Hızı & Ağ Performansı Hakkında Merak Edilenler'}
        </h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 transition-colors">
          {t?.faqSubtitle || 'Ağınızı optimize etmek, pingi düşürmek ve en yüksek performansı almak için uzman rehberi.'}
        </p>
      </div>

      {/* FAQ Accordions */}
      <div className="max-w-3xl mx-auto space-y-3">
        {faqList.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="p-5 transition-all bg-white dark:bg-[#121316] border border-black/5 dark:border-white/10 rounded-2xl shadow-xs"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                className="w-full flex items-center justify-between text-left gap-4 font-bold text-sm text-neutral-900 dark:text-white cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-[#74DB00] shrink-0" />
                  {/* h3 under the section's h2 — questions are real subheadings,
                      which is also what FAQ rich results expect to find */}
                  <h3 className="text-neutral-900 dark:text-white font-bold text-sm m-0">{faq.q}</h3>
                </span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-neutral-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed animate-in fade-in duration-150">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
