# Fleex Optim PAV — Guide utilisateur

> Application en ligne : **https://fleex-optim-pav.benomad.net**

## 1. Introduction

**Fleex Optim PAV** est l'interface de planification pour l'optimisation des tournées de collecte de bornes à déchets (*Bornes / Points d'Apport Volontaire* — BAV/PAV). Elle s'adresse à l'agent de planification qui doit transformer une liste de bornes à vider en un ensemble de tournées réalisables.

Le déroulement est toujours le même :

1. Se connecter à Bemap.
2. Importer les bornes à collecter — depuis un fichier ou en les plaçant à la main sur la carte.
3. Définir le point de départ / retour, les dépôts de vidage et la flotte de véhicules.
4. Lancer l'optimisation.
5. Consulter les tournées et les exporter.

L'optimisation affecte chaque borne à un véhicule, ordonne les arrêts et insère un passage au dépôt de vidage compatible le plus proche chaque fois qu'un camion est plein. Vous obtenez une tournée par véhicule.

**Ce que couvre l'application (Niveaux 1 et 2) :**

| Niveau | Signification |
| --- | --- |
| **Niveau 1** | Un seul véhicule sur des bornes que vous avez déjà choisies → une tournée ordonnée optimale avec insertion des arrêts de vidage. |
| **Niveau 2** | Une flotte : le solveur affecte les bornes aux véhicules, respecte la règle mono-flux (un flux par camion) et optimise toutes les tournées en même temps. |

Quelques règles à garder en tête :

- La sélection des bornes est **manuelle** — vous importez ou placez les bornes, puis activez/désactivez celles que vous voulez inclure ou exclure. Seules les bornes **actives** sont envoyées à l'optimiseur.
- Les quantités sont en **kilogrammes (kg entiers)**. Le poids d'une borne est le **poids à collecter**, pas la capacité de la borne (voir §5).
- Un véhicule est **mono-flux** (il transporte un seul flux).
- Le **point de départ est aussi le point de retour**.
- Un **dépôt de vidage peut accepter plusieurs flux**.
- Les types de flux sont : **verre, emballages, papiers, ordures ménagères, textile**.

**Les deux lieux d'une tournée** — l'application n'écrit jamais « dépôt » tout seul, car deux lieux différents pourraient porter ce mot :

| Terme | Le lieu | Dans une tournée |
| --- | --- | --- |
| **Départ / retour** | Le point unique d'où les véhicules partent et où ils reviennent. | Les arrêts **Départ** (le premier) et **Retour** (le dernier). |
| **Dépôt de vidage** | Un site où un véhicule plein se vide avant de continuer. | Un arrêt **Vidage**. |

---

## 2. Connexion

L'application s'ouvre sur une fenêtre **Configuration Bemap**. Rien d'autre ne fonctionne tant que vous n'êtes pas connecté et que le solveur ne répond pas.

Renseignez :

| Champ | À saisir |
| --- | --- |
| **Environnement** | `Beta`, `Preprod` ou `Prod`. |
| **Utilisateur** | Votre identifiant Bemap. |
| **Mot de passe** | Votre mot de passe Bemap. |
| **Se souvenir sur ce poste** | Cochez pour conserver vos identifiants sur cet ordinateur entre les sessions ; laissez décoché pour les effacer à la fermeture de l'onglet. |

Cliquez sur **Se connecter**. Vos identifiants sont vérifiés auprès de Bemap ; s'ils sont valides, la fenêtre se ferme et la carte se charge.

Deux conditions doivent être réunies avant de pouvoir lancer une optimisation :

1. Vous êtes **connecté** (identifiants Bemap valides).
2. Le **solveur est joignable** — un petit indicateur d'état dans l'en-tête passe au vert quand le solveur répond ; il reste gris/rouge pendant la vérification ou s'il est indisponible. Le bouton **Lancer l'optimisation** reste désactivé tant que le solveur n'est pas disponible.

> Vos identifiants ont un double rôle : ils authentifient la carte et sont transmis au solveur pour qu'il calcule les distances routières en votre nom. Ils sont obfusqués en base64 au repos (non chiffrés) et toujours transmis via HTTPS.

Pour changer d'environnement ou vous connecter sous un autre compte par la suite, ouvrez la section **Configuration Bemap** dans le panneau de gauche et cliquez sur **Modifier** — cela rouvre la même fenêtre.

---

## 3. Présentation de l'espace de travail

L'écran est un planificateur à trois panneaux :

- **Panneau de gauche — saisies.** Tout ce que vous configurez : import, point de départ / retour, flotte, dépôts de vidage, bornes et le bouton **Lancer l'optimisation**.
- **Centre — la carte.** Vos marqueurs et, après un calcul, les tournées optimisées.
- **Panneau de droite — résultats.** Les vignettes de synthèse et une carte par véhicule (masqué tant que vous n'avez pas lancé une première optimisation).

### Commandes de l'en-tête

- **Drapeaux de langue** — basculez l'interface entre **EN / FR / IT / DE**.
- **Bascule de thème** (🌙 / ☀️) — passez du mode clair au mode sombre.
- Bouton **Documentation** — ouvre ce guide et la référence API (voir §14).
- **Indicateur de connexion** — l'état du solveur décrit au §2.
- **Flèches de repli** — repliez le panneau de gauche ou de droite pour agrandir la carte.

### Le Guide par étapes

Un **Guide** épinglé en haut du panneau de gauche liste les étapes dans l'ordre et met en évidence celle où vous en êtes :

1. Connexion Bemap
2. Départ / retour
3. Configurer la flotte
4. Dépôts de vidage
5. Sélection des bornes
6. Lancer l'optimisation

Fermez-le avec le **×** quand vous n'en avez plus besoin.

---

## 4. Import des données

Ouvrez la section **Import des données** dans le panneau de gauche. Vous pouvez charger chaque entité séparément, ou tout un problème en une fois.

### Import par section (CSV ou JSON)

Quatre boutons chargent une entité à la fois, chacune depuis son propre fichier :

| Bouton | Charge |
| --- | --- |
| **Bornes** | Les PAV/BAV à collecter. |
| **Départ / retour** | Le point d'où les véhicules partent et où ils reviennent. |
| **Dépôts de vidage** | Les sites où un véhicule plein se vide. |
| **Véhicules** | La flotte. |

Chaque bouton accepte du **CSV** ou du **JSON**. Le lecteur CSV détecte automatiquement le séparateur (`,` ou `;`) et tolère les variantes courantes de noms de colonnes. Les poids et capacités sont lus en **kg entiers**.

**Colonnes CSV :**

| Entité | Colonnes |
| --- | --- |
| **Bornes** | `id`, `lon`, `lat`, `flux`, `weight_kg` *(poids à collecter, kg entiers)*, `service_time_s` *(facultatif)*, `active` *(facultatif, vrai par défaut)* |
| **Véhicules** | `id`, `flux`, `capacity_kg` |
| **Dépôts de vidage** | `id`, `lon`, `lat`, `flux_accepted` *(ex. `glass\|packages`)*, `dump_time_s` *(facultatif)* |
| **Départ / retour** | `id`, `lon`, `lat` |

### Un problème complet dans un seul fichier

- **Importer un JSON (fichier)** — choisissez un seul fichier JSON déjà au format « problème complet » du solveur (bornes + départ / retour + dépôts de vidage + véhicules) ; tout est chargé en une fois.
- **Import JSON (coller)** — dépliez cette sous-section et collez le même JSON, puis cliquez sur **Importer le JSON**.

### Démarrages rapides

- **Exemple Nice (démo complète)** — charge un petit jeu de données prêt à l'emploi autour de Nice (départ / retour, un dépôt de vidage, six bornes verre, un véhicule) pour lancer un calcul immédiatement.
- **CSV exemple** / **JSON exemple** — téléchargez un modèle CSV à remplir, ou pré-remplissez la zone de collage avec un exemple multi-flux complet (JSON).

### Adaptateur GeoJSON

Si vous importez un `FeatureCollection` GeoJSON de points, l'application le lit comme des bornes : elle reprend les coordonnées de chaque point et reconnaît les libellés de flux courants (par exemple `VERRE` → verre), en attribuant une valeur par défaut aux poids manquants.

---

## 5. Bornes (PAV)

Les bornes apparaissent dans la section **4. Bornes (PAV)** du panneau de gauche et sous forme de marqueurs sur la carte.

### Sur la carte

Chaque borne est un marqueur numéroté, **dont la forme et la couleur dépendent de son flux**, avec un numéro d'ordre. Les bornes inactives sont grisées.

### La liste

Chaque ligne affiche l'identifiant de la borne, son adresse (ou ses coordonnées) et permet de :

- **Activer / désactiver** via la case à cocher — c'est le **mécanisme de sélection manuelle**. Seules les bornes **actives** sont optimisées ; les bornes désactivées restent sur la carte mais sont ignorées. (Cliquer sur le marqueur d'une borne la bascule également.)
- **Changer le flux** depuis la liste déroulante.
- **Modifier le poids** à collecter en kg (nombre entier, supérieur à 0) — voir « Le poids d'une borne » ci-dessous.
- **Centrer** la carte dessus (le bouton ⊙).
- **Supprimer** la borne (le bouton ×).

### Le poids d'une borne

Le poids est **la quantité que vous prévoyez de collecter à cette borne lors de cette tournée**, en kilogrammes entiers. Ce n'est **pas** la capacité totale de la borne.

C'est ce poids qui remplit le camion : l'optimiseur l'ajoute au chargement à chaque arrêt, et dès que le chargement atteindrait la capacité du véhicule, il insère un passage au dépôt de vidage (qui remet le chargement à zéro).

Si vous ne connaissez pas ce poids, estimez-le :

```
poids à collecter  =  poids de la borne à pleine capacité  ×  taux de remplissage
```

Par exemple, une borne à verre pleine à 800 kg, remplie à 75 %, donne 600 kg.

À l'import, une borne sans poids exploitable reçoit **300 kg** par défaut ; une borne placée à la main démarre aussi à 300 kg. Pensez à corriger la valeur.

### Autres actions

- **Ajouter à la main** — cliquez sur **+ Ajouter sur la carte**, puis cliquez sur la carte pour déposer une nouvelle borne. Le point est géocodé et accroché à la route. Le bouton reste armé pour en déposer plusieurs à la suite ; cliquez à nouveau (ou Échap) pour arrêter.
- **Glisser pour repositionner** — faites glisser n'importe quel marqueur ; il est re-géocodé à son nouvel emplacement.
- **Filtre par flux** — les pastilles au-dessus de la liste permettent de n'afficher qu'un flux à la fois (ou **Tous** pour réinitialiser). Le filtre agit à la fois sur la liste et sur les marqueurs.

---

## 6. Départ / retour & dépôts de vidage

### Point de départ / retour (section 1)

Les véhicules partent et reviennent d'un point unique.

- Cliquez sur **Placer sur la carte**, puis cliquez sur l'emplacement. Le point est géocodé et accroché à la route.
- Il n'y a qu'un seul point de départ / retour — un nouveau placement remplace le précédent.
- Utilisez le **×** pour l'effacer.

### Dépôts de vidage (section 3)

Un dépôt de vidage est l'endroit où un camion plein se vide avant de continuer. Ajoutez-en autant que nécessaire.

- Cliquez sur **+ Ajouter sur la carte**, puis cliquez sur chaque emplacement. Le bouton reste armé pour plusieurs dépôts de vidage.
- Pour chaque dépôt de vidage, choisissez les **flux acceptés** :
  - basculez les pastilles de flux individuelles, ou
  - utilisez la pastille **Tous** pour accepter tous les flux d'un coup (cliquez à nouveau pour déplier et affiner).
  Un dépôt de vidage peut accepter plusieurs flux.
- Renseignez le **temps de vidage** (en secondes) pour ce dépôt de vidage. Laissez vide pour utiliser la valeur globale par défaut (voir §7).
- Utilisez **⊙** pour centrer la carte sur un dépôt de vidage et **×** pour le supprimer.

Chaque dépôt de vidage doit accepter au moins un flux, et chaque flux que vous collectez doit disposer d'au moins un dépôt de vidage qui l'accepte (les contrôles du §8 le vérifient).

---

## 7. La flotte

Ouvrez la section **2. Flotte** dans le panneau de gauche.

- **+ Ajouter un véhicule** crée un véhicule. Chaque véhicule possède :
  - un **identifiant**,
  - un **flux** (mono-flux — à choisir dans la liste déroulante),
  - une **capacité en kg**.
- Modifiez le flux et la capacité directement dans la ligne ; supprimez un véhicule avec le **×**.

Il vous faut au moins un véhicule par flux collecté.

### Temps de service avancés (global)

La section **Paramètres (global)** définit les temps de service utilisés partout :

| Paramètre | Signification | Défaut |
| --- | --- | --- |
| **Temps de collecte / borne (s)** | Secondes passées à chaque borne. | 120 |
| **Temps de vidage (s)** | Secondes passées à un dépôt de vidage (une valeur par dépôt de vidage au §6 la remplace). | 600 |
| **Temps au départ / retour (s)** | Secondes passées au point de départ / retour. | 0 |

### Équilibrage de charge

Pour l'instant, le solveur **équilibre les tournées par le temps** (intégré, sans réglage). L'équilibrage par poids collecté ou par nombre de bornes est prévu pour une version ultérieure.

---

## 8. Contrôles avant optimisation

Au-dessus du bouton **Lancer l'optimisation**, un panneau de validation liste tout ce qui demande attention. Il se met à jour **en direct** au fil de vos modifications, de sorte que vous savez toujours si vous pouvez lancer le calcul.

Deux types de signalements :

- **Problèmes bloquants (rouge)** — ils **désactivent le bouton Lancer** tant qu'ils ne sont pas corrigés. Exemples : pas de point de départ / retour, aucune borne active, aucun véhicule, aucun dépôt de vidage ; un identifiant en double ou vide ; des coordonnées hors plage ; un poids/capacité non entier ou nul ; un flux sans véhicule ou sans dépôt de vidage compatible ; une borne plus lourde que la capacité de tout véhicule de son flux.
- **Avertissements (orange)** — à noter, mais ils **ne bloquent pas**. Exemples : un véhicule dont le flux n'a aucune borne active, ou un dépôt de vidage dont les flux acceptés ne correspondent à aucun de ceux que vous collectez (il restera inutilisé).

Lorsque l'application peut résoudre un problème pour vous, le signalement propose une **correction en un clic** (par exemple : fixer un poids valide, augmenter une capacité, ajouter le flux manquant à un dépôt de vidage, ou ajouter un véhicule pour un flux).

Quand il n'y a plus de problème bloquant, le bouton **Lancer l'optimisation** devient disponible.

---

## 9. Lancer l'optimisation

Cliquez sur **Lancer l'optimisation**.

- Un **écran de chargement** plein écran affiche des étapes successives : **1/3 préparation des données** (matrices de routage) → **2/3 optimisation** → **3/3 mise en forme des résultats**.
- Un calcul peut être **annulé** avec le bouton **Annuler** ; démarrer un nouveau calcul interrompt aussi le précédent.
- Un calcul peut prendre **jusqu'à 15 minutes** pour les gros problèmes. La plupart sont bien plus rapides.

Il existe aussi un bouton **Télécharger les données (JSON)** qui exporte exactement ce qui serait envoyé au solveur — pratique pour le support ou pour réimporter plus tard.

Quand le calcul réussit, le panneau de droite s'ouvre avec les résultats.

---

## 10. Lecture des résultats

Le panneau de droite (**Résultats — Tournées optimisées**) comporte trois parties.

### Vignettes de synthèse

En un coup d'œil, les totaux sur l'ensemble des véhicules :

- **Véhicules** utilisés
- **Temps total**
- **Distance totale** (km)
- **Bornes** collectées
- **Vidages** (arrêts de vidage)
- **Collecté** (kg)

### Une carte par véhicule

Chaque véhicule dispose d'une carte à sa **couleur de tournée**, indiquant son **flux**, sa **capacité**, le **nombre** de bornes collectées et de vidages effectués, ainsi que sa **durée et sa distance**. Chaque carte propose :

- Un bouton **œil** pour **afficher/masquer cette tournée sur la carte**.
- La **liste ordonnée des arrêts** — chaque arrêt numéroté dans l'ordre (départ, bornes, arrêts de vidage, retour). Chaque arrêt de borne indique son poids et la **charge cumulée** après lui ; chaque arrêt de vidage indique la charge juste avant le vidage.
- Un menu **Exporter** (CSV / JSON) pour ce seul véhicule.

### Carte & navigation

- **Tout afficher / Tout masquer** (en-tête du panneau) basculent toutes les tournées d'un coup.
- Lorsque plusieurs flux sont présents, un **filtre par flux** restreint à la fois les cartes et les itinéraires sur la carte.
- **Cliquez sur un arrêt** dans une carte pour centrer la carte dessus.
- Si une tournée a échoué pour un flux donné, une bannière le signale ; les bornes qui n'ont pas pu être visitées sont également indiquées.

> Les tournées sont tracées par une ligne colorée par véhicule, avec des fanions d'arrêt numérotés. Quand le routage est disponible, la ligne suit les routes ; sinon, elle se rabat sur des lignes droites (voir §13).

---

## 11. Export

Vous pouvez exporter à deux niveaux.

**Toutes les tournées** (boutons en haut du panneau de résultats) :

- **Exporter CSV** — un fichier détaillé, une ligne par arrêt, avec le véhicule, le flux, l'ordre de l'arrêt, le type, l'identifiant, les coordonnées, le poids et la charge cumulée.
- **Exporter JSON** — la solution complète.

**Par véhicule** (le menu **Exporter** dans chaque carte) :

- **CSV** — les arrêts de ce véhicule uniquement.
- **JSON** — la tournée de ce véhicule uniquement.

Tous les fichiers sont téléchargés avec un nom horodaté.

---

## 12. Langues & thème

- **Langues de l'interface :** anglais, français, italien, allemand — à basculer avec les drapeaux de l'en-tête.
- **Thème :** clair ou sombre, via le bouton 🌙 / ☀️. Votre choix est mémorisé sur le poste.

---

## 13. Dépannage

| Symptôme | Signification | Que faire |
| --- | --- | --- |
| Tournées tracées en lignes droites ; distance marquée **estimée** | Le routage est hors ligne : le solveur n'a renvoyé ni géométrie routière ni distance (zéro). L'optimisation par le temps reste valable. | Considérez les distances comme approximatives ; vérifiez la connectivité s'il vous faut de vraies distances routières. |
| Signalements bloquants rouges, bouton **Lancer** désactivé | La saisie présente un problème que le solveur rejetterait. | Corrigez les éléments du panneau de validation (§8) ; utilisez les corrections en un clic lorsqu'elles sont proposées. |
| Message **aucune tournée réalisable** | Le solveur n'a pas pu construire de tournée (ex. contrainte impossible). | Revoyez les capacités, les flux des dépôts de vidage et les poids des bornes. |
| Bannière **solution partielle** | Un flux n'a pas pu être résolu alors que d'autres ont réussi. | La bannière nomme le flux en échec ; vérifiez ses véhicules et ses dépôts de vidage. |
| **Trop long / délai dépassé** | Le calcul a dépassé la limite de temps. | Réduisez le périmètre (moins de bornes, problème plus simple) et réessayez. |
| **Service indisponible / erreur serveur** | Le solveur est arrêté ou a renvoyé une erreur. | Patientez puis réessayez ; vérifiez l'indicateur de connexion (§2). |
| **Identifiants Bemap invalides** | Le solveur n'a pas pu s'authentifier auprès de Bemap. | Ouvrez **Configuration Bemap → Modifier** et reconnectez-vous (§2). |

---

## 14. Documentation & support

Cliquez sur le bouton **Documentation** dans l'en-tête pour ouvrir le panneau de documentation. Il comporte deux onglets :

- **Guide utilisateur** — le présent document.
- **Référence API** — la référence d'intégration/du contrat.

Vous pouvez changer la langue de la documentation (**EN / FR**) et **télécharger** n'importe quel document au format Markdown (`.md`).

Pour tout point non couvert ici, contactez votre interlocuteur BeNomad.
