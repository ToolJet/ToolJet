---
id: dynamodb
title: DynamoDB
---

**DynamoDB** est un service de base de données non relationnelle géré, fourni par Amazon. ToolJet a la capacité de se connecter à DynamoDB pour lire et écrire des données.

## Connexion

Pour établir une connexion avec la source de données **DynamoDB**, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit accéder à la page **[Data sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet.

ToolJet prend en charge la connexion à DynamoDB via trois méthodes : **IAM Credentials**, **AWS Instance Credentials**, ou **AWS ARN Role**.

Lorsque vous utilisez **IAM Credentials**, vous devrez fournir les informations suivantes :

- **Region**
- **Access key**
- **Secret key**

Il est recommandé de créer un utilisateur IAM dédié pour la base de données afin d'avoir un contrôle précis sur les niveaux d'accès de ToolJet.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/iam-v3.png" alt="dynamo - IAM creds" />

Pour vous connecter à DynamoDB à l'aide des AWS Instance Credentials, sélectionnez l'option **Use AWS Instance Credentials**. Cela utilisera le rôle IAM attaché à l'instance EC2 sur laquelle ToolJet s'exécute. Le paramètre WebIdentityToken obtenu suite à une connexion réussie avec un fournisseur d'identité est utilisé pour accéder au service de métadonnées d'un conteneur ECS et de l'instance EC2.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/awsinstance-v3.png" alt="dynamo - AWS instance creds" />

Si vous préférez utiliser un **AWS ARN Role**, vous devrez fournir les détails suivants :

- **Region**
- **Role ARN**

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/arn-v3.png" alt="dynamo - AWS ARN role" />

## Interroger DynamoDB

Pour effectuer des requêtes sur **DynamoDB**, cliquez sur le bouton **+ Add** du gestionnaire de requêtes situé dans le panneau inférieur de l'éditeur. Sélectionnez la base de données précédemment ajoutée comme source de données pour la requête. Choisissez l'opération souhaitée et cliquez sur le bouton **Run** pour exécuter la requête.

<img style={{marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/list-ops-v4.png" alt="list query operations" />

:::tip
Vous pouvez appliquer des transformations aux résultats de la requête. Consultez notre documentation sur les transformations pour plus d'informations : [lien](/docs/app-builder/custom-code/transform-data)
:::

#### Opérations prises en charge

- **[List Tables](#list-tables)**
- **[Get Item](#get-item)**
- **[Query Table](#query-table)**
- **[Scan Table](#scan-table)**
- **[Delete Item](#delete-item)**
- **[Update Item](#update-item)**
- **[Describe Table](#describe-table)**
- **[Create Table](#create-table)**
- **[Put Item](#put-item)**

### List Tables

Retourne un tableau des noms de tables associés au compte et au endpoint actuels. Le résultat de **List Tables** est paginé, chaque page retournant un maximum de 100 noms de tables.

<img className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/list-v4.png" alt="List tables-DynamoDB" />

### Get Item

Récupère un seul élément d'une table. Vous devez spécifier la clé primaire de l'élément souhaité. Vous pouvez récupérer l'élément entier, ou seulement un sous-ensemble de ses attributs.

#### Paramètres requis

- **Table**
- **Key**

#### Paramètre optionnel

- **Expression attribute values**

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/get-v4.png" alt="Get items-DynamoDB" />

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{
  "USER_ID": 1,
  "USER_TIMESTAMP": 1709768400
}
```
</details>

### Query Table

Récupère tous les éléments possédant une clé de partition spécifique. Vous devez spécifier la valeur de la clé de partition. Vous pouvez récupérer des éléments entiers, ou seulement un sous-ensemble de leurs attributs. Vous pouvez éventuellement appliquer une condition sur les valeurs de la clé de tri afin de ne récupérer qu'un sous-ensemble des données partageant la même clé de partition. Vous pouvez utiliser cette opération sur une table, à condition que celle-ci possède à la fois une clé de partition et une clé de tri. Vous pouvez également l'utiliser sur un index, à condition que celui-ci possède à la fois une clé de partition et une clé de tri.

#### Paramètres requis

- **Table**
- **Query condition**

#### Paramètre optionnel

- **Expression attribute values**

<img style={{marginBottom:'15px'}} className="screenshot-full img-full"  src="/img/datasource-reference/dynamodb/query-v4.png" alt="Query table-DynamoDB" />

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{
  "KeyConditionExpression": "USER_ID = :id",
  "ExpressionAttributeValues": {
    ":id": 2
  }
}
```
</details>

### Scan Table

Récupère tous les éléments de la table ou de l'index spécifié. Vous pouvez récupérer des éléments entiers, ou seulement un sous-ensemble de leurs attributs. Vous pouvez éventuellement appliquer une condition de filtrage afin de ne retourner que les valeurs qui vous intéressent et d'écarter le reste.

#### Paramètres requis

- **Table**
- **Scan condition**

#### Paramètre optionnel

- **Expression attribute values**

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/scan-v4.png" alt="Scan table-DynamoDB" />

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{
  "FilterExpression": "USER_ID = :id",
  "ExpressionAttributeValues": {
    ":id": 1
  }
}
```
</details>

### Delete Item

Supprime un seul élément d'une table. Vous devez spécifier la clé primaire de l'élément à supprimer.

#### Paramètres requis

- **Table**
- **Key**

#### Paramètre optionnel

- **Expression attribute values**

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/delete-item-v4.png" alt="Delete item-DynamoDB" />

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{
  "USER_ID": 1,
  "USER_TIMESTAMP": 1709768400
}
```
</details>

### Update Item

Met à jour un élément dans DynamoDB en spécifiant la clé primaire et en fournissant de nouvelles valeurs d'attributs. Si la clé primaire n'existe pas dans la table, alors, au lieu d'être mise à jour, une nouvelle ligne sera insérée.

#### Paramètres requis

- **Table**
- **Update condition**

#### Paramètre optionnel

- **Expression attribute values**

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/update-v4.png" alt="Update item-DynamoDB" />

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{
  "Key": {
    "USER_ID": 1,
    "USER_TIMESTAMP": 1709768400
  },
  "UpdateExpression": "SET USER_NAME = :name, USER_FEE = :fee",
  "ExpressionAttributeValues": {
    ":name": "JOHN",
    ":fee": 2000
  }
}
```
</details>

### Describe Table

Cette opération dans DynamoDB récupère les métadonnées et les détails de configuration d'une table spécifique. Elle fournit des informations telles que le nom de la table, le schéma de la clé primaire, les paramètres de débit provisionné, et les éventuels index secondaires définis sur la table.

#### Paramètre requis

- **Table**

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/describe-v4.png" alt="Describe table-DynamoDB" />

### Create Table

Cette opération dans DynamoDB vous permet de créer une nouvelle table en spécifiant son nom, le schéma de sa clé primaire, et des configurations optionnelles.

#### Paramètre requis

- **Table parameters**

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/create-v4.png" alt="Create table-DynamoDB" />

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{
  "AttributeDefinitions":
    [
      { "AttributeName": "USER_ID" },
      { "AttributeName": "USER_FEE" },
    ],
  "KeySchema": [{ "AttributeName": "USER_ID", "KeyType": "HASH" }],
  "LocalSecondaryIndexes":
    [
      {
        "IndexName": "USER_FEE",
        "KeySchema":
          [
            { "AttributeName": "USER_ID", "KeyType": "HASH" },
            { "AttributeName": "USER_FEE", "KeyType": "RANGE" },
          ],
        "Projection": { "ProjectionType": "KEYS_ONLY" },
      },
    ],
  "ProvisionedThroughput": { "ReadCapacityUnits": 1, "WriteCapacityUnits": 1 },
  "TableName": "USER_FEE_LOCAL",
  "StreamSpecification": { "StreamEnabled": false },
}
```
</details>

### Put Item

Cette opération vous permet de créer ou de remplacer un élément dans une table. Elle vous permet de spécifier le nom de la table, de fournir les valeurs d'attributs du nouvel élément, et de définir les attributs de clé primaire permettant d'identifier l'élément de façon unique.

#### Paramètres requis

- **Table**
- **New item details**

#### Paramètre optionnel

- **Expression attribute values**

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/put-v4.png" alt="Put item-DynamoDB" />

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{
  "Item": {
    "USER_ID": 2,
    "USER_TIMESTAMP": 1710768400,
    "USER_FEE": 1153.86,
    "USER_NAME": "JOHN",
    "USER_AGE": 32
  }
}
```
</details>
