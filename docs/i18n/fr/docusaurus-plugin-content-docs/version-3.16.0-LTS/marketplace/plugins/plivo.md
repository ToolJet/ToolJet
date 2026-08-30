---
id: marketplace-plugin-plivo
title: Plivo
---

Vous pouvez intégrer votre application ToolJet avec Plivo pour la fonctionnalité SMS.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé la procédure d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour utiliser le plugin Plivo, vous avez besoin des identifiants suivants :

- **Auth Token**
- **Auth ID**

:::info Génération de l'Auth Token/ID

- Accédez à la Plivo Console (https://www.plivo.com/)
- Dans la console, vous verrez votre auth ID et votre auth token listés sous la section « API ».
- Si vous ne voyez pas votre auth ID et votre auth token, vous pouvez en générer de nouveaux en cliquant sur le bouton "Generate New Auth ID/Token".
  :::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full img-full" src="/img/marketplace/plugins/plivo/connection-v3.png" alt="Configuring Plivo In ToolJet" />

</div>

## Requêtes prises en charge

### Envoyer un SMS

Vous pouvez utiliser l'opération Send SMS pour envoyer un SMS à un numéro de mobile spécifié.

#### Paramètres requis :

- **To Number**
- **From Number**
- **Body**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full img-full" src="/img/marketplace/plugins/plivo/query-v3.png" alt="Send SMS Using plivo" />

</div>
