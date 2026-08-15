import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { fetchRealNetworkMeta } from '../utils/speedEngine';

export default function DnsLeakCheck({ t }) {
  const [scanning, setScanning] = useState(false);
  const [localIp, setLocalIp] = useState('—');
  const [publicIp, setPublicIp] = useState('—');
  const [webrtcStatus, setWebrtcStatus] = useState('checking'); // 'shielded' | 'exposed' | 'blocked'
  const [dnsStatus, setDnsStatus] = useState('blocked'); // 'reachable' | 'blocked'

  const runScan = async () => {
    setScanning(true);
    setWebrtcStatus('checking');
    
    // Real WebRTC local IP probing attempt.
    // Only `typ host` candidates carry the LAN address. `srflx`/`relay` candidates
    // carry the public IP the STUN server saw, which is not a leak and must not be
    // reported as the local IP.
    try {
      let foundLocal = false;
      const isPrivateV4 = (ip) =>
        /^10\./.test(ip) ||
        /^192\.168\./.test(ip) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
        /^169\.254\./.test(ip);
      const isPrivateV6 = (ip) => /^(fe80|fc|fd)/i.test(ip);

      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pc.createDataChannel('');
      pc.createOffer().then((offer) => pc.setLocalDescription(offer));
      pc.onicecandidate = (ice) => {
        if (ice && ice.candidate && ice.candidate.candidate) {
          const candidate = ice.candidate.candidate;
          const isHost = / typ host/.test(candidate);
          const match = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/);
          const ip = match && match[1];
          if (ip && isHost && (isPrivateV4(ip) || isPrivateV6(ip))) {
            setLocalIp(ip);
            foundLocal = true;
            setWebrtcStatus('exposed');
          }
        }
        if (!ice.candidate) {
          // ICE gathering complete
          if (!foundLocal) {
            setLocalIp(t?.webrtcHidden || 'Hidden · mDNS / Blocked');
            setWebrtcStatus('shielded');
          }
          pc.close();
        }
      };
      // Safety timeout: close after 4s
      setTimeout(() => {
        try {
          if (!foundLocal) {
            setLocalIp(t?.webrtcHidden || 'Hidden · mDNS / Blocked');
            setWebrtcStatus('shielded');
          }
          pc.close();
        } catch {}
      }, 4000);
    } catch (e) {
      setLocalIp(t?.webrtcBlocked || 'Unavailable (WebRTC blocked)');
      setWebrtcStatus('blocked');
    }

    try {
      const meta = await fetchRealNetworkMeta();
      if (meta && meta.clientIp) {
        setPublicIp(meta.clientIp);
      }
    } catch (e) {}

    // A page cannot see which resolver the OS uses, so this does NOT claim the
    // user's DNS is encrypted. All it establishes is whether the DoH endpoint is
    // reachable from this network — some ISPs and captive portals block it.
    try {
      const dohRes = await fetch('https://cloudflare-dns.com/dns-query?name=cloudflare.com&type=A', {
        headers: { 'accept': 'application/dns-json' },
        cache: 'no-store'
      });
      setDnsStatus(dohRes.ok ? 'reachable' : 'blocked');
    } catch {
      setDnsStatus('blocked');
    }

    await new Promise((r) => setTimeout(r, 600));
    setScanning(false);
  };

  useEffect(() => {
    runScan();
  }, [t]);

  return (
    <div id="privacy" className="bento-card p-6 sm:p-7 h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-500/20 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                {t.privacyTitle}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium hidden sm:block">
                {t.privacySubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={runScan}
            disabled={scanning}
            className="btn-tactile px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-black/5 dark:border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t.runPrivacyScan}</span>
          </button>
        </div>

        {/* Spacious 3-box Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-neutral-50/90 dark:bg-white/5 p-3.5 rounded-2xl border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all shadow-2xs">
            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 block mb-1">
              {t.publicIp}
            </span>
            <div className="text-sm font-black font-mono text-neutral-900 dark:text-white mb-0.5 break-all">
              {publicIp}
            </div>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{t.ispPeering}</span>
          </div>

          <div className="bg-neutral-50/90 dark:bg-white/5 p-3.5 rounded-2xl border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all shadow-2xs">
            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 block mb-1">
              {t.localIp}
            </span>
            <div className="text-sm font-black font-mono text-neutral-900 dark:text-white mb-0.5 break-all leading-snug">
              {localIp}
            </div>
            <span className={`text-[10px] font-bold ${webrtcStatus === 'shielded' || webrtcStatus === 'blocked' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {webrtcStatus === 'shielded' || webrtcStatus === 'blocked' ? (t.webrtcShielded || 'WebRTC Korumalı') : (t.localIpDetected || 'Yerel IP Tespit Edildi')}
            </span>
          </div>

          <div className="bg-neutral-50/90 dark:bg-white/5 p-3.5 rounded-2xl border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all shadow-2xs">
            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 block mb-1">
              {t.dnsStatus}
            </span>
            <div className="text-sm font-black text-neutral-900 dark:text-white mb-0.5 flex items-center gap-1.5">
              {dnsStatus === 'reachable' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#74DB00]" />
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{t?.dohReachable || 'DoH reachable'}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{t?.dohBlocked || 'DoH blocked'}</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
              {dnsStatus === 'reachable'
                ? (t?.dohReachableNote || 'Cloudflare DoH is reachable · your active resolver is not visible to the browser')
                : (t.dnsUnencrypted || 'Cloudflare DoH bu ağdan engellenmiş görünüyor')}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
