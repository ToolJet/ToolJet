---
id: google
title: Google (OIDC)
---

Google peut être configuré comme fournisseur d'identité pour OIDC, un protocole d'authentification qui vérifie de manière sécurisée l'identité des utilisateurs via un fournisseur de confiance. Ce document explique comment obtenir les identifiants requis depuis la console Google. Consultez le guide **[Configuration OIDC](/docs/user-management/sso/oidc/setup)** pour configurer OIDC dans votre application.

## Générer un ID client et un secret client sur GCC

1. Rendez-vous sur la **[console Google Cloud](https://console.cloud.google.com/)** et créez un projet.
    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/google/gc-new-project.png" alt="Create New Project"/>

2. Rendez-vous sur la **[page des identifiants de la console Google Cloud](https://console.cloud.google.com/apis/credentials)**, puis créez un ID client OAuth.
    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/google/create-oauth.png" alt="General Settings: SSO"/>

3. Il vous sera demandé de sélectionner le type d'utilisateur sur l'écran de consentement. Pour n'autoriser que les utilisateurs de votre organisation, sélectionnez « Internal », sinon,
sélectionnez « External ».
    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/google/oauth-type.png" alt="General Settings: SSO" />

4. Vous serez dirigé vers une page d'enregistrement de l'application ; renseignez les informations requises et cliquez sur le bouton **SAVE AND CONTINUE** en bas de page.

5. Sur la deuxième page, vous pouvez définir les scopes OAuth. Sélectionnez **ADD OR REMOVE SCOPES** et ajoutez les scopes **userinfo.email** et **userinfo.profile** comme illustré sur l'image. Cela permettra à ToolJet de stocker l'adresse e-mail et le nom de l'utilisateur qui se connecte. Cliquez sur **SAVE AND CONTINUE**.
    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/google/scope.png" alt="General Settings: SSO"/>

6. Rendez-vous dans l'onglet **Credentials**, cliquez sur **+ CREATE CREDENTIAL** et sélectionnez **OAuth client ID**. Sélectionnez le type d'application et donnez-lui un nom ; sous **Authorised JavaScript origins**, indiquez le domaine sur lequel ToolJet est hébergé, et sous **Authorized redirect URIs**, saisissez l'URL de redirection générée dans les paramètres SSO Google de ToolJet.
    <img style={{ marginBottom:'15px' }}  className="screenshot-full" src="/img/user-management/sso/google/gc-uri.png" alt="General Settings: SSO"/>

7. Cliquez sur **Create** et copiez le **Client ID** et le **Client secret**.
    <img style={{ marginBottom:'15px' }}  className="screenshot-full" src="/img/user-management/sso/google/client-id.png" alt="General Settings: SSO"/>

8. Utilisez `https://accounts.google.com/.well-known/openid-configuration` comme **Well Known URL**.
