import React, { useRef, useEffect } from 'react';
import { X, Download, Sparkles } from 'lucide-react';
import { SITE_DOMAIN } from '../config/site';

const LOCALES = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', es: 'es-ES' };

export default function ShareCardModal({ isOpen, onClose, metrics, t, lang = 'tr' }) {
  const canvasRef = useRef(null);
  const locale = LOCALES[lang] || LOCALES.tr;

  useEffect(() => {
    if (!isOpen || !metrics) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // High DPI Canvas setup (1200 x 675 for crisp 16:9 social share)
    const width = 1200;
    const height = 675;
    canvas.width = width;
    canvas.height = height;

    // Background: Deep Carbon Dark
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0D0E12');
    bgGrad.addColorStop(0.5, '#12141A');
    bgGrad.addColorStop(1, '#181A22');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Glowing Neon Lime Accent Orb (Top Right)
    const orbGrad1 = ctx.createRadialGradient(width - 150, 120, 20, width - 150, 120, 350);
    orbGrad1.addColorStop(0, 'rgba(136, 231, 36, 0.22)');
    orbGrad1.addColorStop(1, 'transparent');
    ctx.fillStyle = orbGrad1;
    ctx.fillRect(0, 0, width, height);

    // Cyan Accent Orb (Bottom Left)
    const orbGrad2 = ctx.createRadialGradient(150, height - 100, 20, 150, height - 100, 300);
    orbGrad2.addColorStop(0, 'rgba(0, 212, 255, 0.12)');
    orbGrad2.addColorStop(1, 'transparent');
    ctx.fillStyle = orbGrad2;
    ctx.fillRect(0, 0, width, height);

    // Faint measurement grid — gives the card depth instead of flat panels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.028)';
    ctx.lineWidth = 1;
    for (let x = 72; x < width - 40; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 32);
      ctx.lineTo(x, height - 32);
      ctx.stroke();
    }
    for (let y = 32; y < height - 32; y += 48) {
      ctx.beginPath();
      ctx.moveTo(32, y);
      ctx.lineTo(width - 32, y);
      ctx.stroke();
    }

    // Outer Card Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, width - 64, height - 64);

    // Rounded panel helper with a soft inner wash
    const panel = (x, y, w, h, accent, strong) => {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 20);
      const wash = ctx.createLinearGradient(x, y, x, y + h);
      wash.addColorStop(0, strong ? 'rgba(255,255,255,0.065)' : 'rgba(255,255,255,0.04)');
      wash.addColorStop(1, 'rgba(255,255,255,0.012)');
      ctx.fillStyle = wash;
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    };

    // Accent rule under a panel's label, matching the metric's colour
    const rule = (x, y, w, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, 3);
    };

    // Header Logo Icon Badge (Professional Vector)
    ctx.fillStyle = '#88E724';
    ctx.beginPath();
    ctx.roundRect(72, 68, 44, 44, 14);
    ctx.fill();

    // Sharp Lightning Vector inside Badge
    ctx.fillStyle = '#0D0E12';
    ctx.beginPath();
    ctx.moveTo(96, 75);
    ctx.lineTo(84, 91);
    ctx.lineTo(93, 91);
    ctx.lineTo(91, 105);
    ctx.lineTo(104, 88);
    ctx.lineTo(95, 88);
    ctx.closePath();
    ctx.fill();

    // Brand Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('NetMeter', 130, 101);

    ctx.fillStyle = '#88E724';
    ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('PRO', 285, 101);

    // Subtitle
    ctx.fillStyle = '#8E94A0';
    ctx.font = '500 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    // Domain appended at render time so a domain change does not require
    // re-translating this line in 13 languages
    ctx.fillText(`${t?.shareReportSubtitle || 'Official Network Performance Report'} · ${SITE_DOMAIN}`, 130, 132);

    // Left Column: Massive Download Hero Metric Card
    panel(72, 180, 480, 380, 'rgba(136, 231, 36, 0.35)', true);

    // Download Label (Clean typography, no emoji)
    rule(104, 216, 40, '#88E724');
    ctx.fillStyle = '#88E724';
    ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillText(t?.download ? t.download.toUpperCase() : 'İNDİRME (DOWNLOAD)', 104, 252);

    // Download Big Value
    const dlVal = metrics.download >= 1000 ? (metrics.download / 1000).toFixed(1) : `${metrics.download || '—'}`;
    const dlUnit = metrics.download >= 1000 ? 'Gbps' : 'Mbps';

    ctx.save();
    ctx.shadowColor = 'rgba(136, 231, 36, 0.45)';
    ctx.shadowBlur = 34;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 104px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(dlVal, 104, 372);
    ctx.restore();

    // Download Unit below the value
    ctx.fillStyle = '#88E724';
    ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillText(dlUnit, 108, 424);

    // Throughput bar — fills against the gigabit ceiling the card claims
    const barX = 104;
    const barY = 470;
    const barW = 416;
    const ratio = Math.max(0.02, Math.min(1, (metrics.download || 0) / 1000));
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, 10, 5);
    ctx.fill();
    const barGrad = ctx.createLinearGradient(barX, 0, barX + barW * ratio, 0);
    barGrad.addColorStop(0, '#74DB00');
    barGrad.addColorStop(1, '#88E724');
    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * ratio, 10, 5);
    ctx.fill();

    ctx.fillStyle = '#6E7485';
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillText('0', barX, barY + 32);
    ctx.textAlign = 'right';
    ctx.fillText('1 Gbps', barX + barW, barY + 32);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#6E7485';
    ctx.font = '500 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(t?.shareEdgeSub || 'Cloudflare Anycast Edge', 104, 534);

    // Right Column: 2x2 Grid of Secondary Metrics
    const drawTile = (x, y, label, value, unit, color) => {
      panel(x, y, 260, 175, 'rgba(255, 255, 255, 0.09)', false);

      rule(x + 24, y + 28, 26, color || '#88E724');

      ctx.fillStyle = '#8E94A0';
      ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(label.toUpperCase(), x + 24, y + 58);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
      ctx.fillText(`${value}`, x + 24, y + 116);

      if (unit) {
        ctx.fillStyle = color || '#88E724';
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
        ctx.fillText(unit, x + 24, y + 150);
      }
    };

    const upVal = metrics.upload >= 1000 ? (metrics.upload / 1000).toFixed(1) : `${metrics.upload || '—'}`;
    const upUnit = metrics.upload >= 1000 ? 'Gbps' : 'Mbps';

    drawTile(585, 180, t?.upload || 'Yükleme (Upload)', upVal, upUnit, '#FFB800');
    drawTile(870, 180, t?.ping || 'Ping (Gecikme)', metrics.ping || '—', 'ms', '#00D4FF');
    drawTile(585, 385, t?.jitter || 'Jitter', metrics.jitter ?? '—', `ms (${t?.shareJitterSubtitle || 'Dalgalanma'})`, '#A0A4B0');
    drawTile(870, 385, t?.bufferbloat || 'Bufferbloat', metrics.bufferbloatGrade || '—', t?.shareGradeSubtitle || 'Düşük Gecikme', '#88E724');

    // Connection provenance — an unattributed number is not worth sharing
    const provenance = [metrics.isp, metrics.city, metrics.colo ? `${metrics.colo} POP` : null]
      .filter((part) => part && part !== '—')
      .join('  ·  ');

    if (provenance) {
      ctx.fillStyle = '#A0A4B0';
      ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(provenance, 72, 596);
    }

    // Footer Timestamp
    ctx.fillStyle = '#5A5F6E';
    ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const now = new Date().toLocaleString(locale, {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    ctx.fillText(`${t?.shareVerified || 'Doğrulanmış Test Tarihi'}: ${now}`, 72, provenance ? 624 : 605);

  }, [isOpen, metrics, t, locale]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `netmeter-speed-report-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121316] text-white border border-white/10 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#88E724]" />
            <h3 className="text-xl font-bold">{t?.shareTitle || 'Hız Karnesi & Rapor'}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Generated Canvas Preview */}
        <div className="w-full rounded-2xl overflow-hidden border border-white/10 mb-6 bg-black shadow-2xl">
          <canvas
            ref={canvasRef}
            className="w-full h-auto block"
            style={{ aspectRatio: '1200 / 675' }}
          />
        </div>

        {/* Action Button — Only Download image */}
        <div className="flex justify-end">
          <button
            onClick={handleDownload}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#88E724] hover:bg-[#74DB00] text-black text-sm font-black flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(136,231,36,0.35)] transition-transform active:scale-95"
          >
            <Download className="w-5 h-5" />
            <span>{t?.downloadImage || 'Görseli İndir (PNG / 1200x675)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
