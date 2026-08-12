---
id: azuread
title: Microsoft Entra ID
---

Microsoft Entra ID peut être configuré comme fournisseur d'identité (Identity Provider) pour OIDC, un protocole d'authentification qui vérifie de manière sécurisée les identités des utilisateurs via un fournisseur de confiance. Ce document explique comment obtenir les identifiants requis depuis le portail Microsoft Azure. Consultez le guide **[Configuration OIDC](/docs/user-management/sso/oidc/setup)** pour configurer OIDC dans votre application.

## Générer le Client ID et le Client Secret sur le portail Microsoft Azure


1. Allez dans **ToolJet > Workspace Settings > Workspace login > Enable OpenID Connect > Add provider**.
    (Exemple d'URL - https://app.corp.com/demo-workspace/workspace-settings/workspace-login)
    <img className="screenshot-full img-m" src="/img/user-management/sso/oidc/microsoft-entra-id/enable-oidc.png" alt="Microsoft Entra ID" />

2. Sans saisir aucune information, cliquez sur **Save changes** pour générer et copier la **Redirect URL**.

3. Allez sur le [portail Microsoft Azure](https://portal.azure.com) et naviguez vers [Manage Microsoft Entra ID](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview).

4. Enregistrez votre application ou créez-en une nouvelle en cliquant sur **Add > App Registration**.
    <img className="screenshot-full img-l" src="/img/user-management/sso/oidc/microsoft-entra-id/app-registration.png" alt="App registration" />

5. Renseignez les informations selon vos besoins. Dans le Redirect URI, saisissez la Redirect URL obtenue depuis ToolJet et cliquez sur **Register**.
    <img className="screenshot-full img-full" src="/img/user-management/sso/oidc/microsoft-entra-id/register-application.png" alt="Register application" />

6. Vous pouvez trouver le **Client ID** dans l'onglet **Application's Overview**. Pour obtenir le Client Secret, allez dans l'onglet **Overview** de l'application > **Manage** > **Client credentials** > **Add a certificate or secret** > **New client secret**. Copiez le champ value.
    <img className="screenshot-full img-l" src="/img/user-management/sso/oidc/microsoft-entra-id/client-secret.png" alt="Client secret" />

7. Saisissez le Client ID et le Client Secret dans la fenêtre modale de configuration OIDC de ToolJet.

8. Le Well known URL sera :
    ```js
    https://login.microsoftonline.com/<directory(tenant)-id>/v2.0/.well-known/openid-configuration
    ```
    Vous pouvez trouver le Directory (tenant) ID dans l'onglet Overview de votre application dans Azure.

Vous devriez maintenant pouvoir vous connecter à votre workspace ToolJet en utilisant Microsoft Entra ID.
   <img className="screenshot-full img-l" src="/img/user-management/sso/oidc/microsoft-entra-id/sign_in_page.png" alt="Sign-In Page"/>

## Configurer la synchronisation de groupes avec Microsoft Entra ID

1. Allez sur le portail Azure > [Enterprise Applications](https://portal.azure.com/#view/Microsoft_AAD_IAM/StartboardApplicationsMenuBlade/~/AppAppsPreview) > Votre application.

2. Dans le panneau de gauche, allez dans Manage > Single sign-on > Attributes & Claims > Edit > Add a group claim > Cliquez sur Go to Token configuration.
    <img className="screenshot-full img-full" src="/img/user-management/sso/oidc/microsoft-entra-id/group-sync/token-configuration.png" alt="Token Configuration" />

3. Cliquez sur Add groups claim > All groups (vous pouvez choisir le type de groupe selon vos besoins) et cliquez sur Add. Une claim nommée **groups** sera créée.
    <img className="screenshot-full img-full" src="/img/user-management/sso/oidc/microsoft-entra-id/group-sync/groups-claim.png" alt="Groups Claim" />

4. Allez sur le portail Azure > Groups > All groups. Sélectionnez le groupe pour lequel vous souhaitez créer une correspondance et copiez l'Object ID.
    <img className="screenshot-full img-full" src="/img/user-management/sso/oidc/microsoft-entra-id/group-sync/group-id.png" alt="Groups Object ID" />

5. Allez dans **ToolJet > Workspace Settings > Workspace login > OpenID Connect > Your Microsoft Entra ID OIDC Configuration > Enable Group Sync**.
    (Exemple d'URL - https://app.corp.com/demo-workspace/workspace-settings/workspace-login)

6. Saisissez le **Claim Name** comme `groups`. Si le nom obtenu à l'étape 3 était différent, saisissez celui-ci.

7. Le **Group mapping** sera le suivant :
    ```js
    Object ID from Step 4 -> ToolJet group name
    ```
    <img className="screenshot-full border-none img-full" src="/img/user-management/sso/oidc/microsoft-entra-id/group-sync/group-sync-configuration.png" alt="Group Sync COnfiguration" />
