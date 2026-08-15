# NetPulse

Internet speed, latency and network diagnostics in the browser. Measures
download, upload, ping, jitter and bufferbloat, plus gaming-region latency,
WebRTC/DNS leak exposure and streaming readiness — in 13 languages.

## Running it

```bash
npm ci
npm run dev      # http://localhost:3000
npm run build    # regenerates the sitemap, then builds to dist/
npm run preview  # serve the production build
```

| Script | What it does |
| --- | --- |
| `dev` | Vite dev server on port 3000 |
| `build` | Regenerates `public/sitemap.xml`, then builds to `dist/` |
| `preview` | Serves the built `dist/` |
| `sitemap` | Regenerates the sitemap only |
| `icons` | Regenerates favicons/app icons from `public/web-app-manifest-512x512.png` |

## How the measurement works

Reported numbers always reconcile with the byte counter shown next to them.
Two details are worth knowing before changing anything in `src/utils/speedEngine.js`:

**Latency is not raw TTFB.** A plain time-to-first-byte against
`speed.cloudflare.com` reads ~40ms when the real round-trip is ~3ms, because the
Cloudflare Worker serving the endpoint adds 25–600ms of its own processing. That
time is subtracted using the `Server-Timing` response header, and where the edge
exposes kernel TCP statistics (`cfL4; min_rtt`) that value is reported directly —
it tracks ICMP to within about 1ms. Jitter is taken at the same layer so the two
figures stay consistent.

**Throughput is bytes over time, never a percentile.** The steady-state window
excludes the first 1.5s of TCP slow start, and nothing is ever taken from the
peak. Uploads go through `XMLHttpRequest` rather than `fetch` because only XHR
reports upload progress; with `fetch`, a chunk is credited only when the whole
POST resolves, which left up to 30% of the transfer uncounted at the window
edges and inflated the result by ~18%.

## Internationalisation

`src/i18n/routes.js` is the single source of truth for which locales exist.
Routing, the language picker, `hreflang` and the sitemap all read from
`SUPPORTED_LANGS`, so a locale can never be advertised without a page behind it.
Adding a language means adding a block to `src/i18n/translations.js`, a slug set
and a flag in `src/components/FlagIcons.jsx`.

## Deploying

Set the public origin — it feeds canonical URLs, `hreflang`, structured data and
the share card:

```bash
VITE_SITE_ORIGIN=https://example.com SITE_ORIGIN=https://example.com npm run build
```

`public/.htaccess` carries the SPA fallback for Apache/LiteSpeed. On nginx,
Vercel or Netlify you need the equivalent rewrite, otherwise `/fr` and the other
locale paths 404 on direct navigation.

### Known gap

There is no server-side rendering or prerendering. Crawlers that do not execute
JavaScript see an empty document, which slows indexing and hides the content
from engines and AI crawlers that skip JS. For a site whose goal is search
ranking this is the largest remaining item.
