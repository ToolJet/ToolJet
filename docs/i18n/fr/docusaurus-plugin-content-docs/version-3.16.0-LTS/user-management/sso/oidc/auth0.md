---
id: auth0
title: Auth0
---

Auth0 peut être configuré comme fournisseur d'identité (Identity Provider) pour OIDC, un protocole d'authentification qui vérifie de manière sécurisée les identités des utilisateurs via un fournisseur de confiance. Ce document explique comment obtenir les identifiants requis depuis la console développeur Auth0. Consultez le guide **[Configuration OIDC](/docs/user-management/sso/oidc/setup)** pour configurer OIDC dans votre application.

## Configurer OIDC avec Auth0
Pour configurer OIDC avec Auth0, vous pouvez suivre ces étapes :

1. Allez sur le <a href="https://manage.auth0.com/dashboard" target="_blank">tableau de bord Auth0</a>, naviguez vers la section **Applications** et cliquez sur _Create Application_.

    <img className="screenshot-full img-full" src="/img/user-management/sso/oidc/auth0/create-app.png" alt="Auth0: SSO"/>

2. Sélectionnez **Regular Web Applications**. Vous pouvez laisser les autres paramètres inchangés et cliquer sur _Create_.
   <img className="screenshot-full img-m" src="/img/user-management/sso/oidc/auth0/application-type.png" alt="Auth0: SSO"/>

3. Allez dans **Settings** pour obtenir le **Client ID**, le **Client Secret** et le **Domain**.
   <img className="screenshot-full img-full" src="/img/user-management/sso/oidc/auth0/auth0-OIDC-configuration.png" alt="Auth0: ToolJet Configuration"/>

4. Allez dans vos **ToolJet Workspace settings > Workspace login** et activez **OpenID Connect**.
   (Exemple d'URL - https://app.corp.com/demo-workspace/workspace-settings/workspace-login)

   <img className="screenshot-full img-full" src="/img/user-management/sso/oidc/auth0/enableOIDC.png" alt="Auth0: ToolJet Configuration"/>

5. Collez le Client ID et le Client secret obtenus à l'étape 3.
6. Le [Well known URL](https://auth0.com/docs/get-started/applications/configure-applications-with-oidc-discovery#:~:text=You%20can%20configure%20applications%20with%20the%20OpenID%20Connect%20(OIDC)%20discovery%20documents%20found%20at%3A%20https%3A//%7ByourDomain%7D/.well%2Dknown/openid%2Dconfiguration) aura le format suivant. Vous devez remplacer `<YOUR-AUTH0-DOMAIN>` par le Auth0 Domain obtenu à l'étape 3.
   ```js
   https://<YOUR-AUTH0-DOMAIN>/.well-known/openid-configuration // Nous avons obtenu le Auth0 Domain à l'étape 3.
   ```
7. Cliquez sur *Save Changes* et copiez la Redirect URL fournie dans la boîte de dialogue.
   <img className="screenshot-full img-m" src="/img/user-management/sso/oidc/auth0/tooljet-OIDC-configuration.png" alt="Auth0: ToolJet Configuration"/>
8. Allez dans votre **application Auth0 > Settings > Application URIs** et collez la Redirect URI dans **Allowed Callback URLs**, puis enregistrez la configuration.

Vous devriez maintenant pouvoir vous connecter à votre workspace ToolJet en utilisant Auth0.
   <img className="screenshot-full img-full" src="/img/user-management/sso/oidc/auth0/sign_in_page.png" alt="Sign-In Page"/>
