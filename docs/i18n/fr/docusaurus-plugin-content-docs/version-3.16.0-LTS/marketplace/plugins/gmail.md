---
id: marketplace-plugin-gmail
title: Gmail
---

Le plugin Gmail vous permet de connecter votre compte Gmail aux applications ToolJet pour envoyer, lire et gérer des e-mails directement depuis votre application ToolJet.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[utilisation des plugins du Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Vous aurez besoin des identifiants suivants pour vous connecter à Gmail :
- **Client ID**
- **Client Secret**

Ces identifiants sont utilisés pour s'authentifier via OAuth2 et accéder aux données Gmail de manière sécurisée. Vous pouvez générer les identifiants requis depuis la [Google Cloud Console](https://console.cloud.google.com/).

Vous pouvez activer l'option **Authentication required for all users** dans la configuration. Lorsqu'elle est activée, les utilisateurs sont redirigés vers l'écran de consentement OAuth la première fois qu'une requête de cette source de données est déclenchée dans l'application. Cela garantit que chaque utilisateur connecte son propre compte Gmail de manière sécurisée.

Remarque : Une fois le flux OAuth terminé, la requête doit être déclenchée à nouveau pour charger les données.

<img className="screenshot-full img-l" src="/img/marketplace/plugins/gmail/connection-v2.png" alt="Gmail Configuration" />

## Opérations prises en charge

### User Info

| Méthode | Point de terminaison | Description |
| ------ | -------- | ----------- |
| GET    | `/gmail/v1/users/{userId}/profile` | Récupérer les informations du profil utilisateur |

### Messages

| Méthode | Point de terminaison | Description |
| ------ | -------- | ----------- |
| GET    | `/gmail/v1/users/{userId}/messages` | Lister les messages |
| POST   | `/gmail/v1/users/{userId}/messages` | Créer un message |
| GET    | `/gmail/v1/users/{userId}/messages/{messageId}` | Récupérer un message spécifique |
| DELETE | `/gmail/v1/users/{userId}/messages/{messageId}` | Supprimer un message |
| POST   | `/gmail/v1/users/{userId}/messages/{messageId}/modify` | Modifier les libellés d'un message |
| POST   | `/gmail/v1/users/{userId}/messages/{messageId}/trash` | Déplacer un message dans la corbeille  |
| POST   | `/gmail/v1/users/{userId}/messages/{messageId}/untrash` | Retirer un message de la corbeille |
| POST   | `/gmail/v1/users/{userId}/messages/send` | Envoyer un message |
| POST   | `/gmail/v1/users/{userId}/messages/batchDelete` | Supprimer plusieurs messages |
| POST   | `/gmail/v1/users/{userId}/messages/batchModify` | Modifier les libellés de plusieurs messages |
| GET    | `/gmail/v1/users/{userId}/messages/{messageId}/attachments/{attachmentId}` | Récupérer une pièce jointe d'un message |

### Threads

| Méthode | Point de terminaison | Description |
| ------ | -------- | ----------- |
| GET    | `/gmail/v1/users/{userId}/threads` | Lister les fils de discussion |
| GET    | `/gmail/v1/users/{userId}/threads/{threadId}` | Récupérer un fil de discussion spécifique |
| DELETE | `/gmail/v1/users/{userId}/threads/{threadId}` | Supprimer un fil de discussion |
| POST   | `/gmail/v1/users/{userId}/threads/{threadId}/modify`  | Modifier les libellés d'un fil de discussion |
| POST   | `/gmail/v1/users/{userId}/threads/{threadId}/trash`   | Déplacer un fil de discussion dans la corbeille |
| POST   | `/gmail/v1/users/{userId}/threads/{threadId}/untrash` | Retirer un fil de discussion de la corbeille |

### Drafts

| Méthode | Point de terminaison | Description |
| ------ | -------- | ----------- |
| GET    | `/gmail/v1/users/{userId}/drafts` | Lister les brouillons |
| POST   | `/gmail/v1/users/{userId}/drafts` | Créer un brouillon |
| GET    | `/gmail/v1/users/{userId}/drafts/{draftId}` | Récupérer un brouillon spécifique |
| PUT    | `/gmail/v1/users/{userId}/drafts/{draftId}` | Mettre à jour un brouillon |
| DELETE | `/gmail/v1/users/{userId}/drafts/{draftId}` | Supprimer un brouillon |
| POST   | `/gmail/v1/users/{userId}/drafts/send` | Envoyer un brouillon |

### Labels

| Méthode | Point de terminaison | Description |
| ------ | -------- | ----------- |
| GET    | `/gmail/v1/users/{userId}/labels` | Lister les libellés |
| POST   | `/gmail/v1/users/{userId}/labels` | Créer un libellé |
| GET    | `/gmail/v1/users/{userId}/labels/{labelId}` | Récupérer un libellé spécifique |
| PUT    | `/gmail/v1/users/{userId}/labels/{labelId}` | Mettre à jour un libellé |
| PATCH  | `/gmail/v1/users/{userId}/labels/{labelId}` | Mettre à jour partiellement un libellé |
| DELETE | `/gmail/v1/users/{userId}/labels/{labelId}` | Supprimer un libellé |

### Watch and History

| Méthode | Point de terminaison | Description |
| ------ | -------- | ----------- |
| GET    | `/gmail/v1/users/{userId}/history` | Récupérer l'historique de la boîte de réception |
| POST   | `/gmail/v1/users/{userId}/watch` | Démarrer les notifications push |
| POST   | `/gmail/v1/users/{userId}/stop` | Arrêter les notifications push  |
