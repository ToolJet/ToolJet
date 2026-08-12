---
id: okta
title: Okta
---

Okta peut être configuré comme fournisseur d'identité pour OIDC, un protocole d'authentification qui vérifie de manière sécurisée l'identité des utilisateurs via un fournisseur de confiance. Ce document explique comment obtenir les identifiants requis depuis la console développeur Okta. Consultez le guide **[Configuration OIDC](/docs/user-management/sso/oidc/setup)** pour configurer OIDC dans votre application.

## Générer un ID client et un secret client sur la console développeur Okta

1. Connectez-vous à la [console développeur Okta](https://developer.okta.com/).

2. Accédez à la section **Applications** et cliquez sur **Create App Integration**.
    <img className="screenshot-full" src="/img/user-management/sso/oidc/okta/create-app.png" alt="Okta: SSO"/>

3. Sélectionnez **OIDC - OpenID Connect** comme **Sign-in method**, puis sélectionnez le **Application type** :
    - **Web Application** pour Authorization Code
    - **Single Page Application** pour Authorization Code with PKCE <br/><br/>
Cliquez sur le bouton **Next**. <br/><br/>
    <img className="screenshot-full img-l" src="/img/user-management/sso/oidc/okta/app-type.png" alt="Okta: SSO" />

4. Saisissez un **App integration name** et définissez les **Sign-in redirect URIs** avec l'URL de redirection fournie par ToolJet.
    <img className="screenshot-full img-l" src="/img/user-management/sso/oidc/okta/redirect.png" alt="Okta: SSO" />

5. Créez l'application.

6. Copiez les identifiants client et configurez-les dans ToolJet.
    <img className="screenshot-full img-l" src="/img/user-management/sso/oidc/okta/client-cred.png" alt="Okta: SSO" />

7. Suivez la [documentation des serveurs d'autorisation Okta](https://developer.okta.com/docs/concepts/auth-servers/#org-authorization-server) pour trouver l'URL well known.
