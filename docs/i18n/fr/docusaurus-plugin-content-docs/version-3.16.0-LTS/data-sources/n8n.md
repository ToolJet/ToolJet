---
id: n8n
title: n8n
---

ToolJet peut déclencher des workflows n8n à l'aide d'URL de webhook. Consultez [cette page](https://docs.n8n.io/) pour en savoir plus sur n8n.

## Connexion

Pour établir une connexion avec la source de données n8n, cliquez sur le bouton **+ Add new Data source** situé sur le panneau de requêtes, ou accédez à la page [Data Sources](/docs/data-sources/overview) depuis le dashboard de ToolJet.

Les webhooks dans n8n peuvent être configurés pour fonctionner avec ou sans **authentification**. Si aucune authentification n'est requise, sélectionnez `None` comme **Authentication type**. Pour les webhooks nécessitant une authentification, choisissez la méthode appropriée dans la liste déroulante et fournissez les identifiants correspondants.

### Types d'authentification
- **Basic Auth** : pour connecter vos webhooks n8n à l'aide de l'authentification basique, vous devrez fournir les identifiants suivants :
    - **Username**
    - **Password**

<img className="screenshot-full img-full" src="/img/datasource-reference/n8n/basicauth.png" alt="n8n basicauth connection"  />

- **Header Auth** : pour connecter vos webhooks n8n à l'aide de l'authentification par en-tête, les champs suivants sont requis :
    - **Name / Key**
    - **Value**

<img className="screenshot-full img-full" src="/img/datasource-reference/n8n/headerauth.png" alt="n8n headerauth connection"  />

:::tip
Les identifiants du webhook et les identifiants de l'instance sont différents. Veuillez utiliser les identifiants que vous utilisez avec le déclencheur webhook. En savoir plus : **[Webhook Authentication](https://docs.n8n.io/nodes/n8n-nodes-base.webhook/#:~:text=then%20gets%20deactivated.-,Authentication,-%3A%20The%20Webhook%20node)**.
:::

## Déclencher un workflow

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes, dans le panneau inférieur de l'éditeur.
2. Sélectionnez la base de données ajoutée à l'étape précédente comme source de données. 

Une fois la source de données n8n ajoutée, vous pouvez déclencher un workflow avec une URL `GET/POST`. 

### Méthode GET

Choisissez la méthode GET dans la liste déroulante.

#### Paramètre facultatif :
  - **URL parameters** 

<img className="screenshot-full img-full" src="/img/datasource-reference/n8n/get-query.png" alt="n8n query"  />

### Méthode POST

Choisissez la méthode POST dans la liste déroulante.

#### Paramètre requis :
  - **Body**

#### Paramètre facultatif :
  - **URL parameters** 

<img className="screenshot-full img-full" src="/img/datasource-reference/n8n/post-query.png" alt="n8n query" />
