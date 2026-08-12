---
id: audit-logs
title: Aperçu des journaux d'audit
sidebar_label: Aperçu
---

<PlanBadge type="team" />

Le journal d'audit est le rapport de toutes les activités effectuées dans votre compte ToolJet. Il capture et affiche automatiquement les événements en enregistrant qui a effectué une activité, quoi, quand et où l'activité a été effectuée, ainsi que d'autres informations telles que l'adresse IP.

<img className="screenshot-full" src="/img/enterprise/audit_logs/logsnew-v2.png" alt="Journaux d'audit" />

### Plage de dates

Récupérez le journal des événements survenus dans la plage de date et d'heure spécifiée à l'aide du sélecteur de plage. Par défaut, le système charge les journaux des 24 dernières heures pour la vue initiale. La durée maximale pouvant être spécifiée pour les dates "from" et "to" est de 30 jours.

:::info
La pagination en bas permet de naviguer entre les pages, chaque page affichant un maximum de 7 journaux.
:::

<img className="screenshot-full" src="/img/enterprise/audit_logs/filtersnew-v2.png" alt="Journaux d'audit" />

## Période de conservation des journaux d'audit

Par défaut, les journaux d'audit sont conservés pendant 90 jours. Cependant, les administrateurs peuvent personnaliser cette période de conservation en définissant la variable d'environnement suivante :

```js
AUDIT_LOGS_RETENTION_PERIOD;
```

Pour conserver les journaux d'audit indéfiniment, définissez la variable à 0.

## Filtrer les journaux d'audit

Vous pouvez appliquer des filtres aux événements audités selon les critères suivants.

## Sélectionner des utilisateurs

Choisissez un utilisateur spécifique dans la liste déroulante pour voir toutes ses activités.

## Sélectionner des applications

La liste déroulante affichera toutes les applications associées à votre compte. Sélectionnez une application pour filtrer les journaux liés à cette application spécifique.

## Sélectionner des ressources {#select-resources}

| <div style={{ width:"100px"}}> Ressources </div> | <div style={{ width:"100px"}}> Description </div>                                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| User                                            | Filtre tous les événements User comme `USER_LOGIN`, `USER_SIGNUP`, `USER_INVITE` et `USER_INVITE_REDEEM`.                                        |
| App                                             | Filtre tous les événements App comme `APP_CREATE`, `APP_UPDATE`,`APP_DELETE`,`APP_IMPORT`,`APP_EXPORT`,`APP_CLONE`.                                |
| Data Query                                      | Filtre les événements associés aux Data Query comme `DATA_QUERY_RUN`.                                                                         |
| Group Permission                                | Tous les événements associés aux Group Permissions seront filtrés. Les Group Permissions incluent `GROUP_CREATE`, `GROUP_UPDATE`, `GROUP_DELETE`. |
| App Group Permission                            | Dans chaque groupe, vous pouvez définir des applications avec des privilèges de lecture ou d'édition. Ces événements sont enregistrés en tant qu'App Group Permissions.                         |

## Sélectionner des actions {#select-actions}

