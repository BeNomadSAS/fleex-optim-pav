# Fleex Optim PAV — Référence de l'API du solveur

Voici le contrat REST avec lequel l'interface **Fleex Optim PAV** s'intègre. Le backend est le solveur
OR-Tools `intermediate-dump-problem` (« intermediate dump problem » == collecte de déchets avec un
arrêt de vidage intermédiaire). Il expose exactement deux points d'accès : `GET /health` et
`POST /solve`.

---

## Vue d'ensemble

| Élément | Valeur |
| --- | --- |
| **URL de base (dev)** | `http://localhost:8080` |
| **URL de base (production)** | `https://vrp-solver-pav-1004103140386.europe-west1.run.app` |
| **CORS** | Ouvert (`*`). |
| **Modèle de `/solve`** | Un seul appel **synchrone / bloquant**. |
| **Timeout serveur** | **900 s**. Le client annule plus tôt (`AbortController`, ~15 min). |
| **Type de contenu** | `application/json` pour les requêtes et les réponses. |

L'URL de base est configurée par environnement. L'interface conditionne le bouton **Lancer** à l'état
de la connexion (voir `GET /health`), et un `/solve` de longue durée est annulable côté client.

---

## GET /health

Sonde de disponibilité (liveness/readiness). L'interface l'interroge au chargement et périodiquement.

**Réponse — HTTP 200**

```json
{
  "status": "ok",
  "solver_binary": "…/bav_solver.exe",
  "solver_available": true,
  "output_dir": "…"
}
```

| Champ | Type | Notes |
| --- | --- | --- |
| `status` | string | `"ok"` lorsque le service est opérationnel. |
| `solver_binary` | string | Chemin de l'exécutable du solveur que le service invoquera. |
| `solver_available` | bool | **`true` uniquement lorsque le binaire du solveur est présent et exécutable.** |
| `output_dir` | string | Répertoire où le solveur écrit les artefacts d'exécution. |

> L'interface n'active le bouton **Lancer** que lorsque `solver_available` vaut `true` (combiné à des
> identifiants valides).

---

## POST /solve — requête

Le corps de la requête comporte **quatre listes obligatoires** plus des blocs de configuration
optionnels.

### Exemple annoté

```json
{
  "depots": [
    { "id": "DEPOT-1", "lat": 43.7009, "lon": 7.2683 }      // point de départ ; départ == retour
  ],
  "bavs": [
    { "id": "BAV-01", "lat": 43.7031, "lon": 7.2660, "weight_kg": 600, "flux": "glass" },
    { "id": "BAV-02", "lat": 43.6991, "lon": 7.2712, "weight_kg": 450, "flux": "glass" }
  ],                                                          // seuls les conteneurs ACTIFS sont envoyés
  "dump_depots": [
    { "id": "VIDAGE-01", "lat": 43.6905, "lon": 7.2400, "flux_accepted": ["glass", "packages"] }
  ],
  "vehicles": [
    { "id": "CAMION-1", "flux": "glass", "capacity_kg": 7000 } // mono-flux, capacité en kg
  ],

  "service_times": {                                          // optionnel, NIVEAU RACINE
    "bav_collection_s": 60,
    "dump_unload_s": 300
  },

  "config_api": {                                             // optionnel, IMBRIQUÉ — config routage Bemap
    "use_api": true,
    "api_geoserver": "osm",
    "api_url": "https://bemap-beta.benomad.com/bgis/service/routing/1.0",
    "api_key": "<injecté depuis la connexion — l'en-tête HTTP Basic Auth, soit base64(login:password)>",
    "api_timeout_seconds": 300
  }
}
```

### `depots[]` — obligatoire

Le point de départ. **Départ == retour** (le véhicule part de ce point et y revient).

| Champ | Type | Obligatoire | Unités | Notes |
| --- | --- | --- | --- | --- |
| `id` | string | ✓ | — | Identifiant unique. |
| `lat` | number | ✓ | degrés | Latitude. |
| `lon` | number | ✓ | degrés | Longitude. |

### `bavs[]` — obligatoire

