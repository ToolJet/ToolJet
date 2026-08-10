---
id: unique-constraint
title: Résoudre les erreurs de contrainte d'unicité dans le branching Git
---

:::warning BETA
Les branches et les pull requests sont actuellement en beta et ne sont pas recommandées pour un usage en production.
:::

Cette page s'applique aux workspaces utilisant [les branches et les pull requests](/docs/beta/branching-and-pr).

Lorsque vous travaillez avec des branches, toutes les modifications sont limitées à cette branche uniquement. Cependant, certains champs de ToolJet doivent être uniques au sein d'une branche. Lorsque deux branches attribuent indépendamment la même valeur à l'un de ces champs et que les deux sont fusionnées dans main, la récupération (pull) du dernier commit depuis Git échouera avec une erreur de contrainte d'unicité.

**Champs avec des contraintes d'unicité :**

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

- Slug de l'application
- Nom de l'application
- Nom du dossier de l'application

</div>

<div style = {{ width:'5%' }} > </div>

<div style = {{ width:'50%' }} >

- Nom du module
- Nom de la source de données
- Nom du dossier de module

</div>

</div>

## Comment cela se produit

Lorsque deux développeurs travaillent sur des branches séparées, chacun opère de manière isolée — les vérifications de contrainte d'unicité s'appliquent uniquement au sein d'une seule branche. Cela signifie que les deux branches peuvent avoir une application avec le même slug (`/inventory`, par exemple) sans que cela ne déclenche d'erreur.

Une fois que les deux pull requests sont fusionnées dans main, la branche main dans Git contient désormais deux applications avec le même slug. La récupération de ces changements dans ToolJet échouera, car ToolJet ne peut pas autoriser de valeurs dupliquées pour des champs contraints.

**Exemple :**
1. Le développeur A crée une application sur `feature/inventory` avec le slug `/inventory`.
2. Le développeur B crée une application différente sur `feature/catalog`, également avec le slug `/inventory`.
3. Les deux PR sont révisées et fusionnées dans main (éventuellement avec un conflit au niveau de Git qui a été accepté manuellement).
4. Récupérer main dans ToolJet déclenche une erreur de contrainte d'unicité identifiant le slug en conflit.

## Résoudre l'erreur

### Option 1 : la branche existe toujours

Si la branche qui a introduit la valeur dupliquée existe toujours :

1. Basculez vers cette branche dans ToolJet.
2. Renommez le champ en conflit (par exemple, changez le slug de l'application de `/inventory` à `/inventory-catalog`).
3. Commitez le changement et poussez-le (push) vers Git.
4. Ouvrez une pull request et fusionnez-la dans main.
5. Récupérez (pull) le dernier commit de main dans ToolJet — le conflit est désormais résolu.

### Option 2 : la branche a été supprimée

Si la branche a été automatiquement supprimée après la fusion de la PR, vous ne pouvez pas faire de pull depuis main pour corriger le problème, car le pull tentera de récupérer l'état complet de la branche et échouera à cause des champs en conflit. À la place, utilisez un workspace temporaire pour importer uniquement l'application concernée afin de pouvoir la renommer proprement.

1. **Créez un nouveau workspace temporaire** dans ToolJet.
2. **Connectez-le au même dépôt Git** en utilisant vos identifiants Git existants.
3. **Importez l'application concernée** en utilisant l'option d'import depuis Git — n'utilisez pas Pull, car cela tentera de récupérer l'état complet de la branche et échouera à cause des champs en conflit.
4. **Créez une nouvelle branche** dans le workspace temporaire.
5. **Renommez le champ en conflit** (par exemple, mettez à jour le slug de l'application avec une valeur unique).
6. **Commitez, poussez, créez une pull request**, puis fusionnez-la dans main.
7. **Récupérez (pull) le dernier commit de main** dans votre workspace d'origine — le conflit est désormais résolu.

:::info
Le message d'erreur affiché dans ToolJet identifiera l'application ou la ressource spécifique (par nom ou ID) à l'origine du conflit, ce qui vous aide à localiser la bonne branche ou application à corriger.
:::
