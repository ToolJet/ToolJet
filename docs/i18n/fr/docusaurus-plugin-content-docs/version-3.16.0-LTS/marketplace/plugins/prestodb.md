---
id: marketplace-plugin-Presto
title: PrestoDB
---

# PrestoDB

ToolJet vous permet de vous connecter à votre base de données PrestoDB pour exécuter des requêtes SQL et récupérer des données.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé la procédure d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour connecter une source de données PrestoDB dans ToolJet, vous pouvez soit cliquer sur le bouton **+Add new data source** dans le panneau de requêtes, soit accéder à la page **[Data Sources](/docs/data-sources/overview)** du tableau de bord ToolJet.

Pour vous connecter à votre base de données PrestoDB, les identifiants suivants sont requis :

- **Username**
- **Password**
- **Catalog**
- **Host**
- **Port**
- **Schema**
- **User**
- **Timezone** (optionnel)
- **Extra Headers** (optionnel)

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/prestodb/connection-v2.png" alt="PrestoDB data source configuration" />
</div>

## Interroger PrestoDB

1. Cliquez sur le bouton **+** dans le gestionnaire de requêtes en bas de l'éditeur, puis sélectionnez la source de données PrestoDB ajoutée précédemment.
2. Écrivez votre requête SQL dans l'éditeur de requêtes.

:::tip
Les résultats des requêtes peuvent être transformés à l'aide de transformations. Reportez-vous à notre documentation sur les transformations pour plus de détails : **[lien](/docs/app-builder/custom-code/transform-data)**
:::

## Opérations prises en charge

ToolJet prend en charge l'exécution de requêtes SQL sur les bases de données PrestoDB.

### Requête SQL

Cette opération vous permet d'exécuter des requêtes SQL sur votre base de données PrestoDB.

#### Paramètre requis :

- **SQL Query** : la requête SQL à exécuter.

#### Exemple 1 :

```sql
SELECT * FROM my_table WHERE column_name = 'value' LIMIT 10
```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/prestodb/query1.png" alt="PrestoDB Query"/>
</div>

<details id="tj-dropdown">
  <summary>**Response Example**</summary>

```json
[
  {
    "id": 1,
    "name": "Alice",
    "column_name": "value",
    "created_at": "2025-02-01 10:00:00"
  },
  {
    "id": 2,
    "name": "Bob",
    "column_name": "value",
    "created_at": "2025-02-01 11:30:00"
  }
]
```
</details>

#### Exemple 2 :

Utilisez cette requête pour grouper et compter les lignes selon une colonne spécifique d'une table (par exemple, compter les enregistrements par statut). Remplacez **your_table_name** et **status_column** par le nom réel de votre table et de votre colonne.

```sql
-- Example: Count rows by status in a PrestoDB table
SELECT status_column,
       COUNT(*) AS total_count
FROM your_table_name
WHERE status_column IS NOT NULL
GROUP BY status_column
ORDER BY total_count DESC
LIMIT 20;
```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/prestodb/query2.png" alt="PrestoDB Query"/>
</div>

<details id="tj-dropdown">
  <summary>**Response Example**</summary>

```json
[
  {
    "status_column": "Completed",
    "total_count": 245
  },
  {
    "status_column": "Pending",
    "total_count": 180
  },
  {
    "status_column": "Failed",
    "total_count": 52
  },
  {
    "status_column": "Cancelled",
    "total_count": 21
  }
]
```
</details>
