---
id: server-side-variables
title: Variables côté serveur
---

<PlanBadge type="enterprise" />

Les variables côté serveur vous permettent de référencer l'identité de l'utilisateur connecté dans vos queries et configurations de source de données, avec des valeurs résolues de manière sécurisée **sur le serveur** au moment où une query s'exécute. Ces variables se trouvent sous `globals.server.currentUser` et sont substituées dans votre query côté backend, de sorte que leurs valeurs n'atteignent jamais le navigateur.

Comme la résolution se fait côté serveur, ces variables peuvent être utilisées en toute sécurité pour la [row-level security](/docs/app-builder/dynamic-access-rule/row-level-security), les en-têtes d'authentification et les options de connexion des sources de données, cas où exposer les valeurs au client représenterait un risque de sécurité.

## Cas d'utilisation courants

- **Filtrage au niveau des lignes** : Ne retourner que les enregistrements appartenant à l'utilisateur actuel, appliqué côté serveur.
- **Requêtes authentifiées** : Injecter l'identité de l'utilisateur dans les en-têtes ou jetons d'API REST sans l'exposer côté client.
- **Options de connexion par utilisateur** : Utiliser les attributs de l'utilisateur actuel dans les paramètres de connexion de la source de données.

## Prérequis

- Les variables côté serveur sont disponibles uniquement sur les plans **Enterprise**.
- Elles peuvent être utilisées **uniquement à l'intérieur du [Query Manager](/docs/app-builder/connecting-with-data-sources/creating-managing-queries)**, dans les corps de query et les options de connexion des sources de données.

## Fonctionnement

Lorsque vous référencez une variable côté serveur dans une query, ToolJet n'envoie pas sa valeur au navigateur. Au lieu de cela, la référence brute `{{globals.server.currentUser.*}}` est conservée dans la query et résolue sur le serveur juste avant l'exécution de la query, en utilisant l'identité de l'utilisateur qui l'a déclenchée.

Cela signifie que :

- La valeur résolue, comme l'email ou l'ID de l'utilisateur, n'est jamais exposée dans le client, dans les réponses réseau, ou dans la console du navigateur.
- La query de chaque utilisateur s'exécute automatiquement avec sa propre identité, sans que vous ayez à transmettre les détails de l'utilisateur depuis le frontend.

## Variables disponibles

Toutes les variables côté serveur sont disponibles sous `globals.server.currentUser` :

| Variable | Type | Description |
|:---------|:-----|:------------|
| `globals.server.currentUser.id` | string | L'ID unique de l'utilisateur (UUID). |
| `globals.server.currentUser.email` | string | L'adresse email de l'utilisateur. |
| `globals.server.currentUser.firstName` | string | Le prénom de l'utilisateur. |
| `globals.server.currentUser.lastName` | string | Le nom de l'utilisateur. |
| `globals.server.currentUser.role` | string | Le nom du rôle de l'utilisateur, comme `admin`, `builder`, ou `end-user`. |
| `globals.server.currentUser.metadata` | object | [Métadonnées utilisateur](/docs/user-management/onboard-users/user-metadata) personnalisées, stockées sous forme d'attributs clé/valeur. |
| `globals.server.currentUser.ssoUserInfo` | object | [Informations utilisateur du fournisseur SSO](/docs/user-management/sso/oidc/ssouserinfo), renseignées pour les utilisateurs connectés via SSO. |
| `globals.server.currentUser.groups` | string[] | Les noms des groupes auxquels appartient l'utilisateur. Le tableau commence toujours par `all_users`, suivi de chaque groupe attribué. |

## Utiliser les variables côté serveur

Vous pouvez référencer les variables côté serveur n'importe où dans le Query Manager en utilisant la syntaxe `{{globals.server.currentUser.*}}`. Lorsque vous tapez à l'intérieur d'une query, ToolJet suggère ces variables via l'autocomplétion.

### Référencer les attributs utilisateur

```
{{globals.server.currentUser.email}}
{{globals.server.currentUser.id}}
{{globals.server.currentUser.role}}
{{globals.server.currentUser.groups}}
{{globals.server.currentUser.metadata.department}}
{{globals.server.currentUser.ssoUserInfo.name}}
```

### Filtrer les résultats de query par utilisateur

Un cas d'utilisation courant consiste à limiter les lignes retournées par une query à celles appartenant à l'utilisateur actuel. Comme l'email est résolu sur le serveur, les utilisateurs ne peuvent pas altérer le filtre depuis le client.

```sql
SELECT * FROM orders
WHERE owner_email = '{{globals.server.currentUser.email}}';
```

C'est le fondement de la [Row Level Security](/docs/app-builder/dynamic-access-rule/row-level-security), où vous restreignez les enregistrements qu'un utilisateur peut voir en fonction de son identité ou de son appartenance à un groupe.

### Configurer les en-têtes d'authentification et les options de connexion

Les variables côté serveur sont également utiles dans les en-têtes d'authentification d'API REST, les jetons de requête et les options de connexion des sources de données, cas où la valeur doit rester invisible pour le client. Par exemple, vous pouvez transmettre l'ID de l'utilisateur actuel en tant que valeur d'en-tête lors d'un appel à un service externe.

## Variables côté client vs variables côté serveur

ToolJet expose les mêmes champs utilisateur via deux variables différentes. La différence réside dans où et comment elles sont résolues.

|  | `globals.currentUser` | `globals.server.currentUser` |
|:-|:----------------------|:-----------------------------|
| Résolution | Dans le navigateur (côté client) | Sur le serveur |
| Disponibilité | Free | Enterprise |
| Où l'utiliser | Partout dans l'application | Query Manager uniquement |
| Exposition côté client | La valeur est disponible côté client | La valeur n'est jamais envoyée au client |

Utilisez [`globals.currentUser`](/docs/app-builder/custom-code/access-currentuser) lorsque vous avez besoin des détails de l'utilisateur pour la logique de l'interface, comme afficher ou masquer un composant. Utilisez `globals.server.currentUser` lorsque la valeur doit rester sécurisée, comme pour filtrer des données ou authentifier une requête.

:::info
Comme `globals.currentUser` est résolu dans le navigateur, un utilisateur peut modifier sa valeur avant qu'elle n'atteigne le serveur. Ne vous appuyez jamais sur cette variable pour des décisions de sécurité telles que la [row-level security](/docs/app-builder/dynamic-access-rule/row-level-security). Utilisez `globals.server.currentUser` pour tout ce qui doit être appliqué de manière garantie.
:::

## Limitations

- Les variables côté serveur ne peuvent être utilisées qu'à l'intérieur du Query Manager. Elles ne sont pas disponibles dans les propriétés des composants ni ailleurs dans l'application.
- Elles ne peuvent pas être utilisées dans les queries **RunJS** et **RunPy**, car celles-ci exécutent du code qui n'est pas résolu via le flux de substitution côté serveur.

## Voir aussi

- [Configurer la Row Level Security](/docs/app-builder/dynamic-access-rule/row-level-security)
- [Constantes de workspace](/docs/security/constants)
- [Métadonnées utilisateur](/docs/user-management/onboard-users/user-metadata)
- [Accéder aux propriétés de l'utilisateur actuel](/docs/app-builder/custom-code/access-currentuser)

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [Communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
