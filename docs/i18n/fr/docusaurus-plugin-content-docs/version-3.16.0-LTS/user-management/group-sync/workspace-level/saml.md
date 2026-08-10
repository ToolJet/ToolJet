---
id: saml
title: SAML
---

<PlanBadge type="enterprise" />

Dans ToolJet, vous pouvez utiliser la fonctionnalité de synchronisation de groupes pour mettre à jour automatiquement les rôles des utilisateurs et les groupes personnalisés à partir du fournisseur d'identité. Cette fonctionnalité permet une gestion centralisée des accès, réduit le risque d'erreurs manuelles, renforce la sécurité et simplifie le processus d'intégration des utilisateurs. La synchronisation de groupes SAML n'est disponible qu'au niveau espace de travail.

Ce guide explique comment configurer la synchronisation de groupes SAML avec Okta comme fournisseur d'identité, à titre d'exemple. Cela peut servir de référence pour la configuration d'autres IdP.

La synchronisation de groupes se produit à chaque connexion. Les utilisateurs doivent se déconnecter puis se reconnecter pour que les changements soient pris en compte. La modification manuelle des groupes dans ToolJet n'est pas recommandée, car les changements seront écrasés lors des connexions suivantes.

:::caution Suppression d'un utilisateur depuis le fournisseur d'identité
Chaque fois qu'un utilisateur est supprimé du fournisseur d'identité, les admins doivent archiver manuellement l'utilisateur dans ToolJet. Sinon, si la connexion par mot de passe est activée, l'utilisateur peut toujours se connecter avec son mot de passe.
:::

Si la licence expire ou est rétrogradée vers un plan sans synchronisation de groupes, les fonctionnalités SSO et de synchronisation de groupes seront toutes deux désactivées. Les utilisateurs devront se connecter via d'autres méthodes SSO ou par e-mail/mot de passe. Si la limite de licence est atteinte, les nouveaux utilisateurs ne pourront pas se connecter.

## Prérequis

Veillez à ajouter l'*attribut de groupe* lors de la configuration de SAML pour votre espace de travail ToolJet. Consultez la documentation [configuration SAML](/docs/user-management/sso/saml/setup) et [configuration Okta](/docs/user-management/sso/saml/okta) pour des instructions détaillées.

## Mappage de groupes

ToolJet permet de mapper les groupes du fournisseur d'identité (IdP) aux groupes personnalisés ToolJet à l'aide de la synchronisation de groupes SAML. Cela garantit que l'accès et les rôles des utilisateurs sont gérés de manière cohérente entre les systèmes, permettant un contrôle d'accès centralisé et automatisé.

Il existe deux façons de configurer cela :
- Mappage via l'interface utilisateur : Créez des groupes personnalisés correspondants dans ToolJet qui reflètent les noms de groupe de votre IdP.
- Mappage via variable d'environnement : Définissez les mappages de groupes dans le fichier .env de votre instance ToolJet.

Voyons chaque méthode en détail :

## Mappage de groupes via l'interface utilisateur

Pour mapper les groupes via l'interface utilisateur, suivez ces étapes :

### 1.	Configurer la synchronisation de groupes via SAML
Assurez-vous que SAML est correctement configuré entre votre IdP et ToolJet.
### 2.	Identifier les groupes dans votre IdP
Déterminez les groupes de votre fournisseur d'identité (par exemple, Okta) que vous souhaitez synchroniser avec ToolJet.
### 3.	Créer des groupes personnalisés dans ToolJet
- Créez des groupes personnalisés dans ToolJet en utilisant exactement les mêmes noms que ceux de votre IdP. Consultez la documentation [groupe personnalisé](/docs/user-management/role-based-access/custom-groups/) pour en savoir plus sur la création de groupes personnalisés.
<div>
  :::note
  Les noms de groupe sont sensibles à la casse, assurez-vous donc que les noms de groupe dans ToolJet et votre fournisseur d'identité (par exemple, Okta) correspondent exactement.
  :::
</div>
- Exemple : Si vous avez un groupe nommé *Support* dans Okta, créez un groupe nommé *Support* dans ToolJet comme indiqué ci-dessous :
  - Groupe dans Okta

    <img className="screenshot-full img-s" src="/img/user-management/group-sync/saml/okta-group.png" alt="SAML Group Sync Config" />

  - Groupe dans ToolJet
    <img className="screenshot-full img-l" src="/img/user-management/group-sync/saml/tooljet-group.png" alt="SAML Group Sync Config" />

### 4.	Définir les permissions dans ToolJet
Attribuez des rôles et des permissions à chaque groupe personnalisé dans ToolJet selon vos besoins de contrôle d'accès.