### User

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div>                                                                     |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| USER_LOGIN                                    | Cet événement est enregistré chaque fois qu'un utilisateur se connecte.                                                                       |
| USER_SIGNUP                                   | Cet événement est enregistré chaque fois qu'une nouvelle inscription est effectuée.                                                                |
| USER_INVITE                                   | Vous pouvez inviter des utilisateurs à votre compte depuis la section `Manage Users`, et un événement est audité chaque fois qu'une invitation est envoyée. |
| USER_INVITE_REDEEM                            | Cet événement est enregistré chaque fois qu'une invitation est utilisée.                                                                |
| USER_LOGOUT                                   | Cet événement est enregistré chaque fois qu'un utilisateur se déconnecte.                                                                      |
| USER_ARCHIVE                                  | Cet événement est enregistré chaque fois qu'un utilisateur est archivé.                                                                   |
| USER_UNARCHIVE                                | Cet événement est enregistré chaque fois qu'un utilisateur est désarchivé.                                                                 |
| USER_PROFILE_UPDATE                           | Cet événement est enregistré chaque fois que le nom ou l'avatar d'un utilisateur est mis à jour.                                                                   |
| USER_PASSWORD_FORGOT                          | Cet événement est enregistré chaque fois qu'un utilisateur demande un lien de mot de passe oublié depuis l'écran de connexion.                           |
| USER_PASSWORD_RESET                           | Cet événement est enregistré chaque fois qu'un super admin réinitialise le mot de passe d'un utilisateur au niveau de l'instance.                           |
| USER_PASSWORD_UPDATE                          | Cet événement est enregistré chaque fois qu'un utilisateur met à jour son mot de passe depuis les paramètres du profil.                                     |
| USER_DETAILS_UPDATE                           | Cet événement est enregistré chaque fois qu'un super admin met à jour les informations d'un utilisateur.                                               |

### User Groups and Permissions

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div>                                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| SET_AS_SUPERADMIN                             | Cet événement est enregistré chaque fois qu'un utilisateur est promu super admin.                                                              |
| GROUP_PERMISSION_CREATE                       | Cet événement est enregistré chaque fois qu'un groupe est créé.                                                                             |
| GROUP_PERMISSION_UPDATE                       | Cet événement est enregistré chaque fois qu'une application ou un utilisateur est ajouté à ou retiré d'un groupe, ou que les permissions d'un groupe sont mises à jour. |
| GROUP_PERMISSION_DELETE                       | Cet événement est enregistré chaque fois qu'un groupe d'utilisateurs est supprimé d'un compte.                                                        |
| GROUP_PERMISSION_DUPLICATE                    | Cet événement est enregistré chaque fois qu'un groupe et ses permissions sont dupliqués.                                                           |
| USER_ADD_TO_GROUP                             | Cet événement est enregistré chaque fois qu'un utilisateur est ajouté à un groupe.                                                                     |
| USER_REMOVE_FROM_GROUP                        | Cet événement est enregistré chaque fois qu'un utilisateur est retiré d'un groupe.                                                                     |
| GRANULAR_PERMISSION_APP_CREATE                | Cet événement est enregistré chaque fois qu'une permission granulaire au niveau de l'application est créée.                                                                    |
| GRANULAR_PERMISSION_APP_UPDATE                | Cet événement est enregistré chaque fois qu'une permission granulaire au niveau de l'application est mise à jour.                                                                    |
| GRANULAR_PERMISSION_APP_DELETE                | Cet événement est enregistré chaque fois qu'une permission granulaire au niveau de l'application est supprimée.                                                                    |
| GRANULAR_PERMISSION_DATA_SOURCE_CREATE        | Cet événement est enregistré chaque fois qu'une permission au niveau de la source de données est créée.                                                                      |
| GRANULAR_PERMISSION_DATA_SOURCE_UPDATE        | Cet événement est enregistré chaque fois qu'une permission au niveau de la source de données est mise à jour.                                                                      |
| GRANULAR_PERMISSION_DATA_SOURCE_DELETE        | Cet événement est enregistré chaque fois qu'une permission au niveau de la source de données est supprimée.                                                                      |

### Workspace

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div>                    |
| --------------------------------------------- | -------------------------------------------------------------------- |
| WORKSPACE_CREATE                              | Cet événement est enregistré chaque fois qu'un nouvel espace de travail est créé.          |
| WORKSPACE_UPDATE                              | Cet événement est enregistré chaque fois que le nom ou le slug d'un espace de travail est mis à jour. |
| WORKSPACE_ARCHIVE                             | Cet événement est enregistré chaque fois qu'un espace de travail est archivé.             |
| WORKSPACE_UNARCHIVE                           | Cet événement est enregistré chaque fois qu'un espace de travail est désarchivé.           |
| WORKSPACE_LOGIN_SETTINGS_UPDATE               | Cet événement est enregistré chaque fois que les paramètres de connexion d'un espace de travail sont mis à jour. |

