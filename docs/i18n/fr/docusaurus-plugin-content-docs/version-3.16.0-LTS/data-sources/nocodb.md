---
id: nocodb
title: NocoDB
---

ToolJet vous permet de vous connecter à NocoDB pour effectuer des actions et récupérer des données.

## Connexion

Pour vous connecter à la source de données NocoDB dans ToolJet, vous pouvez soit cliquer sur le bouton **+ Add new data source** sur le panneau de requêtes, soit naviguer vers la page [Data Source](/docs/data-sources/overview/) sur le tableau de bord ToolJet.

ToolJet vous permet de vous connecter à votre NocoDB par deux méthodes. Il s'agit de **NocoDB Cloud** et **Self Hosted**.

### NocoDB Cloud
Connectez-vous au service géré NocoDB Cloud à l'aide d'un jeton d'API, l'hébergement et l'infrastructure étant entièrement gérés par NocoDB.

<img className="screenshot-full img-full" src="/img/datasource-reference/nocodb/connection.png" alt="NocoDB cloud connection" />

### Self-Hosted NocoDB
Connectez-vous à une instance NocoDB auto-hébergée en fournissant le jeton d'API et l'URL de base de votre déploiement.

<img className="screenshot-full img-full" src="/img/datasource-reference/nocodb/self-hosted-connection.png" alt="NocoDB self hosted connection" />

## Opérations prises en charge

ToolJet prend en charge les opérations suivantes pour NocoDB :

- **[List records](#list-records)**
- **[Get count](#get-count)**
- **[Get record](#get-record)**
- **[Create record](#create-record)**
- **[Update record](#update-record)**
- **[Delete record](#delete-record)**

<img className="screenshot-full img-full" src="/img/datasource-reference/nocodb/listops.png" alt="NocoDB supported operations" />

### List Records

Cette opération récupère une liste des enregistrements présents dans la table spécifiée.

#### Paramètres requis
- Table ID

#### Paramètres optionnels
- Query String

<img className="screenshot-full img-full" src="/img/datasource-reference/nocodb/list-query.png" alt="NocoDB List Records" />

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>

```yaml
Table ID: your-table-id
```

</details>

### Get Count

Cette opération peut être utilisée pour récupérer le nombre d'enregistrements présents dans la table.

#### Paramètres requis
- Table ID

#### Paramètres optionnels
- Query String

<img className="screenshot-full img-full" src="/img/datasource-reference/nocodb/getcount-query.png" alt="NocoDB Get Count" />

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>

```yaml
Table ID: your-table-id
```

</details>

### Get Record

Cette opération peut être utilisée pour récupérer l'enregistrement spécifié par le Table ID et le Row ID.

#### Paramètres requis
- Table ID
- Row ID

#### Paramètres optionnels
- Query String

<img className="screenshot-full img-full" src="/img/datasource-reference/nocodb/getrec-query.png" alt="NocoDB Get Record" />

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>

```yaml
Table ID: your-table-id
Row ID: your-row-id
```

</details>

### Create Record

Cette opération peut être utilisée pour créer de nouveaux enregistrements.

#### Paramètres requis
- Table ID
- Records

<img className="screenshot-full img-full" src="/img/datasource-reference/nocodb/create-query.png" alt="NocoDB Create Record" />

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>

```yaml
Table ID: your-table-id
Records: {title: 'ToolJet'}
```

</details>

### Update Record

Cette opération peut être utilisée pour mettre à jour l'enregistrement.

#### Paramètres requis
- Table ID
- Row ID
- Records

<img className="screenshot-full img-full" src="/img/datasource-reference/nocodb/update-query.png" alt="NocoDB Update Record" />

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>

```yaml
Table ID: your-table-id
Row ID: your-row-id
Records: {title: 'NocoDB'}
```

</details>

### Delete Record

Cette opération peut être utilisée pour supprimer un enregistrement.

#### Paramètres requis
- Table ID
- Row ID

<img className="screenshot-full img-full" src="/img/datasource-reference/nocodb/delete-query.png" alt="NocoDB Delete Record" />

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>

```yaml
Table ID: your-table-id
Row ID: your-row-id
```

</details>
