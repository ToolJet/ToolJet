---
id: google
title: Google
---

Vous pouvez configurer le SSO Google dans ToolJet à la fois au niveau de l'instance et du workspace pour une authentification fluide et une sécurité renforcée.

## Configurer le SSO Google

Pour activer le Single Sign-on (SSO) GitHub pour votre ToolJet, suivez ces étapes :

Rôle requis : <br/>
&nbsp;&nbsp;&nbsp;&nbsp; Pour le niveau instance : **Super Admin** <br/>
&nbsp;&nbsp;&nbsp;&nbsp; Pour le niveau workspace : **Admin**

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.

2. Pour le niveau instance : <br/>
Allez dans **Settings > Instance login**. <br/> 
    (Exemple d'URL - `https://app.corp.com/instance-settings/instance-login`)

    Pour le niveau workspace : <br/>
    Allez dans **Workspace Settings > Workspace login**. <br/> 
    (Exemple d'URL - `https://app.corp.com/nexus/workspace-settings/workspace-login`)

3. Sur la droite, vous verrez des boutons bascule permettant d'activer le SSO via différents clients. Tous les boutons bascule des clients sont désactivés par défaut. Activez le bouton bascule devant Google.
    <img className="screenshot-full" src="/img/user-management/sso/google/sso-menu.png" alt="Add user button" />

4. Après l'avoir activé, une fenêtre modale apparaîtra avec des champs de saisie pour des paramètres tels que Host name, Client ID et Client secret. En haut à gauche de la fenêtre modale se trouve un bouton bascule permettant d'activer cette configuration. Activez-le, puis, sans saisir aucun paramètre, cliquez sur le bouton Save changes. Cela générera une Redirect URL que vous devrez utiliser dans la Google Cloud Console.
    <img className="screenshot-full img-m" src="/img/user-management/sso/google/google-modal.png" alt="Add user button" />

5. Allez dans **[Google Cloud console](https://console.cloud.google.com/)** et créez un projet.
    <img className="screenshot-full" src="/img/user-management/sso/google/gc-new-project.png" alt="Create New Project"/>

6. Allez sur la **[page des identifiants de la Google Cloud console](https://console.cloud.google.com/apis/credentials)**, et créez un OAuth client ID.
    <img className="screenshot-full" src="/img/user-management/sso/google/create-oauth.png" alt="General Settings: SSO"/>

7. Il vous sera demandé de sélectionner un type d'utilisateur sur l'écran de consentement. Pour n'autoriser que les utilisateurs de votre workspace, sélectionnez 'Internal', sinon,
sélectionnez 'External'.
    <img className="screenshot-full" src="/img/user-management/sso/google/oauth-type.png" alt="General Settings: SSO" width="700"/>

8. Vous serez dirigé vers une page d'enregistrement d'application ; remplissez les informations requises et cliquez sur le bouton **SAVE AND CONTINUE** en bas de page.

9. Sur la deuxième page, vous pouvez définir les OAuth scopes. Sélectionnez **ADD OR REMOVE SCOPES** et ajoutez les scopes **userinfo.email** et **userinfo.profile** comme indiqué dans l'image. Cela permettra à ToolJet de stocker l'email et le nom de l'utilisateur qui se connecte. Cliquez sur **SAVE AND CONTINUE**.
    <img className="screenshot-full" src="/img/user-management/sso/google/scope.png" alt="General Settings: SSO"/>

10. Allez dans l'onglet **Credentials**, cliquez sur **+ CREATE CREDENTIAL** et sélectionnez **OAuth client ID**. Sélectionnez le type d'application et donnez-lui un nom ; sous **Authorised JavaScript origins**, définissez le domaine sur lequel ToolJet est hébergé, et sous **Authorized redirect URIs**, saisissez la Redirect URL qui a été générée dans les paramètres SSO Google de ToolJet.
    <img className="screenshot-full" src="/img/user-management/sso/google/gc-uri.png" alt="General Settings: SSO"/>

11. Cliquez sur **Create** et copiez le **Client ID**.
    <img className="screenshot-full" src="/img/user-management/sso/google/client-id.png" alt="General Settings: SSO"/>

12. Configurez le **Client ID** dans les paramètres SSO Google de ToolJet.
    <img className="screenshot-full img-m" src="/img/user-management/sso/google/tooljet-config.png" alt="General Settings: SSO"/>
