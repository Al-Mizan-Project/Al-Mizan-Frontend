# 🚀 Guide de Setup - Détection du Saucissonnage

## ✅ Ce qui a été implémenté

### Backend (Al-Mizan-Backend)
1. ✅ Module IA de détection (`services/ia_service/`)
2. ✅ API endpoints pour saucissonnage
3. ✅ Données de test (3 services contractants avec anomalies)

### Frontend (Al-Mizan-Frontend)
1. ✅ Route proxy `/api/proxy/ia`
2. ✅ Client API `lib/api/ia.ts`
3. ✅ Composant `SaucissonnageView.tsx`
4. ✅ Navigation dans le sidebar System Admin

---

## 📦 Prérequis

Assurez-vous d'avoir :
- Docker Desktop (installé et en cours d'exécution)
- Node.js 18+ et npm
- Git

---

## 🔧 Setup Backend (Première fois uniquement)

### Étape 1 : Cloner et configurer

```bash
cd Al-Mizan-Backend
```

### Étape 2 : Créer le fichier `.env`

Créez un fichier `.env` à la racine du backend avec :

```env
# Aucune configuration spéciale nécessaire pour local
```

### Étape 3 : Démarrer les services Docker

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build
```

**⏱️ Attendre 1-2 minutes** que tous les services démarrent.

### Étape 4 : Vérifier que tout fonctionne

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml ps
```

Vous devriez voir :
- ✅ backend (healthy)
- ✅ postgres (healthy)
- ✅ redis (healthy)
- ✅ minio (healthy)
- ✅ nginx (healthy)

### Étape 5 : Créer les données de test

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml exec backend python manage.py shell
```

Puis dans le shell Python, coller ce code :

```python
from services.appels_service.models import AppelOffres, ServiceContractant
from services.ia_service.models import DetectionAnomalieIA
from datetime import datetime, timedelta
from decimal import Decimal

# Créer les services contractants
sc1, _ = ServiceContractant.objects.get_or_create(
    id_service_contractant=1,
    defaults={'nom': 'Ministère de la Santé', 'type_organisme': 'MINISTERIEL'}
)
sc2, _ = ServiceContractant.objects.get_or_create(
    id_service_contractant=2,
    defaults={'nom': 'Ministère de l\'Éducation', 'type_organisme': 'MINISTERIEL'}
)
sc3, _ = ServiceContractant.objects.get_or_create(
    id_service_contractant=3,
    defaults={'nom': 'Commune d\'Alger', 'type_organisme': 'COMMUNAL'}
)

# SC#1 - CRITIQUE : Cumul dépassant seuil (3 marchés fournitures = 12.5M > 12M)
today = datetime.now().date()
a1 = AppelOffres.objects.create(
    numero_ao='AO-2024-001', titre='Achat fournitures médicales lot A',
    objet='Fournitures médicales', type_marche='FOURNITURES',
    montant_estime=Decimal('4000000'), id_service_contractant=sc1,
    statut='PUBLIE', date_publication=today - timedelta(days=30)
)
a2 = AppelOffres.objects.create(
    numero_ao='AO-2024-002', titre='Achat fournitures médicales lot B',
    objet='Fournitures médicales', type_marche='FOURNITURES',
    montant_estime=Decimal('5000000'), id_service_contractant=sc1,
    statut='PUBLIE', date_publication=today - timedelta(days=25)
)
a3 = AppelOffres.objects.create(
    numero_ao='AO-2024-003', titre='Achat fournitures médicales lot C',
    objet='Fournitures médicales', type_marche='FOURNITURES',
    montant_estime=Decimal('3500000'), id_service_contractant=sc1,
    statut='PUBLIE', date_publication=today - timedelta(days=20)
)

# SC#2 - MOYEN : Proximité de seuil (21M sur seuil 25M = 84%)
a4 = AppelOffres.objects.create(
    numero_ao='AO-2024-010', titre='Construction école primaire',
    objet='Travaux de construction', type_marche='TRAVAUX',
    montant_estime=Decimal('21000000'), id_service_contractant=sc2,
    statut='PUBLIE', date_publication=today - timedelta(days=15)
)

# SC#3 - AUCUN : Marché conforme (30M > 25M, procédure complète)
a5 = AppelOffres.objects.create(
    numero_ao='AO-2024-020', titre='Rénovation voirie principale',
    objet='Travaux de rénovation', type_marche='TRAVAUX',
    montant_estime=Decimal('30000000'), id_service_contractant=sc3,
    statut='PUBLIE', date_publication=today - timedelta(days=10)
)

print("✅ Données de test créées avec succès!")
print(f"- SC#1: {AppelOffres.objects.filter(id_service_contractant=sc1).count()} appels")
print(f"- SC#2: {AppelOffres.objects.filter(id_service_contractant=sc2).count()} appels")
print(f"- SC#3: {AppelOffres.objects.filter(id_service_contractant=sc3).count()} appels")
exit()
```

Taper `exit()` pour quitter le shell.

---

## 🎨 Setup Frontend

### Étape 1 : Aller dans le dossier frontend

```bash
cd Al-Mizan-Frontend
```

### Étape 2 : Créer le fichier `.env.local`

Créez un fichier `.env.local` avec :

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_IA_SERVICE_URL=http://localhost:8080
NEXT_PUBLIC_APPELS_SERVICE_URL=http://localhost:8080
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:8080
```

### Étape 3 : Installer les dépendances

```bash
npm install
```

### Étape 4 : Lancer le serveur de développement

```bash
npm run dev
```

Le frontend sera accessible sur : **http://localhost:3000**

---

## 🧪 Tester la Fonctionnalité

### 1. Se connecter

- URL : http://localhost:3000/fr/login
- Email : `a@a.dz`
- Mot de passe : `admin1234`

### 2. Accéder à la détection

- Cliquer sur **"System Admin"** dans le menu
- Cliquer sur **"Détection Saucissonnage"** dans le sidebar

### 3. Tester les 3 cas

#### Test 1 : SC#1 — Saucissonnage CRITIQUE ⚠️

1. Cliquer sur le bouton **"SC#1 — Saucissonnage CRITIQUE"**
2. **Résultat attendu :**
   - Score de risque : **~85-95** (rouge)
   - Niveau : **CRITIQUE**
   - 1-2 anomalies détectées
   - Type : **Cumul dépassant seuil**
   - Appels affectés : **3** (AO-2024-001, AO-2024-002, AO-2024-003)
   - Message : "3 marchés fournitures, cumul > 12M DA"

#### Test 2 : SC#2 — Proximité de seuil ⚡

1. Cliquer sur le bouton **"SC#2 — Proximité de seuil"**
2. **Résultat attendu :**
   - Score de risque : **~50-70** (gris)
   - Niveau : **MOYEN** ou **ÉLEVÉ**
   - 1 anomalie détectée
   - Type : **Proximité de seuil**
   - Appels affectés : **1** (AO-2024-010)
   - Message : "1 marché travaux à 84% du seuil 25M DA"

#### Test 3 : SC#3 — Aucune anomalie ✅

1. Cliquer sur le bouton **"SC#3 — Aucune anomalie"**
2. **Résultat attendu :**
   - **Aucune anomalie détectée** (message vert avec checkmark)
   - Score : **0**
   - Niveau : **AUCUN**
   - Message : "Ce service contractant ne présente aucun signe de fractionnement"

---

## 🎬 Pour la Démo de Demain

### Scénario de présentation recommandé :

1. **Introduction (1 min)**
   - "Nous avons implémenté un module de détection automatique du saucissonnage"
   - "Il analyse les appels d'offres et détecte 4 types de fraude"

2. **Démonstration du cas CRITIQUE (2 min)**
   - Cliquer sur "SC#1 — Saucissonnage CRITIQUE"
   - Montrer le score rouge (85+)
   - Expliquer : "3 marchés de fournitures médicales qui totalisent 12.5M alors que le seuil est 12M"
   - Cliquer sur "Voir les détails" d'une anomalie
   - Montrer les appels concernés (#1, #2, #3)
   - Cliquer sur "Confirmer fraude" pour montrer l'action

3. **Cas modéré (1 min)**
   - Cliquer sur "SC#2 — Proximité de seuil"
   - Montrer : "Un marché à 21M sur un seuil de 25M = 84%"
   - Expliquer : "Trop proche pour être un hasard"

4. **Cas conforme (30 sec)**
   - Cliquer sur "SC#3 — Aucune anomalie"
   - Montrer le message vert : "Aucune anomalie détectée"
   - Expliquer : "Le système sait aussi reconnaître les marchés conformes"

5. **Conclusion (30 sec)**
   - "L'algorithme utilise Jaccard + Union-Find pour détecter les patterns"
   - "Les 4 signaux sont basés sur l'Article 7 de la Loi 23-12"
   - "Les auditeurs peuvent confirmer ou rejeter chaque anomalie"

---

## 🐛 Troubleshooting

### Problème : Backend ne démarre pas

```bash
# Arrêter tout
docker compose --env-file deploy/.env -f deploy/docker-compose.yml down -v

# Redémarrer proprement
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build
```

### Problème : Erreur 502 sur le frontend

Vérifier que le backend est accessible :
```bash
curl http://localhost:8080/auth/login
```

Si ça ne marche pas, vérifier les logs :
```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml logs backend
```

### Problème : Pas de données de test

Relancer le script Python (Étape 5 du Backend).

### Problème : Erreur "Module not found"

```bash
cd Al-Mizan-Frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📸 Screenshots à Prendre (pour la doc)

1. État initial avec les 3 boutons de test
2. Résultat SC#1 avec score critique rouge
3. Détails d'une anomalie déployée
4. Résultat SC#3 avec message vert "Aucune anomalie"
5. Vue filtres (TOUS / CRITIQUE / ÉLEVÉE / etc.)

---

## 📝 Fichiers Modifiés (pour le commit)

### Backend
- `services/ia_service/` (nouveau module complet)
- `config/urls.py` (ajout route IA)

### Frontend
- `app/api/proxy/ia/route.ts` (nouveau)
- `lib/api/ia.ts` (nouveau)
- `components/SaucissonnageView.tsx` (nouveau)
- `components/SystemAdminSidebar.tsx` (ajout nav item)
- `app/[lang]/system-admin/page.tsx` (ajout vue)
- `.env.local` (configuration)

---

## ✅ Checklist Avant la Démo

- [ ] Backend Docker tourne (vérifier avec `docker ps`)
- [ ] Frontend npm run dev lancé
- [ ] Login fonctionne (a@a.dz / admin1234)
- [ ] Les 3 boutons de test sont visibles
- [ ] SC#1 retourne des anomalies CRITIQUE
- [ ] SC#3 retourne "Aucune anomalie"
- [ ] Navigateur en plein écran (F11)
- [ ] Zoom à 100% (Ctrl+0)
- [ ] Cache navigateur vidé (Ctrl+Shift+R)

---

## 🎯 Points Clés à Mentionner

✅ **Technique :**
- Algorithme Union-Find pour clustering
- Similarité de Jaccard pour détecter les marchés similaires
- 4 signaux basés sur la loi (Article 7)
- Score de confiance calibré (70%-95%)

✅ **Métier :**
- Détection automatique du saucissonnage
- Basé sur les seuils réglementaires algériens (12M fournitures, 25M travaux)
- Explicabilité complète (chaque anomalie est justifiée)
- Actions auditeur (confirmer/rejeter)

✅ **Impact :**
- Gain de temps énorme (analyse automatique vs manuelle)
- Détection proactive des fraudes
- Défendable légalement (règles explicites, pas de boîte noire)

---

**Bon courage pour la démo ! 🚀**
