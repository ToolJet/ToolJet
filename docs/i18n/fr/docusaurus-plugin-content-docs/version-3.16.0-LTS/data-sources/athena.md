---
id: athena
title: Athena
---

ToolJet peut se connecter à **Amazon Athena**, un service de requêtes interactif qui facilite l'analyse de données dans Amazon S3 à l'aide du SQL standard.

## Connexion

Pour établir une connexion avec la source de données **Amazon Athena**, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit accéder à la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet et choisir **Amazon Athena** comme source de données.

ToolJet requiert les éléments suivants pour se connecter à votre Athena.

- **Database**
- **S3 output location**
- **Access key**
- **Secret key**
- **Region**

:::info
Vous pouvez également configurer des **[paramètres optionnels supplémentaires](https://github.com/ghdna/athena-express)**.
:::

<img className="screenshot-full img-full" src="/img/datasource-reference/athena/athena-connection-v3.png" alt="Athena connection" />

## Interroger Amazon Athena

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **Amazon Athena** ajoutée à l'étape précédente.
3. Sélectionnez SQL Query dans la liste déroulante et saisissez la requête.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat, ou sur le bouton **Run** pour déclencher la requête.

:::tip
Consultez la [documentation d'Amazon Athena](https://docs.aws.amazon.com/athena/latest/ug/what-is.html) pour plus d'informations.
:::

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/athena/athena-query-v3.png" alt="Athena Query" />

## Exemples de requêtes SQL

### Création d'une table

Cette requête est utilisée pour créer une table externe au sein de la base de données. Les données de cette table sont stockées dans un bucket S3 à l'URL fournie (`s3://athena-express-akiatfa53s-2026/` dans cet exemple).

```sql
CREATE EXTERNAL TABLE student (
    name STRING,
    age INT
)  LOCATION 's3://athena-express-akiatfa53s-2026/';
```

<img className="screenshot-full img-full" src="/img/datasource-reference/athena/athena-create.png" alt="Athena connection" />

### Insertion dans une table

Cette requête tente d'insérer un nouvel enregistrement dans la table *student* d'une base de données.

```sql
INSERT INTO student
VALUES ('Lansing',1)
```

<img className="screenshot-full img-full" src="/img/datasource-reference/athena/athena-insert.png" alt="Athena connection" />

### Opération de sélection

Cette requête récupère tous les enregistrements de la table *student* pour lesquels l'âge de l'étudiant est exactement de 1 an.

```sql
SELECT * from student WHERE AGE=1
```

<img className="screenshot-full img-full" src="/img/datasource-reference/athena/athena-select.png" alt="Athena connection" />

### Liste des tables

Cette requête permet d'afficher la liste de toutes les tables de la base de données actuelle.

```sql
SHOW TABLES
```

<img className="screenshot-full img-full" src="/img/datasource-reference/athena/athena-list.png" alt="Athena connection" />
