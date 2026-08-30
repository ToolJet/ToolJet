---
id: github
title: GitHub
---

Le SSO GitHub dans ToolJet permet une authentification fluide, permettant aux utilisateurs de se connecter avec leurs identifiants GitHub. Cette intégration simplifie la gestion des accès d'équipe, renforce la sécurité et fluidifie les workflows pour les développeurs et collaborateurs.

## Configurer le SSO GitHub

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

3. Sur la droite, vous verrez des boutons bascule permettant d'activer le SSO via différents clients. Tous les boutons bascule des clients sont désactivés par défaut. Activez le bouton bascule devant GitHub.
    <img className="screenshot-full img-l" src="/img/user-management/sso/github/sso-menu.png" alt="Add user button" />

4. Après l'avoir activé, une fenêtre modale apparaîtra avec des champs de saisie pour des paramètres tels que Host name, Client ID et Client secret. En haut à gauche de la fenêtre modale se trouve un bouton bascule permettant d'activer cette configuration. Activez-le, puis, sans saisir aucun paramètre, cliquez sur le bouton Save changes. Cela générera une Redirect URL que vous devrez utiliser dans les paramètres GitHub Developer.
    <img className="screenshot-full img-m" src="/img/user-management/sso/github/github-modal.png" alt="Add user button" />

5. Allez dans **[GitHub Developer Settings](https://github.com/settings/developers)**, naviguez vers **OAuth Apps** et créez une nouvelle OAuth App.
    <img className="screenshot-full img-l" src="/img/user-management/sso/github/oauth-app.png" alt="Add user button" />

6. Saisissez le **App Name**, le **Homepage URL** et le **Authorization callback URL**. Le Authorization callback URL doit être le Redirect URL généré sur la page de gestion du SSO GitHub de ToolJet. Cliquez sur le bouton Register application pour créer l'OAuth App.
    <img className="screenshot-full img-m" src="/img/user-management/sso/github/oauth-config.png" alt="Add user button" />

7. Le **Client ID** sera généré automatiquement. Générez le **Client Secret** en cliquant sur le bouton **Generate a new client secret**.
    <img className="screenshot-full img-m" src="/img/user-management/sso/github/github-clientid.png" alt="Add user button" />

8. Ouvrez les paramètres SSO GitHub de ToolJet et saisissez le **Client ID** et le **Client Secret** obtenus.
    <img className="screenshot-full img-m" src="/img/user-management/sso/github/config-github.png" alt="Add user button" />

9. Si vous utilisez GitHub Enterprise auto-hébergé, saisissez le Host Name. Le host name doit être une URL et ne doit pas se terminer par `/`, par exemple, `https://github.tooljet.com`. Si ce n'est pas auto-hébergé, vous pouvez ignorer ce champ.

10. Enfin, cliquez sur le bouton **Save changes** et le bouton de connexion GitHub sera désormais disponible sur votre écran de connexion ToolJet.

11. Récupérez la Login URL depuis la page de connexion Instance/Workspace.
