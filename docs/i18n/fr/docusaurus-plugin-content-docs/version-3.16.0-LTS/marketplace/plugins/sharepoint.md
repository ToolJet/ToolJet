---
id: marketplace-plugin-sharepoint
title: Sharepoint
---

ToolJet vous permet de vous connecter à Microsoft Sharepoint pour effectuer diverses opérations comme la gestion des sites, des listes et des éléments via l'API Microsoft Graph.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour vous connecter à une source de données Sharepoint dans ToolJet, vous pouvez soit cliquer sur le bouton **+ Add new data source** dans le panneau des requêtes, soit accéder à la page **[Sources de données](/docs/data-sources/overview)** du tableau de bord ToolJet.

:::info
Vous devrez enregistrer votre application dans Azure Active Directory pour obtenir les identifiants requis. L'application a besoin des permissions API Microsoft Graph appropriées.
:::

Pour vous connecter à Sharepoint, vous avez besoin des identifiants suivants :

- **Client ID**
- **Client Secret**
- **Tenant ID**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/connect.png" alt="Connexion à la source de données Sharepoint" />

## Interroger Sharepoint

1. Cliquez sur le bouton **+ Add** dans le gestionnaire de requêtes en bas de l'éditeur et sélectionnez la source de données Sharepoint ajoutée précédemment.
2. Choisissez l'opération que vous souhaitez effectuer sur votre instance Sharepoint.

:::tip
Les résultats des requêtes peuvent être transformés à l'aide de transformations. Consultez notre documentation sur les transformations pour plus de détails : **[lien](/docs/app-builder/custom-code/transform-data)**
:::

## Opérations prises en charge

ToolJet prend en charge les opérations Sharepoint suivantes :

