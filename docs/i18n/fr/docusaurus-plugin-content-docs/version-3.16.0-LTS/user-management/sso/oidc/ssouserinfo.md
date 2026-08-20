---
id: ssouserinfo
title: Accéder aux informations utilisateur SSO
---

Dans ToolJet, vous pouvez désormais transmettre des détails d'authentification spécifiques à l'utilisateur, provenant du fournisseur SSO, aux sources de données connectées. Cela permet à chaque utilisateur d'accéder à des systèmes tels que Snowflake, Salesforce, GraphQL, et bien d'autres, en utilisant ses propres identifiants, éliminant ainsi le besoin de logins partagés. Cela garantit que les politiques de sécurité d'entreprise, telles que le contrôle d'accès basé sur les rôles et les restrictions au niveau des lignes, sont appliquées en fonction de l'identité de l'utilisateur.

## Accéder aux informations utilisateur SSO dans App Builder

ToolJet expose une variable globale appelée `ssoUserInfo` au sein de l'App Builder, qui contient les détails d'authentification spécifiques à l'utilisateur issus de la session SSO active. Cela vous permet de transmettre en toute sécurité des informations d'identité, telles que des tokens et des identifiants d'utilisateur, dans les requêtes et la logique de votre application.

Vous pouvez référencer `ssoUserInfo` directement dans les requêtes ou les composants pour contrôler dynamiquement l'accès, personnaliser le contenu, ou transmettre des tokens d'authentification aux sources de données connectées qui prennent en charge OAuth 2.0 ou OIDC.

Utilisez la syntaxe suivante pour référencer une variable exposée par `ssoUserInfo` :

```js
{{globals.currentUser.ssoUserInfo.<variable-name>}}
```

## Variables SSO couramment exposées

Les variables exposées peuvent varier en fonction du fournisseur d'identité. Vous pouvez consulter toutes les variables disponibles dans le panneau Inspector sous `globals` > `currentUser` > `ssoUserInfo`. Voici quelques variables couramment exposées :

| Variable | Description |
|:----------|:-------------|
| `sub` | Identifiant unique de l'utilisateur attribué par le fournisseur d'identité. |
| `name` | Nom complet de l'utilisateur authentifié. |
| `given_name` | Prénom de l'utilisateur. |
| `family_name` | Nom de famille de l'utilisateur. |
| `picture` | URL de la photo de profil de l'utilisateur. |
| `email` | Adresse e-mail associée à l'identité SSO de l'utilisateur. |
| `email_verified` | Indicateur booléen précisant si l'adresse e-mail a été vérifiée. |
| `hd` | Domaine hébergé ou organisation à laquelle appartient l'utilisateur. |
| `access_token` | Token d'accès OAuth 2.0 pour la session utilisateur en cours, utilisé pour authentifier les requêtes vers les sources de données connectées. |
| `id_token` | Token d'ID encodé contenant les claims d'identité de l'utilisateur au format JWT. |
| `id_token_decrypted` | Contenu déchiffré du token d'ID, utile pour accéder aux claims détaillés de l'utilisateur. |

### Actualisation automatique du token et fraîcheur de `ssoUserInfo`

ToolJet actualise automatiquement votre token d'accès OIDC en arrière-plan lorsqu'il approche de son expiration, maintenant votre session active sans nécessiter de rechargement de page ni de reconnexion.

#### Fonctionnement

ToolJet actualise automatiquement votre token d'accès OIDC en arrière-plan lorsqu'il expire, maintenant votre session active et `ssoUserInfo` à jour sans rechargement de page.
Si l'actualisation échoue, votre session sera invalidée.

#### Recommandations de binding

Selon votre cas d'usage, choisissez le modèle de binding qui correspond le mieux à vos besoins :

| Binding | Comportement |
|---|---|
| `{{globals.currentUser.ssoUserInfo.<variable>}}` | Peut refléter brièvement des valeurs obsolètes immédiatement après une actualisation de token ; se synchronise automatiquement peu après |
| `{{globals.server.currentUser.ssoUserInfo.<variable>}}` | Reflète toujours les valeurs les plus récentes ; recommandé pour les requêtes sensibles aux tokens et l'authentification des sources de données |

:::tip
Pour les cas d'usage où vous transmettez `access_token` ou d'autres identifiants directement à une source de données connectée, privilégiez `globals.server.currentUser.ssoUserInfo` pour garantir que le token le plus récent est toujours utilisé.
:::



## Variables SSO personnalisées (claims OIDC)
ToolJet vous permet d'utiliser des variables SSO personnalisées fournies par votre fournisseur d'identité (IdP) lors de la connexion.

Tous les claims personnalisés (tels que branch, location, ou department) configurés dans votre IdP et inclus dans la réponse d'authentification seront disponibles dans ToolJet après une connexion réussie.

Ces claims peuvent être consultés dans l'App Builder en utilisant :
```js
{{globals.currentUser.ssoUserInfo.<claim_name>}}
```
:::note
Les attributs personnalisés doivent être explicitement configurés dans le fournisseur d'identité pour être inclus dans le token OIDC ou la réponse UserInfo.
:::

    <img className="screenshot-full img-s" src="/img/user-management/sso/oidc/ssouserinfo/ssouserinfo.png" alt="SSO User Info" />