### App

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div>                                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| APP_CREATE                                    | Cet événement est enregistré lorsqu'un utilisateur crée une nouvelle application.                                                                                        |
| APP_UPDATE                                    | Cet événement est enregistré chaque fois que des actions telles que renommer l'application, la rendre publique, modifier le lien de partage ou déployer l'application sont effectuées. |
| APP_PROMOTE                                   | Cet événement est enregistré chaque fois que l'environnement d'une application est promu.                                                                    |
| APP_RELEASE                                   | Cet événement est enregistré chaque fois qu'une application est publiée.                                                                                  |
| APP_SHARE                                     | Cet événement est enregistré chaque fois qu'une application est partagée.                                                                                    |
| APP_PUBLIC_UPDATE                             | Cet événement est enregistré chaque fois qu'une application est rendue publique.                                                                               |
| APP_DELETE                                    | Cet événement est enregistré chaque fois qu'un utilisateur supprime une application depuis le tableau de bord.                                                                    |
| APP_IMPORT                                    | Cet événement est enregistré chaque fois qu'un utilisateur importe une application.                                                                                       |
| APP_EXPORT                                    | Cet événement est enregistré chaque fois qu'une application est exportée.                                                                                          |
| APP_CLONE                                     | Cet événement est enregistré chaque fois qu'un clone d'une application existante est créé.                                                                      |
| APP_VERSION_CREATE                            | Cet événement est enregistré chaque fois qu'une nouvelle version d'une application est créée.                                                                  |
| APP_VERSION_UPDATE                            | Cet événement est enregistré chaque fois qu'une version d'une application est mise à jour.                                                                      |
| APP_VERSION_DELETE                            | Cet événement est enregistré chaque fois qu'une version d'une application est supprimée.                                                                      |

### Data Source

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div>                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| DATA_SOURCE_CREATE                            | Cet événement est enregistré chaque fois qu'une nouvelle source de données est créée.                                    |
| DATA_SOURCE_UPDATE                            | Cet événement est enregistré chaque fois qu'une source de données est mise à jour.                                        |
| DATA_SOURCE_DELETE                            | Cet événement est enregistré chaque fois qu'une source de données est supprimée.                                        |
| DATA_QUERY_RUN                                | Cet événement est enregistré chaque fois qu'une requête est exécutée, que ce soit depuis l'éditeur de requêtes ou depuis l'application lancée. |

## Comprendre les informations du journal

