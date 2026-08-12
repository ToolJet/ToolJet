---
id: clickhouse
title: ClickHouse
---

ToolJet peut se connecter à ClickHouse pour lire et écrire des données.

:::info
ToolJet utilise ce client [NodeJS](https://github.com/TimonKK/clickhouse) pour ClickHouse.
:::

## Connexion

Pour établir une connexion avec la source de données Clickhouse, vous pouvez soit cliquer sur le bouton **+ Add new data source** situé sur le panneau de requête, soit accéder à la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet.

ToolJet requiert les éléments suivants pour se connecter à votre base de données ClickHouse :

- **Username**
- **Password**
- **Host**
- **Port**
- **Database Name**
- **Protocol**

<img className="screenshot-full img-full" src="/img/datasource-reference/clickhouse/connection-v3.png" alt="ClickHouse connection" />

## Interroger ClickHouse

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **ClickHouse** ajoutée à l'étape précédente.
3. Sélectionnez l'opération que vous souhaitez effectuer et saisissez la requête.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat, ou sur le bouton **Run** pour créer et déclencher la requête.

:::info
Pour plus de détails sur ClickHouse, consultez la [documentation de ClickHouse](https://clickhouse.com/docs/en/quick-start).
:::

## Opérations prises en charge

- **[SQL Query](#sql-query)**
- **[Insert array of objects](#insert-array-of-objects)**

### SQL Query

Utilisez cette opération pour saisir des **[instructions SQL ClickHouse](https://clickhouse.com/docs/en/sql-reference/statements/)**. Ces instructions représentent les différents types d'actions que vous pouvez effectuer à l'aide de requêtes SQL.

#### Exemples de requêtes SQL

#### SELECT :

```sql
SELECT * from test array;
```

<img className="screenshot-full img-full" src="/img/datasource-reference/clickhouse/clickhouse-selectq.png" alt="ClickHouse SQL Statement operation" style={{marginBottom:'15px'}}/>

#### CREATE : 

```sql
CREATE TABLE test array3 (
	date Date,
	str String,
	arr Array(String),
	arr2 Array (Date)
	arr3 Array(UInt32) ,
	id1 UUID
)ENGINE=MergeTree () ORDER BY(str)
```

<img className="screenshot-full img-full" src="/img/datasource-reference/clickhouse/clickhouse-createq.png" alt="ClickHouse SQL Statement operation" style={{marginBottom:'15px'}}/>

#### ALTER TABLE (ajout d'une colonne)

```sql
ALTER TABLE test array1 ADD COLUMN Added2 UInt32;
```

<img className="screenshot-full img-full" src="/img/datasource-reference/clickhouse/clickhouse-alterq.png" alt="ClickHouse SQL Statement operation" style={{marginBottom:'15px'}} />

#### SELECT AVEC CLAUSE WHERE
```sql
SELECT * FROM test array1 WHERE str='Somethingl...'
```

<img className="screenshot-full img-full" src="/img/datasource-reference/clickhouse/clickhouse-selectwclauseq.png" alt="ClickHouse SQL Statement operation" style={{marginBottom:'15px'}} />

#### UPDATE
```sql
ALTER TABLE test_array1 UPDATE arr = (12] WHERE str='Somethingl...'
```

<img className="screenshot-full img-full" src="/img/datasource-reference/clickhouse/clickhouse-updateq.png" alt="ClickHouse SQL Statement operation" style={{marginBottom:'15px'}} />

#### DELETE
```sql
ALTER TABLE test_array1 DELETE WHERE str= 'Somethingl...'
```

<img className="screenshot-full img-full" src="/img/datasource-reference/clickhouse/clickhouse-deleteq.png" alt="ClickHouse SQL Statement operation" style={{marginBottom:'15px'}} />

#### INSERTION NORMALE

##### Étape 1 - Création de la table

```sql
CREATE TABLE test array4 (
	name String,
	date Date
)ENGINE=MergeTree () ORDER BY (name)
```

<img className="screenshot-full img-full" src="/img/datasource-reference/clickhouse/clickhouse-normalInsertq.png" alt="ClickHouse SQL Statement operation" />

#### Étape 2 - Insertion

```sql
INSERT INTO test_array4 (*) VALUES ('juvane', '1996-01-13')
```

<img className="screenshot-full img-full" src="/img/datasource-reference/clickhouse/clickhouse-insertq.png" alt="ClickHouse SQL Statement operation" />


**Définir une clé primaire**

```sql
CREATE TABLE db.table_name
(
	name1 type1, name2 type2, ...,
	PRIMARY KEY(expr1[, expr2,...])]
)
ENGINE = engine;

OR
 	
CREATE TABLE db.table_name
(
	name1 type1, name2 type2, ...,
)
ENGINE = engine
PRIMARY KEY(expr1[, expr2,...]);
```

### Insert Array of Objects

Utilisez cette opération pour insérer un tableau d'objets.

#### Paramètres requis :
- **Body**
- **Table name**
- **Fields**

**Exemple de valeur pour Body :**
```javascript
[
  { "id": 1, "name": "Alice", "age": 25 },
  { "id": 2, "name": "Bob", "age": 30 },
  { "id": 3, "name": "Charlie", "age": 28 }
]
```

<img className="screenshot-full img-full" src="/img/datasource-reference/clickhouse/clickhouse-arrayobjq.png" alt="ClickHouse Insert array of objects operation" />
