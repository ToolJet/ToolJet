---
id: entra-id
title: Microsoft Entra ID
---

Microsoft Entra ID peut être configuré comme fournisseur d'identité pour SAML, un protocole d'authentification qui vérifie de manière sécurisée l'identité des utilisateurs via un fournisseur de confiance. Ce document explique comment obtenir les identifiants requis depuis le portail Azure Developer Portal. Consultez le [guide de configuration SAML](/docs/user-management/sso/saml/setup) pour configurer SAML dans votre application.

## Générer les métadonnées

1. Connectez-vous au Azure Developer Portal. Accédez à Enterprise applications et créez une nouvelle application.

2. Ouvrez l'application et allez dans **Manage > Single sign-on > SAML**.
    <img className="screenshot-full img-full" src="/img/user-management/sso/saml/entra-id/add_application.png" alt="Entra ID: Create Application"/>

3. Sous SAML Certificates, copiez l'App Federation Metadata URL. Ouvrez cette URL dans un nouvel onglet et copiez le contenu XML.

4. Dans ToolJet, accédez à **Workspace settings > Workspace login > SAML**. Collez le XML dans Identity provider metadata et cliquez sur **Save changes**. Copiez l'URL de redirection générée.
    <img className="screenshot-full img-full" src="/img/user-management/sso/saml/entra-id/tooljet_saml_configuration.png" alt="Entra ID: ToolJet SAML Configuration"/>

5. Retournez au Azure Developer Portal. Allez dans **Manage > Single sign-on**, modifiez **Basic SAML Configuration**, et collez l'URL de redirection à la fois dans **Identifier (Entity ID)** et **Reply URL (Assertion Consumer Service URL)**. Cliquez sur **Save**.
    <img className="screenshot-full img-full" src="/img/user-management/sso/saml/entra-id/azure_saml_configuration.png" alt="Entra ID: Azure SAML Configuration"/>

6. Modifiez **Attributes & Claims** et renommez la claim **emailaddress** en **email**.

Une fois ces étapes terminées, les utilisateurs devraient pouvoir se connecter à ToolJet via Microsoft Entra ID en utilisant SAML, sans configuration supplémentaire.

   <img className="screenshot-full img-full" src="/img/user-management/sso/saml/entra-id/sign_in_page.png" alt="Sign-In Page"/>

## Configurer la synchronisation des groupes avec Microsoft Entra ID

:::note
La synchronisation des groupes avec Microsoft Entra ID via SAML n'est prise en charge que sur les instances ToolJet auto-hébergées.
:::

Pour configurer la synchronisation des groupes avec Microsoft Entra ID SAML, suivez ces étapes :

1. Définissez la variable d'environnement suivante dans votre déploiement ToolJet :
```js
    TJ_SAML_GROUP_MAPPINGS__<tooljet-workspace-slug> = '{"<azure-group-object-id>": "tooljet-group-name"}'
```

2. Pour obtenir l'Object ID du groupe Azure, connectez-vous au Azure Developer Portal et accédez à Groups > All groups. Sélectionnez le groupe que vous souhaitez mapper et copiez son Object ID.
    <img className="screenshot-full img-full" src="/img/user-management/sso/saml/entra-id/group_object_id.png" alt="Entra ID: Azure Group Object ID"/>

3. Retournez à votre application dans le Azure Developer Portal. Allez dans **Manage > Single sign-on**, modifiez **Attributes & Claims**, et ajoutez une nouvelle **Group Claim**. Sous **Which groups associated with the user should be returned in the claim**, sélectionnez **All groups** ou les types de groupes dont vous avez besoin. Définissez le **Source attribute** sur **Group ID**. Cliquez sur **Save**.

4. Dans votre application ToolJet, allez dans **Workspace settings > Workspace login > SAML** et activez **Group sync**.

5. Dans le champ Group attribute, saisissez `groups`.
    <img className="screenshot-full img-full" src="/img/user-management/sso/saml/entra-id/enable_group_sync.png" alt="Entra ID: Enable Group Sync"/>

Une fois configuré, ToolJet synchronisera automatiquement les groupes d'utilisateurs depuis Microsoft Entra ID en fonction des mappings définis.
