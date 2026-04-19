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

Le projet est connecté à GitHub. Chaque `git push` déclenche un redéploiement automatique sur Vercel.

```powershell
cd C:\Users\GRIMAULT\documents\consulting\lacarte-web
git add .
git commit -m "description des changements"
git push
```

Vercel redéploie en ~1 minute sur `app.lacarte-conseil.fr`.

---

## Structure du projet

```
lacarte-web/
├── src/
│   ├── App.jsx               # Router principal + AuthContext
│   ├── supabase.js           # Client Supabase
│   ├── main.jsx              # Point d'entrée React
│   ├── index.css             # Styles globaux
│   ├── components/
│   │   └── Layout.jsx        # Sidebar desktop + menu mobile
│   └── pages/
│       ├── Login.jsx         # Page de connexion
│       ├── Dashboard.jsx     # Tableau de bord cockpit
│       ├── Clients.jsx       # Liste des clients
│       ├── ClientDetail.jsx  # Fiche client
│       ├── Pipeline.jsx      # Pipeline commercial
│       ├── Facturation.jsx   # Suivi facturation
│       └── Social.jsx        # Réseaux sociaux
├── public/
├── vercel.json               # Rewrites SPA pour Vercel
├── vite.config.js
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

## Base de données

Partagée avec l'application desktop. Les données sont synchronisées en temps réel — une modification dans l'app desktop est immédiatement visible sur le web, et inversement.

**Supabase URL :** `https://eqkpugvccpolkgtnmpxs.supabase.co`

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
