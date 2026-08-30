---
id: upgrade-to-v3
title: Guide de migration vers ToolJet 3.0
slug: /setup/upgrade-to-v3/
---

ToolJet 3.0 est une nouvelle **version majeure**, incluant des **changements majeurs (breaking changes)** qui nécessitent d'ajuster vos applications en conséquence. Nous allons vous guider tout au long de ce processus et mentionner quelques changements importants.

:::tip Avant la mise à niveau

Avant de procéder à la mise à niveau, nous vous recommandons de revoir vos applications existantes pour toute utilisation de fonctionnalités dépréciées. Traiter ces points en amont vous aidera à réduire le travail nécessaire pour passer à ToolJet 3.0.

Pour les applications complexes, nous vous recommandons également de mettre en place des procédures de test approfondies pour vous assurer que vos applications fonctionnent correctement après la mise à niveau.
:::

## Mise à niveau vers ToolJet 3.0

### Prérequis ⚠️

Avant de tenter la mise à niveau vers ToolJet 3.0 :

- **Sauvegarde de la base de données** : créez une sauvegarde complète de votre base de données
- **Revue des applications** : vérifiez vos applications pour les fonctionnalités majeures et dépréciées listées dans ce guide.
- **Environnement de test** : ne tentez la mise à niveau que dans un environnement de test d'abord.

Pour effectuer la mise à niveau, consultez la dernière image Docker **[ici](/docs/setup/choose-your-tooljet)**.

## Changements majeurs (Breaking Changes)

Les changements suivants sont majeurs et nécessitent une action immédiate pour garantir que vos applications continuent de fonctionner correctement après la mise à niveau.

## Restrictions sur les entrées dynamiques

Vous ne pouvez plus modifier dynamiquement les références aux noms de composants.

### Action requise

- Vérifiez vos applications pour toute référence dynamique à un nom de composant et adaptez le code si nécessaire
- Remplacez toutes les références dynamiques aux composants par des références statiques
- Testez toutes les interactions des composants après avoir effectué ces changements

### Exemples et détails

Les modèles suivants ne sont plus pris en charge :

1. Utilisation de variables pour construire des noms de composants :

   ```javascript
   // This will no longer work
   {
     {
       components[variables.componentNameVariable].value;
     }
   }
   ```

2. Référencement dynamique des composants :

   ```javascript
   // This is not supported
   {
     {
       components["textinput" + components.tabs1.currentTab].value;
     }
   }
   ```

3. Accès dynamique aux propriétés imbriquées :
   ```javascript
   // This dynamic property access is not allowed
   {
     {
       components.table1[components.textinput1.value];
     }
   }
   ```

Utilisez plutôt des références statiques vers les composants :

```javascript
{
  {
    components.textinput1.value;
  }
}
{
  {
    components.table1.selectedRow;
  }
}
{
  {
    queries.query1.data;
  }
}
```

## Nommage des composants et des requêtes

:::note
Ceci n'est un problème que pendant le processus de mise à niveau. Une fois votre application exécutée sur ToolJet 3.0, vous pouvez utiliser des noms identiques pour les composants et les requêtes sans aucun problème.
:::

### Action requise

- Vérifiez vos applications pour tout cas où des requêtes et des composants partagent le même nom
- Renommez temporairement le composant ou la requête pour garantir des noms uniques
- Documentez tous les composants/requêtes renommés pour un éventuel retour en arrière post-mise à niveau
- Testez les composants et requêtes concernés après le renommage

### Détails et exemples

Lors de la mise à niveau, si un composant référence une requête portant le même nom, le processus de mise à niveau peut casser ce mappage. Cela se produit car ToolJet utilisait auparavant une correspondance globale ID-vers-nom pour les composants et les requêtes, qui est désormais scindée dans la version 3.0.

Exemple de scénario : si un composant de tableau nommé `userData` référence une requête également nommée `userData`, cette référence peut être rompue pendant le processus de mise à niveau.

## Logique du panneau de propriétés

### Action requise

- Vérifiez toutes les vérifications de variables du panneau de propriétés
- Mettez à jour toutes les vérifications existantes d'existence de variable pour utiliser le nouveau format recommandé
- Supprimez toutes les instances de modèles de logique non pris en charge
- Testez tous les composants utilisant des vérifications de variables après les mises à jour

### Nouvelles règles d'accès aux variables

Il y a des changements dans la façon d'accéder et de vérifier l'existence des variables dans le panneau de propriétés :

- Pour les composants, les requêtes et les variables de page, un minimum de deux clés doit être disponible après le mot-clé `component/query/page`
- Pour les variables, un minimum d'une clé doit être présente après le mot-clé `variables`

```javascript
// Supported formats
components.textinput1.value;
components?.textinput1?.value;
components["textinput1"].value;
queries.restapi1.data;
page.variables.name;
variables["name"];
variables.name;

// No longer supported
{
  {
    "name" in variables;
  }
}
{
  {
    Object.keys(variables).includes("name");
  }
}
{
  {
    variables.hasOwnProperty("name");
  }
}
// Recommended approach for checking existence
{
  {
    variables["name"] ?? false;
  }
}
```

:::caution
Ces changements peuvent affecter la façon dont votre application interagit avec les variables et les composants. Assurez-vous de bien tester après avoir effectué ces mises à jour.
:::

## Noms de composants sur plusieurs pages

### Action requise

