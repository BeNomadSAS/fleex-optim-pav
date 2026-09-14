# Fleex Optim PAV — Solver API Reference

This is the REST contract that the **Fleex Optim PAV** interface integrates with. The backend is the
OR-Tools solver `intermediate-dump-problem` ("intermediate dump problem" == waste collection with an
intermediate dump stop). It exposes exactly two endpoints: `GET /health` and `POST /solve`.

---

## Overview

| Item | Value |
| --- | --- |
| **Base URL (dev)** | `http://localhost:8080` |
| **Base URL (production)** | `https://vrp-solver-pav-1004103140386.europe-west1.run.app` |
| **CORS** | Open (`*`). |
| **`/solve` model** | A single **synchronous / blocking** call. |
| **Server timeout** | **900 s**. The client aborts earlier (`AbortController`, ~15 min). |
| **Content type** | `application/json` for requests and responses. |

The base URL is configured per environment. The interface gates the **Run** button on the connection
state (see `GET /health`), and a long-running `/solve` is cancellable client-side.

---

## GET /health

Liveness/readiness probe. The UI polls it on load and periodically.

**Response — HTTP 200**

```json
{
  "status": "ok",
  "solver_binary": "…/bav_solver.exe",
  "solver_available": true,
  "output_dir": "…"
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `status` | string | `"ok"` when the service is up. |
| `solver_binary` | string | Path to the solver executable the service will invoke. |
| `solver_available` | bool | **`true` only when the solver binary is present and runnable.** |
| `output_dir` | string | Directory where the solver writes its run artifacts. |

> The UI enables the **Run** button only when `solver_available` is `true` (combined with valid
> credentials).

---

## POST /solve — request

The request body carries **four required lists** plus optional configuration blocks.

### Annotated example

```json
{
  "depots": [
    { "id": "DEPOT-1", "lat": 43.7009, "lon": 7.2683 }      // start point; start == return
  ],
  "bavs": [
    { "id": "BAV-01", "lat": 43.7031, "lon": 7.2660, "weight_kg": 600, "flux": "glass" },
    { "id": "BAV-02", "lat": 43.6991, "lon": 7.2712, "weight_kg": 450, "flux": "glass" }
  ],                                                          // only ACTIVE containers are sent
  "dump_depots": [
    { "id": "VIDAGE-01", "lat": 43.6905, "lon": 7.2400, "flux_accepted": ["glass", "packages"] }
  ],
  "vehicles": [
    { "id": "CAMION-1", "flux": "glass", "capacity_kg": 7000 } // mono-flux, capacity in kg
  ],

  "service_times": {                                          // optional, TOP-LEVEL
    "bav_collection_s": 60,
    "dump_unload_s": 300
  },

  "config_api": {                                             // optional, NESTED — Bemap routing config
    "use_api": true,
    "api_geoserver": "osm",
    "api_url": "https://bemap-beta.benomad.com/bgis/service/routing/1.0",
    "api_key": "<injected from the login — the HTTP Basic-auth header, i.e. base64(login:password)>",
    "api_timeout_seconds": 300
  }
}
```

### `depots[]` — required

The start point. **Start == return** (the vehicle leaves from and comes back to this point).

| Field | Type | Required | Units | Notes |
| --- | --- | --- | --- | --- |
| `id` | string | ✓ | — | Unique identifier. |
| `lat` | number | ✓ | degrees | Latitude. |
| `lon` | number | ✓ | degrees | Longitude. |

### `bavs[]` — required

The waste containers (*Bornes/Points d'Apport Volontaire*) to collect. The UI sends **only the
containers the agent marked active.**

| Field | Type | Required | Units | Notes |
| --- | --- | --- | --- | --- |
| `id` | string | ✓ | — | Unique identifier. |
| `lat` | number | ✓ | degrees | Latitude. |
| `lon` | number | ✓ | degrees | Longitude. |
| `weight_kg` | integer | ✓ | kg | Quantity to collect at this container — **not** the container's total capacity. Acts as the demand in the vehicle capacity constraint. **Integer kilograms.** |
| `flux` | string (enum) | ✓ | — | One of the flux enum values (see below). |

### `dump_depots[]` — required

The dump depots (*dépôts de vidage*) where a vehicle empties when it fills up.

| Field | Type | Required | Units | Notes |
| --- | --- | --- | --- | --- |
| `id` | string | ✓ | — | Unique identifier. |
| `lat` | number | ✓ | degrees | Latitude. |
| `lon` | number | ✓ | degrees | Longitude. |
| `flux_accepted` | string[] (enum) | ✓ | — | One or more flux values this depot accepts. |

### `vehicles[]` — required

The fleet. A vehicle is **mono-flux**.

| Field | Type | Required | Units | Notes |
| --- | --- | --- | --- | --- |
| `id` | string | ✓ | — | Unique identifier. |
| `flux` | string (enum) | ✓ | — | The single flux this vehicle carries. |
| `capacity_kg` | integer | ✓ | kg | Maximum load. **Integer, > 0.** |

### `service_times` — optional, TOP-LEVEL

Per-stop fixed handling times. Sent at the **top level** of the request, not nested.

| Field | Type | Required | Units | Notes |
| --- | --- | --- | --- | --- |
| `bav_collection_s` | integer | ○ | seconds | Time spent at each container. |
| `dump_unload_s` | integer | ○ | seconds | Time spent unloading at each dump depot. |

### `config_api` — optional, NESTED (Bemap routing config)

The Bemap routing configuration. **The solver reads credentials ONLY from this nested block** —
top-level `api_url` / `api_key` / `use_api` are silently ignored.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `use_api` | bool | ○ | `true` enables routing; `false` (or omitted) = offline / time-only. |
| `api_geoserver` | string | ○ | `"osm"` (default; no credentials needed) or `"here"`. |
| `api_url` | string | ○ | Routing service URL (required for `here`). |
| `api_key` | string | ○ | `"Basic <base64(login:password)>"` (required for `here`). |
| `api_timeout_seconds` | integer | ○ | Routing call timeout. |

> ⚠️ **`api_key` format.** Write it as `"Basic "` (capital "Basic") followed by the base64 of
> `login:password`. The example above uses the literal placeholder `"Basic <base64(login:password)>"`
> — substitute the real value at runtime.

> ℹ️ `use_api` is a **temporary** test / non-regression flag and is likely to be removed after the POC.

### Flux enum

The `flux` / `flux_accepted` values are **exactly**:

```
glass | packages | papers | household_waste | textile
```

### Constraints

- A vehicle is **mono-flux** (one `flux` per vehicle).
- **Start == return** (the depot is both origin and destination).
- `weight_kg` and `capacity_kg` are **integers**; `capacity_kg` must be **> 0**.
- A dump depot may accept **several** fluxes (`flux_accepted[]`).

### Advanced (not used by this UI)

These exist server-side but are **out of scope** for the Fleex Optim PAV interface:

- **`raw_matrices[]`** — a precomputed N×N travel-time matrix (integer seconds) per flux, which
  bypasses live routing for that flux. Shape: `[{ "flux": "glass", "path": "…/matrix.json" }]`.
- **Predictive (Level 3) fields** — `l3_config` (top-level) and `bavs[].fill_rate_pct` drive
  predictive container selection. The UI keeps container selection manual, so these are not sent.

---

## POST /solve — response

The response is an envelope with the solution nested under `solution`.

```json
{
  "status": "ok",
  "run_id": "…",
  "solution": { "…": "…" },
  "solver_log": "…"
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `status` | string | Envelope status (transport-level). |
| `run_id` | string | Identifier for this solve run. |
| `solution` | object | The result — see below. |
| `solver_log` | string | Raw solver log output (diagnostics). |

### `solution`

| Field | Type | Notes |
| --- | --- | --- |
| `status` | string | `"ok"` \| `"partial_no_solution"` \| `"error"`. **The UI branches on this**, not just the HTTP code. |
| `reason` | string | Set on error — e.g. `no_bav_selected`, `input_not_found`. |
| `input_path` | string | Always present — **ignore it in the UI** (it may reveal a server-side file path). |
| `service_times` | object | The `{ bav_collection_s, dump_unload_s }` actually used. |
| `total_time_s` | integer | Total solution time in seconds (sum across vehicles). On the root. |
| `total_distance_km` | float | Total distance. **`0.0` when offline / no routing.** On the root. |
| `formatted_duration` | string | `"HH:MM:SS"`. On the root. |
| `unvisited_bavs[]` | array | Containers that could not be visited (empty in Level 1 / Level 2 happy path). |
| `flux_sub_problems[]` | array | One per-flux sub-problem. Per-flux failure carries `status: "no_solution"` + a `reason`. |
| `vehicles[]` | array | **Flat concatenation across all fluxes** — the list to iterate. |

### vehicle (an entry of `solution.vehicles[]`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Vehicle id. |
| `flux` | string (enum) | The vehicle's flux. |
| `capacity_kg` | integer | Capacity in kg. |
| `total_time_s` | integer | Tour time in seconds. |
| `formatted_duration` | string | `"HH:MM:SS"`. |
| `total_distance_km` | float | Tour distance. **`0.0` when offline.** |
| `route_geometry[]` | string[] | Google-encoded polylines, **precision 5**. **Empty when offline.** |
| `num_bavs_collected` | integer | Containers collected on this tour. |
| `num_dumps` | integer | Dump stops on this tour. |
| `num_mandatory_collected` | integer | Mandatory containers collected. |
| `num_opportunistic_collected` | integer | Opportunistic containers (Level 3; `0` in N1/N2). |
| `total_collected_kg` | integer | Total weight collected on this tour. |
| `steps[]` | array | Ordered stops — see below. |

### step (an entry of `vehicle.steps[]`)

| Field | Type | Present on | Notes |
| --- | --- | --- | --- |
| `type` | string | all | `"depot"` \| `"bav"` \| `"dump"`. |
| `id` | string | all | Stop id. **Identify a stop by `type`, never by `id`** (dump ids gain a `_c<K>` suffix once enriched). |
| `lat` | number | all | Latitude. |
| `lon` | number | all | Longitude. |
| `weight_kg` | integer | `bav` | Weight collected at this container. |
| `load_after_kg` | integer | `bav` | Running load **just after** this container. |
| `classification` | string | `bav` | `"mandatory"` by default (Level 3 may set `"opportunistic"`). |
| `projected_fill_pct` | float | `bav` | Projected fill % (Level 3; `0.0` in N1/N2). |
| `load_before_kg` | integer | `dump` | Load **just before** emptying at this dump depot. |

> The running load shown in the UI — e.g. `900 kg`, then `1600 kg`, then `2200 kg`, then `→ 0` at a
> dump — comes straight from `load_after_kg` (per container) and `load_before_kg` (at the dump).

---

## Errors

Branch on `solution.status` first — many error conditions arrive **inside HTTP 200**.

| Condition | HTTP | Shape / how to detect |
| --- | --- | --- |
| Success | 200 | `solution.status == "ok"`. |
| Nothing to solve / bad input | 200 | `solution.status == "error"` + `reason` (`no_bav_selected`, `input_not_found`). |
| One flux failed | 200 | `solution.status == "partial_no_solution"`; the failing entry in `flux_sub_problems[]` has `status: "no_solution"` and `reason: ROUTING_*`. |
| Solver binary not found | 500 | `{ "detail": "solver binary not found: <path>" }`. |
| Solver produced no output | 500 | `{ "error": "no_output_file", "expected_path": "…", "return_code": N, "log_tail": "…" }`. |
| Took too long | 504 | `solver timeout (Ns)` — N is the server's configured timeout (default 900). |

**HTTP 500 body example**

```json
{
  "error": "no_output_file",
  "expected_path": "…/output/run_….json",
  "return_code": 1,
  "log_tail": "…"
}
```

**Per-flux failure (inside a 200 response)**

```json
{
  "flux_sub_problems": [
    { "flux": "glass", "status": "no_solution", "reason": "ROUTING_FAIL", "vehicles": [] }
  ]
}
```

---

## Worked example

A minimal offline run: **3 glass containers, 1 vehicle, 1 dump depot.** Offline (no `config_api`
block), so distance is `0.0` and `route_geometry` is empty.

### Request

```json
{
  "depots": [
    { "id": "DEPOT-01", "lat": 45.7640, "lon": 4.8357 }
  ],
  "bavs": [
    { "id": "BAV-01-G", "lat": 45.7600, "lon": 4.8330, "weight_kg": 700, "flux": "glass" },
    { "id": "BAV-02-G", "lat": 45.7680, "lon": 4.8400, "weight_kg": 900, "flux": "glass" },
    { "id": "BAV-03-G", "lat": 45.7560, "lon": 4.8290, "weight_kg": 600, "flux": "glass" }
  ],
  "dump_depots": [
    { "id": "VIDAGE-01-G", "lat": 45.7519, "lon": 4.8274, "flux_accepted": ["glass"] }
  ],
  "vehicles": [
    { "id": "VEH-01-G", "flux": "glass", "capacity_kg": 4000 }
  ]
}
```

### Response (trimmed)

The envelope is omitted for brevity; this is `solution`. Note `total_distance_km == 0.0`,
`route_geometry == []`, and the ordered steps with their running load.

```json
{
  "status": "ok",
  "service_times": { "bav_collection_s": 0, "dump_unload_s": 0 },
  "total_time_s": 295,
  "total_distance_km": 0.0,
  "formatted_duration": "00:04:55",
  "unvisited_bavs": [],
  "flux_sub_problems": [
    { "flux": "glass", "unvisited_bavs": [], "vehicles": [ "… (same vehicle as below) …" ] }
  ],
  "vehicles": [
    {
      "id": "VEH-01-G",
      "flux": "glass",
      "capacity_kg": 4000,
      "total_time_s": 295,
      "formatted_duration": "00:04:55",
      "total_distance_km": 0.0,
      "route_geometry": [],
      "num_bavs_collected": 3,
      "num_dumps": 1,
      "num_mandatory_collected": 3,
      "num_opportunistic_collected": 0,
      "total_collected_kg": 2200,
      "steps": [
        { "type": "depot", "id": "DEPOT-01",   "lat": 45.764,  "lon": 4.8357 },
        { "type": "bav",   "id": "BAV-02-G",   "lat": 45.768,  "lon": 4.84,   "weight_kg": 900, "load_after_kg": 900,  "classification": "mandatory", "projected_fill_pct": 0.0 },
        { "type": "bav",   "id": "BAV-01-G",   "lat": 45.76,   "lon": 4.833,  "weight_kg": 700, "load_after_kg": 1600, "classification": "mandatory", "projected_fill_pct": 0.0 },
        { "type": "bav",   "id": "BAV-03-G",   "lat": 45.756,  "lon": 4.829,  "weight_kg": 600, "load_after_kg": 2200, "classification": "mandatory", "projected_fill_pct": 0.0 },
        { "type": "dump",  "id": "VIDAGE-01-G","lat": 45.7519, "lon": 4.8274, "load_before_kg": 2200 },
        { "type": "depot", "id": "DEPOT-01",   "lat": 45.764,  "lon": 4.8357 }
      ]
    }
  ]
}
```

**Reading the tour:** depart `DEPOT-01` → collect `BAV-02-G` (load 900) → `BAV-01-G` (load 1600) →
`BAV-03-G` (load 2200) → empty at `VIDAGE-01-G` (load before 2200, after 0) → return to `DEPOT-01`.
Total collected 2200 kg, one dump, 4 min 55 s.

---

## Integration notes

- **Branch on `solution.status`** (`ok` / `partial_no_solution` / `error`) — not just the HTTP status
  code. Error and partial conditions arrive inside HTTP 200.
- **Decode `route_geometry` at precision 5** (e.g. `bemap.gep.decode(enc, 5)`), then concatenate the
  decoded segments into one polyline per vehicle.
- **Offline ⇒ no geometry.** When routing is off, `total_distance_km == 0.0` and `route_geometry == []`;
  fall back to straight lines between stops and mark the distance as estimated.
- **The solver splits per flux** and concatenates `vehicles[]` **flat** across fluxes — iterate
  `solution.vehicles[]` directly; use `flux_sub_problems[]` only for per-flux diagnostics.
- **Coordinate axis order.** The solver JSON uses `{ lat, lon }`. The map SDK
  (`bemap.Coordinate` / `addMarker` / `.move`) uses `(lon, lat)`. Convert deliberately at every
  boundary.
- **Identify a stop by `step.type`**, never by `id` — dump ids gain a `_c<K>` suffix once enriched.