### 5.	Mappage des groupes utilisateur lors de la connexion
Une fois SAML configuré et les groupes créés dans ToolJet, lors de la prochaine connexion de l'utilisateur concerné, le mappage de groupes se produira, et son rôle ainsi que ses groupes personnalisés seront mis à jour en conséquence.

## Mappage de groupes via variable d'environnement

Dans certains cas (notamment pour Azure AD), les noms de groupe ne sont pas transmis sous forme de chaînes de caractères mais sous forme d'ID d'objet. Dans ces cas, vous devez utiliser la méthode de mappage de groupes via variable d'environnement.

:::note
- Cette méthode s'applique uniquement aux configurations auto-hébergées.
- Cette configuration s'applique à tous les fournisseurs d'identité pour le mappage de groupes SAML.
- Pour les utilisateurs Azure AD : utilisez l'Object ID du groupe si la configuration n'émet pas le nom du groupe.
- Si des variables d'environnement sont configurées, elles auront priorité sur les mappages de groupes définis dans les étapes ci-dessus.
:::

### Utilisation

Ajoutez la variable d'environnement suivante dans votre instance ToolJet :

```bash title=".env"
TJ_SAML_GROUP_MAPPINGS__<workspace_slug>='{"idp-group-name-or-objectId": "tooljet-group-name"}'
```

Remplacez `<workspace_slug>` par le slug de votre espace de travail et, si le slug contient des traits d'union (-), remplacez-les par des underscores (_). Le slug se trouve dans l'URL de votre espace de travail.

Par exemple, dans l'URL d'instance `https://app.corp.com/my-workspace`, le slug est `my-workspace` et dans la variable d'environnement, il devient `my_workspace`. Vous pouvez également le trouver en cliquant sur l'icône *Edit* dans le menu déroulant de l'espace de travail en bas à gauche, une fenêtre modale apparaîtra affichant le slug.

  <img className="screenshot-full img-s" src="/img/user-management/group-sync/saml/workspace-slug.png" alt="SAML Group Sync Config" />

La valeur doit être une chaîne JSON dans laquelle les clés représentent les noms de groupe ou les ID d'objet de votre fournisseur d'identité, et les valeurs représentent les noms de groupe correspondants dans ToolJet.

### Exemple pour Azure AD
Si vous avez un groupe nommé *Support* dans Azure AD et que vous souhaitez le mapper à un groupe nommé *Support* dans ToolJet, vous devez récupérer l'Object ID du groupe depuis Azure AD et l'utiliser comme clé dans la variable d'environnement.

- Groupe dans Azure AD
  <img className="screenshot-full img-l" src="/img/user-management/group-sync/saml/azure-group.png" alt="SAML Group Sync Config" />

- Groupe dans ToolJet
  <img className="screenshot-full img-l" src="/img/user-management/group-sync/saml/tooljet-group.png" alt="SAML Group Sync Config" />

Voici à quoi ressemblera la variable d'environnement :

```bash title=".env"
TJ_SAML_GROUP_MAPPINGS__my_workspace='{"cObfe2ea-680-4029-9172-9d73dd5c08c7": "Support"}'
```

### Exemple de mappages de groupes multiples

Vous pouvez également spécifier plusieurs mappages en les séparant par des virgules. Par exemple, si vous avez deux groupes nommés "Support" et "Admin" dans votre fournisseur d'identité (par exemple, Okta) et que vous souhaitez les mapper à des groupes nommés "Support_Team" et "Admin" dans ToolJet respectivement, vous pouvez les configurer ainsi :

```bash title=".env"
TJ_SAML_GROUP_MAPPINGS__my_workspace='{"Support": "Support_Team", "Admin": "Admin"}'
```

Désormais, lorsqu'un utilisateur se connecte à ToolJet via SAML, son rôle et ses groupes personnalisés seront mis à jour selon les mappages spécifiés.


## Désactiver la synchronisation de groupes (facultatif)

Par défaut, ToolJet synchronise les groupes d'utilisateurs lors de la connexion SSO avec SAML. Si vous souhaitez ignorer la synchronisation de groupes, par exemple pour éviter des changements de permissions involontaires, vous pouvez désactiver ce comportement à l'aide d'une variable d'environnement.

Pour désactiver la synchronisation de groupes pour SAML, définissez ce qui suit dans votre fichier .env :

```bash
DISABLE_SAML_GROUP_SYNC=true
```
Lorsque cette variable est définie sur true, ToolJet ignorera la synchronisation de groupes pendant le processus de connexion SAML. Si la variable n'est pas définie ou est définie sur false, la synchronisation de groupes continuera de fonctionner normalement.

Cela vous donne davantage de contrôle sur la manière dont les permissions et les groupes d'accès des utilisateurs sont gérés pendant l'authentification.
