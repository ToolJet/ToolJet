---
id: row-level-security
title: Row Level Security
---

<PlanBadge type="enterprise" />

La row-level security dans ToolJet vous permet de contrôler quels enregistrements un utilisateur peut voir ou avec lesquels il peut interagir, même lorsque plusieurs utilisateurs accèdent à la même table. Ceci est utile lorsque vous souhaitez restreindre l'accès à certaines lignes en fonction de [groupes personnalisés](/docs/user-management/role-based-access/custom-groups/) ou de [rôles d'utilisateur par défaut](/docs/user-management/role-based-access/user-roles#default-user-roles). La row-level security est appliquée côté serveur, garantissant que la logique reste sécurisée et invisible pour le client.

La row-level security repose sur les [variables côté serveur](/docs/app-builder/dynamic-access-rule/server-side-variables). Vous référencez l'identité de l'utilisateur actuel via `globals.server.currentUser`, et ToolJet résout ces valeurs sur le serveur avant l'exécution de la query, de sorte que les utilisateurs ne peuvent pas altérer le filtre depuis le navigateur.

:::caution
Un filtre écrit avec la variable côté client `{{globals.currentUser.*}}` est résolu dans le navigateur, ce qui permet à un utilisateur de modifier sa valeur (par exemple via les outils de développement du navigateur) pour récupérer les lignes d'un autre utilisateur. Le filtrage côté client est une facilité de présentation, pas un contrôle de sécurité.
:::

:::info
Les variables côté serveur (`{{globals.server.currentUser.*}}`) sont résolues sur le serveur à partir de la session authentifiée, ce qui rend le filtre impossible à contourner. Utilisez-les systématiquement pour toute ségrégation des données qui constitue une exigence de sécurité ou de conformité.
:::

## Prérequis

- La row-level security repose sur les variables côté serveur, disponibles uniquement sur les plans **Enterprise**.
- Le filtrage s'écrit dans le [Query Manager](/docs/app-builder/connecting-with-data-sources/creating-managing-queries), et fonctionne donc avec toutes les sources de données sauf RunJS et RunPy.

## Cas d'utilisation courants

- **Données spécifiques à un département** : Restreindre les données RH à l'équipe RH, les données commerciales à l'équipe Ventes.
- **Applications multi-tenant** : Garantir que les clients ne voient que leurs propres enregistrements dans des tables partagées.
- **Contrôle d'accès régional** : Limiter la visibilité des données selon la région ou l'agence assignée à l'utilisateur.

## Scénarios

- Lorsque différents utilisateurs doivent accéder à différents sous-ensembles de données d'une même table.
- Lorsque vous avez besoin d'un filtrage des données côté serveur qui ne peut pas être contourné par le client.
- Lors de la création d'applications où la ségrégation des données est une exigence de conformité.

## Syntaxe utilisateur côté serveur

Vous filtrez les lignes en référençant l'identité de l'utilisateur actuel dans votre query. Les approches les plus courantes consistent à filtrer par appartenance à un groupe ou par un attribut utilisateur tel que l'email ou l'ID.

La syntaxe ci-dessous récupère les groupes de l'utilisateur actuel depuis le serveur. Les groupes incluent à la fois les groupes personnalisés et les rôles d'utilisateur par défaut comme `admin` et `end-user`, et la liste commence toujours par `all_users`.

```bash
{{globals.server.currentUser.groups}}
```

Pour filtrer par un attribut utilisateur spécifique, référencez-le directement :

```bash
{{globals.server.currentUser.email}}
{{globals.server.currentUser.id}}
```

Pour la liste complète des attributs disponibles, consultez [Variables côté serveur](/docs/app-builder/dynamic-access-rule/server-side-variables).

:::info
La syntaxe ci-dessus fonctionne avec toutes les sources de données sauf RunJS et RunPy.
:::

## Exemple : vue spécifique à un département avec PostgreSQL

Si vous utilisez PostgreSQL, vous pouvez filtrer les enregistrements en référençant directement le(s) groupe(s) de l'utilisateur dans votre requête SQL. Cela garantit que chaque utilisateur ne voit que les données qui le concernent.

Supposons que vous créez un outil interne de suivi des tickets pour votre entreprise. Chaque département (comme "Engineering", "HR", "Marketing") enregistre et gère ses propres tickets dans une table partagée ayant la structure suivante :

- Nom de la table : **issue_reports**
- Colonnes : **id**, **title**, **status** et **department**
- Contrôle d'accès : Chaque utilisateur est affecté à des groupes personnalisés basés sur les départements, correspondant aux noms de département dans la base de données.

Pour garantir que les utilisateurs ne voient que les rapports de leur(s) propre(s) département(s), utilisez la requête SQL suivante :

```sql
SELECT * FROM issue_reports
WHERE department = ANY (
  string_to_array('{{globals.server.currentUser.groups}}', ',')
);
```

**Comment cela fonctionne :**
- `{{globals.server.currentUser.groups}}` récupère les groupes de l'utilisateur de manière sécurisée depuis le serveur.
- `string_to_array(...)` convertit la chaîne de groupes séparée par des virgules en un tableau utilisable.
- `department = ANY (...)` garantit que les utilisateurs ne voient que les tickets déposés sous leurs propres départements.

### Résultats filtrés par département

Les utilisateurs affectés aux groupes **Engineering** et **HR** verront :

| id | title                             | status   | department  |
|:---|:----------------------------------|:---------|:------------|
| 1  | Login bug on portal               | Open     | Engineering |
| 3  | Leave approval stuck              | Open     | HR          |
| 4  | Data sync error                   | Open     | Engineering |
| 5  | Employee onboarding delay         | Pending  | HR          |
| 9  | GitHub webhook failure            | Open     | Engineering |

Les utilisateurs affectés au groupe **Marketing** verront :

| id | title                              | status   | department |
|:---|:-----------------------------------|:---------|:-----------|
| 2  | Delivery failure issues            | Pending  | Marketing  |
| 7  | Campaign budget approval delayed   | Pending  | Marketing  |
| 8  | Social media calendar not updated  | Open     | Marketing  |

## Exemple : vue spécifique à un département avec MySQL

MySQL ne prend pas en charge l'opérateur de tableau `ANY (...)` utilisé ci-dessus. Vous utilisez donc la fonction `FIND_IN_SET` à la place. Elle vérifie si une valeur existe dans une chaîne séparée par des virgules, ce qui correspond au format résolu par `globals.server.currentUser.groups`.

En utilisant la même table **issue_reports**, la requête devient :

```sql
SELECT * FROM issue_reports
WHERE FIND_IN_SET(department, '{{globals.server.currentUser.groups}}') > 0;
```

**Comment cela fonctionne :**
- `{{globals.server.currentUser.groups}}` se résout en une chaîne de groupes de l'utilisateur séparée par des virgules, comme `all_users,Engineering,HR`.
- `FIND_IN_SET(department, ...)` renvoie la position de `department` dans cette chaîne, ou `0` s'il n'est pas présent.
- `> 0` ne conserve que les lignes dont le département correspond à l'un des groupes de l'utilisateur.

Les résultats filtrés sont identiques à l'exemple PostgreSQL ci-dessus.

## Exemple : restreindre les lignes à l'utilisateur actuel

Lorsque les lignes appartiennent à des utilisateurs individuels plutôt qu'à des départements, filtrez sur un attribut unique tel que l'email ou l'ID plutôt que sur des groupes. Cela garantit que chaque utilisateur ne voit que ses propres enregistrements.

Supposons qu'une table **orders** stocke une colonne `owner_email` identifiant qui a créé chaque commande. Pour ne retourner que les commandes de l'utilisateur actuel :

```sql
SELECT * FROM orders
WHERE owner_email = '{{globals.server.currentUser.email}}';
```

Comme `globals.server.currentUser.email` est résolu sur le serveur, les utilisateurs ne peuvent pas modifier le filtre depuis le client pour voir les données d'un autre utilisateur.

Cette configuration garantit qu'un outil interne partagé reste sécurisé, avec un minimum de modifications de query et aucune duplication de logique ou de vues, ce qui la rend idéale pour les tableaux de bord RH, les systèmes de tickets, les outils CRM, et bien plus encore.

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [Communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
