# Changelog

All public, user-visible changes to **Fleex Optim PAV**. The full internal
changelog lives in the private source repository.

Format: [Keep a Changelog](https://keepachangelog.com/). Versioning:
[SemVer](https://semver.org/) — the project is pre-1.0, so a minor bump may
carry features and fixes together.

---

## [0.3.0] — 2026-09-09 — Clearer wording, units and distances

### Changed
- **The interface and the user guide now say the same thing.** Every place has
  one name — **Départ / retour** for the point vehicles leave from and come back
  to, **Dépôt de vidage** for a site where a full truck empties. The app never
  writes a bare "dépôt" any more, because the word could mean either one.
- **A unit on every numeric field.** Weights are in kilograms, durations in
  hours and minutes, distances in kilometres.
- **"Poids" is defined as the weight to collect** — not the container's
  capacity. This was the single most common source of wrong input.
- **One distance format everywhere** — kilometres with one decimal, in the
  tour cards, the step lists and the exports alike.

---

## [0.2.1] — 2026-07-30 — No more stale builds

### Fixed
- **The app no longer keeps running an old version after a release.** It now
  checks the deployed build on startup and, when it finds a newer one, clears
  its own caches and reloads once. Previously a returning browser could stay on
  a previous build indefinitely.
- **Blank map after a tiles update.** The bundled BeNomad SDK was upgraded to
  v2.0.1, which fixes a tile-caching issue that could leave the map empty after
  the server rebuilt a map archive under the same name.

---

## [0.2.0] — Languages, in-app documentation, environments

### Added
- **Italian and German** join English and French — four UI languages, picked
  from a dropdown in the header.
- **Documentation inside the app.** The User Guide and the Solver API reference
  (EN + FR) are readable in a viewer without leaving the app, and downloadable.
- **Per-environment solver.** Each build targets its own solver backend, so a
  test deployment and the production deployment no longer share one.

### Changed
- **Faster, more reliable map tiles** — BeNomad Tiles moved to a browser-cacheable
  delivery path, and the companion service worker was removed.
- **The product is now called Fleex Optim PAV**, live at
  <https://fleex-optim-pav.benomad.net>.

---

## [0.1.0] — First release

### Added
- The waste-container (PAV/BAV) collection-tour planning interface, covering
  **Level 1** (one vehicle, an ordered tour with dump stops inserted) and
  **Level 2** (a fleet, with containers assigned to vehicles automatically):
  - import containers from a file, or place them by hand on the map;
  - define the start / return point, the dump depots and the fleet;
  - checks that catch a bad setup *before* an optimisation is launched;
  - one result card per vehicle, with the ordered stop list and the running load;
  - **CSV and JSON export** of the result.

---

© BeNomad SAS — see [LICENSE](LICENSE).
