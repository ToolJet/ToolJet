---
id: marketplace-plugin-microsoft_graph
title: Microsoft Graph
---

En intégrant Microsoft Graph à ToolJet, vous pouvez interagir avec les services Microsoft 365 tels qu'Outlook Mail, Calendar, Users et OneDrive.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[Utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour connecter ToolJet à Microsoft Graph, vous aurez besoin des identifiants suivants :

- **Tenant**
- **Access Token URL**
- **OAuth Type**
- **Client ID**
- **Client Secret**

Suivez ce [guide Microsoft](https://learn.microsoft.com/en-us/graph/auth-register-app-v2) pour enregistrer une application et générer les identifiants requis.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/microsoft-graph/connection-v3.png" alt="Microsoft Graph data source configuration" />

Vous pouvez activer la bascule **Authentication required for all users** dans le panneau de configuration. Lorsque cette option est activée, chaque utilisateur sera redirigé vers l'écran de consentement OAuth la première fois qu'une query de cette source de données est déclenchée dans votre application. Cela garantit que chaque utilisateur se connecte avec son propre compte Microsoft de manière sécurisée.

:::note 
Après avoir terminé le flux OAuth, la query doit être déclenchée à nouveau pour récupérer les données depuis Microsoft Graph.
:::

## Entités prises en charge

- **[Outlook](#outlook)** 
- **[Calendar](#calendar)**
- **[Users](#users)**
- **[Teams](#teams)**
- **[One Drive](#onedrive)**

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/microsoft-graph/listops.png" alt="Microsoft Graph supoorted entities" />

### Outlook

#### Messages 

| Méthode | Endpoint                                   | Description                          |
| ------ | ------------------------------------------ | ------------------------------------ |
| GET    | `/me/messages`                             | Liste les messages dans la boîte mail de l'utilisateur. |
| POST   | `/me/messages`                             | Crée un nouveau brouillon de message.          |
| GET    | `/me/messages/{message-id}`                | Récupère un message spécifique par ID.        |
| PATCH  | `/me/messages/{message-id}`                | Met à jour un message.                    |
| DELETE | `/me/messages/{message-id}`                | Supprime un message.                    |
| POST   | `/me/messages/{message-id}/forward`        | Transfère un message existant.         |
| POST   | `/me/messages/{message-id}/createForward`  | Crée un brouillon de transfert.              |
| POST   | `/me/messages/{message-id}/reply`          | Répond à un message.                  |
| POST   | `/me/messages/{message-id}/createReply`    | Crée un brouillon de réponse.            |
| POST   | `/me/messages/{message-id}/replyAll`       | Répond à tous pour un message.              |
| POST   | `/me/messages/{message-id}/createReplyAll` | Crée un brouillon de réponse à tous.            |
| POST   | `/me/messages/{message-id}/send`           | Envoie un brouillon de message.                |
| POST   | `/me/messages/{message-id}/move`           | Déplace un message.                      |
| POST   | `/me/messages/{message-id}/copy`           | Copie un message.                      |
| POST   | `/me/sendMail`                             | Envoie un mail sans créer de brouillon.  |

#### Mail Folders

| Méthode | Endpoint                                         | Description                           |
| ------ | ------------------------------------------------ | ------------------------------------- |
| GET    | `/me/mailFolders`                                | Liste les dossiers de messagerie.                    |
| POST   | `/me/mailFolders`                                | Crée un dossier de messagerie.                 |
| GET    | `/me/mailFolders/{mailFolder-id}`                | Récupère un dossier de messagerie spécifique.             |
| PATCH  | `/me/mailFolders/{mailFolder-id}`                | Met à jour un dossier de messagerie.                 |
| DELETE | `/me/mailFolders/{mailFolder-id}`                | Supprime un dossier de messagerie.                 |
| GET    | `/me/mailFolders/{mailFolder-id}/messages`       | Liste les messages à l'intérieur d'un dossier.        |
| GET    | `/me/mailFolders/Inbox/messages/delta`           | Suit les modifications des messages de la boîte de réception.      |
| GET    | `/me/mailFolders/{mailFolder-id}/messages/delta` | Suit les modifications des messages d'un dossier. |
| GET    | `/me/mailFolders/delta`                          | Suit les modifications de tous les dossiers.         |

#### Categories and Rooms

| Méthode | API Endpoint                                        | Description             |
| ------ | --------------------------------------------------- | ----------------------- |
| GET    | `/me/outlook/masterCategories`                      | Liste les catégories principales  |
| POST   | `/me/outlook/masterCategories`                      | Crée une nouvelle catégorie   |
| GET    | `/me/outlook/masterCategories/{outlookCategory-id}` | Récupère une catégorie spécifique |
| PATCH  | `/me/outlook/masterCategories/{outlookCategory-id}` | Met à jour une catégorie       |
| DELETE | `/me/outlook/masterCategories/{outlookCategory-id}` | Supprime une catégorie       |
| GET    | `/me/findRooms`                                     | Liste les salles disponibles    |
| GET    | `/me/findRooms(RoomList='{roomList-emailAddress}')` | Trouve des salles par liste de salles |
| GET    | `/me/findRoomLists`                                 | Liste les listes de salles         |

### Calendar

#### Default Calendar

| Méthode | API Endpoint                                      | Description                           |
| ------ | ------------------------------------------------- | ------------------------------------- |
| GET    | `/me/calendar`                                    | Récupère le calendrier par défaut                  |
| PATCH  | `/me/calendar`                                    | Met à jour le calendrier par défaut               |
| GET    | `/me/calendar/events`                             | Liste les événements du calendrier par défaut     |
| POST   | `/me/calendar/events`                             | Crée un événement dans le calendrier par défaut   |
| GET    | `/me/calendar/calendarPermissions`                | Liste les permissions du calendrier             |
| POST   | `/me/calendar/calendarPermissions`                | Accorde des permissions au calendrier par défaut |
| GET    | `/me/calendar/calendarPermissions/{permissionId}` | Récupère une permission de calendrier spécifique      |
| PATCH  | `/me/calendar/calendarPermissions/{permissionId}` | Met à jour une permission de calendrier            |
| DELETE | `/me/calendar/calendarPermissions/{permissionId}` | Supprime une permission de calendrier            |
| POST   | `/me/calendar/getSchedule`                        | Récupère les informations de disponibilité (free/busy)           |

#### User Calendars and Groups

| Méthode | API Endpoint                             | Description                             |
| ------ | ---------------------------------------- | ---------------------------------------- |
| GET    | `/user/{userId}/calendar`                | Récupère le calendrier par défaut d'un utilisateur spécifique |
| GET    | `/me/calendars`                          | Liste les calendriers de l'utilisateur                     |
| POST   | `/me/calendars`                          | Crée un nouveau calendrier                   |
| GET    | `/me/calendars/{calendarId}`             | Récupère un calendrier spécifique                 |
| PATCH  | `/me/calendars/{calendarId}`             | Met à jour un calendrier                       |
| DELETE | `/me/calendars/{calendarId}`             | Supprime un calendrier                       |
| GET    | `/me/calendars/{calendarId}/events`      | Liste les événements d'un calendrier spécifique      |
| POST   | `/me/calendars/{calendarId}/events`      | Crée un événement dans un calendrier spécifique     |
| GET    | `/me/calendarGroups`                     | Liste les groupes de calendriers                    |
| POST   | `/me/calendarGroups`                     | Crée un groupe de calendriers                 |
| GET    | `/me/calendarGroups/{groupId}/calendars` | Récupère les calendriers d'un groupe                |
| POST   | `/me/calendarGroups/{groupId}/calendars` | Ajoute un calendrier à un groupe                 |

#### Events

| Méthode | API Endpoint                       | Description                         |
| ------ | ---------------------------------- | ----------------------------------- |
| GET    | `/me/events/{eventId}`             | Récupère un événement par ID                  |
| PATCH  | `/me/events/{eventId}`             | Met à jour un événement                     |
| DELETE | `/me/events/{eventId}`             | Supprime un événement                     |
| GET    | `/me/events/{eventId}/instances`   | Liste les occurrences d'un événement récurrent |
| GET    | `/me/events/{eventId}/attachments` | Liste les pièces jointes d'un événement        |
| POST   | `/me/events/{eventId}/attachments` | Ajoute des pièces jointes à un événement         |
| GET    | `/me/calendarView`                 | Récupère la vue calendrier des événements         |
| POST   | `/me/findMeetingTimes`             | Trouve des horaires de réunion                  |

### Users

#### User Management

| Méthode | API Endpoint       | Description            |
| ------ | ------------------ | ---------------------- |
| GET    | `/users`           | Liste tous les utilisateurs         |
| POST   | `/users`           | Crée un utilisateur          |
| GET    | `/users/{user-id}` | Récupère un utilisateur spécifique    |
| PATCH  | `/users/{user-id}` | Met à jour un utilisateur spécifique |
| DELETE | `/users/{user-id}` | Supprime un utilisateur spécifique |

#### Profile

| Méthode | API Endpoint | Description                      |
| ------ | ------------ | -------------------------------- |
| GET    | `/me`        | Récupère le profil de l'utilisateur connecté    |
| PATCH  | `/me`        | Met à jour le profil de l'utilisateur connecté |

### Teams

#### Teams and Chats

| Méthode | API Endpoint      | Description                    |
| ------ | ----------------- | ------------------------------ |
| GET    | `/teams`          | Liste les équipes                     |
| POST   | `/teams`          | Crée une équipe                  |
| GET    | `/chats`          | Liste les chats                     |
| POST   | `/chats`          | Crée un chat                  |
| GET    | `/me/joinedTeams` | Liste les équipes rejointes par l'utilisateur |

#### Chat Operations

| Méthode | API Endpoint                                       | Description                      |
| ------ | -------------------------------------------------- | -------------------------------- |
| GET    | `/chats/{chat-id}`                                 | Récupère un chat                       |
| PATCH  | `/chats/{chat-id}`                                 | Met à jour un chat                    |
| DELETE | `/chats/{chat-id}`                                 | Supprime un chat                    |
| GET    | `/chats/{chat-id}/members`                         | Liste les membres d'un chat           |
| POST   | `/chats/{chat-id}/members`                         | Ajoute des membres à un chat            |
| POST   | `/chats/{chat-id}/members/add`                     | Ajoute des membres (endpoint alternatif) |
| GET    | `/chats/{chat-id}/members/{conversationMember-id}` | Récupère les détails d'un membre de chat          |
| PATCH  | `/chats/{chat-id}/members/{conversationMember-id}` | Met à jour un membre de chat               |
| DELETE | `/chats/{chat-id}/members/{conversationMember-id}` | Retire un membre de chat               |
| GET    | `/chats/{chat-id}/messages`                        | Liste les messages d'un chat          |
| POST   | `/chats/{chat-id}/messages`                        | Envoie un message dans un chat           |
| GET    | `/chats/{chat-id}/messages/{chatMessage-id}`       | Récupère un message de chat spécifique      |
| PATCH  | `/chats/{chat-id}/messages/{chatMessage-id}`       | Met à jour un message de chat            |
| DELETE | `/chats/{chat-id}/messages/{chatMessage-id}`       | Supprime un message de chat            |
| GET    | `/chats/getAllMessages`                            | Récupère tous les messages de tous les chats    |

#### Team Operation

| Méthode | API Endpoint                   | Description                      |
| ------ | ------------------------------ | -------------------------------- |
| GET    | `/teams/{team-id}`             | Récupère une équipe                       |
| PATCH  | `/teams/{team-id}`             | Met à jour une équipe                    |
| DELETE | `/teams/{team-id}`             | Supprime une équipe                    |
| POST   | `/teams/{team-id}/archive`     | Archive une équipe                   |
| POST   | `/teams/{team-id}/unarchive`   | Désarchive une équipe                 |
| GET    | `/teams/{team-id}/members`     | Liste les membres de l'équipe                |
| POST   | `/teams/{team-id}/members`     | Ajoute des membres à l'équipe                 |
| POST   | `/teams/{team-id}/members/add` | Ajoute des membres (endpoint alternatif) |

#### Channels and Messages 

| Méthode | API Endpoint                                                       | Description                             |
| ------ | ------------------------------------------------------------------ | --------------------------------------- |
| GET    | `/teams/{team-id}/allChannels`                                     | Liste tous les canaux d'une équipe             |
| GET    | `/teams/{team-id}/channels`                                        | Liste les canaux standard d'une équipe        |
| POST   | `/teams/{team-id}/channels`                                        | Crée un canal dans une équipe              |
| GET    | `/teams/{team-id}/channels/{channel-id}`                           | Récupère les détails d'un canal                     |
| PATCH  | `/teams/{team-id}/channels/{channel-id}`                           | Met à jour un canal                        |
| DELETE | `/teams/{team-id}/channels/{channel-id}`                           | Supprime un canal                        |
| GET    | `/teams/{team-id}/channels/{channel-id}/members`                   | Liste les membres d'un canal               |
| POST   | `/teams/{team-id}/channels/{channel-id}/members`                   | Ajoute des membres à un canal                |
| GET    | `/teams/{team-id}/channels/{channel-id}/messages`                  | Liste les messages d'un canal              |
| POST   | `/teams/{team-id}/channels/{channel-id}/messages`                  | Envoie un message dans un canal               |
| GET    | `/teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}` | Récupère un message de canal spécifique          |
| PATCH  | `/teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}` | Met à jour un message de canal                |
| DELETE | `/teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}` | Supprime un message de canal                |
| GET    | `/teams/{team-id}/allChannels/{channel-id}`                        | Récupère un canal spécifique parmi tous les canaux |

### OneDrive

#### Root and Shared Content

| Méthode | API Endpoint                                | Description                         |
| ------ | ------------------------------------------- | ------------------------------------ |
| GET    | `/me/drive/root/children`                   | Liste les éléments du dossier racine           |
| POST   | `/me/drive/root/children`                   | Crée un nouveau fichier ou dossier à la racine |
| GET    | `/me/drive/recent`                          | Liste les fichiers récents                   |
| GET    | `/me/drive/sharedWithMe`                    | Liste les fichiers partagés avec l'utilisateur     |
| GET    | `/me/drive/root/search(q='{search-query}')` | Recherche des fichiers par requête               |

#### Specific Drives and Items

| Méthode | API Endpoint                                     | Description                           |
| ------ | ------------------------------------------------ | ------------------------------------- |
| GET    | `/drives/{drive-id}/root/children`               | Liste les éléments à la racine d'un drive spécifique |
| GET    | `/drives/{drive-id}/items/{item-id}/children`    | Liste les enfants d'un dossier             |
| POST   | `/drives/{drive-id}/items/{item-id}/children`    | Ajoute un élément à un dossier                    |
| GET    | `/drives/{drive-id}/items/{item-id}`             | Récupère les métadonnées d'un élément              |
| PATCH  | `/drives/{drive-id}/items/{item-id}`             | Met à jour les métadonnées d'un élément            |
| DELETE | `/drives/{drive-id}/items/{item-id}`             | Supprime un élément                        |
| GET    | `/drives/{drive-id}/items/{item-id}/content`     | Télécharge le contenu d'un fichier                 |
| PUT    | `/drives/{drive-id}/items/{item-id}/content`     | Charge le contenu d'un fichier                   |
| POST   | `/drives/{drive-id}/items/{item-id}/createLink`  | Crée un lien de partage                   |
| GET    | `/drives/{drive-id}/items/{item-id}/permissions` | Récupère les permissions d'un élément                  |

## Exemples de queries

### Users

**Opération** : `GET/ me`

Cette opération récupère les détails du profil de l'utilisateur actuellement authentifié.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/marketplace/plugins/microsoft-graph/example1.png" alt="Microsoft Graph example query" />

**Opération** : `GET/ users`

Cette opération récupère une liste d'utilisateurs de votre tenant Azure AD.

<img style={{ marginTop:'15px' }} className="screenshot-full img-l" src="/img/marketplace/plugins/microsoft-graph/example2.png" alt="Microsoft Graph example query" />
