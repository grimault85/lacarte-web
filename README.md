# La Carte Web — Application mobile & web

Version web de l'application de gestion du cabinet **La Carte Advisory**, accessible depuis n'importe quel appareil via navigateur.

**URL de production :** `https://app.lacarte-conseil.fr`

---

## Stack technique

| Composant | Technologie |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router DOM v6 |
| Base de données | Supabase (partagée avec l'app desktop) |
| Hébergement | Vercel |
| Domaine | OVH → CNAME → Vercel |

---

## Installation locale

### Prérequis
- [Node.js](https://nodejs.org) v18 ou supérieur

### Première installation

```powershell
cd C:\Users\GRIMAULT\documents\consulting\lacarte-web
npm install
```

Créer un fichier `.env.local` à la racine du projet :

```
VITE_SUPABASE_URL=https://eqkpugvccpolkgtnmpxs.supabase.co
VITE_SUPABASE_ANON_KEY=<clé anon disponible dans Supabase → Settings → API>
```

> Ce fichier est exclu du dépôt git (`.gitignore`). Ne jamais committer les clés.

### Lancer en développement

```powershell
npm run dev
```

Ouvre `http://localhost:5173` dans le navigateur.

### Générer le build de production

```powershell
npm run build
npm run preview   # tester le build localement
```

---

## Déploiement

Le projet est connecté à GitHub. Chaque `git push` sur `main` déclenche un build automatique sur Vercel.

```powershell
cd C:\Users\GRIMAULT\documents\consulting\lacarte-web
git add .
git commit -m "description des changements"
git push
```

### ⚠️ Promotion manuelle requise

**"Auto-assign Custom Production Domains" est désactivé sur Vercel.** Le build se déclenche automatiquement mais le domaine `app.lacarte-conseil.fr` n'est **pas mis à jour automatiquement**.

Après chaque `git push`, il faut manuellement promouvoir le déploiement :

1. Vercel → **Deployments**
2. Dernier déploiement → `...` → **Promote to Production**

> Pour activer la mise à jour automatique : Vercel → Settings → Git → activer **"Auto-assign Custom Production Domains"**.

---

## Structure du projet

```
lacarte-web/
├── src/
│   ├── App.jsx               # Router principal + AuthContext + lazy loading
│   ├── supabase.js           # Client Supabase (credentials via .env.local)
│   ├── main.jsx              # Point d'entrée React
│   ├── index.css             # Styles globaux
│   ├── components/
│   │   ├── Layout.jsx        # Sidebar desktop + menu mobile
│   │   └── BackToDashboard.jsx  # Bouton retour dashboard
│   └── pages/
│       ├── Login.jsx         # Page de connexion
│       ├── Dashboard.jsx     # Tableau de bord cockpit
│       ├── Clients.jsx       # Liste des clients
│       ├── ClientDetail.jsx  # Fiche client
│       ├── Pipeline.jsx      # Pipeline commercial
│       ├── Facturation.jsx   # Suivi facturation
│       └── Social.jsx        # Réseaux sociaux
├── public/
├── .env.local                # Variables d'environnement (non versionné)
├── .gitignore
├── vercel.json               # Rewrites SPA pour Vercel
├── vite.config.js            # Build optimisé : code splitting + terser
└── package.json
```

---

## Pages

### 🔐 Login
Authentification via Supabase Auth. Accès réservé au cabinet.

### 📊 Dashboard
Cockpit d'action quotidien, identique à la version desktop :
- ⚠️ Actions en retard (avec nombre de jours)
- 🎯 Missions en cours avec barre de progression
- 📧 Devis sans réponse
- 💬 Relances à planifier (clients clôturés +60j)
- 🕐 Dernière activité globale

### 📁 Clients
Liste des dossiers avec filtres par étape. Navigation vers la fiche détaillée.

### 👤 Client Detail
Fiche client avec informations, tâches, notes et historique. Modification du statut en direct.

### 🎯 Pipeline
Vue Kanban des prospects en cours de conversion. Changement de statut en ligne.

### 💰 Facturation
Suivi des factures avec filtres par statut :
- Brouillon · Envoyée · En attente · **1er versement reçu** · Payée ✓ · En retard
- KPIs : CA encaissé, CA en attente, CA en retard
- Modification du statut directement depuis la liste

### 📱 Réseaux Sociaux
- **Banque de contenus** — pipeline visuel Idée → Brouillon → Programmé → Publié, affichage des visuels uploadés
- **Suivi performance** — KPIs globaux, taux d'engagement par post

---

## Authentification

L'app utilise **Supabase Auth**. La session est gérée via `AuthContext` dans `App.jsx`.

Les routes sont protégées par le composant `RequireAuth` — toute tentative d'accès sans session redirige vers `/login`.

**Connexion :** email + mot de passe configurés dans Supabase → Authentication → Users.

---

## Variables d'environnement

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique anon (Supabase → Settings → API) |

En local : fichier `.env.local` (non versionné).
Sur Vercel : Settings → Environment Variables.

---

## Base de données

Partagée avec l'application desktop. Les données sont synchronisées en temps réel — une modification dans l'app desktop est immédiatement visible sur le web, et inversement.

---

## Responsive

L'application est optimisée pour mobile et desktop :

| Écran | Comportement |
|---|---|
| Desktop (>768px) | Sidebar fixe à gauche |
| Mobile (<768px) | Top bar avec menu hamburger ☰ |

---

## Charte graphique

| Élément | Valeur |
|---|---|
| Navy | `#0D1520` |
| Or | `#C9A84C` |
| Crème | `#EEE6C9` |
| Police titres | DM Serif Display |
| Police corps | DM Sans |

---

## Performance

| Optimisation | Détail |
|---|---|
| Lazy loading | Les 6 pages sont chargées à la demande (`React.lazy` + `Suspense`) |
| Code splitting | Bundle séparé vendor (React/Router) + supabase via `manualChunks` |
| Minification | Terser activé en production |
| Memoization | Calculs dérivés du Dashboard via `useMemo` |

---

## Configuration Vercel

Le fichier `vercel.json` redirige toutes les routes vers `index.html` pour le routing côté client (SPA) :

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Différences avec l'app desktop

La version web est conçue pour la **mobilité et les actions rapides**. Certaines sections lourdes restent desktop uniquement :

| Section | Desktop | Web |
|---|---|---|
| Tableau de bord | ✓ | ✓ |
| Dossiers clients | ✓ | ✓ (simplifié) |
| Pipeline | ✓ | ✓ |
| Facturation | ✓ | ✓ |
| Réseaux Sociaux | ✓ | ✓ |
| Dossier Interne | ✓ | — |
| Comptabilité complète | ✓ | — |
| Ressources | ✓ | — |
| Analyses financières | ✓ | — |
| Génération PDF | ✓ | — |

---

## Auteur

**Anthony Grimault** — Fondateur La Carte Advisory
📧 lacarte.advisory@gmail.com
