# Fleex Optim PAV — User Guide

> Live app: **https://fleex-optim-pav.benomad.net**

## 1. Introduction

**Fleex Optim PAV** is the planning interface for optimising waste-container collection tours (*Bornes / Points d'Apport Volontaire* — BAV/PAV). It is built for the planning agent who has to turn a list of containers to empty into a set of driveable tours.

The workflow is always the same:

1. Sign in to Bemap.
2. Bring in the containers to collect — import a file, or place them by hand on the map.
3. Define the start / return point, the dump depots, and the vehicle fleet.
4. Run the optimisation.
5. Review the tours and export them.

The optimisation assigns each container to a vehicle, orders the stops, and inserts a trip to the nearest compatible dump depot every time a truck fills up. You get one tour per vehicle.

**What the app covers (Levels 1 & 2):**

| Level | Meaning |
| --- | --- |
| **Level 1** | A single vehicle over containers you have already chosen → an optimal ordered tour with dump stops inserted. |
| **Level 2** | A fleet: the solver assigns containers to vehicles, honours the per-flux rule (one flux per truck), and optimises every tour at once. |

A few rules to keep in mind:

- Container selection is **manual** — you import or place containers, then activate/deactivate the ones you want in or out. Only **active** containers are sent to the optimiser.
- Quantities are in **kilograms (whole kg)**. A container's weight is the **weight to collect**, not the container's capacity (see §5).
- A vehicle is **mono-flux** (it carries one flux).
- The **start point is also the return point**.
- A **dump depot can accept several fluxes**.
- The flux types are: **glass, packages, papers, household waste, textile**.

**The two places in a tour** — the app never writes "depot" on its own, because two different places could carry that word:

| Term | The place | In a tour |
| --- | --- | --- |
| **Start / return** | The single point vehicles leave from and come back to. | The **Start** (first) and **Return** (last) stops. |
| **Dump depot** | A site where a full vehicle empties before continuing. | A **Dump** stop. |

---

## 2. Signing in

The app opens on a **Bemap configuration** modal. Nothing else works until you are signed in and the solver answers.

Fill in:

| Field | What to enter |
| --- | --- |
| **Environment** | `Beta`, `Preprod`, or `Prod`. |
| **User** | Your Bemap username. |
| **Password** | Your Bemap password. |
| **Remember on this device** | Tick to keep your credentials on this computer between sessions; leave unticked to clear them when the tab closes. |

Press **Sign in**. Your credentials are verified against Bemap; if they are valid the modal closes and the map loads.

Two things must be true before you can run an optimisation:

1. You are **signed in** (valid Bemap credentials).
2. The **solver is reachable** — a small status badge in the header turns green when the solver answers; it stays grey/red while it is being checked or is unavailable. The **Run** button stays disabled until the solver is available.

> Your credentials do double duty: they authenticate the map and are forwarded to the solver so it can compute road distances on your behalf. They are base64-obfuscated at rest (not encrypted) and only ever sent over HTTPS.

To change environment or sign in as someone else later, open the **Bemap configuration** section in the left panel and press **Edit** — this re-opens the same modal.

---

## 3. The workspace tour

The screen is a three-panel planner:

- **Left panel — inputs.** Everything you configure: import, start / return point, fleet, dump depots, containers, and the **Run** button.
- **Centre — the map.** Your markers and, after a run, the optimised tours.
- **Right panel — results.** Summary tiles and one card per vehicle (hidden until you run a first optimisation).

### Header controls

- **Language flags** — switch the interface between **EN / FR / IT / DE**.
- **Theme toggle** (🌙 / ☀️) — switch between light and dark.
- **Documentation** button — opens this guide and the API reference (see §14).
- **Connection badge** — the solver status indicator described in §2.
- **Collapse arrows** — fold the left or right panel to give the map more room.

### The step Guide

A sticky **Guide** at the top of the left panel lists the steps in order and highlights where you are:

1. Bemap sign-in
2. Start / return
3. Configure the fleet
4. Dump depots
5. Select the containers
6. Run the optimisation

Close it with the **×** once you no longer need it.

---

## 4. Importing data

Open the **Data import** section in the left panel. You can load each entity separately, or a whole problem in one go.

### Per-section import (CSV or JSON)

Four buttons load one entity at a time, each from its own file:

| Button | Loads |
| --- | --- |
| **Containers** | The PAV/BAV to collect. |
| **Start / return** | The point vehicles leave from and come back to. |
| **Dump depots** | The sites where a full vehicle empties. |
| **Vehicles** | The fleet. |

Each accepts **CSV** or **JSON**. The CSV reader auto-detects the separator (`,` or `;`) and tolerates common column-name variants. Weights and capacities are read as **whole kg**.

**CSV columns:**

| Entity | Columns |
| --- | --- |
| **Containers** | `id`, `lon`, `lat`, `flux`, `weight_kg` *(weight to collect, whole kg)*, `service_time_s` *(optional)*, `active` *(optional, default true)* |
| **Vehicles** | `id`, `flux`, `capacity_kg` |
| **Dump depots** | `id`, `lon`, `lat`, `flux_accepted` *(e.g. `glass\|packages`)*, `dump_time_s` *(optional)* |
| **Start / return** | `id`, `lon`, `lat` |

### A full problem in one file

- **Import a JSON (file)** — pick a single JSON file already in the solver's full-problem shape (containers + start / return + dump depots + vehicles); it loads everything at once.
- **Import JSON (paste)** — expand this sub-section and paste the same JSON, then press **Import the JSON**.

### Quick starts

- **Nice sample (full demo)** — loads a small ready-to-run dataset around Nice (start / return, a dump depot, six glass containers, one vehicle) so you can try a run immediately.
- **CSV example** / **JSON example** — download a sample template to fill in (CSV) or pre-fill the paste box with a worked multi-flux example (JSON).

### GeoJSON adapter

If you import a GeoJSON `FeatureCollection` of points, the app reads it as containers: it maps each point's coordinates and recognises common flux labels (for instance `VERRE` → glass), defaulting missing weights to a sensible value.

---

## 5. Containers (PAV)

Containers appear in section **4. Containers (PAV)** in the left panel and as markers on the map.

### On the map

Each container is a numbered marker, **shaped and coloured by its flux**, with a sequence number. Inactive containers are dimmed.

### The list

Each row shows the container id, its address (or coordinates), and lets you:

- **Activate / deactivate** with the checkbox — this is the **manual selection mechanism**. Only **active** containers are optimised; deactivated ones stay on the map but are ignored. (Clicking a container's marker also toggles it.)
- **Change the flux** from the dropdown.
- **Edit the weight** to collect in kg (whole number, greater than 0) — see "What a container's weight means" below.
- **Centre** the map on it (the ⊙ button).
- **Delete** it (the × button).

### What a container's weight means

The weight is **the quantity you expect to collect at that container on this tour**, in whole kilograms. It is **not** the container's total capacity.

This weight is what fills the truck: the optimiser adds it to the load at each stop, and as soon as the load would reach the vehicle's capacity it inserts a trip to a dump depot (which resets the load to zero).

If you do not know the weight, estimate it:

```
weight to collect  =  container weight when full  ×  fill rate
```

For instance a glass container that holds 800 kg when full, 75 % full, gives 600 kg.

On import, a container with no usable weight is given **300 kg** by default, and a hand-placed container also starts at 300 kg. Remember to correct the value.

### Other actions

- **Add by hand** — press **+ Add on the map**, then click the map to drop a new container. The point is geocoded and snapped to the road. The button stays armed so you can drop several in a row; press it again (or Esc) to stop.
- **Drag to reposition** — drag any marker; it is re-geocoded at the new spot.
- **Flux filter** — chips above the list let you show only one flux at a time (or **All** to reset). This filters both the list and the markers.

---

## 6. Start / return & dump depots

### Start / return point (section 1)

The vehicles leave from and come back to a single point.

- Press **Place on the map**, then click the location. It is geocoded and snapped to the road.
- There is only one start / return point — placing again replaces it.
- Use the **×** to clear it.

### Dump depots (section 3)

A dump depot is where a full truck empties before continuing. Add as many as you need.

- Press **+ Add on the map**, then click each location. The button stays armed for several dump depots.
- For each dump depot, choose the **accepted fluxes**:
  - Toggle individual flux chips, or
  - Use the **All** chip to accept every flux at once (click it again to expand and refine).
  A dump depot can accept several fluxes.
- Set the **emptying time** (in seconds) for that dump depot. Leave it blank to use the global default (see §7).
- Use **⊙** to centre the map on a dump depot and **×** to delete it.

Each dump depot must accept at least one flux, and every flux you collect must have at least one dump depot that accepts it (the checks in §8 enforce this).

---

## 7. The fleet

Open section **2. Fleet** in the left panel.

- **+ Add a vehicle** creates a vehicle. Each vehicle has:
  - an **id**,
  - a **flux** (mono-flux — pick one from the dropdown),
  - a **capacity in kg**.
- Edit the flux and capacity inline; remove a vehicle with the **×**.

You need at least one vehicle per flux you are collecting.

### Advanced service times (global)

The **Settings (global)** section sets the service times used everywhere:

| Setting | Meaning | Default |
| --- | --- | --- |
| **Collection time / container (s)** | Seconds spent at each container. | 120 |
| **Emptying time (s)** | Seconds spent at a dump depot (a per-dump-depot value in §6 overrides it). | 600 |
| **Time at start / return (s)** | Seconds spent at the start / return point. | 0 |

### Load balancing

For now the solver **balances the tours by time** (built in, no toggle). Balancing by collected weight or by container count is planned for a later version.

---

## 8. Checks before optimising

Above the **Run** button, a validation panel lists anything that needs attention. It updates **live** as you edit, so you always know whether you can run.

Two kinds of finding:

- **Blocking issues (red)** — these **disable the Run button** until fixed. Examples: no start / return point, no active container, no vehicle, no dump depot; a duplicate or empty id; coordinates out of range; a non-integer or zero weight/capacity; a flux that has no vehicle or no compatible dump depot; a container heavier than every vehicle's capacity for its flux.
- **Warnings (amber)** — worth noting but they **do not block**. Examples: a vehicle whose flux has no active container, or a dump depot whose accepted fluxes are none of those you collect (it will sit unused).

Where the app can fix a problem for you, the finding offers a **one-tap fix** (for example, set a valid weight, raise a capacity, add the missing flux to a dump depot, or add a vehicle for a flux).

When there are no blocking issues, the **Run** button becomes available.

---

## 9. Running the optimisation

Press **Run the optimisation**.

- A full-screen **progress loader** shows phased steps: **1/3 data preparation** (routing matrices) → **2/3 optimisation** → **3/3 results formatting**.
- A run can be **cancelled** with the **Cancel** button; starting a new run also aborts the previous one.
- A run can take **up to 15 minutes** for large problems. Most runs are far quicker.

There is also a **Download data (JSON)** button that exports exactly what would be sent to the solver — handy for support or for re-importing later.

When the run succeeds, the right panel opens with the results.

---

## 10. Reading the results

The right panel (**Results — Optimised tours**) has three parts.

### Summary tiles

At a glance, totals across all vehicles:

- **Vehicles** used
- **Total time**
- **Total distance** (km)
- **Containers** collected
- **Dumps** (emptying stops)
- **Collected** (kg)

### One card per vehicle

Each vehicle gets a card in its **route colour**, showing its **flux**, **capacity**, the **count** of containers collected and dumps performed, and its **duration and distance**. Each card has:

- An **eye** button to **show/hide that tour on the map**.
- The **ordered list of stops** — every stop numbered in sequence (start, containers, dump stops, return). Each container stop shows its weight and the **running load** after it; each dump stop shows the load just before emptying.
- An **Export** menu (CSV / JSON) for that single vehicle.

### Map & navigation

- **Show all / Hide all** (panel header) toggle every tour at once.
- When more than one flux is present, a **flux filter** narrows both the cards and the routes on the map.
- **Click any stop** in a card to centre the map on it.
- If a tour failed for a given flux, a banner names it; any containers that could not be visited are reported as well.

> Tours are drawn as a coloured line per vehicle with numbered stop flags. When routing is available the line follows the roads; otherwise it falls back to straight lines (see §13).

---

## 11. Exporting

You can export at two levels.

**All tours** (buttons at the top of the results panel):

- **Export CSV** — a detailed file, one row per stop, with vehicle, flux, stop order, type, id, coordinates, weight, and the running load.
- **Export JSON** — the full solution.

**Per vehicle** (the **Export** menu inside each card):

- **CSV** — that vehicle's stops only.
- **JSON** — that vehicle's tour only.

All files are downloaded with a timestamped name.

---

## 12. Languages & theme

- **Interface languages:** English, French, Italian, German — switch with the flags in the header.
- **Theme:** light or dark, toggled with the 🌙 / ☀️ button. Your choice is remembered on the device.

---

## 13. Troubleshooting

| Symptom | What it means | What to do |
| --- | --- | --- |
| Tours drawn as straight lines; distance marked **estimated** | Routing is offline, so the solver returned no road geometry and a zero distance. The optimisation by time is still valid. | Treat distances as approximate; check connectivity if you need real road distances. |
| Red blocking findings, **Run** disabled | The input has a problem the solver would reject. | Fix the items in the validation panel (§8); use the one-tap fixes where offered. |
| **No feasible tour** message | The solver could not build a tour (e.g. an impossible constraint). | Review capacities, dump-depot fluxes, and container weights. |
| **Partial solution** banner | One flux could not be solved while others succeeded. | The banner names the failing flux; check its vehicles and dump depots. |
| **Too long / timeout** | The run exceeded the time limit. | Reduce the scope (fewer containers, simpler problem) and try again. |
| **Service unavailable / server error** | The solver is down or returned an error. | Wait and retry; check the connection badge (§2). |
| **Invalid Bemap credentials** | The solver could not authenticate to Bemap. | Open **Bemap configuration → Edit** and sign in again (§2). |

---

## 14. Documentation & support

Click the **Documentation** button in the header to open the documentation panel. It has two tabs:

- **User guide** — this document.
- **API reference** — the integration/contract reference.

You can switch the documentation language (**EN / FR**) and **download** any document as Markdown (`.md`).

For anything not covered here, contact your BeNomad point of contact.