- Vérifiez les applications multi-pages pour des composants portant des noms identiques
- Renommez les composants pour garantir leur unicité entre les pages
- Ou modifiez les requêtes pour utiliser des paramètres de requête plutôt que des références directes
- Documentez tous les changements de noms de composants
- Testez les pages concernées et leurs interactions après avoir effectué les changements

### Limitations actuelles et détails

Lorsque le même nom de composant existe sur plusieurs pages et est lié à des requêtes, la requête ne fonctionnera correctement que sur la page où le composant lui était initialement associé.

Exemple de scénario :

1. Vous avez `page1` et `page2`, chacune contenant un composant nommé `textinput1`
2. Vous créez une requête dans `page1` qui est liée à `textinput1`
3. La requête ne fonctionnera correctement que sur `page1`
4. Lorsque vous passez à `page2`, la requête ne fonctionnera pas comme prévu, même s'il existe un composant portant le même nom

:::tip
Lors de la création d'applications multi-pages, il est recommandé d'utiliser des noms de composants uniques sur toutes les pages afin d'éviter tout problème potentiel avec les liaisons de requêtes.
:::

Résolution future : nous ajouterons une fonctionnalité permettant d'imposer des noms de composants uniques sur toutes les pages dans les prochaines versions.

## Suppression des fonctionnalités dépréciées

### Kanban Board

L'ancien composant déprécié **Kanban Board** cessera complètement de fonctionner. Les applications utilisant ce composant se planteront après la mise à niveau si elles ne sont pas mises à jour.

<img className="screenshot-full" src="/img/widgets/kanban/kanban.png" alt="ToolJet - Widget Reference - Kanban widget" />

#### Actions requises

1. Identifiez immédiatement toutes les instances de l'ancien composant **Kanban Board** dans vos applications
2. Créez de nouveaux tableaux en utilisant le nouveau composant **Kanban**.
3. Transférez vos données et votre configuration vers le nouveau composant
4. Supprimez les anciens composants Kanban Board
5. Mettez à jour toutes les requêtes ou workflows qui étaient connectés aux anciens tableaux
6. Testez minutieusement pour vous assurer que toutes les fonctionnalités sont préservées

:::caution
Après la mise à niveau vers la version 3.0, les applications comportant l'ancien composant Kanban Board se planteront et deviendront inutilisables. Assurez-vous de remplacer toutes les instances de l'ancien composant par le nouveau composant Kanban avant la mise à niveau.
:::

### Sources de données locales

#### Action requise

- Identifiez toutes les sources de données locales dans vos applications
- Migrez-les vers des sources de données globales de l'espace de travail
- Mettez à jour toutes les requêtes et composants utilisant ces sources de données
- Testez tous les composants et requêtes concernés après la migration

#### Action requise après la mise à niveau

Si vous n'avez pas migré vos sources de données locales vers des sources de données globales, vous rencontrerez un message d'erreur indiquant que les sources de données locales ne sont plus prises en charge. Pour des instructions détaillées sur la migration des sources de données locales vers les nouvelles sources de données, consultez notre [guide de migration des sources de données locales](/docs/3.0.0-LTS/data-sources/local-data-sources-migration).

### Variables d'espace de travail

#### Action requise

- Identifiez toutes les utilisations des variables d'espace de travail (Workspace Variables)
- Remplacez-les par des constantes d'espace de travail (Workspace Constants)
- Mettez à jour tous les composants et requêtes utilisant ces variables
- Configurez un accès basé sur les rôles approprié pour les nouvelles constantes
- Testez toutes les fonctionnalités concernées après la migration

Les constantes d'espace de travail sont conçues pour être résolues uniquement côté serveur, garantissant un niveau de sécurité élevé. Vous pouvez attribuer des utilisateurs à un rôle spécifique et leur accorder des droits de création, de modification et de suppression sur les constantes d'espace de travail.

Pour des instructions détaillées sur la migration des variables d'espace de travail vers les constantes d'espace de travail, consultez notre [guide de migration des variables d'espace de travail](/docs/3.5.0-LTS/security/constants/variables).

## En-têtes de réponse et métadonnées

#### Action requise

- Identifiez toutes les instances où les en-têtes de réponse sont utilisés
- Mettez à jour le code pour utiliser le nouveau format de métadonnées
- Testez toutes les requêtes et composants concernés après la migration

Nous avons introduit une capacité permettant d'exposer des informations supplémentaires via des métadonnées pour toutes les sources de données. Auparavant, ceci n'était disponible que pour les sources de données REST API et GraphQL.

Auparavant, vous pouviez accéder aux en-têtes de réponse ainsi :

```javascript
{{queries.<queryName>.responseHeaders}}
```

Désormais, vous devez utiliser :

```javascript
{{queries.<queryName>.metadata}}
```

L'objet `metadata` contiendra des informations détaillées sur la requête et la réponse, y compris l'URL de la requête, la méthode, les en-têtes, les paramètres, le code de statut de la réponse et les en-têtes. Vous pouvez en savoir plus sur les métadonnées [ici](/docs/data-sources/restapi/metadata-and-cookies/#metadata).

## Changements système

### ToolJet Database

ToolJet Database est désormais une exigence centrale pour ToolJet 3.0.
Pour utiliser ToolJet Database, vous devrez configurer et déployer un serveur PostgREST qui permet d'interroger ToolJet Database. <br/>
Veuillez vérifier les variables d'environnement que vous devez configurer pour la mise en place :

- [PostgREST](/docs/setup/env-vars#postgrest)
- [ToolJet Database](/docs/setup/env-vars#tooljet-database)

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [Communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
