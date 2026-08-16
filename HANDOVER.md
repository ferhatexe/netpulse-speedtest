# NetMeter — devir notu

Son güncelleme: 16 Ağustos 2026 · Son commit: `22fd8f4`

---

## 1. Nerede duruyoruz

| | |
| --- | --- |
| Canlı adres | https://netmeter.app (HTTPS, sertifika geçerli) |
| Hosting | Render static site, **ücretsiz plan** — servis adı `netpulse-speedtest`, ID `srv-da0cvqou01pc738svkg0` |
| Depo | https://github.com/ferhatexe/netmeter-speedtest (adı hâlâ eski, bkz. §5) |
| Alan adı | Cloudflare Registrar, ~$14.20/yıl, otomatik yenileme **açık** |
| Eski adres | `netpulse-speedtest-eflw.onrender.com` — hâlâ açık, aynı içeriği sunuyor |

Deploy: `main`'e push → Render otomatik build eder (~3 dk).

### DNS (Cloudflare)

```
netmeter.app       CNAME  netpulse-speedtest-eflw.onrender.com  DNS only
www.netmeter.app   CNAME  netpulse-speedtest-eflw.onrender.com  DNS only
```

**Proxy (turuncu bulut) kapalı tutulmalı** — açılırsa Render SSL sertifikasını yenileyemez.

### Render environment

```
VITE_SITE_ORIGIN = https://netmeter.app
```

`SITE_ORIGIN` eklenmedi; build script'lerinin varsayılanı zaten `https://netmeter.app`.

---

## 2. Komutlar

```bash
npm ci
npm run dev        # localhost:3000
npm run build      # ikonlar + sitemap + vite build + prerender
npm run preview    # dist/ klasörünü sunar
```

| Script | Ne yapar |
| --- | --- |
| `build` | İkonları üretir, sitemap'i üretir, Vite build alır, 78 rotayı prerender eder |
| `sitemap` | Sadece `public/sitemap.xml` üretir |
| `icons` | `public/web-app-manifest-512x512.png`'den 12 ikon üretir |
| `prerender` | Sadece prerender adımı |

`scripts/fetch-fonts.mjs` elle çalıştırılır; çıktısı (`public/fonts/`, `src/fonts.css`) commit edilmiştir.

---

## 3. Mimarinin bilinmesi gereken yerleri

### Ölçüm motoru — `src/utils/speedEngine.js`

Bu dosyaya dokunmadan önce şu ikisini bil, yoksa sessizce yanlış sayı üretirsin:

**Gecikme ham TTFB değildir.** `speed.cloudflare.com`'a atılan bir isteğin TTFB'si ~40ms okur, gerçek tur ~3ms'dir; aradaki fark Cloudflare Worker'ının kendi işlem süresidir (25-600ms). Bu süre `Server-Timing` başlığından çıkarılır. Edge çekirdek TCP istatistiği veriyorsa (`cfL4; min_rtt`) doğrudan o kullanılır — ICMP'ye ~1ms yaklaşır. Jitter aynı katmandan alınır, yoksa iki rakam birbiriyle çelişir.

**Throughput asla yüzdelik dilim değildir.** Bayt / süre, TCP yavaş başlangıcın ilk 1.5 saniyesi hariç bir pencerede. Tepe noktadan hiçbir şey alınmaz — eskiden p85 alınıyordu ve sonucu kendi bayt sayacına göre **%46 şişiriyordu**.

**Upload `XMLHttpRequest` kullanır, `fetch` değil.** Sadece XHR yükleme ilerlemesi bildirir. `fetch` ile bir parça ancak POST tamamen bitince sayılır; 16 akış × 16MB = 256MB uçuşta sayılmadan kalıyor ve sonucu **%18 şişiriyordu**.

### Çok dillilik

`src/i18n/routes.js` içindeki `SUPPORTED_LANGS` **tek doğruluk kaynağıdır.** Yönlendirme, dil menüsü, hreflang, sitemap ve prerender hepsi oradan okur. Yeni dil eklemek: `translations.js`'e blok, `routes.js`'e slug seti, `FlagIcons.jsx`'e bayrak.

13 dil: tr, en, de, es, fr, it, pt, nl, pl, ru, ja, zh, ar. Arapça RTL.

### Prerender — `scripts/prerender.mjs`

78 rotanın her biri statik HTML'e basılır. Üç kritik detay:

- **Dil URL'den render sırasında türetilir**, `useEffect` ile değil. Effect'ler prerender sırasında çalışmaz; ilk denemede `/fr` ve `/ja` Türkçe H1 basıyordu.
- **Head etiketleri de prerender'da yazılır** (`applyHead`). Sadece runtime'da yazılırsa JS çalıştırmayan bot `<html lang="tr">` ve köke bakan canonical görür — bu Google'a "diğer 77 URL kopyadır" demektir ve **12 dili birden indeksten düşürür.**
- **Her rota iki dosya olarak yazılır**: `fr/index.html` ve `fr.html`. Sunucular eğik çizgisiz yolu farklı çözümler; desteklemediği biçim SPA yönlendirmesine düşer ve Türkçe kök belgeyi sunar.

### Tema

