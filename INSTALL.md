# INSTALL — self-hosting Fleex Optim PAV

This repository ships a **pre-built static site**. There is no build step, no
`npm install`, no server-side runtime: copy the files behind any web server that
can serve static assets and fall back to `index.html`.

The hosted reference deployment is <https://fleex-optim-pav.benomad.net>.

---

## Prerequisites

| Requirement | Notes |
| --- | --- |
| A static web server | Nginx, Apache, Caddy, Cloudflare, S3 + CloudFront, GitHub Pages… |
| **HTTPS** | Mandatory in practice — Bemap credentials travel as Basic Auth. |
| A **Bemap account** | Beta / Preprod / Prod. Entered at the sign-in gate. |
| A reachable **PAV solver** | `GET /health` + `POST /solve`, CORS-enabled for your origin. |

---

## Quick start (Python — for local testing)

```bash
git clone https://github.com/BeNomadSAS/fleex-optim-pav.git
cd fleex-optim-pav
python -m http.server 5500
```

Open <http://localhost:5500/>.

This is fine for a look around, but Python's `http.server` has no SPA fallback —
deep links will 404. Use one of the production setups below for anything real.

---

## Production hosting

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name pav.example.com;

    ssl_certificate     /etc/ssl/certs/pav.example.com.pem;
    ssl_certificate_key /etc/ssl/private/pav.example.com.key;

    root /var/www/fleex-optim-pav;
    index index.html;

    # Single-page app: unknown paths fall back to the shell.
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Content-hashed bundles — safe to cache forever.
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    location /jquery/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # The SDK's CSS references nested, unstamped resources (marker icons,
    # sprite sheets, glyph fonts) — let them revalidate instead of freezing
    # them for a year.
    location /bemap-js-api/ {
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # The shell and the version manifest must never be cached, or a returning
    # browser keeps running the previous build.
    location = /            { add_header Cache-Control "no-store"; }
    location = /index.html  { add_header Cache-Control "no-store"; }
    location = /version.json { add_header Cache-Control "no-store"; }
}
```

Then:

```bash
rsync -av --delete ./ user@host:/var/www/fleex-optim-pav/
```

### Cloudflare Workers Static Assets

The bundled `_headers` file is written for Cloudflare and is picked up
automatically. A minimal `wrangler.jsonc` next to these files:

```jsonc
{
  "name": "fleex-optim-pav",
  "compatibility_date": "2026-06-11",
  "assets": {
    "directory": "./",
    "not_found_handling": "single-page-application",
    "html_handling": "auto-trailing-slash"
  }
}
```

```bash
npx wrangler deploy
```

### GitHub Pages / S3 / any object store

Upload the tree as-is and configure the SPA fallback (`404.html` → a copy of
`index.html` on GitHub Pages; an error-document rule on S3/CloudFront). Apply
the cache rules from the Nginx example above.

---

## Cache + security headers

`_headers` (Cloudflare syntax) is the reference policy. Two rules matter most,
whatever the host:

1. **`/`, `/index.html` and `/version.json` must be `no-store`.** The app
   fetches `version.json` at runtime and reloads itself once when the deployed
   build differs from the running one. If the shell or the manifest is cached,
   that self-heal cannot fire and users stay stuck on an old build.
2. **`/assets/*` is content-hashed** — cache it `immutable` for a year.

The security set applied to every response:

```
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'; worker-src 'self' blob:; …
```

The CSP `connect-src` allow-list must name **your** solver host alongside the
BeNomad hosts, or the browser will block the `/solve` call. See the next section.

---

## Pointing the app at your own solver

The solver URL is baked in at build time, but it can be overridden at runtime
without rebuilding:

| Method | How | Scope |
| --- | --- | --- |
| Query string | `https://your-host/?solver=https://solver.example.com` | That page load |
| Local storage | `localStorage.pav_solver_url = 'https://solver.example.com'` | That browser |

Both are **host-allow-listed** inside the bundle: only `*.benomad.net`,
`*.benomad.com`, `*.run.app` and `localhost` are accepted. A different domain
needs a rebuild from source — ask BeNomad.

If you self-host with your own solver domain, also add it to the CSP
`connect-src` list in `_headers`.

---

## CORS

`POST /solve` is a cross-origin request. Your solver must return
`Access-Control-Allow-Origin` for the origin you serve this app from, and
answer the `OPTIONS` preflight. The BeNomad reference solver is permissive
(`*`) — a solver you deploy yourself may not be.

A `/solve` run is **synchronous and can take several minutes**. Any proxy in
front of the solver needs a read timeout of at least **900 s**, or the browser
will see a gateway error while the solver is still working.

---

## Updating

```bash
git pull
```

…then re-run your deploy step (rsync to Nginx, `wrangler deploy`, re-upload to
S3, …). The repository is force-refreshed on every release, so a `git pull` may
fast-forward over rewritten history — `git fetch && git reset --hard origin/main`
is the reliable form.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Blank page, 404 on a deep link | No SPA fallback — point unknown paths at `index.html`. |
| Sign-in rejects valid credentials | Wrong environment picked (Beta vs Preprod vs Prod), or the account exists on one and not the other. |
| **Run** button stays disabled | `GET /health` is failing — wrong solver URL, solver down, or CORS blocking the probe. |
| Map loads, tours never appear | `/solve` blocked by CSP `connect-src` or by CORS. Check the browser console. |
| Straight lines instead of roads | The solver is running without routing enabled — it returns times but no road geometry. Server-side setting. |
| Old build keeps loading after an update | `index.html` / `version.json` are being cached. Set them `no-store`. |

---

© BeNomad SAS — see [LICENSE](LICENSE).
