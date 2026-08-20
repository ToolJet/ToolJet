---
id: slack
title: Slack
---

ToolJet prend en charge l'intégration avec votre workspace Slack, vous permettant d'automatiser et d'interagir avec Slack directement depuis vos applications. En connectant Slack comme source de données, vous pouvez effectuer des opérations telles que l'envoi de messages vers des canaux, la récupération de l'historique des messages, et bien plus encore.

## Connexion

ToolJet propose deux façons de se connecter à Slack :
- [Custom Slack App](#custom-slack-app) : offre un contrôle total sur les autorisations, les scopes OAuth et la configuration.
- [ToolJet Slack App](#tooljet-slack-app) : offre une configuration rapide où il suffit d'autoriser l'application avec votre workspace Slack, sans avoir à configurer manuellement les scopes OAuth. Cette option n'est disponible que sur ToolJet Cloud.

### Custom Slack App

1. Ajoutez une nouvelle source de données **Slack** dans ToolJet.
2. Sélectionnez **Custom slack app** dans le menu déroulant et copiez l'URL de redirection affichée en bas. <br/>
    <img className="screenshot-full img-full" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/custom-slack-connect.png" alt="Slack datasource: ToolJet"/>
3. Rendez-vous sur le tableau de bord de l'[API Slack](https://api.slack.com/apps) et cliquez sur le bouton **Create New App**. <br/>
    <img className="screenshot-full img-full" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/slack-app.png" alt="Slack datasource: ToolJet"/>
4. Sélectionnez **From scratch** dans la fenêtre modale, saisissez le nom de l'application, et choisissez votre workspace dans le menu déroulant. <br/>
    <img className="screenshot-full img-full" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/slack-api.png" alt="Slack datasource: ToolJet"/>
5. Cliquez sur **Create App**. Vous serez redirigé vers la page App Credentials où vous trouverez le Client ID, le Client Secret et d'autres identifiants. <br/>
    <img className="screenshot-full img-full" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/creds.png" alt="Slack datasource: ToolJet"/>
6. Dans la barre de navigation gauche, allez dans l'onglet **OAuth & Permissions** et ajoutez l'URL de redirection copiée depuis ToolJet dans la section Redirect URLs. Cliquez sur Save URLs. <br/>
    <img className="screenshot-full img-full" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/oauth.png" alt="Slack datasource: ToolJet"/>
7. Dans le même onglet, faites défiler jusqu'à Scopes et ajoutez les scopes OAuth nécessaires, y compris les scopes obligatoires requis par ToolJet (comme indiqué sur la page de configuration de la source de données Slack).
8. Retournez sur la page de configuration de la source de données Slack de ToolJet et saisissez le Client ID et le Client Secret obtenus à l'étape 5.
9. Cliquez sur **Connect to Slack**. Vous serez redirigé vers Slack pour autoriser l'application pour votre workspace. <br/>
    <img className="screenshot-full img-full" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/slack-auth.png" alt="Slack datasource: ToolJet"/>
10. Après autorisation, cliquez sur **Save data source** dans ToolJet. Cela ajoutera un nouveau bot Slack à votre workspace.
11. Vous pouvez également personnaliser le profil du bot (icône, nom, description, etc.) depuis la page de l'API Slack.

Après une configuration réussie, un nouveau bot apparaîtra dans votre workspace Slack. Vous pouvez ajouter ce bot à différents canaux pour effectuer des opérations depuis ToolJet.

<img className="screenshot-full img-full" src="/img/datasource-reference/slack/slack.png" alt="Slack datasource: ToolJet"/>

### ToolJet Slack App

Vous pouvez utiliser l'application ToolJet Slack App pour configurer et tester rapidement l'intégration Slack. Cette option n'est disponible que sur ToolJet Cloud.

1. Ajoutez une nouvelle source de données Slack dans ToolJet.
2. Sélectionnez **ToolJet Slack App** dans le menu déroulant et copiez l'URI de redirection affichée en bas.
    <img className="screenshot-full img-full" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/tooljet-slack-connect.png" alt="Slack datasource: ToolJet"/>
3. Cliquez sur **Connect to Slack**.
4. Vous serez redirigé vers Slack pour autoriser l'application, et l'URL de redirection sera ajoutée automatiquement.
5. Après autorisation, cliquez sur **Save data source** dans ToolJet. Cela ajoutera un nouveau bot Slack à votre workspace.

## Interroger Slack

1. Créez une nouvelle requête depuis le panneau de requête en bas.
2. Sélectionnez la source de données **Slack**.
3. Sélectionnez l'opération souhaitée.
4. Cliquez sur le bouton **Preview** pour afficher un aperçu du résultat, ou sur le bouton **Run** pour créer et déclencher la requête.
<img className="screenshot-full img-full" src="/img/datasource-reference/slack/listops-v3.png" alt="Slack datasource: ToolJet"/>

## Opérations prises en charge

### List Members

Cette opération renvoie la liste et les données de tous les membres de votre workspace Slack.

<img className="screenshot-full img-full" src="/img/datasource-reference/slack/list-mem-v4.png" alt="Slack datasource: ToolJet"/>

### Send Message

Cette opération envoie/publie le message vers un canal spécifié ou l'envoie en messages directs (également appelés DM ou IM) dans votre workspace Slack.

#### Paramètres requis
- Channel
- Message

<img className="screenshot-full img-full" src="/img/datasource-reference/slack/send-msg-v4.png" alt="Slack datasource: ToolJet"/>

### List Messages

Cette opération récupère les messages d'un canal spécifié.

#### Paramètres requis
- Channel

#### Paramètres optionnels
- Limit
- Next Cursor

<img className="screenshot-full img-full" src="/img/datasource-reference/slack/list-mems-lim-v4.png" alt="Slack datasource: ToolJet"/>
