---
id: marketplace-plugin-supabase
title: Supabase
---

ToolJet se connecte à votre base de données Supabase, ce qui vous permet d'interagir directement avec votre back-end Supabase depuis votre application ToolJet.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé la procédure d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

- Pour vous connecter à Supabase, vous devez disposer de la **Project URL** et du **Service Role Secret**. Vous pouvez trouver ces identifiants dans les paramètres API du tableau de bord Supabase. Veillez à copier la clé Service Role Secret. Cette clé a la capacité de contourner la Row Level Security.

  <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/marketplace/plugins/supabase/api_settings.png" alt="Supabase API Settings" />

- Établissez une connexion à Supabase en cliquant sur `+Add new Data source` dans le panneau de requêtes, ou en accédant à la page [Data Sources](/docs/data-sources/overview/) depuis le tableau de bord ToolJet.

- Saisissez votre Project URL et votre Service Role Secret dans les champs correspondants.

- Cliquez sur **Test Connection** pour valider vos identifiants. Cliquez sur **Save** pour enregistrer la source de données.

  <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/marketplace/plugins/supabase/connection.png" alt="Supabase datasource configuration" />

## Interroger Supabase

- Pour effectuer des requêtes sur Supabase dans ToolJet, cliquez sur le bouton **+Add** dans le [gestionnaire de requêtes](/docs/app-builder/connecting-with-data-sources/creating-managing-queries) situé dans le panneau inférieur de l'éditeur.
- Sélectionnez la source de données Supabase précédemment configurée.
- Dans le menu déroulant Operation, sélectionnez le type d'opération souhaité. ToolJet [prend en charge](#supported-operations) actuellement cinq types de requêtes pour les interactions avec Supabase.
- Saisissez le nom de la table et les autres paramètres requis pour l'opération sélectionnée, puis cliquez sur le bouton **Run** pour exécuter la requête.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/supabase/listops.png" alt="Supabase supported operations" />

:::info
Les résultats des requêtes peuvent être transformés à l'aide de transformations. Consultez notre [documentation sur les transformations](/docs/app-builder/custom-code/transform-data).
:::

## Opérations prises en charge {#supported-operations}

Vous pouvez créer une requête pour la source de données Supabase afin d'effectuer plusieurs opérations telles que :

1. **[Get Rows](#get-rows)**
2. **[Create Row(s)](#create-rows)**
3. **[Update Row(s)](#update-rows)**
4. **[Delete Row(s)](#delete-rows)**
5. **[Count Rows](#count-rows)**

### Get Rows

#### Paramètres requis

- **Table** - Nom de la table de la base de données.

#### Paramètres optionnels

- **Where** - Filtrer les lignes selon une condition.
- **Sort** - Trier les lignes selon une colonne.
- **Limit** - Limiter le nombre de lignes retournées.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/supabase/get-rows.png" alt="Get Rows query" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
created: true
```

</details>

### Create Row(s)

#### Paramètres requis

- **Table** - Nom de la table de la base de données.
- **Body** - Données à insérer dans la table. Il doit s'agir d'un tableau d'objet(s).
 
Voici le **Sample Input** ci-dessous :

```javascript
[
  { "content": "Photo post", "likes", 100 },
  { "content": "Reel post", "likes", 300 }
]
```
<img className="screenshot-full img-full" src="/img/marketplace/plugins/supabase/create-rows.png" alt="Create Rows query" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
[
  {
    "id": 1,
    "created_at": "2026-02-23T12:10:17.780412+00:00",
    "likes": 100,
    "content": "Photo post",
  },
  {
    "id": 2,
    "created_at": "2026-02-23T12:12:37.624735+00:00",
    "likes": 300,
    "content": "Reel post",
  },
]
```

</details>

### Update Row(s)

#### Paramètres requis

- **Table** - Nom de la table de la base de données.
- **Columns** - Nom de la colonne et valeur à mettre à jour.

#### Paramètres optionnels

- **Where** - Mettre à jour les lignes selon une condition. Si aucune condition n'est fournie, toutes les lignes seront mises à jour.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/supabase/update-rows.png" alt="Update Rows query" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
[
  {
    "id": 2,
    "created_at": "2026-02-23T12:20:08.623547+00:00",
    "likes": 94,
    "content": "Saved!",
  },
]
```

</details>

### Delete Row(s)

#### Paramètres requis

- **Table** - Nom de la table de la base de données.
- **Where** - Supprimer les lignes selon une condition.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/supabase/delete-rows.png" alt="Delete Rows query" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
deleted: true
```

</details>

### Count Rows

#### Paramètres requis

- **Table** - Nom de la table de la base de données.

#### Paramètres optionnels

- **Where** - Filtrer les lignes selon une condition.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/supabase/count-rows.png" alt="Count Rows query" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
count: 1
```

</details>
