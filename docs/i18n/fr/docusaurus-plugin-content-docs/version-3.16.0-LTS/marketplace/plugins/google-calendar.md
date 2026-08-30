---
id: marketplace-plugin-googlecalendar
title: Google Calendar
---

ToolJet peut se connecter à Google Calendar pour récupérer, créer, mettre à jour et supprimer des événements de calendrier directement depuis votre application ToolJet.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[Utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Vous aurez besoin des identifiants suivants pour vous connecter à Google Calendar :
 - **Client ID**
 - **Client Secret**

Ces identifiants sont utilisés pour s'authentifier via OAuth2 et accéder aux données de calendrier de manière sécurisée. Vous pouvez consulter tous les scopes de permission disponibles [ici](https://developers.google.com/workspace/calendar/api/auth).

Vous pouvez activer **Authentication required for all users** dans la configuration. Lorsque cette option est activée, les utilisateurs seront redirigés vers l'écran de consentement OAuth la première fois qu'une query de cette source de données est déclenchée dans l'application. Cela garantit que chaque utilisateur connecte son propre compte Google Calendar de manière sécurisée.

Remarque : Après avoir terminé le flux OAuth, la query doit être déclenchée à nouveau pour charger les données.

<img className="screenshot-full img-l" src="/img/marketplace/plugins/googlecal/connection-v2.png" alt="Hugging Face Configuration" />

### Génération du Client ID et du Client Secret


1. Allez sur **[Google Cloud console](https://console.cloud.google.com/)** et créez un projet.

    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/marketplace/plugins/googlecal/gc-new-project.png" alt="Create New Project"/>

2. Allez sur la **[page des identifiants de la console Google Cloud](https://console.cloud.google.com/apis/credentials)**, et créez un OAuth client ID.

 <img className="screenshot-full img-full"  style={{ marginTop: '15px' }} src="/img/marketplace/plugins/googlecal/create-oauth.png" alt="General Settings: SSO"/>
    
3. Il vous sera demandé de sélectionner le type d'utilisateur dans l'écran de consentement. Pour n'autoriser que les utilisateurs de votre workspace, sélectionnez 'Internal', sinon,
sélectionnez 'External'.

<img className="screenshot-full img-full"  style={{ marginTop: '15px' }} src="/img/marketplace/plugins/googlecal/oauth-type.png" alt="General Settings: SSO"/>

4. Après avoir configuré l'écran de consentement, vous serez redirigé vers la page de présentation OAuth ; cliquez sur **Create OAuth client**.

5. Ensuite, sur la page Clients, sélectionnez le type d'application **Web application**, donnez-lui un nom, sous Authorised JavaScript origins, définissez le domaine sur lequel ToolJet est hébergé, et sous Authorized redirect URIs, saisissez l'URL de redirection générée sur la page de configuration de la source de données de ToolJet.

<img className="screenshot-full img-l"  style={{ marginTop: '15px' }} src="/img/marketplace/plugins/googlecal/clients.png" alt="General Settings: SSO"/>

6. Cliquez sur **Create** et copiez le **Client ID** et le **Client Secret**.

<img className="screenshot-full img-full"  style={{ marginTop: '15px' }} src="/img/marketplace/plugins/googlecal/client-id.png" alt="General Settings: SSO"/>

## Opérations prises en charge

### Calendars

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendars/{calendarID}` | Récupère les détails d'un calendrier. |
| PUT | `/calendars/{calendarID}` | Met à jour un calendrier. |
| DELETE | `/calendars/{calendarID}` | Supprime un calendrier. |
| POST | `/calendars` | Crée un calendrier. |
| GET | `/users/me/calendarList` | Liste les calendriers accessibles à l'utilisateur. |

### Events

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendars/{calendarID}/events` | Liste les événements. |
| POST | `/calendars/{calendarID}/events` | Crée un événement. |
| GET | `/calendars/{calendarID}/events/{eventID}` | Récupère les détails d'un événement. |
| PUT | `/calendars/{calendarID}/events/{eventID}` | Met à jour un événement. |
| DELETE | `/calendars/{calendarID}/events/{eventID}` | Supprime un événement. |
| POST | `/calendars/{calendarID}/events/quickAdd` | Ajout rapide d'un événement. |

### Access Control (ACL)

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendars/{calendarID}/acl` | Liste les règles de contrôle d'accès. |
| POST | `/calendars/{calendarID}/acl` | Crée une règle de contrôle d'accès. |
| GET | `/calendars/{calendarID}/acl/{ruleID}` | Récupère une règle de contrôle d'accès. |
| PUT | `/calendars/{calendarID}/acl/{ruleID}` | Met à jour une règle de contrôle d'accès. |
| DELETE | `/calendars/{calendarID}/acl/{ruleID}` | Supprime une règle de contrôle d'accès. |

### Free/Busy

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| POST | `/freeBusy` | Interroge les informations de disponibilité (free/busy). |