Varsayılan **açık tema**. Üç yer birbiriyle uyumlu olmak zorunda, yoksa hidrasyon kırılır:
- `index.html` içindeki boot script (`|| 'light'`)
- `src/App.jsx` içindeki `useState('light')`
- Dolayısıyla prerender edilen HTML

`localStorage`'daki tercih mount'ta uygulanır, initializer'da okunmaz.

### Analytics — `src/utils/analytics.js`

Consent Mode v2. Etiket her sayfada yüklenir ama **depolama reddedilmiş başlar**. Kabul edilince `analytics_storage: granted`'a çevrilir. Reklam sinyalleri kalıcı kapalı.

Doğrulandı: onay öncesi `_ga` çerezi yok, kabul sonrası var, ret sonrası yok.

Ölçüm kimliği `src/config/site.js` içinde (`G-H0V5DYS9D3`), `VITE_ANALYTICS_ID` ile geçilebilir.

### Alan adı

`src/config/site.js` tek kaynak. Değiştirmek için:

```bash
VITE_SITE_ORIGIN=https://yeni.com SITE_ORIGIN=https://yeni.com npm run build
```

Kaynak kodda sabit alan adı yok. `index.html` ve `public/*.txt` statik dosyalar, onlar elle değişir.

---

## 4. PageSpeed durumu

Son ölçüm (prerender + font değişikliği **öncesi**):

| | Mobil | Masaüstü |
| --- | --- | --- |
| Performans | 83 | 98 |
| Erişilebilirlik | 100 | 100 |
| En İyi Uygulamalar | 100 | 100 |
| SEO | 100 | 100 |
| Ajan Taraması | 3/3 | — |

**Font self-hosting ve per-route SEO değişikliklerinden sonra yeniden ölçülmedi.** İlk iş bu olmalı.

Kalan uyarılar hep aynı kökten: 136 KB'lık tek JS paketi → `Zorunlu yeniden düzenleme`, `Ağ bağımlılık ağacı`, `Kullanılmayan JS 30 KiB`, `Ana iş parçacığı`. Çözümü kod bölme.

Mobilde 100 gerçekçi değil — Google kısıtlı 4G'de emülasyonlu Moto G Power kullanıyor. React + Router + ikon kütüphanesi taşıyan bir uygulamada 90-95 tavandır.

---

## 5. Yapılacaklar

### Önce

**PageSpeed'i yeniden ölç.** Font ve SEO değişiklikleri ölçülmedi.

**Google Analytics doğrulaması.** GA'da "Tekrar test et". Algılamazsa reklam engelleyici eklentiyi kapat, gizli sekmede dene.

### Sonra — trafik için asıl iş

**78 URL'in hepsi aynı içeriği sunuyor.** `/tr/hiz-testi` ile `/tr/oyun-ping-radari` bayt bayt aynı sayfa, sadece farklı çapaya kaydırıyor. Google bunları kopya sayar ve birini indeksler. **78 URL'in var ama gerçekte 1 sayfan var.**

Her rota kendi içeriğini sunmalı: ilgili araç üstte, etrafında o konuya özel 500-800 kelime. 13 dilde ~65 gerçek içerik sayfası. Trafiği getirecek olan bu, özellik değil.

### Küçük işler

- **Depo adı** `netmeter-speedtest` — "speedtest" Ookla'nın tescilli markası, `netmeter` yap
- **Render servis adı** hâlâ `netpulse-speedtest`
- **Eski onrender adresi** kapatılmalı (Settings → Render Subdomain) veya 301 verilmeli
- **Ölü kod**: `src/components/AdBanner.jsx` ve `AffiliateNordCard.jsx` hiçbir yerden import edilmiyor, içleri sabit Türkçe
- **`font-black` (900)** 33 yerde kullanılıyor ama Plus Jakarta Sans 800'de bitiyor — tarayıcı sahte kalınlaştırıyor. `font-extrabold`'a çevrilebilir.

### Değerlendirilebilecek özellikler

- **Paket kaybı** — veri zaten `cfL4`'te (`lost`, `retrans`), yarım saatlik iş, rakiplerde nadir
- **Test geçmişi** — localStorage, "geçen haftaya göre kötü mü" sorusunun cevabı
- **Paylaşılabilir sonuç linki** — PNG yerine açılabilir URL; her paylaşım bir geri bağlantı

---

## 6. Trafik beklentisi — gerçekçi

Pazarda Ookla Speedtest, Fast.com, nPerf ve Cloudflare var. Daha önemlisi **Google "internet speed test" aramasında kendi testini doğrudan sonuç sayfasında gösteriyor** — baş terimlerdeki tıklamaların büyük kısmı orada ölüyor.

Sıfır otoriteli yeni alan adı baş terimlerde 12-18 ay ilk sayfaya çıkmaz.

Trafik uzun kuyruktan gelir: "valorant ping nasıl düşürülür", "bufferbloat nedir", "100 Mbps kaç MB". 13 dil bu yüzeyi çarpar. Bufferbloat notlandırma, oyun ping radarı ve WebRTC sızıntı testi rakiplerin çoğunda yok.

Mevcut hâliyle (içerik ayrıştırılmadan) aylık **2-5K**. İçerik sayfaları yazılıp 12-18 ay sabredilirse **30-80K** makul. 100K+ için güçlü bir niş ya da ciddi geri bağlantı çalışması gerekir.
