---
id: notion
title: Notion
---

ToolJet peut se connecter à un espace de travail Notion pour effectuer des opérations sur les pages, les bases de données, les utilisateurs et les blocs Notion.

## Connexion

Pour établir une connexion avec la source de données Notion, cliquez sur le bouton **+ Add new Data source** situé sur le panneau de requêtes ou naviguez vers la page [Data Sources](/docs/data-sources/overview) depuis le tableau de bord ToolJet.

Pour intégrer Notion à ToolJet, nous aurons besoin du jeton d'API. Le jeton d'API peut être généré depuis les paramètres de votre espace de travail Notion. Consultez la documentation officielle de Notion pour [créer une intégration interne avec l'API Notion](https://www.notion.so/help/create-integrations-with-the-notion-api).

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/api.png" alt="notion api data source connection" />

## Interroger Notion

L'API Notion offre la prise en charge de :

- **[Database](#querying-notion-database)**
- **[Page](#querying-notion-page)**
- **[Block](#querying-notion-blocks)**
- **[User](#querying-notion-user)**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/listops-querying.png" alt="notion querying"/>

:::info
Le **Database ID**, le **View ID** et le **Page ID** peuvent être trouvés à partir de l'URL de l'espace de travail Notion.

Par exemple :

URL : `https://www.notion.so/workspace/XXX?v=YYY&p=ZZZ`

Ici :
- `XXX` est le **Database ID**
- `YYY` est le **View ID**
- `ZZZ` est le **Page ID**

:::

:::tip

Avant d'interroger Notion, vous devez partager la base de données avec votre intégration. Cliquez sur le bouton de partage dans votre vue de base de données, trouvez le nom de votre intégration et sélectionnez-le.

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/share.png" alt="notion share"/>

:::

## Interroger une base de données Notion

Sur la ressource base de données, vous pouvez effectuer les opérations suivantes :

- **[Retrieve a database](#retrieve-a-database)**
- **[Query a database](#query-a-database)**
- **[Create a database](#create-a-database)**
- **[Update a database](#update-a-database)**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/listops-db.png" alt="notion db"/>

### Retrieve a Database

Cette opération récupère un objet Database à l'aide de l'ID spécifié.

#### Paramètres requis :

- **Database ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/retrieve-db.png" alt="notion db retrieve"/>

### Query a Database

Cette opération récupère une liste de **Pages** contenues dans la base de données, filtrées et ordonnées selon les conditions de filtre et les critères de tri fournis dans la requête.

#### Paramètres requis :

- **Database ID**

#### Paramètres optionnels :

- **Filter**
- **Sort**
- **Limit**
- **Start Cursor**

<img className="screenshot-full img-l" src="/img/datasource-reference/notion/query-db.png" alt="notion db query"/>

### Create a Database

Cette opération crée une base de données en tant que sous-page dans la page parente spécifiée, avec les propriétés indiquées.

#### Paramètres requis :

- **Page ID**
- **Properties**

#### Paramètres optionnels :

- **Title**
- **Icon type**
- **Icon value**
- **Cover type**
- **Cover value**

<img className="screenshot-full img-l" src="/img/datasource-reference/notion/create-db.png" alt="notion db create"/>

#### Exemple :
##### Title
```yaml
[
    {
      "type": "text",
      "text": {
        "content": "Project Tasks Database",
        "link": null
      }
    }
]
```

##### Properties
```yaml
{
    "Task Name": {
      "title": {}
    },
    "Due Date": {
      "date": {}
    },
    "Completed": {
      "checkbox": {}
    }
}
```

### Update a Database

Cette opération met à jour une base de données existante selon les paramètres spécifiés.

#### Paramètres requis :

- **Database ID**

#### Paramètres optionnels :

- **Title**
- **Properties**
- **Icon type**
- **Icon value**
- **Cover type**
- **Cover value**

<img className="screenshot-full img-l" src="/img/datasource-reference/notion/update-db.png" alt="notion db update"/>

#### Exemple :
##### Title
```yaml
[
    {
      "type": "text",
      "text": {
        "content": "Updated Tasks Database"
      }
    }
]
```

##### Properties
```yaml
{
    "Priority": {
      "select": {
        "options": [
          { "name": "High", "color": "red" },
          { "name": "Medium", "color": "yellow" },
          { "name": "Low", "color": "green" }
        ]
      }
    },
    "Assigned To": {
      "people": {}
    }
}
```

## Interroger une page Notion

Sur la ressource page, vous pouvez effectuer les opérations suivantes :

- **[Retrieve a page](#retrieve-a-page)**
- **[Create a page](#create-a-page)**
- **[Update a page](#update-a-page)**
- **[Retrieve a page property](#retrieve-a-page-property-item)**
- **[Archive a page](#archive-delete-a-page)**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/listops-page.png" alt="notion page"/>

### Retrieve a Page

Cette opération récupère un objet **Page** à l'aide de l'ID spécifié.

#### Paramètres requis :

- **Page ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/retrieve-page.png" alt="notion page retrieve"/>

### Create a Page

Cette opération crée une nouvelle page dans la base de données spécifiée ou en tant qu'enfant d'une page existante. Si le parent est une base de données, les valeurs de propriété de la nouvelle page dans le paramètre properties doivent respecter le schéma de propriétés de la base de données parente. Si le parent est une page, la seule propriété valide est le titre.

#### Paramètres requis :

- **Parent Type**
- **Page/Database ID**
- **Properties**

#### Paramètres optionnels :
- **Children (Blocks)**
- **Icon type**
- **Icon value**
- **Cover type**
- **Cover value**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/create-page.png" alt="notion page create"/>

#### Exemple :
```yaml
{
    "Title": {
      "title": [
        {
          "type": "text",
          "text": {
            "content": "New Page Title"
          }
        }
      ]
    }
}
```

### Update a Page

Cette opération met à jour les valeurs de propriété de la page spécifiée. Les propriétés qui ne sont pas définies via le paramètre properties resteront inchangées.

#### Paramètres requis :

- **Page ID**
- **Properties**

#### Paramètres optionnels

- **Icon type**
- **Icon value**
- **Cover type**
- **Cover value**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/update-page.png" alt="notion page update"/>

#### Exemple :
```yaml
{
    "Title": {
      "title": [
        {
          "type": "text",
          "text": {
            "content": "Updated Page Title"
          }
        }
      ]
    },
    "Status": {
      "select": {
        "name": "In Progress"
      }
    }
}
```

### Retrieve a Page Property Item

Cette opération récupère un objet property_item pour un Page ID et un Property ID donnés. Selon le type de propriété, l'objet renvoyé sera soit une valeur, soit une liste paginée de valeurs de property item. Consultez Property item objects pour plus de détails.

#### Paramètre requis :

- **Page ID**

#### Paramètres optionnels :

- **Property ID**
- **Limit**
- **Start cursor**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/retrieve-page-prop.png" alt="notion page retrieve page property"/>

### Archive (delete) a Page

Cette opération archive ou désarchive la page spécifiée à l'aide du Page ID.

#### Paramètres requis :

- **Page ID**
- **Archive**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/archive-page.png" alt="notion page retrieve page property" />

## Interroger les blocs Notion

Les opérations suivantes peuvent être effectuées sur la ressource block :

- **[Retrieve a block](#retrieve-a-block)**
- **[Append block children](#append-new-block-children)**
- **[Retrieve block children](#retrieve-block-children)**
- **[Update a block](#update-a-block)**
- **[Delete a block](#delete-a-block)**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/listops-block.png" alt="notion block" />

:::info
Pour obtenir l'ID d'un bloc, cliquez simplement sur l'icône de menu du bloc puis sur « Copy link ». Collez ensuite le lien dans le navigateur ; il devrait ressembler à ceci : `https://www.notion.so/Creating-Page-Sample-ee18b8779ae54f358b09221d6665ee15#7fcb3940a1264aadb2ad4ee9ffe11b0e`, la chaîne après **#** est l'ID du bloc, c'est-à-dire `7fcb3940a1264aadb2ad4ee9ffe11b0e`.
:::

### Retrieve a Block

Cette opération récupère un objet **Block** à l'aide de l'ID spécifié.

#### Paramètres requis :

- **Block ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/retrieve-block.png" alt="notion block retrieve"/>

### Append New Block Children

Cette opération crée et ajoute de nouveaux blocs enfants au block_id parent spécifié.

#### Paramètres requis :

- **Block ID**
- **Children**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/append-block.png" alt="notion block append"/>

### Retrieve Block Children

Cette opération récupère un tableau paginé des objets bloc enfants contenus dans le bloc à l'aide de l'ID spécifié.

#### Paramètres requis :

- **Block ID**

#### Paramètres optionnels :

- **Limit**
- **Start cursor**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/retrieve-child-block.png" alt="notion block append"/>

### Update a Block

Cette opération met à jour le contenu du block_id spécifié selon le type de bloc.

#### Paramètres requis :

- **Block ID**

#### Paramètres optionnels :

- **Properties**
- **Archive**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/update-block.png" alt="notion block update"/>

#### Exemple
```yaml
{
    "Title": {
      "title": [
        {
          "type": "text",
          "text": {
            "content": "Updated Page Title"
          }
        }
      ]
    },
    "Status": {
      "select": {
        "name": "In Progress"
      }
    }
}
```

### Delete a Block

#### Paramètres requis :

- **Block ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/delete-block.png" alt="notion block delete" />

## Interroger les utilisateurs Notion

Les opérations suivantes peuvent être effectuées sur la ressource utilisateur Notion :

- **[Retrieve a user from current workspace](#retrieve-a-user-from-current-workspace)**
- **[Retrieve list of users of a workspace](#retrieve-list-of-users-of-a-workspace)**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/listops-user.png" alt="notion user"/>

### Retrieve a User From Current Workspace

Cette opération récupère un utilisateur à l'aide de l'ID spécifié.

#### Paramètres requis :

- **User ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/retrieve-user.png" alt="notion user retrieve a user"/>

### Retrieve List of Users of a Workspace

Cette opération renvoie une liste paginée des utilisateurs de l'espace de travail.

#### Paramètres optionnels :

- **Limit**
- **Start cursor**

<img className="screenshot-full img-full" src="/img/datasource-reference/notion/listall-users.png" alt="notion user list all user" />

[En savoir plus sur l'API Notion](https://developers.notion.com/reference/intro)
