---
id: oidc
title: OpenID Connect
---

<PlanBadge type="enterprise" />

Dans ToolJet, vous pouvez utiliser la fonctionnalité de synchronisation de groupes pour mettre à jour automatiquement les rôles des utilisateurs et les groupes personnalisés à partir du fournisseur d'identité. Cette fonctionnalité permet une gestion centralisée des accès, réduit le risque d'erreurs manuelles, renforce la sécurité et simplifie le processus d'intégration des utilisateurs.

La synchronisation de groupes se produit à chaque connexion. Les utilisateurs doivent se déconnecter puis se reconnecter pour que les changements soient pris en compte. La modification manuelle des groupes dans ToolJet n'est pas recommandée, car les changements seront écrasés lors des connexions suivantes.

:::caution Suppression d'un utilisateur depuis le fournisseur d'identité
Chaque fois qu'un utilisateur est supprimé du fournisseur d'identité, les admins doivent archiver manuellement l'utilisateur dans ToolJet. Sinon, si la connexion par mot de passe est activée, l'utilisateur peut toujours se connecter avec son mot de passe.
:::

Si la licence expire ou est rétrogradée vers un plan sans synchronisation de groupes, les fonctionnalités SSO et de synchronisation de groupes seront toutes deux désactivées. Les utilisateurs devront se connecter via d'autres méthodes SSO ou par e-mail/mot de passe. Si la limite de licence est atteinte, les nouveaux utilisateurs ne pourront pas se connecter.

## Mappage de groupes

Le mappage de groupes dans ToolJet suit ces principes :

- Mappage 1:1 par défaut basé sur les noms de groupe (sensible à la casse).
- Un mappage de groupes personnalisé peut être configuré.
- Les utilisateurs sans groupe correspondant sont assignés au groupe **end-users**.

### Scénarios de mappage de groupes

| Groups in IdP | <div style={{width: '180px'}}> Groups in ToolJet </div> | Role Mapping Settings | Result |
|---------------|-------------------|------------------------|--------|
| **admin**, **builder**, **end-user** | Existe (rôles utilisateur) | Aucun | L'utilisateur est assigné avec le rôle utilisateur correspondant. |
| **engineers** | Existe | Aucun | L'utilisateur est ajouté au groupe personnalisé **engineers** et assigné au rôle **end-users** ou **builders** selon les permissions. |
| **engineers** | **engineers** - N'existe pas <br/> **developer** - Existe | **engineers → developers** | L'utilisateur est ajouté au groupe personnalisé **developers** et assigné au rôle **builder** ou **end-user** selon les permissions. |
| **admin**, **developers** | Existe | Aucun | L'utilisateur est ajouté au groupe personnalisé **developers** et assigné au rôle utilisateur **admin**. |
| aucun groupe | N/A | Aucun | L'utilisateur est ajouté au groupe par défaut **end-users**. |

## Configurer la synchronisation de groupes OIDC dans ToolJet

Pour configurer la synchronisation de groupes OIDC dans ToolJet, suivez ces étapes :

1. Accédez à l'onglet **Workspace Settings** > **Workspace Login**. <br/>
   (URL d'exemple : `https://app.corp.com/nexus/workspace-settings/workspace-login` )
2. Cliquez sur OpenID Connect dans la section SSO.
3. Configurez le SSO OpenID Connect en suivant ce [guide](/docs/user-management/sso/oidc/setup).
4. Activez le bouton bascule **Group Sync** et fournissez les informations suivantes :

  - **Claim name** : Saisissez le nom de la revendication (claim) dans le jeton OIDC qui contient les informations de groupe (par exemple, groups).
  - **Group mapping** : Configurez comment les groupes IdP sont mappés aux groupes ToolJet. Utilisez le format :
    ```
    IdP Group -> ToolJet Group, Another IdP Group -> Another ToolJet Group
    ```
    Par exemple :
    ```
    Marketing Team -> marketing, Sales Team -> sales
    ```

   <img className="screenshot-full img-full" src="/img/user-management/group-sync/oidc/mapping.png" alt="OIDC Group Sync Config" />

## Scopes personnalisés

Les fournisseurs OIDC permettent souvent de demander des scopes personnalisés supplémentaires au-delà des scopes standard. Ces scopes définissent quelles informations ou permissions une application peut accéder, telles que les groupes, les rôles ou les permissions d'accès à l'annuaire.
ToolJet inclut les scopes suivants par défaut :
```
OIDC_CUSTOM_SCOPES=openid, email, profile
```
Lorsque la synchronisation de groupes est activée et qu'aucun scope personnalisé n'est configuré, ToolJet ajoute automatiquement :
```
OIDC_CUSTOM_SCOPES=groups
```

### Configuration

Vous pouvez remplacer ou étendre les scopes par défaut en utilisant la variable d'environnement `OIDC_CUSTOM_SCOPES` dans la version auto-hébergée de ToolJet.

Définissez les scopes dans votre fichier `.env` en utilisant des valeurs séparées par des virgules :
```
OIDC_CUSTOM_SCOPES=groups,roles,offline_access
```

### Exemples spécifiques aux fournisseurs

| **Provider** | **Required Scope** | **Extended Scope Example** |
|:------------:|:------------------:|:--------------------------:|
| Okta | `OIDC_CUSTOM_SCOPES=groups` | `OIDC_CUSTOM_SCOPES=groups,roles` |
| Azure Entra ID (Microsoft) | `OIDC_CUSTOM_SCOPES=Group.Read.All` | `OIDC_CUSTOM_SCOPES= Group.Read.All,Directory.Read.All` |

:::note
- Les scopes personnalisés doivent être pris en charge par votre fournisseur OIDC.
- Assurez-vous que votre application dispose des permissions nécessaires configurées dans le fournisseur d'identité pour les scopes spécifiques.
:::
