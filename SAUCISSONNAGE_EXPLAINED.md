# 🔍 Détection du Saucissonnage - Guide Simple

## Qu'est-ce que le saucissonnage ?

**Le saucissonnage = Fractionnement artificiel de marchés**

C'est une fraude où un service contractant découpe volontairement un gros marché en plusieurs petits pour éviter les règles strictes.

### Exemple concret :
- **Règle légale** : Un marché > 12 millions DZD doit passer par appel d'offres ouvert
- **Fraude** : Le service crée 3 marchés de 4 millions DZD chacun (12M total)
- **Résultat** : Ils évitent l'appel d'offres ouvert et peuvent choisir qui ils veulent

---

## Comment ça marche ?

### 1. Vous entrez :
- **ID du service contractant** (l'organisme gouvernemental à vérifier)
- **Dates** (optionnel - pour analyser une période spécifique)

### 2. Le système détecte 4 types de fraude :

#### 📊 Signal 1 : Proximité de seuil
**Quoi ?** Un marché dont le montant est juste sous le seuil légal (entre 85% et 100%)  
**Exemple :** Marché de 11.8M DZD alors que le seuil est 12M DZD  
**Pourquoi c'est suspect ?** Trop proche du seuil pour être un hasard

#### ⏱️ Signal 2 : Clustering temporel
**Quoi ?** Plusieurs marchés similaires publiés rapidement (< 90 jours)  
**Exemple :** 3 marchés "fournitures de bureau" en 2 mois  
**Pourquoi c'est suspect ?** Pourquoi ne pas les regrouper en un seul marché ?

#### 💰 Signal 3 : Cumul dépassant le seuil ⚠️ CRITIQUE
**Quoi ?** Chaque marché < seuil, mais leur SOMME > seuil  
**Exemple :** 3 marchés de 4M, 5M et 3.5M DZD = 12.5M total  
**Pourquoi c'est suspect ?** C'est la définition exacte du saucissonnage

#### 🤝 Signal 4 : Même fournisseur
**Quoi ?** Le même opérateur remporte plusieurs marchés du même service (≥3)  
**Exemple :** L'entreprise X gagne 4 marchés du même ministère  
**Pourquoi c'est suspect ?** Possible collusion ou favoritisme

---

## Que faire avec les résultats ?

### Le score de risque (0-100)
- **0-50** : Risque faible (peut-être normal)
- **50-80** : Risque modéré (à surveiller)
- **80-100** : Risque critique (violation probable)

### Pour chaque anomalie, vous pouvez :
1. **Confirmer fraude** → Marque comme véritable fraude (enquête nécessaire)
2. **Faux positif** → Rejette l'alerte (le système s'est trompé)

---

## Pourquoi c'est important ?

Le saucissonnage est interdit par **l'Article 7 de la Loi 23-12** car :
- Il contourne les procédures transparentes
- Il favorise la corruption
- Il coûte plus cher aux contribuables
- Il réduit la concurrence

Ce système aide à détecter automatiquement ces fraudes au lieu de vérifier manuellement des milliers de marchés.

---

## Interface simplifiée

✅ **Couleurs minimales** : Seulement rouge pour critique, vert pour conforme, gris pour le reste  
✅ **Explications claires** : Chaque signal est expliqué en termes simples  
✅ **Actions directes** : 2 boutons clairs : "Confirmer fraude" ou "Faux positif"  
✅ **Score visuel** : Jauge circulaire pour voir le risque d'un coup d'œil

---

## Questions fréquentes

**Q : C'est quoi la "confiance" à côté de chaque anomalie ?**  
R : Le niveau de certitude de l'IA (70% = probable, 95% = quasi-certain)

**Q : Pourquoi certains marchés apparaissent plusieurs fois ?**  
R : Un marché peut déclencher plusieurs signaux (ex : proche du seuil ET même fournisseur)

**Q : Les données de test, c'est quoi ?**  
R : Des exemples pré-chargés pour tester le système :
- **SC#1** : Cas critique (saucissonnage évident)
- **SC#2** : Cas modéré (proximité de seuil)
- **SC#3** : Cas conforme (aucune anomalie)
