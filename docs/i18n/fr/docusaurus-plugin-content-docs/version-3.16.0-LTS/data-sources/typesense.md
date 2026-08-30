---
id: typesense
title: TypeSense
---

ToolJet peut se connecter à votre déploiement TypeSense pour lire et écrire des données.

## Connexion

Pour établir une connexion avec la source de données Typesense, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit naviguer vers la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet et choisir Typesense comme source de données.

:::info
Assurez-vous que le **Host/IP** de la base de données est accessible depuis votre VPC si vous avez auto-hébergé ToolJet. Si vous utilisez ToolJet Cloud, veuillez **mettre en liste blanche** notre IP.
:::

ToolJet nécessite les éléments suivants pour se connecter à un déploiement TypeSense :

- **Host**
- **Port**
- **API Key**
- **Protocol**

<img className="screenshot-full img-full" src="/img/datasource-reference/typesense/connect-v2.png" alt="typesense connect" />

## Interroger TypeSense

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes situé dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **Typesense** ajoutée à l'étape précédente.
3. Sélectionnez l'opération souhaitée dans le menu déroulant et saisissez les paramètres requis.
4. Cliquez sur le bouton **Preview** pour afficher un aperçu du résultat, ou sur le bouton **Run** pour déclencher la requête.

:::tip
Les résultats des requêtes peuvent être transformés à l'aide de transformations. Consultez notre documentation sur les transformations pour voir comment : **[lien](/docs/app-builder/custom-code/transform-data)**
:::

## Opérations prises en charge

<img className="screenshot-full img-full" src="/img/datasource-reference/typesense/listops.png" alt="typesense supported operations" style={{marginBottom:'15px'}}/>

### Create a Collection

Avec cette opération, vous pouvez facilement créer des `Collections` dans votre cluster TypeSense. Dans le champ schema, vous devrez définir le schéma pour créer une nouvelle collection. Consultez la documentation TypeSense pour en savoir plus sur les collections **[ici](https://typesense.org/docs/30.2/api/collections.html#create-a-collection)**

#### Paramètre requis

- **Schema**

<img className="screenshot-full img-full" src="/img/datasource-reference/typesense/create-query.png" alt="typesense collection" style={{marginBottom:'15px'}}/>

#### Exemple

```yaml
[
  { "name": "id", "type": "string" },
  { "name": "name", "type": "string" },
  { "name": "price", "type": "float" },
]
```

### Search

Utilisez cette opération pour effectuer une recherche dans la collection spécifiée. Découvrez-en davantage sur les paramètres de recherche dans la documentation TypeSense **[ici](https://typesense.org/docs/30.2/api/documents.html#search)**.

#### Paramètre requis

- **Collection**

#### Paramètre optionnel

- **Search parameters**

<img className="screenshot-full img-full" src="/img/datasource-reference/typesense/search-query.png" alt="typesense search" style={{marginBottom:'15px'}}/>

```yaml
{ "filter_by": "price:<1000", "sort_by": "price:desc", "per_page": 10 }
```
### Index a Document

Utilisez cette opération pour indexer un document dans votre collection. Vous devrez spécifier le **Collection Name** dans lequel votre document doit être indexé, ainsi que fournir les données du document selon le schéma défini dans la collection. En savoir plus sur l'indexation d'un document dans TypeSense **[ici](https://typesense.org/docs/30.2/api/documents.html#index-a-single-document)**.

#### Paramètres requis

- **Collection**
- **Document**

<img className="screenshot-full img-full" src="/img/datasource-reference/typesense/index-query.png" alt="typesense index" style={{marginBottom:'15px'}}/>

```yaml
{ "id": "1", "name": "Laptop", "price": 999.99 }
```

### Get a Document

Utilisez cette opération pour récupérer un document individuel dans une collection en fournissant l'`id` du document. En savoir plus **[ici](https://typesense.org/docs/30.2/api/documents.html#retrieve-a-document)**.

#### Paramètres requis

- **Collection**
- **Id**

<img className="screenshot-full img-full" src="/img/datasource-reference/typesense/get-query.png" alt="typesense get" style={{marginBottom:'15px'}}/>

### Update a Document

Utilisez cette opération pour mettre à jour un document individuel en fournissant le **Collection Name** et l'**Id** du document. Vous devrez fournir les données du document mis à jour selon le schéma spécifié. Consultez la documentation TypeSense sur la mise à jour d'un document **[ici](https://typesense.org/docs/30.2/api/documents.html#update-a-single-document)**.

#### Paramètres requis

- **Collection**
- **Id**
- **Document**

<img className="screenshot-full img-full" src="/img/datasource-reference/typesense/update-query.png" alt="typesense update" style={{marginBottom:'15px'}}/>

```yaml
{ "name": "Gaming Laptop", "price": 1199.99 }
```

### Delete a Document

Supprimez un document d'une collection en fournissant l'`Id` du document. Consultez la documentation TypeSense sur la suppression de documents **[ici](https://typesense.org/docs/30.2/api/documents.html#delete-documents)**.

#### Paramètres requis

- **Collection**
- **Id**

<img className="screenshot-full img-full" src="/img/datasource-reference/typesense/delete-query.png" alt="typesense delete" style={{marginBottom:'15px'}}/>

<br/><br/>

:::tip
Veillez à fournir des chaînes JSON plutôt que des objets JavaScript pour tout document ou schéma transmis au serveur, dans l'une des opérations ci-dessus.
:::
