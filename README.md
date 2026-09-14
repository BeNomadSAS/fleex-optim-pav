# Fleex Optim PAV

> **Public distribution mirror** — by **BeNomad**.
> Built artefact + end-user documentation for the waste-container collection-tour
> planner shipped at <https://fleex-optim-pav.benomad.net>.

[![License](https://img.shields.io/badge/license-proprietary-blue)](LICENSE)
![Stack](https://img.shields.io/badge/stack-Vite%20%7C%20jQuery%20%7C%20bemap--js--api-6366f1)

---

## What this is

**Fleex Optim PAV** is the planning interface for optimising waste-container
collection tours (*Bornes / Points d'Apport Volontaire* — BAV/PAV). It is built
for the planning agent who has to turn a list of containers to empty into a set
of driveable tours.

The workflow is always the same:

1. Sign in to Bemap.
2. Bring in the containers to collect — import a file, or place them by hand on the map.
3. Define the start / return point, the dump depots, and the vehicle fleet.
4. Run the optimisation.
5. Review the tours and export them.

The optimisation assigns each container to a vehicle, orders the stops, and
inserts a trip to the nearest compatible dump depot every time a truck fills up.
You get one tour per vehicle.

| Level | What it does |
| --- | --- |
| **Level 1** | A single vehicle over containers you have already chosen → an optimal ordered tour with dump stops inserted. |
| **Level 2** | A fleet: the solver assigns containers to vehicles, honours the per-flux rule (one flux per truck), and optimises every tour at once. |

Flux types: **glass · packages · papers · household waste · textile**.
Quantities are in **kilograms**. A vehicle is **mono-flux**. The **start point is
also the return point**. A **dump depot can accept several fluxes**.

**→ Full walk-through: [docs/USER_GUIDE_EN.md](docs/USER_GUIDE_EN.md) · [docs/USER_GUIDE_FR.md](docs/USER_GUIDE_FR.md)**

---

## This repository is read-only

It contains the **built static-site artefact** — no source code, no build step.
Source lives in a private BeNomad GitLab.

The repository is **rebuilt and re-published on every release**. Manual changes
here will be overwritten by the next release.

---

## What's in this repo

```
index.html              # The single-page app entry
version.json            # Build version + token (used by the runtime version guard)
assets/                 # Bundled JS + CSS (build output — content-hashed filenames)
bemap-js-api/           # Vendored BeNomad SDK (MapLibre + Leaflet bindings, geocoder, tiles)
jquery/                 # Vendored jQuery
boot.js                 # Pre-app boot (theme, no-flash)
data/                   # Sample dataset shipped with the app
_headers                # Cloudflare cache-control / security headers
docs/                   # User Guide + API Doc (EN + FR) — downloadable from inside the app
  USER_GUIDE_EN.md      # End-user guide (English)
  USER_GUIDE_FR.md      # End-user guide (French)
  API_DOC_EN.md         # /solve + /health REST contract — payload + response (English)
  API_DOC_FR.md         # /solve + /health REST contract — payload + response (French)

README.md               # ← you are here
INSTALL.md              # Self-hosting walk-through (Nginx, Cloudflare, S3, GitHub Pages…)
CHANGELOG.md            # Release notes
LICENSE                 # Usage terms
```

The user guides and API docs are part of the build output (the `docs/` folder
above). The four top-level Markdown files (README, INSTALL, CHANGELOG, LICENSE)
are the only "meta" files dropped on top of the build at release time.

---

## Quick start — try locally

```bash
git clone https://github.com/BeNomadSAS/fleex-optim-pav.git
cd fleex-optim-pav
python -m http.server 5500
```

Open <http://localhost:5500/>. Sign in with your Bemap credentials.

> The app is a single-page app: serve it over HTTP (not `file://`), and point
> unknown paths back at `index.html`. See [INSTALL.md](INSTALL.md) for real
> hosting setups.

> The `/solve` call needs a reachable PAV solver that allows your origin via
> CORS. Contact BeNomad to have `http://localhost:5500` allow-listed for testing.

---

## What you need to run it

| Requirement | Why |
| --- | --- |
| **A Bemap account** (Beta / Preprod / Prod) | Signs you in, renders the map, and is forwarded to the solver so it can compute road distances on your behalf. |
| **A reachable PAV solver** (`/solve` + `/health`) | Does the optimisation. The hosted app points at the BeNomad production solver; a self-hosted copy can point elsewhere. |
| **A modern browser** | Chrome / Edge / Firefox / Safari, current versions. |

Credentials are never stored in this repository. They are entered at the sign-in
gate, base64-obfuscated at rest (not encrypted), and only ever sent over HTTPS.

---

## The backend contract

The app talks to a PAV solver over two endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Solver availability probe — gates the **Run** button. |
| `POST /solve` | The optimisation itself: containers + depots + dump depots + fleet in, tours out. |

Full request/response reference, field by field, with worked examples:
**[docs/API_DOC_EN.md](docs/API_DOC_EN.md)** · **[docs/API_DOC_FR.md](docs/API_DOC_FR.md)**

---

## Support

Questions, bug reports, or a solver deployment of your own: contact your
BeNomad account manager. Issues opened on this mirror are not monitored.

---

© BeNomad SAS — see [LICENSE](LICENSE).