- **[Get All Sites](#get-all-sites)**
- **[Get Site](#get-site)**
- **[Get Analytics](#get-analytics)**
- **[Get Pages Of a Site](#get-pages-of-a-site)**
- **[Get All Lists](#get-all-lists)**
- **[Get Metadata Of a List](#get-metadata-of-a-list)**
- **[Create a List](#create-a-list)**
- **[Get Items Of a List](#get-items-of-a-list)**
- **[Update Item Of a List](#update-item-of-a-list)**
- **[Delete Item Of a List](#delete-item-of-a-list)**
- **[Add Item To a List](#add-item-to-a-list)**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/listops.png" alt="Opérations prises en charge par Sharepoint" />

### Get All Sites

Cette opération récupère tous les sites Sharepoint disponibles. Pour plus de détails, consultez la documentation de l'API Microsoft Graph **[ici](https://learn.microsoft.com/en-us/graph/api/site-search)**.

#### Paramètres optionnels

- **Top** : Le nombre de sites à récupérer.
- **Page** : Le numéro de page à récupérer.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/getall-sites.png" alt="Get All Sites" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites",
  "value": [
    {
      "createdDateTime": "2026-03-02T10:45:02Z",
      "id": "tooljetxxxx.sharepoint.com,bcxxxx-4b3a-xxxxxx-dfe229c34311,2a4ac5da-xxx-xxxx-b047-18dece61fb95",
      "lastModifiedDateTime": "2026-03-02T10:46:15Z",
      "name": "appcatalog",
      "webUrl": "https://tooljetxxxx.sharepoint.com/sites/appcatalog",
      "displayName": "Apps",
      "root": {},
      "siteCollection": {
        "hostname": "tooljetxxxx.sharepoint.com"
      }
    }
  ]
}
```
</details>

### Get Site

Cette opération récupère les informations d'un site spécifique.

#### Paramètre requis

- **Site ID** : L'ID du site à récupérer.

#### Exemple :

```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
```

<img style={{ marginTop: '15px', marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/get-site-query.png" alt="Get Site" />


<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites/$entity",
  "createdDateTime": "2026-03-02T10:50:09Z",
  "description": "Internal DIA Guidelines",
  "id": "tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb",
  "lastModifiedDateTime": "2026-03-02T10:52:23Z",
  "name": "NewStyle",
  "webUrl": "https://tooljetxxxx.sharepoint.com/sites/NewStyle",
  "displayName": "NewStyle",
  "root": {},
  "siteCollection": {
    "hostname": "tooljetxxxx.sharepoint.com"
  }
}
```
</details>

### Get Analytics

Cette opération récupère les statistiques d'analyse d'un site spécifique.

#### Paramètres requis

- **Site ID** : L'ID du site.
- **Time Interval** : La durée entre chaque synchronisation ou requête d'interrogation automatique.
  - Last 7 Days
  - All Time

#### Exemple :

```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
Time Interval: Last 7 Days
```

<img style={{ marginTop: '15px', marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/get-analytics-query.png" alt="Get Analytics" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#microsoft.graph.itemActivityStat",
  "aggregationInterval": "None",
  "startDateTime": "2026-03-02T10:55:30Z",
  "endDateTime": "2026-03-02T10:55:40Z",
  "isTrending": false,
  "access": {
    "actionCount": 0,
    "actorCount": 0,
    "timeSpentInSeconds": 0
  },
  "incompleteData": {
    "wasThrottled": false,
    "resultsPending": false,
    "notSupported": false
  }
}
```
</details>

### Get Pages Of a Site

Cette opération récupère toutes les pages d'un site spécifique.

#### Paramètre requis

- **Site ID** : L'ID du site.

#### Paramètres optionnels

- **Top** : Le nombre de sites à récupérer.
- **Page** : Le numéro de page à récupérer.

#### Exemple :

```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
```

<img style={{ marginTop: '15px', marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/getpages-site.png" alt="Get Pages" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/pages",
  "@odata.nextLink": "https://graph.microsoft.com/v1.0/sites/tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb/pages?$top=1&$skiptoken=UGFnZWQ9VFJVRSZwX0ZpbGVMZWFmUmVmPUV2ZW50UGxhbkhvbWUuYXNweCZwX0lEPTc",
  "value": [
    {
      "@odata.type": "#microsoft.graph.sitePage",
      "@odata.etag": ""{2095ED1D-AC76-4480-BBDC-8D63EBAAE2AF},6"",
      "createdDateTime": "2026-03-02T11:04:33Z",
      "eTag": ""{2095ED1D-AC76-4480-BBDC-8D63EBAAE2AF},6"",
      "id": "2095ed1d-ac76-4480-bbdc-8d63ebaae2af",
      "lastModifiedDateTime": "2026-03-02T11:04:36Z",
      "name": "EventPlanHome.aspx",
      "webUrl": "https://tooljetxxxx.sharepoint.com/sites/NewStyle/SitePages/EventPlanHome.aspx",
      "title": "Home",
      "pageLayout": "home",
      "thumbnailWebUrl": "https://tooljetxxxx.sharepoint.com/_layouts/15/getpreview.ashx?guidSite=887cb371-e930-4e5b-a726-8d5769e6b946&guidWeb=6d653d09-1613-4663-99ab-1bb72ff6ceeb&guidFile=bb423735-7402-47df-ab2e-729bddfe6f23",
      "promotionKind": "page",
      "showComments": false,
      "showRecommendedPages": false,
      "contentType": {
        "id": "0x0101009D1CB255DA76424F860D91F20E6C4118004CC245E37669F3438CDDEB01FCEAE890",
        "name": "Site Page"
      },
      "createdBy": {
        "user": {
          "displayName": "Oliver Smith",
          "email": "oliver@tooljetxxxx.onmicrosoft.com"
        }
      },
      "lastModifiedBy": {
        "user": {
          "displayName": "Oliver Smith",
          "email": "oliver@tooljetxxxx.onmicrosoft.com"
        }
      },
      "parentReference": {
        "siteId": "887cb371-e930-4e5b-a726-8d5769e6b946"
      },
      "publishingState": {
        "level": "published",
        "versionId": "1.0"
      },
      "reactions": {}
    }
  ]
}
```
</details>

### Get All Lists

Cette opération récupère toutes les listes d'un site spécifique.

#### Paramètre requis

- **Site ID** : L'ID du site.

#### Paramètre optionnel

- **Page** : Le numéro de page à récupérer.

#### Exemple :

```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
Page: 1
```

<img style={{ marginTop: '15px', marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/getall-lists.png" alt="Get All Lists" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists",
  "value": [
    {
      "@odata.etag": ""1a64ae23-9cb6-4521-b489-61d558dde9f7,11"",
      "createdDateTime": "2026-03-02T11:08:27Z",
      "description": "",
      "eTag": ""1a64ae23-9cb6-4521-b489-61d558dde9f7,11"",
      "id": "1a64ae23-9cb6-4521-b489-61d558dde9f7",
      "lastModifiedDateTime": "2026-03-02T11:08:29Z",
      "name": "Test_table_query",
      "webUrl": "https://tooljetxxxx.sharepoint.com/sites/NewStyle/Lists/Test_table_query",
      "displayName": "test_table_query",
      "createdBy": {
        "user": {
          "email": "oliver@tooljetxxxx.onmicrosoft.com",
          "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
          "displayName": "Oliver Smith"
        }
      },
      "lastModifiedBy": {
        "user": {
          "email": "oliver@tooljetxxxx.onmicrosoft.com",
          "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
          "displayName": "Oliver Smith"
        }
      },
      "parentReference": {
        "siteId": "tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb"
      },
      "list": {
        "contentTypesEnabled": false,
        "hidden": false,
        "template": "genericList"
      }
    }
  ]
}
```
</details>

### Get Metadata Of a List

Cette opération récupère les métadonnées d'une liste spécifique.

#### Paramètres requis

- **Site ID** : L'ID du site.
- **List Name** : Le nom de la liste, utilisé uniquement si List ID n'est pas fourni.
- **List ID** : L'ID de la liste, requis si List Name n'est pas fourni.

#### Exemple :

```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
List ID: 22f69173-0c1d-4c76-a721-5a31f0bd5af3
```

<img style={{ marginTop: '15px', marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/get-metadata-list.png" alt="Get List Metadata" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists/$entity",
  "@odata.etag": ""1a64ae23-9cb6-4521-b489-61d558dde9f7,11"",
  "createdDateTime": "2026-03-02T11:11:10Z",
  "description": "",
  "eTag": ""1a64ae23-9cb6-4521-b489-61d558dde9f7,11"",
  "id": "1a64ae23-9cb6-4521-b489-61d558dde9f7",
  "lastModifiedDateTime": "2026-03-02T11:27:04Z",
  "name": "test_table_query",
  "webUrl": "https://tooljetxxxx.sharepoint.com/sites/NewStyle/Lists/Test_table_query",
  "displayName": "test_table_query",
  "createdBy": {
    "user": {
      "email": "oliver@tooljetxxxx.onmicrosoft.com",
      "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
      "displayName": "Oliver Smith"
    }
  },
  "lastModifiedBy": {
    "user": {
      "email": "oliver@tooljetxxxx.onmicrosoft.com",
      "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
      "displayName": "Oliver Smith"
    }
  },
  "parentReference": {
    "siteId": "tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb"
  },
  "list": {
    "contentTypesEnabled": false,
    "hidden": false,
    "template": "genericList"
  },
  "columns@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists('1a64ae23-9cb6-4521-b489-61d558dde9f7')/columns",
  "columns": [
    {
      "columnGroup": "Custom Columns",
      "description": "",
      "displayName": "USER_NAME",
      "enforceUniqueValues": false,
      "hidden": false,
      "id": "fa564e0f-0c70-4ab9-b863-0177e6ddd247",
      "indexed": false,
      "name": "Title",
      "readOnly": false,
      "required": false,
      "text": {
        "allowMultipleLines": false,
        "appendChangesToExistingText": false,
        "linesForEditing": 0,
        "maxLength": 255
      }
    }
  ],
  "items@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists('1a64ae23-9cb6-4521-b489-61d558dde9f7')/items",
  "items": [
    {
      "@odata.etag": ""12b493eb-2452-451b-84e5-ecba8ec898c8,1"",
      "createdDateTime": "2024-10-24T11:11:11Z",
      "eTag": ""12b493eb-2452-451b-84e5-ecba8ec898c8,1"",
      "id": "1",
      "lastModifiedDateTime": "2026-03-02T11:28:11Z",
      "webUrl": "https://tooljetxxxx.sharepoint.com/sites/NewStyle/Lists/Test_table_query/1_.000",
      "createdBy": {
        "user": {
          "email": "oliver@tooljetxxxx.onmicrosoft.com",
          "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
          "displayName": "Oliver Smith"
        }
      },
      "lastModifiedBy": {
        "user": {
          "email": "oliver@tooljetxxxx.onmicrosoft.com",
          "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
          "displayName": "Oliver Smith"
        }
      },
      "parentReference": {
        "id": "036d657d-ed69-4dcc-a669-483ce9788655",
        "siteId": "tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb"
      },
      "contentType": {
        "id": "0x0100A3D887BE30452F4A9CBA7E684C523E2100098058C6B440D14786561D28914A3EDB",
        "name": "Item"
      },
      "fields@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists('1a64ae23-9cb6-4521-b489-61d558dde9f7')/items('1')/fields/$entity",
      "fields": {
        "@odata.etag": ""12b493eb-2452-451b-84e5-ecba8ec898c8,1"",
        "Title": "Null_test",
        "id": "1",
        "AuthorLookupId": "7",
        "EditorLookupId": "7",
        "_UIVersionString": "1.0",
        "Attachments": false,
        "Edit": "",
        "LinkTitleNoMenu": "Null_test",
        "LinkTitle": "Null_test",
        "ItemChildCount": "0",
        "FolderChildCount": "0",
        "_ComplianceFlags": "",
        "_ComplianceTag": "",
        "_ComplianceTagWrittenTime": "",
        "_ComplianceTagUserId": ""
      }
    }
  ]
}
```
</details>

### Create a List

Cette opération crée une nouvelle liste dans un site Sharepoint.

#### Paramètres requis

- **Site ID** : L'ID du site.
- **Body** : La configuration de la liste au format JSON.

#### Exemple :

```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
Body:
{
  "displayName": "Project Tasks",
  "columns": [
    {
      "name": "TaskName",
      "text": { }
    },
    {
      "name": "DueDate",
      "dateTime": { }
    },
    {
      "name": "Priority",
      "choice": {
        "choices": ["High", "Medium", "Low"]
      }
    }
  ],
  "list": {
    "template": "genericList"
  }
}
```

<img style={{ marginTop: '15px', marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/create-list-query.png" alt="Create List" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists/$entity",
  "@odata.etag": "f7497bc1-a8e6-49d0-a11c-05b3df1d8d2b,10",
  "createdDateTime": "2026-03-02T11:32:31Z",
  "description": "",
  "eTag": "f7497bc1-a8e6-49d0-a11c-05b3df1d8d2b,10",
  "id": "f7497bc1-a8e6-49d0-a11c-05b3df1d8d2b",
  "lastModifiedDateTime": "2026-03-02T11:32:21Z",
  "name": "Project Tasks",
  "webUrl": "https://tooljetxxxx.sharepoint.com/sites/NewStyle/Lists/Project%20Tasks",
  "displayName": "Project Tasks",
  "createdBy": {
    "user": {
      "displayName": "Oliver Smith",
      "email": "oliver@tooljetxxxx.onmicrosoft.com"
    }
  },
  "parentReference": {
    "siteId": "tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb"
  },
  "list": {
    "contentTypesEnabled": false,
    "hidden": false,
    "template": "genericList"
  }
}
```
</details>

### Get Items Of a List

Cette opération récupère les éléments d'une liste spécifique.

#### Paramètres requis

- **Site ID** : L'ID du site.
- **List ID** : L'ID de la liste.

#### Paramètres optionnels

- **Top** : Le nombre de sites à récupérer.
- **Page** : Le numéro de page à récupérer.

#### Exemple :

```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
List ID: 22f69173-0c1d-4c76-a721-5a31f0bd5af3
Top: 1
Page: 4
```

<img style={{ marginTop: '15px', marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/getitems-list.png" alt="Get List Items" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists('1a64ae23-9cb6-4521-b489-61d558dde9f7')/items(fields())",
  "@odata.nextLink": "https://graph.microsoft.com/v1.0/sites/tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb/lists/1a64ae23-9cb6-4521-b489-61d558dde9f7/items?$expand=fields&$top=1&$skiptoken=UGFnZWQ9VFJVRSZwX0lEPTE",
  "value": [
    {
      "@odata.etag": ""12b493eb-2452-451b-84e5-ecba8ec898c8,1"",
      "createdDateTime": "2026-03-02T11:39:51Z",
      "eTag": ""12b493eb-2452-451b-84e5-ecba8ec898c8,1"",
      "id": "1",
      "lastModifiedDateTime": "2026-03-02T11:40:11Z",
      "webUrl": "https://tooljetxxxx.sharepoint.com/sites/NewStyle/Lists/Test_table_query/1_.000",
      "createdBy": {
        "user": {
          "email": "oliver@tooljetxxxx.onmicrosoft.com",
          "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
          "displayName": "Oliver Smith"
        }
      },
      "lastModifiedBy": {
        "user": {
          "email": "oliver@tooljetxxxx.onmicrosoft.com",
          "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
          "displayName": "Oliver Smith"
        }
      },
      "parentReference": {
        "id": "036d657d-ed69-4dcc-a669-483ce9788655",
        "siteId": "tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb"
      },
      "contentType": {
        "id": "0x0100A3D887BE30452F4A9CBA7E684C523E2100098058C6B440D14786561D28914A3EDB",
        "name": "Item"
      },
      "fields@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists('1a64ae23-9cb6-4521-b489-61d558dde9f7')/items('1')/fields/$entity",
      "fields": {
        "@odata.etag": ""12b493eb-2452-451b-84e5-ecba8ec898c8,1"",
        "Title": "Null_test",
        "field_2": 10,
        "field_3": 123.32,
        "field_4": 1,
        "id": "1",
        "ContentType": "Item",
        "Modified": "2026-03-02T11:42:39Z",
        "Created": "2026-03-02T11:42:29Z",
        "AuthorLookupId": "7",
        "EditorLookupId": "7",
        "_UIVersionString": "1.0",
        "Attachments": false,
        "Edit": "",
        "LinkTitleNoMenu": "Null_test",
        "LinkTitle": "Null_test",
        "ItemChildCount": "0",
        "FolderChildCount": "0",
        "_ComplianceFlags": "",
        "_ComplianceTag": "",
        "_ComplianceTagWrittenTime": "",
        "_ComplianceTagUserId": ""
      }
    }
  ]
}
```
</details>

### Update Item Of a List

Cette opération met à jour un élément existant dans une liste.

#### Paramètres requis

- **Site ID** : L'ID du site.
- **List ID** : L'ID de la liste.
- **Item ID** : L'ID de l'élément à mettre à jour.
- **Body** : Les valeurs mises à jour au format JSON.

#### Exemple :

```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
List ID: 1a64ae23-9cb6-4521-b489-61d558dde9f7
Item ID: 001
Body:
{
  "TaskName": "Update Documentations",
  "Priority": "High",
  "DueDate": "2026-03-10T00:00:00Z"
}
```

<img style={{ marginTop: '15px', marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/update-item-query.png" alt="Update Item" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```json
{
  "id": "001"
  Update Successful
}
```
</details>

### Delete Item Of a List

Cette opération supprime un élément d'une liste.

#### Paramètres requis

- **Site ID** : L'ID du site.
- **List ID** : L'ID de la liste.
- **Item ID** : L'ID de l'élément à supprimer.

#### Exemple :

```yaml
Site ID: tooljetxxxx.sharepoint.com,da60e844-ba1d-49bc-b4d4-d5e36bae9019
List ID: 22f69173-0c1d-4c76-a721-5a31f0bd5af3
Item ID: 001
```

<img style={{ marginTop: '15px', marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/delete-item-query.png" alt="Delete Item" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```json
{
  "code": 204,
  "status": "No Content",
  "message": "Item having id '001' in List '1a64ae23-9cb6-4521-b489-61d558dde9f7' has been deleted."
}
```
</details>

### Add Item To a List

Cette opération ajoute un nouvel élément à une liste.

#### Paramètres requis

- **Site ID** : L'ID du site.
- **List ID** : L'ID de la liste.
- **Body** : Les données du nouvel élément au format JSON.

#### Exemple :

```yaml
Site ID: tooljetxxxx.sharepoint.com,da60e844-ba1d-49bc-b4d4-d5e36bae9019
List ID: 22f69173-0c1d-4c76-a721-5a31f0bd5af3
Body:
{
  "id" : "003",
  "fields": {
    "Title": "Prepare Presentation"
  }
}
```

<img style={{ marginTop: '15px', marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/add-item-query.png" alt="Add Item" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists('1a64ae23-9cb6-4521-b489-61d558dde9f7')/items/$entity",
  "@odata.etag": ""95d95442-f155-45be-ae85-ef9acf1d35f9,1"",
  "createdDateTime": "2026-03-02T11:52:12Z",
  "eTag": ""95d95442-f155-45be-ae85-ef9acf1d35f9,1"",
  "id": "69",
  "lastModifiedDateTime": "2026-03-02T11:52:28Z",
  "webUrl": "https://tooljetxxxx.sharepoint.com/sites/NewStyle/Lists/Test_table_query/69_.000",
  "createdBy": {
    "user": {
      "email": "oliver@tooljetxxxx.onmicrosoft.com",
      "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
      "displayName": "Oliver Smith"
    }
  },
  "lastModifiedBy": {
    "application": {
      "id": "0dc94ee2-9788-443c-8e67-ce714f0fe579",
      "displayName": "Microsoft Graph"
    },
    "user": {
      "email": "oliver@tooljetxxxx.onmicrosoft.com",
      "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
      "displayName": "Oliver Smith"
    }
  },
  "parentReference": {
    "id": "036d657d-ed69-4dcc-a669-483ce9788655",
    "siteId": "tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb"
  },
  "contentType": {
    "id": "0x0100A3D887BE30452F4A9CBA7E684C523E2100098058C6B440D14786561D28914A3EDB",
    "name": "Item"
  },
  "fields@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists('1a64ae23-9cb6-4521-b489-61d558dde9f7')/items('69')/fields/$entity",
  "fields": {
    "@odata.etag": ""95d95442-f155-45be-ae85-ef9acf1d35f9,1"",
    "Title": "Prepare Presentation",
    "id": "69",
    "ContentType": "Item",
    "Modified": "2026-03-02T11:53:45Z",
    "Created": "2026-03-02T11:53:45Z",
    "AuthorLookupId": "7",
    "EditorLookupId": "7",
    "_UIVersionString": "1.0",
    "Attachments": false,
    "Edit": "",
    "LinkTitleNoMenu": "Prepare Presentation",
    "LinkTitle": "Prepare Presentation",
    "ItemChildCount": "0",
    "FolderChildCount": "0",
    "_ComplianceFlags": "",
    "_ComplianceTag": "",
    "_ComplianceTagWrittenTime": "",
    "_ComplianceTagUserId": "",
    "AppAuthorLookupId": "3",
    "AppEditorLookupId": "3"
  }
}
```
</details>
