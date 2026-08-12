---
id: onelogin
title: OneLogin
---

OneLogin peut être configuré comme fournisseur d'identité (IdP) via OpenID Connect (OIDC), un protocole d'authentification qui vérifie de manière sécurisée l'identité des utilisateurs via un fournisseur de confiance. Ce document explique comment obtenir les identifiants requis depuis la console OneLogin. Consultez le guide **[Configuration OIDC](/docs/user-management/sso/oidc/setup)** pour configurer OIDC dans votre application.

## Générer un ID client et un secret client sur le portail d'administration OneLogin

1. Connectez-vous à [OneLogin](https://www.onelogin.com/). Vous aurez besoin d'un domaine pour votre organisation. Vous pouvez en obtenir un en vous inscrivant à un **essai gratuit** sur la page d'accueil.

2. Accédez à la page d'administration, puis naviguez vers **Applications > Applications > Add App**.
    <img className="screenshot-full border-none img-l" src="/img/user-management/sso/oidc/onelogin/add_application.png" alt="OneLogin: Add Application"/>

3. Sur la page Find Applications, recherchez OpenID Connect (OIDC) et sélectionnez OpenId Connect (OIDC).
    <img className="screenshot-full border-none img-l" src="/img/user-management/sso/oidc/onelogin/find_application.png" alt="OneLogin: Find Application"/>

4. Saisissez le Display Name, conservez la configuration par défaut et cliquez sur **Save**.

5. Vous devrez créer votre utilisateur et l'ajouter à l'application OneLogin que vous venez de créer. Dans la barre de navigation, allez dans Users > New User et créez un utilisateur. Après avoir créé l'utilisateur, ouvrez son profil, allez dans Applications, puis cliquez sur l'icône + pour associer l'utilisateur à l'application que vous venez de créer.
    <img className="screenshot-full border-none img-l" src="/img/user-management/sso/oidc/onelogin/assign_application_1.png" alt="OneLogin: Assign Application to User"/>

6. Sélectionnez l'application que vous venez de créer et cliquez sur **Continue**. L'utilisateur sera ajouté à l'application.

À ce stade, l'application OneLogin est prête. Vous allez maintenant récupérer les identifiants OIDC nécessaires pour configurer ToolJet.

7. Rendez-vous maintenant dans votre Application > **SSO** pour récupérer le Client ID. Pour obtenir le Client secret, cliquez sur **Show client secret**. Pour obtenir l'URL de configuration Well-known, cliquez sur **Well-known Configuration** et copiez l'URL.
    <img className="screenshot-full border-none img-l" src="/img/user-management/sso/oidc/onelogin/onelogin_configuration.png" alt="OneLogin: Configuration"/>

8. Allez dans ToolJet > Workspace settings > Workspace login > OpenID Connect > Add provider.
    (URL exemple - https://app.corp.com/demo-workspace/workspace-settings/workspace-login)

9. Saisissez les informations de l'étape 7 et cliquez sur Save changes. Copiez ensuite l'URL de redirection affichée par ToolJet.

10. Rendez-vous dans votre application OneLogin > Configuration > collez l'URL de redirection dans la section Redirect URIs et cliquez sur **Save**.
    <img className="screenshot-full border-none img-l" src="/img/user-management/sso/oidc/onelogin/redirect_url.png" alt="OneLogin: Redirect URL"/>

Vous devriez maintenant pouvoir vous connecter à votre espace de travail ToolJet en utilisant OneLogin.
   <img className="screenshot-full img-full" src="/img/user-management/sso/oidc/onelogin/sign_in_page.png" alt="Sign-In Page"/>

## Configurer la synchronisation des groupes avec OneLogin

Pour configurer la synchronisation des groupes avec OneLogin, suivez ces étapes :

1. Rendez-vous sur le portail d'administration OneLogin et naviguez vers Users → Roles → New Role. Créez un rôle portant le même nom que le groupe que vous souhaitez mapper. Par exemple, pour mapper le rôle builder dans OneLogin au rôle developer dans ToolJet, nommez le rôle builder.

2. Sélectionnez votre application à ajouter au rôle et cliquez sur Save.
    <img className="screenshot-full border-none img-l" src="/img/user-management/sso/oidc/onelogin/add_app_to_role.png" alt="OneLogin: Add Application To Role"/>

3. Ajoutez l'utilisateur au rôle. Naviguez vers **Users > Roles > le rôle que vous avez créé > Users**. Recherchez maintenant l'utilisateur, cliquez sur **Add to role**, puis Save.
    <img className="screenshot-full border-none img-l" src="/img/user-management/sso/oidc/onelogin/add_user_to_role.png" alt="OneLogin: Add User To Role"/>

4. Allez dans Applications -> votre application OneLogin -> Parameters. Modifiez maintenant la configuration Groups comme suit :
    - User Roles
    - Semicolon Delimited input (Multi-value output)<br /><br /> 

    <img className="screenshot-full border-none img-full" src="/img/user-management/sso/oidc/onelogin/edit_field_groups.png" alt="OneLogin: Edit Field Groups"/>

5. Rendez-vous dans **Rules > Add Rule**. Saisissez le nom de votre choix pour la règle. Ajoutez une règle avec l'action :
    `Set Groups in Application > Map from OneLogin > For each > member_of > with value that matches > .*`
    <img className="screenshot-full border-none img-full" src="/img/user-management/sso/oidc/onelogin/one_login_rule.png" alt="OneLogin: One Login Rule"/>

6. Rendez-vous dans votre application ToolJet. Naviguez vers Workspace settings > Workspace login > OpenID Connect > votre configuration OneLogin et activez la synchronisation des groupes.

7. Le nom de la claim sera défini sur `groups`.

8. Le mapping des groupes sera défini comme suit :
    ```js
    <your-onelogin-role> -> <tooljet-group-name>
    ```
    Par exemple : si votre rôle OneLogin est **builder** et que le nom du groupe ToolJet est **developer**, le mapping sera builder -> developer.
    <img className="screenshot-full border-none img-full" src="/img/user-management/sso/oidc/onelogin/tooljet_configuration.png" alt="OneLogin: ToolJet Configuration"/>

Les utilisateurs seront désormais assignés aux groupes ToolJet en fonction de leurs rôles OneLogin.
