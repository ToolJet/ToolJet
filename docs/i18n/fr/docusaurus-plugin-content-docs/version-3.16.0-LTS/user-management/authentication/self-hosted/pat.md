---
id: pat
title: Personal Access Token
---

<PlanBadge type="enterprise" />
<PlanBadge type="self-hosted" />

Vous pouvez intégrer vos applications ToolJet de manière fluide et sécurisée dans des portails clients, des tableaux de bord internes et des systèmes tiers, sans nécessiter de flux d'authentification utilisateur complets.

Avec les Personal Access Tokens (PAT), ToolJet permet un accès sécurisé, restreint et isolé par session aux applications intégrées. Chaque jeton est lié à un utilisateur et une application spécifiques, vous permettant de contrôler exactement qui peut accéder à quoi, et pendant combien de temps, tout cela sans interférer avec votre session ToolJet principale.

## Avantages clés
- **Intégration sans friction** : Chargez les applications à l'intérieur d'iframes instantanément, sans invite de connexion ni redirection.
- **Accès restreint** : Les jetons sont spécifiques à l'application et à l'utilisateur, garantissant un accès correctement délimité.
- **Isolation des sessions** : Les sessions intégrées n'interfèrent pas avec l'utilisation normale de ToolJet.
- **Contrôle de l'expiration** : Définissez la durée de validité de chaque jeton et de chaque session.
- **Compatibilité au niveau de l'espace de travail** : Étendez l'utilisation des PAT à travers l'espace de travail lorsque nécessaire.

## Quand utiliser un PAT

Utilisez les Personal Access Tokens lorsque vous souhaitez :
- Intégrer des applications ToolJet dans des portails destinés aux clients sans nécessiter de connexion.
- Intégrer des applications ToolJet dans des systèmes tiers, des CRM ou des tableaux de bord internes.
- Fournir des interfaces SaaS multi-tenant avec un contrôle d'accès strict par utilisateur.
- Créer des tableaux de bord publics sécurisés avec un accès restreint et limité dans le temps.
- Maintenir une isolation des sessions entre les applications intégrées et l'utilisation principale de ToolJet.

## Générer un PAT

Pour créer un Personal Access Token pour une combinaison application-utilisateur spécifique, vous pouvez utiliser le point de terminaison suivant via un client API tel que Postman, cURL ou tout autre outil de test d'API.

```swift
POST /api/ext/users/personal-access-token
```
**Paramètres requis**

| Field           | Type   | Description                              |
|:--------------- |:------ |:---------------------------------------- |
| `email`         | string | E-mail de l'utilisateur                  |
| `appId`         | string | ID de l'application à laquelle le PAT doit être restreint |
| `sessionExpiry` | number | Durée de la session en minutes           |
| `patExpiry`     | number | Durée de validité du jeton en secondes   |

**Exemple de requête cURL**

```js
curl --location 'http://localhost:3000/api/ext/users/personal-access-token' \
--header 'Authorization: Basic <your_token>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "a1@tooljet.com",
  "appId": "8ba8bf0e-6b8f-4e07-abb9-6fd2d816fabc",
  "sessionExpiry": 60,
  "patExpiry": 1000000
}'
```

<details id="tj-dropdown">
<summary>Exemple de réponse</summary>
```js
{
  "personalAccessToken": "pat_XXXX",
  "redirectUrl": "http://your-domain.com/embed-apps/:appId?personal-access-token=pat_XXXX..."
}
```
</details>

## Intégrer l'application

Utilisez le **redirectUrl** retourné à l'intérieur d'une balise `<iframe>` :

```js
<iframe src="https://your-domain.com/embed-apps/:appId?personal-access-token=pat_XXXX" />
```

Lors de la visite de cette URL :
- Le PAT est validé
- Une session isolée est créée
- L'application se charge à l'intérieur de l'iframe

## Portée de sécurité

| Scope                   | Behavior                                                                       |
|:----------------------- |:------------------------------------------------------------------------------ |
| **Restreint à l'application + l'utilisateur** | Le jeton ne fonctionne que pour l'application et l'utilisateur spécifiés. |
| **Jeton actif unique** | Un seul PAT par paire application-utilisateur.                                 |
| **Pas de multi-espace de travail**  | Les jetons deviennent invalides si l'application est déplacée vers un autre espace de travail. |
| **Stratégie JWT**        | Tous les jetons sont validés en fonction de l'expiration, de la portée et des permissions avant l'accès. |

## Gestion des erreurs

| Status                  | Scenario                                 |
|:----------------------- |:---------------------------------------- |
| `404 Not Found`         | L'utilisateur n'existe pas                |
| `403 Forbidden`         | L'utilisateur n'a pas accès à l'application |
| `400 Bad Request`       | Charge utile invalide                     |
| `429 Too Many Requests` | Plus de 10 requêtes par minute pour la création de PAT |
| `401 Unauthorized`      | PAT invalide ou expiré lors de l'accès à l'application |

## Bonnes pratiques

Pour utiliser les PAT de manière sécurisée et efficace :
- Définissez des durées d'expiration courtes pour les applications publiques ou à haut risque.
- Utilisez HTTPS et des en-têtes de sécurité appropriés (comme Content-Security-Policy) lors de l'intégration d'applications.
- Régénérez les jetons si les rôles des utilisateurs ou les permissions de l'application changent.
- Évitez de stocker les PAT dans le stockage local ou les cookies, ToolJet utilise un stockage en mémoire pour une meilleure isolation.
- Validez l'accès à l'application avant de générer un PAT pour éviter les erreurs 403.
- Enregistrez et surveillez l'utilisation des PAT et les événements d'expiration dans les environnements de production.
- Appliquez une limitation de débit par PAT pour réduire les risques d'abus.
- N'exposez le jeton qu'une seule fois, les jetons sont retournés en texte brut uniquement lors de la création.