<img className="screenshot-full" src="/img/enterprise/audit_logs/readinglogv2.png" alt="Journaux d'audit" />

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div>                                                                                                                                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action_type                                    | Indique le type d'action qui a été enregistré dans l'événement. Consultez [ceci](#select-actions) pour plus d'informations sur les actions.                                                                                           |
| created_at                                     | Affiche la date et l'heure à laquelle l'événement a été enregistré.                                                                                                                                                                          |
| id                                             | Chaque événement enregistré reçoit un identifiant d'événement unique.                                                                                                                                                                            |
| ip_address                                     | Affiche l'adresse IP depuis laquelle l'événement a été enregistré.                                                                                                                                                                    |
| metadata                                       | Les métadonnées incluent deux sous-propriétés : `tooljet_version` et `user_agent`. `tooljet_version` indique la version de ToolJet utilisée pour l'événement, tandis que `user_agent` contient des informations sur l'appareil et le navigateur utilisés. |
| organization_id                                | Chaque organisation dans ToolJet dispose d'un identifiant unique, qui est enregistré lorsqu'un événement se produit.                                                                                                                   |
| resource_id                                    | Différentes [ressources](#select-resources) possèdent leurs identifiants respectifs, qui leur sont attribués lors de leur création.                                                                             |
| resource_name                                  | Affiche le nom des [ressources](#select-resources) impliquées dans l'événement enregistré. Par exemple, si une application a été créée ou supprimée, le nom de cette application sera affiché.                                           |
| resource_type                                  | Indique le type des [ressources](#select-resources) impliquées dans l'événement enregistré.                                                                                                                                      |
| user_id                                        | Chaque compte utilisateur dans ToolJet dispose d'un identifiant unique, qui est enregistré lorsqu'un événement se produit.                                                                                                                    |

### Fichier journal

Le fichier contiendra toutes les données des journaux d'audit. Le fichier journal peut être créé en spécifiant le chemin dans les [variables d'environnement](/docs/setup/env-vars). Le fichier journal est rotaté quotidiennement et mis à jour dynamiquement chaque fois qu'un nouveau journal d'audit est généré.

En savoir plus sur **la configuration de la génération de fichiers journaux** [ici](/docs/security/audit-logs/setup-rsyslog).

### Rotation des journaux

Le fichier journal est configuré pour être rotaté quotidiennement. Cela signifie qu'un nouveau fichier journal sera créé chaque jour, garantissant une gestion et une organisation efficaces des données d'audit.

### Rédaction des journaux

ToolJet met en œuvre la rédaction des journaux pour protéger les informations sensibles. Par défaut, les en-têtes suivants sont masqués dans les journaux :

- authorization
- cookie
- set-cookie
- x-api-key
- proxy-authorization
- www-authenticate
- authentication-info
- x-forwarded-for

De plus, vous pouvez spécifier des champs personnalisés à masquer en utilisant la variable d'environnement `LOGGER_REDACT`.

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"100px"}}> Description </div>                                                                                      |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| LOGGER_REDACT                                  | Liste de champs supplémentaires séparés par des virgules à masquer dans les journaux (par ex., req.headers["x-session-id"],req.headers["x-device-fingerprint"]) |

Par exemple :

```bash
LOGGER_REDACT=res.headers["x-rate-limit-remaining"],res.headers["x-request-id"]
```

### Chemin du fichier journal

Le chemin du fichier journal est défini à l'aide de la variable `LOG_FILE_PATH` dans l'environnement. Il est important de comprendre que ce chemin est relatif au répertoire personnel de la machine. Par exemple, si `LOG_FILE_PATH` est défini sur `hsbc/dashboard/log`, le chemin du fichier journal résultant sera structuré comme suit :

```
homepath/hsbc/dashboard/log/tooljet_log/{process_id}-{date}/audit.log
```

Ici, `{process_id}` est un espace réservé pour l'identifiant de processus unique, et `{date}` représente la date actuelle. Ce chemin structuré garantit que les journaux d'audit sont organisés à la fois par processus et par date, facilitant la traçabilité et l'analyse.

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"100px"}}> Description </div>                                |
| ---------------------------------------------- | -------------------------------------------------------------------------------- |
| LOG_FILE_PATH                                  | le chemin où le fichier journal sera créé (par ex. : tooljet/log/tooljet-audit.log) |

<details id="tj-dropdown">
<summary>Exemple de données de fichier journal</summary>

```bash
{
  level: 'info',
  message: 'PERFORM APP_CREATE OF awdasdawdwd APP',
  timestamp: '2023-11-02 17:12:40',
  auditLog: {
    userId: '0ad48e21-e7a2-4597-9568-c4535aedf687',
    organizationId: 'cf8e132f-a68a-4c81-a0d4-3617b79e7b17',
    resourceId: 'eac02f79-b8e2-495a-bffe-82633416c829',
    resourceType: 'APP',
    actionType: 'APP_CREATE',
    resourceName: 'awdasdawdwd',
    ipAddress: '::1',
    metadata: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      tooljetVersion: '2.22.2-ee2.8.3'
    }
  },
  label: 'APP'
}
```

</details>
