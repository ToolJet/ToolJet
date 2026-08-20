---
id: marketplace-plugin-pocketbase
title: PocketBase
---

ToolJet se connecte à votre base de données PocketBase, vous permettant d'interagir directement avec votre backend PocketBase depuis votre application ToolJet.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé la procédure d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion {#connection}

- Pour vous connecter à PocketBase, vous avez besoin de l'**Host URL**, de l'**Email** et du **Password**. L'Host URL est l'URL de votre instance PocketBase. L'email et le mot de passe sont les identifiants de l'utilisateur ayant accès à l'instance PocketBase.

- Établissez une connexion à PocketBase en cliquant sur `+Add new Data source` dans le panneau de requêtes, ou en accédant à la page [Data Sources](/docs/data-sources/overview/) depuis le tableau de bord ToolJet.

- Saisissez votre Host URL, votre email et votre mot de passe dans les champs correspondants.

- Cliquez sur **Test Connection** pour valider vos identifiants. Cliquez sur **Save** pour enregistrer la source de données.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/pocketbase/connection.png" alt="PocketBase datasource configuration" />

## Interroger PocketBase {#querying-pocketbase}

- Pour effectuer des requêtes sur PocketBase dans ToolJet, cliquez sur le bouton **+Add** dans le [gestionnaire de requêtes](/docs/app-builder/connecting-with-data-sources/creating-managing-queries) situé dans le panneau inférieur de l'éditeur.
- Sélectionnez la source de données PocketBase configurée précédemment.
- Dans le menu déroulant Operation, sélectionnez le type d'opération souhaité. ToolJet [prend actuellement en charge](#supported-operations) cinq types de requêtes pour les interactions avec PocketBase.
- Saisissez le nom de la collection et les autres paramètres requis pour l'opération sélectionnée, puis cliquez sur le bouton **Run** pour exécuter la requête.
  <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/marketplace/plugins/pocketbase/listops.png" alt="PocketBase supported operations" />

:::info
Les résultats des requêtes peuvent être transformés à l'aide de transformations. Consultez notre [documentation sur les transformations](/docs/app-builder/custom-code/transform-data).
:::

## Opérations prises en charge {#supported-operations}

Vous pouvez créer une requête pour la source de données PocketBase afin d'effectuer plusieurs opérations, telles que :

1. **[Lister les enregistrements](#list-records)**
2. **[Obtenir un enregistrement](#get-record)**
3. **[Ajouter un enregistrement à une collection](#add-record-to-collection)**
4. **[Mettre à jour un enregistrement dans une collection](#update-record-to-collection)**
5. **[Supprimer un enregistrement](#delete-record)**

### Lister les enregistrements {#list-records}

#### Paramètres requis {#required-parameters}

- **Collection Name** - nom de la collection dans la base de données.

#### Paramètres optionnels {#optional-parameters}

- **Limit** - nombre d'enregistrements à récupérer.
- **Sort** - trie les enregistrements selon une règle de tri. Ajoutez `-` / `+` (par défaut) devant l'attribut pour un ordre DESC / ASC.
- **Where** - filtre les enregistrements selon des conditions de filtre.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/pocketbase/listrec-query.png" alt="List Records" />

### Obtenir un enregistrement {#get-record}

#### Paramètres requis {#required-parameters-1}

- **Collection Name** - nom de la collection dans la base de données.
- **Record ID** - ID de l'enregistrement à récupérer.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/pocketbase/getrec-query.png" alt="Get Record" />

### Ajouter un enregistrement à une collection {#add-record-to-collection}

#### Paramètres requis {#required-parameters-2}

- **Collection Name** - nom de la collection dans la base de données.
- **Body** - données à ajouter à la collection. Elles doivent être dans un format JSON valide.

```javascript
{
  "email": "emma.brown@example.com",
  "name": "Emma Brown",
  "emailVisibility": true,
  "password": "12345678",
  "passwordConfirm": "12345678"
}
```
<img className="screenshot-full img-full" src="/img/marketplace/plugins/pocketbase/addrec-query.png" alt="Add a Record" />

### Mettre à jour un enregistrement dans une collection {#update-record-to-collection}

#### Paramètres requis {#required-parameters-3}

- **Collection Name** - nom de la collection dans la base de données.
- **Record ID** - ID de l'enregistrement à mettre à jour.
- **Body** - données à mettre à jour dans la collection. Elles doivent être dans un format JSON valide.

 <img className="screenshot-full img-full" src="/img/marketplace/plugins/pocketbase/updaterec-query.png" alt="Update Record" />

### Supprimer un enregistrement {#delete-record}

#### Paramètres requis : {#required-parameters-4}

- **Collection Name** - nom de la collection dans la base de données.
- **Record ID** - ID de l'enregistrement à supprimer.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/pocketbase/deleterec-query.png" alt="Delete Record" />
