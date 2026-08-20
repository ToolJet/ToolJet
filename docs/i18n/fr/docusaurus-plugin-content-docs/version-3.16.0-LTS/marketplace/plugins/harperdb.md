---
id: marketplace-plugin-harperdb
title: HarperDB
---

HarperDB est une plateforme de base de données et de développement d'applications axée sur la performance et la simplicité d'utilisation. Avec des API définies par l'utilisateur, une interface HTTP/S simple et un data store mono-modèle haute performance qui prend en charge à la fois les workloads NoSQL et SQL, HarperDB évolue avec votre application, de la preuve de concept à la production. ToolJet s'intègre avec HarperDB, offrant une interface simplifiée pour lire et écrire des données.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[Utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Connexion

Pour établir une connexion avec HarperDB, vous avez besoin des identifiants suivants :

1. **Host** : Le nom d'hôte ou l'adresse IP de votre instance HarperDB (par exemple, `162.156.250.74` ou `myinstance.harperdbcloud.com`).
2. **Port** : Le numéro de port configuré pour votre serveur (par défaut `9925`). Si vous utilisez HarperDB Studio (cloud), laissez le champ vide ou définissez-le sur `443`.
3. **SSL** : Indique si la connexion nécessite un chiffrement SSL.
4. **Username** : Votre nom d'utilisateur d'authentification pour l'instance HarperDB.
5. **Password** : Votre mot de passe d'authentification (masqué pour des raisons de sécurité).

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/harperdb/connection.png" alt="HarperDB data source configuration" />

</div>

## Interroger HarperDB

Pour effectuer des queries sur HarperDB, cliquez sur le bouton `+Add` dans le gestionnaire de queries situé dans le panneau inférieur de l'app builder. Sélectionnez HarperDB dans la section Global Datasource de l'éditeur de query.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/harperdb/listops.png" alt="HarperDB supported ops" />

### Mode SQL

Le mode SQL vous permet d'effectuer diverses opérations sur la base de données à l'aide d'instructions SQL.

- **[Select](#select)**
- **[Insert](#insert)**
- **[Update](#update)**
- **[Delete](#delete)**

#### Select

L'instruction SELECT est utilisée pour interroger des données de la base de données.

Syntaxe :

```sql
SELECT * FROM sampleorg.people WHERE id = 1
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/harperdb/select-query.png" alt="Marketplace: HarperDB" />

#### Insert

L'instruction INSERT est utilisée pour ajouter une ou plusieurs lignes à une table de la base de données.

Syntaxe :

```sql
INSERT INTO sampleorg.people (id, name, age, country, hobby) VALUE (10, 'John', 30, 'India', 'Gaming')
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/harperdb/insert-query.png" alt="Marketplace: HarperDB" />

#### Update

L'instruction UPDATE est utilisée pour modifier les valeurs d'attributs spécifiés dans une ou plusieurs lignes d'une table de la base de données.

Syntaxe :

```sql
UPDATE sampleorg.people SET hobby = 'Chess' WHERE id = 10
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/harperdb/update-query.png" alt="Marketplace: HarperDB" />

#### Delete

L'instruction DELETE est utilisée pour supprimer une ou plusieurs lignes de données d'une table de la base de données.

Syntaxe :

```sql
DELETE FROM sampleorg.people WHERE id = 10
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/harperdb/delete-query.png" alt="Marketplace: HarperDB" />

### Mode NoSQL

Le mode NoSQL vous permet d'effectuer un stockage et une récupération sans schéma de documents JSON.

- **[Insert](#insert-nosql)**
- **[Update](#update-nosql)**
- **[Delete](#delete-nosql)**
- **[Search by hash](#search-by-hash)**
- **[Search by value](#search-by-value)**
- **[SeleSearch by conditions](#search-by-conditions)**

#### Insert (NoSQL)

L'opération Insert permet d'ajouter une ou plusieurs lignes de données à une table de la base de données.

| <div style={{ width:"100px"}}> Paramètres </div> | <div style={{ width:"100px"}}> Description </div>           |
| ------------------------------------------------ | ----------------------------------------------------------- |
| Schema (requis)                                | schema où se trouve la table dans laquelle vous insérez des enregistrements |
| Table (requis)                                 | nom de la table dans laquelle vous voulez insérer des enregistrements                 |
| Records (requis)                               | tableau d'un ou plusieurs enregistrements à insérer                     |

**Exemple d'enregistrements :**

```js
[{id: 22, name: "James Scott", age: 26, country:"Italy", hobby: "Football"}]
```

<img style={{ marginBottom:'15px'}} className="screenshot-full img-full" src="/img/marketplace/plugins/harperdb/nosql-insert.png" alt="Marketplace: HarperDB" />

#### Update (NoSQL)

L'opération Update modifie les valeurs d'attributs spécifiés dans une ou plusieurs lignes d'une table de la base de données, en fonction de l'attribut hash (clé primaire) qui identifie les lignes.

| <div style={{ width:"100px"}}> Paramètres </div> | <div style={{ width:"100px"}}> Description </div>          |
| ------------------------------------------------ | ---------------------------------------------------------- |
| Schema (requis)                                | schema où se trouve la table dans laquelle vous mettez à jour des enregistrements |
| Table (requis)                                 | nom de la table dans laquelle vous voulez mettre à jour des enregistrements                |
| Records (requis)                               | tableau d'un ou plusieurs enregistrements à mettre à jour                    |

**Exemple d'enregistrements :**

```js
[{id:12, name:"Jeff Hannistor"}] // Record having 12 as Primary key value will be updated
```

<img style={{  marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/harperdb/nosql-update.png" alt="Marketplace: HarperDB" />

#### Delete (NoSQL)

Supprime une ou plusieurs lignes de données d'une table spécifiée.

| <div style={{ width:"100px"}}> Paramètres </div> | <div style={{ width:"100px"}}> Description </div>                                            |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Schema (requis)                                | schema où se trouve la table dans laquelle vous supprimez des enregistrements                                   |
| Table (requis)                                 | nom de la table dans laquelle vous voulez supprimer des enregistrements                                                  |
| Hash Values (requis)                           | tableau d'une ou plusieurs valeurs d'attribut hash (clé primaire) identifiant les enregistrements à supprimer |

**Exemple de valeurs hash :**

```js
[6, 22]; // Records having 6 and 22 as Primary key value will be deleted
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/harperdb/nosql-delete.png" alt="Marketplace: HarperDB" />

#### Search by hash

Renvoie les données d'une table pour une ou plusieurs valeurs hash.

| <div style={{ width:"100px"}}> Paramètres </div> | <div style={{ width:"100px"}}> Description </div> |
| ------------------------------------------------ | ------------------------------------------------- |
| Schema (requis)                                | schema où se trouve la table à rechercher    |
| Table (requis)                                 | table que vous souhaitez rechercher                          |
| Hash Values (requis)                           | tableau des hash à récupérer                       |
| Table Attributes (requis)                      | définit les attributs que vous souhaitez récupérer.        |

**Exemple de valeurs hash :**

```js
[124, 66]; // Records having 6 and 22 as Primary key value will be retrieved
```

**Exemple d'attributs de table :**

```js
["id", "name", "age", "hobby", "country"]; // Only the provided columns will be retrieved from the table
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/harperdb/search-hash-nosql.png" alt="Marketplace: HarperDB" />

#### Search by value

Renvoie les données d'une table correspondant à une valeur.

| <div style={{ width:"100px"}}> Paramètres </div> | <div style={{ width:"100px"}}> Description </div>  |
| ------------------------------------------------ | -------------------------------------------------- |
| Schema (requis)                                | schema où se trouve la table à rechercher     |
| Table (requis)                                 | table que vous souhaitez rechercher                           |
| Hash Values (requis)                           | tableau des hash à récupérer                        |
| Search Attribute (requis)                      | attribut que vous souhaitez rechercher, peut être n'importe quel attribut  |
| Search Value (requis)                          | valeur que vous souhaitez rechercher - les jokers (wild cards) sont autorisés. |
| Table Attributes (requis)                      | définit les attributs que vous souhaitez récupérer.         |

**Exemple d'attribut de recherche :**

```bash
name
```

**Exemple de valeur de recherche :**

```bash
John Doe
or
Joh* // using wild card
```

**Exemple d'attributs de table :**

```js
["id", "name", "age", "hobby", "country"]; // Only the provided columns will be retrieved from the table
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/harperdb/search-value-nosql.png" alt="Marketplace: HarperDB" />

#### Search by conditions

Renvoie les données d'une table correspondant à une ou plusieurs conditions.

| Paramètre                               | Description |
|-----------------------------------------|-------------|
| **Schema** (requis)                  | Schema où se trouve la table à rechercher. |
| **Table** (requis)                   | Table que vous souhaitez rechercher. |
| **Operator in-between each condition** (optionnel) | L'opérateur utilisé entre chaque condition — `And` ou `Or`. La valeur par défaut est `And`. |
| **Offset** (optionnel)                  | Le nombre d'enregistrements que les résultats de la query vont ignorer. La valeur par défaut est `0`. |
| **Limit** (optionnel)                   | Le nombre d'enregistrements que les résultats de la query vont inclure. La valeur par défaut est `null` (pas de limite). |
| **Table Attributes** (requis)        | Définit les attributs que vous souhaitez récupérer. |
| **Conditions to filter** (requis)    | Tableau d'objets de condition utilisés pour filtrer les résultats. Doit inclure un ou plusieurs objets dans le tableau. <br/><br/> Chaque objet doit inclure : <br/> • **search_attribute** (requis) – Attribut que vous souhaitez rechercher (peut être n'importe quel attribut). <br/> • **search_type** (requis) – Type de recherche : `equals`, `contains`, `starts_with`, `ends_with`, `greater_than`, `greater_than_equal`, `less_than`, `less_than_equal`, `between`. <br/> • **search_value** (requis) – Valeur sensible à la casse à rechercher. Si `search_type` est `between`, utilisez un tableau de deux valeurs. |
**Exemple d'attributs de table :**

```js
["id", "name", "age", "hobby", "country"]; // Only the provided columns will be retrieved from the table
```

**Exemple de conditions de filtrage :**

```js
[
  { search_attribute: "age", search_type: "between", search_value: [20, 28] },
  { search_attribute: "name", search_type: "contains", search_value: "Ray" },
];
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/harperdb/search-conditions-nosql.png" alt="Marketplace: HarperDB" />
