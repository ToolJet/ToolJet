---
id: twilio
title: Twilio
---

ToolJet peut se connecter à un compte Twilio pour envoyer des SMS.

## Connexion

Pour établir une connexion avec la source de données Twilio, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requêtes, soit accéder à la page **[Data Sources](/docs/data-sources/overview)** depuis le dashboard de ToolJet et choisir Twilio comme source de données.

ToolJet a besoin des éléments suivants pour se connecter à Twilio :
- **Auth Token**
- **Account SID**
- **Messaging Service SID**

<img className="screenshot-full img-full" src="/img/datasource-reference/twilio/connect-v2.png" alt="ToolJet - Data source - Twilio"  />

Vous pouvez trouver l'**Auth Token et l'Account SID** sur le dashboard de votre compte Twilio.

<img className="screenshot-full img-full" src="/img/datasource-reference/twilio/dashboard-twilio.png" alt="ToolJet - Data source - Twilio"  />

Pour le **Messaging Service SID**, vous devrez d'abord créer un service de messagerie depuis Services, sous Messaging, dans la barre latérale gauche.

<img className="screenshot-full img-full" src="/img/datasource-reference/twilio/dashboard-services.png" alt="ToolJet - Data source - Twilio"  />

## Interroger Twilio

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes, situé dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **Twilio** ajoutée à l'étape précédente.
3. Sélectionnez **Send SMS** dans la liste déroulante et saisissez les paramètres requis.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat ou sur le bouton **Run** pour déclencher la requête.

## Opérations prises en charge

### Send message

Cette opération envoie le message spécifié au numéro de téléphone mobile spécifié.

#### Paramètres requis
- **To Number**
- **Body**

<img className="screenshot-full img-full" src="/img/datasource-reference/twilio/querying-v3.png" alt="ToolJet - Data source - Twilio" />
