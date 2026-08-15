import React, { useState, useEffect } from 'react';
import { Cookie, Check, X } from 'lucide-react';

const STORAGE_KEY = 'netpulse_cookie_consent';

/**
 * GDPR/ePrivacy consent gate.
 *
 * The site is reachable from the EU, so non-essential storage needs opt-in
 * before it is written, and rejecting has to be exactly as easy as accepting —
 * a banner with only an "accept" button is not valid consent under the GDPR.
 * The choice is recorded in localStorage, which is itself strictly necessary
 * (it stores the consent decision), so it is written either way.
 *
 * Read the stored decision from anywhere with `hasAnalyticsConsent()`.
 */
export function hasAnalyticsConsent() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'accepted';
  } catch {
    return false;
  }
}

export default function CookieConsent({ t }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // Small delay so the banner does not fight the first paint
        const id = setTimeout(() => setVisible(true), 700);
        return () => clearTimeout(id);
      }
    } catch {
      // Storage blocked entirely — do not nag, nothing can be stored anyway
    }
  }, []);

  const decide = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;


  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t?.cookieTitle || 'Cookie preferences'}
      className="fixed inset-x-0 z-[60] px-4 pointer-events-none"
      style={{ bottom: 'calc(var(--bottom-nav-clearance, 0px) + 12px)' }}
    >
      {/* All colours come from the fixed `.consent-*` classes in index.css — the
          banner is the same dark snackbar in both themes. Theme-dependent rules
          on this element did not repaint reliably (it kept the surface painted
          on first render even after `html.dark` changed), which left the copy
          unreadable after a theme toggle. A single fixed surface cannot drift. */}
      <div className="consent-surface pointer-events-auto max-w-3xl mx-auto rounded-2xl border shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="w-9 h-9 rounded-xl bg-[#88E724]/15 border border-[#88E724]/30 text-[#88E724] flex items-center justify-center shrink-0">
            <Cookie className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h2 className="consent-title text-sm font-bold mb-1">
              {t?.cookieTitle || 'We use cookies'}
            </h2>
            <p className="consent-body text-xs leading-relaxed">
              {t?.cookieText ||
                'We use strictly necessary storage to run the speed test, and optional analytics to improve it. You can decline optional cookies without losing any functionality.'}
            </p>
          </div>
        </div>

        {/* Always a plain two-up row. The previous sm:flex-col squeezed both
            buttons into a ~100px column that overlapped the copy. */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          {/* Reject carries the same visual weight as accept, as consent rules require */}
          <button
            onClick={() => decide('rejected')}
            className="consent-reject flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <X className="w-3.5 h-3.5" />
            {t?.cookieReject || 'Decline'}
          </button>
          <button
            onClick={() => decide('accepted')}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#88E724] hover:bg-[#74DB00] text-black text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap border-2 border-[#88E724]"
          >
            <Check className="w-3.5 h-3.5" />
            {t?.cookieAccept || 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
}
