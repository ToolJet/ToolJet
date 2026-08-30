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

Ce guide explique comment fonctionne la synchronisation de groupes au niveau instance, quand l'utiliser et comment la configurer.

## Quand utiliser la synchronisation de groupes au niveau instance

Imaginez que votre organisation dispose de plusieurs espaces de travail dans ToolJet, un pour le Marketing, un autre pour les Ventes et un autre pour l'Ingénierie, et que vous utilisez le SSO OIDC pour l'authentification. Dans une configuration traditionnelle, vous devriez configurer le SSO OIDC et la synchronisation de groupes séparément pour chaque espace de travail. Cela signifie configurer manuellement les mappages groupe-rôle dans chaque espace de travail, ce qui peut rapidement devenir répétitif et source d'erreurs.

La synchronisation de groupes au niveau instance résout ce problème. En tant que Super Admin, vous pouvez configurer le SSO OIDC et la synchronisation de groupes une seule fois au niveau instance. Ces paramètres sont automatiquement appliqués à l'espace de travail par défaut et peuvent être hérités facultativement par d'autres espaces de travail.

Cette configuration simplifie également l'expérience de connexion : les utilisateurs peuvent s'authentifier directement via l'URL racine de l'instance, sans avoir besoin d'accéder aux URL individuelles des espaces de travail.


## Fonctionnement

**Rôle requis** : Super Admin

###  Activer la synchronisation de groupes au niveau instance
- Accédez à l'onglet **Instance Settings** > **Instance Login**.
- Cliquez sur OpenID Connect dans la section SSO.
- Configurez le SSO OpenID Connect en suivant ce [guide](/docs/user-management/sso/oidc/setup).
- Activez le bouton bascule **Group Sync** et fournissez les informations suivantes :

    - **Claim name** : Saisissez le nom de la revendication (claim) dans le jeton OIDC qui contient les informations de groupe (par exemple, groups).
    - **Group mapping** : Configurez comment les groupes IdP sont mappés aux groupes ToolJet. Utilisez le format :
    <br/>
   ```
   IdP Group -> ToolJet Group, Another IdP Group -> Another ToolJet Group
   ```
   Par exemple :
   ```
   Marketing Team -> marketing, Sales Team -> sales
   ```

   Consultez la section Mappage de groupes ci-dessous pour plus de détails.

   <img className="screenshot-full img-l" src="/img/user-management/group-sync/oidc/setup.png" alt="OIDC Group Sync Config" />

### Héritage de l'espace de travail par défaut
ToolJet appliquera automatiquement ces paramètres à un espace de travail par défaut.
- Vous pouvez désactiver cet héritage si nécessaire
- Si vous supprimez l'espace de travail par défaut, assurez-vous qu'un autre en hérite la configuration

### Ajouter davantage d'espaces de travail
Vous pouvez choisir d'autres espaces de travail pour hériter de la configuration au niveau instance.
- Cliquez sur **Add Workspace**
- Choisissez un espace de travail dans la liste déroulante
- L'espace de travail héritera du **Claim Name** et des **Group Mappings**
- Vous pouvez les modifier si nécessaire (cela remplace la configuration héritée)
Cela facilite le déploiement de mappages de rôles cohérents sur tous les espaces de travail.
  
  <img className="screenshot-full img-l" src="/img/user-management/group-sync/oidc/add_ws.png" alt="OIDC Group Sync Config" />

### Désactiver la synchronisation de groupes
Si vous désactivez le bouton bascule Group Sync :
- Tous les paramètres sont masqués mais pas perdus
- Vous pouvez les réactiver plus tard, et votre configuration précédente sera restaurée
- Aucun changement n'est appliqué tant que c'est désactivé

   <img className="screenshot-full img-l" src="/img/user-management/group-sync/oidc/disable.png" alt="OIDC Group Sync Config" />

### Supprimer des espaces de travail
- Vous pouvez supprimer des espaces de travail de la liste de synchronisation
- ToolJet affichera un avertissement avant de retirer la configuration
- Au moins un espace de travail doit rester activé pour que la synchronisation de groupes fonctionne

   <img className="screenshot-full img-l" src="/img/user-management/group-sync/oidc/delete.png" alt="OIDC Group Sync Config" />

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