Les conteneurs à déchets (*Bornes / Points d'Apport Volontaire*) à collecter. L'interface n'envoie
**que les conteneurs marqués actifs par l'agent.**

| Champ | Type | Obligatoire | Unités | Notes |
| --- | --- | --- | --- | --- |
| `id` | string | ✓ | — | Identifiant unique. |
| `lat` | number | ✓ | degrés | Latitude. |
| `lon` | number | ✓ | degrés | Longitude. |
| `weight_kg` | integer | ✓ | kg | Quantité à collecter à cette borne — **pas** la capacité totale de la borne. Sert de demande dans la contrainte de capacité du véhicule. **Kilogrammes entiers.** |
| `flux` | string (enum) | ✓ | — | Une des valeurs de l'énumération de flux (voir ci-dessous). |

### `dump_depots[]` — obligatoire

Les dépôts de vidage où un véhicule se vide lorsqu'il est plein.

| Champ | Type | Obligatoire | Unités | Notes |
| --- | --- | --- | --- | --- |
| `id` | string | ✓ | — | Identifiant unique. |
| `lat` | number | ✓ | degrés | Latitude. |
| `lon` | number | ✓ | degrés | Longitude. |
| `flux_accepted` | string[] (enum) | ✓ | — | Un ou plusieurs flux acceptés par ce dépôt. |

### `vehicles[]` — obligatoire

La flotte. Un véhicule est **mono-flux**.

| Champ | Type | Obligatoire | Unités | Notes |
| --- | --- | --- | --- | --- |
| `id` | string | ✓ | — | Identifiant unique. |
| `flux` | string (enum) | ✓ | — | L'unique flux transporté par ce véhicule. |
| `capacity_kg` | integer | ✓ | kg | Charge maximale. **Entier, > 0.** |

### `service_times` — optionnel, NIVEAU RACINE

Temps de manutention fixes par arrêt. Envoyés au **niveau racine** de la requête, pas en imbriqué.

| Champ | Type | Obligatoire | Unités | Notes |
| --- | --- | --- | --- | --- |
| `bav_collection_s` | integer | ○ | secondes | Temps passé à chaque conteneur. |
| `dump_unload_s` | integer | ○ | secondes | Temps de déchargement à chaque dépôt de vidage. |

### `config_api` — optionnel, IMBRIQUÉ (config routage Bemap)

La configuration de routage Bemap. **Le solveur ne lit les identifiants QUE dans ce bloc imbriqué** —
les clés `api_url` / `api_key` / `use_api` de niveau racine sont silencieusement ignorées.

| Champ | Type | Obligatoire | Notes |
| --- | --- | --- | --- |
| `use_api` | bool | ○ | `true` active le routage ; `false` (ou omis) = hors ligne / temps seul. |
| `api_geoserver` | string | ○ | `"osm"` (défaut ; aucun identifiant requis) ou `"here"`. |
| `api_url` | string | ○ | URL du service de routage (requise pour `here`). |
| `api_key` | string | ○ | `"Basic <base64(login:password)>"` (requise pour `here`). |
| `api_timeout_seconds` | integer | ○ | Timeout des appels de routage. |

> ⚠️ **Format de `api_key`.** Écrivez `"Basic "` (« Basic » avec majuscule) suivi du base64 de
> `login:password`. L'exemple ci-dessus utilise l'espace réservé littéral
> `"Basic <base64(login:password)>"` — substituez la vraie valeur à l'exécution.

> ℹ️ `use_api` est un indicateur **temporaire** de test / non-régression et sera probablement retiré
> après le POC.

### Énumération de flux

Les valeurs de `flux` / `flux_accepted` sont **exactement** :

```
glass | packages | papers | household_waste | textile
```

### Contraintes

- Un véhicule est **mono-flux** (un seul `flux` par véhicule).
- **Départ == retour** (le dépôt est à la fois origine et destination).
- `weight_kg` et `capacity_kg` sont des **entiers** ; `capacity_kg` doit être **> 0**.
- Un dépôt de vidage peut accepter **plusieurs** flux (`flux_accepted[]`).

### Avancé (non utilisé par cette interface)

Ces éléments existent côté serveur mais sont **hors périmètre** pour l'interface Fleex Optim PAV :

- **`raw_matrices[]`** — une matrice de temps de trajet N×N précalculée (secondes entières) par flux,
  qui court-circuite le routage en direct pour ce flux. Forme :
  `[{ "flux": "glass", "path": "…/matrix.json" }]`.
- **Champs prédictifs (Niveau 3)** — `l3_config` (niveau racine) et `bavs[].fill_rate_pct` pilotent la
  sélection prédictive des conteneurs. L'interface conserve une sélection manuelle des conteneurs ; ces
  champs ne sont donc pas envoyés.

---

## POST /solve — réponse

La réponse est une enveloppe dont la solution est imbriquée sous `solution`.

```json
{
  "status": "ok",
  "run_id": "…",
  "solution": { "…": "…" },
  "solver_log": "…"
}
```

| Champ | Type | Notes |
| --- | --- | --- |
| `status` | string | Statut de l'enveloppe (niveau transport). |
| `run_id` | string | Identifiant de cette exécution. |
| `solution` | object | Le résultat — voir ci-dessous. |
| `solver_log` | string | Sortie brute du journal du solveur (diagnostics). |

### `solution`

| Champ | Type | Notes |
| --- | --- | --- |
| `status` | string | `"ok"` \| `"partial_no_solution"` \| `"error"`. **L'interface se branche sur ce champ**, pas seulement sur le code HTTP. |
| `reason` | string | Renseigné en cas d'erreur — p. ex. `no_bav_selected`, `input_not_found`. |
| `input_path` | string | Toujours présent — **à ignorer dans l'IHM** (peut révéler un chemin de fichier côté serveur). |
| `service_times` | object | Les `{ bav_collection_s, dump_unload_s }` réellement utilisés. |
| `total_time_s` | integer | Temps total de la solution en secondes (somme sur les véhicules). À la racine. |
| `total_distance_km` | float | Distance totale. **`0.0` hors ligne / sans routage.** À la racine. |
| `formatted_duration` | string | `"HH:MM:SS"`. À la racine. |
| `unvisited_bavs[]` | array | Conteneurs non visités (vide dans le cas nominal Niveau 1 / Niveau 2). |
| `flux_sub_problems[]` | array | Un sous-problème par flux. Un échec par flux porte `status: "no_solution"` + un `reason`. |
| `vehicles[]` | array | **Concaténation à plat de tous les flux** — la liste à parcourir. |

### véhicule (entrée de `solution.vehicles[]`)

| Champ | Type | Notes |
| --- | --- | --- |
| `id` | string | Identifiant du véhicule. |
| `flux` | string (enum) | Le flux du véhicule. |
| `capacity_kg` | integer | Capacité en kg. |
| `total_time_s` | integer | Temps de tournée en secondes. |
| `formatted_duration` | string | `"HH:MM:SS"`. |
| `total_distance_km` | float | Distance de la tournée. **`0.0` hors ligne.** |
| `route_geometry[]` | string[] | Polylignes encodées Google, **précision 5**. **Vide hors ligne.** |
| `num_bavs_collected` | integer | Conteneurs collectés sur cette tournée. |
| `num_dumps` | integer | Arrêts de vidage sur cette tournée. |
| `num_mandatory_collected` | integer | Conteneurs obligatoires collectés. |
| `num_opportunistic_collected` | integer | Conteneurs opportunistes (Niveau 3 ; `0` en N1/N2). |
| `total_collected_kg` | integer | Poids total collecté sur cette tournée. |
| `steps[]` | array | Arrêts ordonnés — voir ci-dessous. |

### arrêt (entrée de `vehicle.steps[]`)

| Champ | Type | Présent sur | Notes |
| --- | --- | --- | --- |
| `type` | string | tous | `"depot"` \| `"bav"` \| `"dump"`. |
| `id` | string | tous | Identifiant de l'arrêt. **Identifiez un arrêt par `type`, jamais par `id`** (les id de vidage gagnent un suffixe `_c<K>` une fois enrichis). |
| `lat` | number | tous | Latitude. |
| `lon` | number | tous | Longitude. |
| `weight_kg` | integer | `bav` | Poids collecté à ce conteneur. |
| `load_after_kg` | integer | `bav` | Charge cumulée **juste après** ce conteneur. |
| `classification` | string | `bav` | `"mandatory"` par défaut (le Niveau 3 peut mettre `"opportunistic"`). |
| `projected_fill_pct` | float | `bav` | Taux de remplissage projeté en % (Niveau 3 ; `0.0` en N1/N2). |
| `load_before_kg` | integer | `dump` | Charge **juste avant** le vidage à ce dépôt. |

> La charge cumulée affichée dans l'interface — p. ex. `900 kg`, puis `1600 kg`, puis `2200 kg`, puis
> `→ 0` à un vidage — provient directement de `load_after_kg` (par conteneur) et `load_before_kg` (au
> vidage).

---

## Erreurs

Branchez-vous d'abord sur `solution.status` — de nombreuses conditions d'erreur arrivent **dans une
réponse HTTP 200**.

| Condition | HTTP | Forme / comment la détecter |
| --- | --- | --- |
| Succès | 200 | `solution.status == "ok"`. |
| Rien à résoudre / entrée invalide | 200 | `solution.status == "error"` + `reason` (`no_bav_selected`, `input_not_found`). |
| Un flux a échoué | 200 | `solution.status == "partial_no_solution"` ; l'entrée fautive de `flux_sub_problems[]` porte `status: "no_solution"` et `reason: ROUTING_*`. |
| Binaire du solveur introuvable | 500 | `{ "detail": "solver binary not found: <chemin>" }`. |
| Aucune sortie produite | 500 | `{ "error": "no_output_file", "expected_path": "…", "return_code": N, "log_tail": "…" }`. |
| Trop long | 504 | `solver timeout (Ns)` — N est le délai configuré côté serveur (900 par défaut). |

**Exemple de corps HTTP 500**

```json
{
  "error": "no_output_file",
  "expected_path": "…/output/run_….json",
  "return_code": 1,
  "log_tail": "…"
}
```

**Échec par flux (dans une réponse 200)**

```json
{
  "flux_sub_problems": [
    { "flux": "glass", "status": "no_solution", "reason": "ROUTING_FAIL", "vehicles": [] }
  ]
}
```

---

## Exemple complet

Une exécution hors ligne minimale : **3 conteneurs verre, 1 véhicule, 1 dépôt de vidage.** Hors ligne
(pas de bloc `config_api`), donc la distance vaut `0.0` et `route_geometry` est vide.

### Requête

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

### Réponse (tronquée)

L'enveloppe est omise par souci de concision ; ceci est `solution`. Notez `total_distance_km == 0.0`,
`route_geometry == []`, et les arrêts ordonnés avec leur charge cumulée.

```json
{
  "status": "ok",
  "service_times": { "bav_collection_s": 0, "dump_unload_s": 0 },
  "total_time_s": 295,
  "total_distance_km": 0.0,
  "formatted_duration": "00:04:55",
  "unvisited_bavs": [],
  "flux_sub_problems": [
    { "flux": "glass", "unvisited_bavs": [], "vehicles": [ "… (même véhicule que ci-dessous) …" ] }
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

**Lecture de la tournée :** départ de `DEPOT-01` → collecte `BAV-02-G` (charge 900) → `BAV-01-G`
(charge 1600) → `BAV-03-G` (charge 2200) → vidage à `VIDAGE-01-G` (charge avant 2200, après 0) →
retour à `DEPOT-01`. Total collecté 2200 kg, un vidage, 4 min 55 s.

---

## Notes d'intégration

- **Branchez-vous sur `solution.status`** (`ok` / `partial_no_solution` / `error`) — pas seulement sur
  le code HTTP. Les conditions d'erreur et partielles arrivent dans une réponse HTTP 200.
- **Décodez `route_geometry` en précision 5** (p. ex. `bemap.gep.decode(enc, 5)`), puis concaténez les
  segments décodés en une polyligne par véhicule.
- **Hors ligne ⇒ pas de géométrie.** Lorsque le routage est désactivé, `total_distance_km == 0.0` et
  `route_geometry == []` ; repliez-vous sur des lignes droites entre les arrêts et signalez la distance
  comme estimée.
- **Le solveur découpe par flux** et concatène `vehicles[]` **à plat** sur tous les flux — parcourez
  directement `solution.vehicles[]` ; utilisez `flux_sub_problems[]` uniquement pour les diagnostics
  par flux.
- **Ordre des axes de coordonnées.** Le JSON du solveur utilise `{ lat, lon }`. Le SDK cartographique
  (`bemap.Coordinate` / `addMarker` / `.move`) utilise `(lon, lat)`. Convertissez délibérément à chaque
  frontière.
- **Identifiez un arrêt par `step.type`**, jamais par `id` — les id de vidage gagnent un suffixe
  `_c<K>` une fois enrichis.
