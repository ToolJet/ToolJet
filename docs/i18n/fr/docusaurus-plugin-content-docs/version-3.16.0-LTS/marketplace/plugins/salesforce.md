---
id: marketplace-plugin-salesforce
title: Salesforce
---

ToolJet se connecte à votre compte Salesforce, vous permettant d'interagir directement avec votre application connectée Salesforce depuis votre application ToolJet.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

- Pour vous connecter à Salesforce, vous devez disposer des identifiants suivants :

  - **Client ID** - La clé consommateur de votre application connectée Salesforce.

  - **Client Secret** - Le secret consommateur de votre application connectée Salesforce.

  <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/marketplace/plugins/salesforce/consumer-creds-sf.png" alt="Paramètres API de l'application connectée Salesforce" />

- Établissez une connexion à Salesforce en cliquant sur `+Add new Data source` dans le panneau des requêtes, ou en accédant à la page [Sources de données](/docs/data-sources/overview/) depuis le tableau de bord ToolJet.

- Sélectionnez la version de l'API dans la liste déroulante, puis saisissez votre Client ID et votre Client Secret dans les champs correspondants.

- Copiez l'**URL de redirection** et collez-la dans le champ **Callback URL** OAuth des paramètres de votre application connectée Salesforce.

- Cliquez sur le bouton **Connect to salesforce** pour authentifier votre compte Salesforce.

- Une fois authentifié, cliquez sur **Save data source** pour enregistrer la source de données.

Vous pouvez activer **Authentication required for all users** dans la configuration. Lorsque cette option est activée, les utilisateurs seront redirigés vers l'écran de consentement OAuth la première fois qu'une requête de cette source de données est déclenchée dans l'application. Cela garantit que chaque utilisateur connecte son propre compte Google Calendar en toute sécurité.

:::note
Une fois le flux OAuth terminé, la requête doit être déclenchée à nouveau pour charger les données.
:::

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/connection-v4.png" alt="Configuration de la source de données Salesforce" />

## Interroger Salesforce

- Pour effectuer des requêtes sur Salesforce dans ToolJet, cliquez sur le bouton **+Add** dans le [gestionnaire de requêtes](/docs/app-builder/connecting-with-data-sources/creating-managing-queries) situé dans le panneau inférieur de l'éditeur.
- Sélectionnez la source de données Salesforce précédemment configurée dans la liste déroulante **Data Source**.
- Dans la liste déroulante Operation, sélectionnez le type d'opération souhaité. ToolJet prend en charge deux types d'opérations pour les interactions avec Salesforce :
  - **[SOQL Query](#soql-query)** - Le SOQL (Salesforce Object Query Language) est utilisé pour rechercher des informations spécifiques dans les données Salesforce de votre organisation.
  - **[CRUD Action](#crud-actions)** - Les actions CRUD (Create, Retrieve/Read, Update, Delete) sont utilisées pour interagir avec les objets Salesforce.

## SOQL Query

- Pour effectuer une requête SOQL, sélectionnez l'opération **SOQL Query** dans la liste déroulante.
- Saisissez la requête SOQL dans le champ **Query**.
- Cliquez sur **Run** pour exécuter la requête.

```sql
SELECT Id, Name
FROM Account
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/soql-query-v4.png" alt="Requête SOQL" />

:::info
Les résultats des requêtes peuvent être transformés à l'aide de transformations. Consultez notre [documentation sur les transformations](/docs/app-builder/custom-code/transform-data).
:::

## CRUD Actions

Pour effectuer des actions CRUD sur Salesforce, sélectionnez l'opération **CRUD Action** dans la liste déroulante. Les actions CRUD suivantes sont prises en charge :

### Create

#### Paramètres requis :

- **Resource Name** - Le nom de l'objet Salesforce que vous souhaitez créer. Par défaut, Account est sélectionné.
- **Resource Body** - Les données que vous souhaitez insérer dans l'objet Salesforce.

```sql
{{ {name : "ToolJet"} }}
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/create-query.png" alt="CRUD - Create" />

### Retrieve(Read)

#### Paramètres requis :

- **Resource Name** - Le nom de l'objet Salesforce que vous souhaitez créer. Par défaut, Account est sélectionné.
- **Resource ID** - L'ID de l'objet Salesforce que vous souhaitez récupérer.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/retrieve-query.png" alt="CRUD - Read" />

### Update

#### Paramètres requis :

- **Resource Name** - Le nom de l'objet Salesforce que vous souhaitez créer. Par défaut, Account est sélectionné.
- **Resource Body** - Les données que vous souhaitez mettre à jour dans l'objet Salesforce. Le resource body doit contenir l'ID de l'objet Salesforce que vous souhaitez mettre à jour.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/update-query.png" alt="CRUD - Update" />

### Delete

#### Paramètres requis :

- **Resource Name** - Le nom de l'objet Salesforce que vous souhaitez créer. Par défaut, Account est sélectionné.
- **Resource ID** - L'ID de l'objet Salesforce que vous souhaitez supprimer.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/delete-query.png" alt="Delete" />
