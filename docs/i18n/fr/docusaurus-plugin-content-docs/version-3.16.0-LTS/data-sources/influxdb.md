---
id: influxdb
title: InfluxDB
---

ToolJet peut se connecter à des bases de données InfluxDB pour lire et écrire des données. Utilisez le schéma d'authentification par jeton (Token) pour vous authentifier auprès de l'API InfluxDB. Pour plus d'informations, consultez la [documentation InfluxDB](https://docs.influxdata.com/).

## Connexion

ToolJet se connecte à InfluxDB en utilisant :

- **API Token**
- **Host**
- **Port**
- **Protocol** (HTTP/HTTPS)

:::info
Pour générer un jeton d'API, consultez la [documentation InfluxDB](https://docs.influxdata.com/influxdb/cloud/security/tokens/create-token/).
:::

<img className="screenshot-full img-full" src="/img/datasource-reference/influxdb/influxauth-v3.png" alt="influx auth" />

## Requêtes prises en charge

- **[Écrire des données](#write-data)**
- **[Interroger des données](#query-data)**
- **[Générer un arbre syntaxique abstrait (AST) à partir d'une requête](#generate-an-abstract-syntax-tree-ast-from-a-query)**
- **[Récupérer des suggestions de requête](#retrieve-query-suggestions)**
- **[Récupérer des suggestions de requête pour une suggestion de branchement](#retrieve-query-suggestions-for-a-branching-suggestion)**
- **[Analyser une requête Flux](#analyze-a-flux-query)**
- **[Lister les buckets](#list-buckets)**
- **[Créer un bucket](#create-a-bucket)**
- **[Récupérer un bucket](#retrieve-a-bucket)**
- **[Mettre à jour un bucket](#update-a-bucket)**
- **[Supprimer un bucket](#delete-a-bucket)**

<img className="screenshot-full img-full" src="/img/datasource-reference/influxdb/listops-v4.png" alt="influx operations"/>

### Écrire des données 

Cette opération écrit des données dans un bucket.

#### Paramètres requis :

- **Bucket**
- **Organization name or ID**
- **Data**

#### Paramètres optionnels : 

- **Precision**

<img className="screenshot-full img-full" src="/img/datasource-reference/influxdb/write-query.png" alt="write query operations"/>

#### Exemple

```yaml
temperature, location = office value = 23.5
```

### Interroger des données

Récupère des données depuis les buckets InfluxDB.

#### Paramètres requis :
- **Organization name or ID**
- **Flux query**

<img className="screenshot-full img-full" src="/img/datasource-reference/influxdb/query-data.png" alt="query data operations"/>

#### Exemple

```yaml
from(bucket: "sensor_data") 
|> range(start: -1h) 
|> filter(fn: (r) => r["_measurement"] == "temperature")
```

### Générer un arbre syntaxique abstrait (AST) à partir d'une requête

Cette opération analyse une requête flux et génère une spécification de requête.

#### Paramètres requis : 

- **Query**

<img className="screenshot-full img-full" src="/img/datasource-reference/influxdb/generate-ast-query.png" alt="generate query operations"/>

#### Exemple

```yaml
from(bucket: "website_metrics")
  |> range(start: -7d)
  |> filter(fn: (r) => r["_measurement"] == "page_views")
  |> group(columns: ["url"])
  |> sum(column: "_value")
  |> sort(columns: ["_value"], desc: true)
```

### Récupérer des suggestions de requête 

Cette requête récupère des suggestions de requête.

<img className="screenshot-full img-full" src="/img/datasource-reference/influxdb/retrieve-query.png" alt="retrieve operations"/>

### Récupérer des suggestions de requête pour une suggestion de branchement 

Cette opération récupère des suggestions de requête pour une suggestion de branchement.

#### Paramètres requis :
- **Name**

<img className="screenshot-full img-full" src="/img/datasource-reference/influxdb/retrieve-branching.png" alt="retrieve operations"/>

### Analyser une requête Flux 

Cette opération analyse une requête Flux.

#### Paramètres requis :

- **Query**

<img className="screenshot-full img-full" src="/img/datasource-reference/influxdb/analyze-flux.png" alt="analyze query operations"/>

#### Exemple
```yaml
from(bucket: "sensor_data")
  |> range(start: -1d)
  |> filter(fn: (r) => r["_measurement"] == "humidity")
  |> mean(column: "_value")
```

### Lister les buckets 

Cette opération liste tous les buckets d'une base de données.

<img className="screenshot-full img-full" src="/img/datasource-reference/influxdb/list-bucket.png" alt="list operations"/>

### Créer un bucket 

Cette opération crée un bucket dans la base de données.

#### Paramètres requis :

- **Query**

<img className="screenshot-full img-full" src="/img/datasource-reference/influxdb/create-bucket.png" alt="create operations"/>

#### Exemple
```yaml
POST http://localhost:8086/api/v2/buckets
Content-Type: application/json
Authorization: Token your_auth_token

{
  "name": "new_bucket",
  "orgID": "your_org_id",
  "retentionRules": [
    {
      "everySeconds": 3600
    }
  ]
}
```

### Récupérer un bucket 

Cette opération récupère un bucket dans une base de données.

#### Paramètres requis :
- **Bucket ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/influxdb/retrieve-bucket.png" alt="retrieve operations"/>

### Mettre à jour un bucket

Cette opération met à jour le bucket dans la base de données.

#### Paramètres requis :
- **Bucket ID**
- **Query**

<img className="screenshot-full img-full" src="/img/datasource-reference/influxdb/update-bucket.png" alt="update operations"/>

#### Exemple
```yaml
{
  "name": "updated_bucket_name",
  "retentionRules": [
    {
      "everySeconds": 7200
    }
  ]
}
```

### Supprimer un bucket

Cette opération supprime le bucket dans la base de données.

#### Paramètres requis :
- **Bucket ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/influxdb/delete-bucket.png" alt="delete operations"/>
