---
id: marketplace-plugin-servicenow
title: ServiceNow
---

ToolJet vous permet de vous connecter à votre instance ServiceNow pour lire et écrire des enregistrements via l'API Table de ServiceNow, inspecter les schémas de table, exécuter des requêtes de statistiques via l'API Aggregate, et invoquer des workflows Action Fabric et des sous-flux Flow Designer.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour vous connecter à une source de données ServiceNow dans ToolJet, vous pouvez soit cliquer sur le bouton **+Add new data source** dans le panneau des requêtes, soit accéder à la page **[Sources de données](/docs/data-sources/overview)** du tableau de bord ToolJet.

Pour vous connecter à votre instance ServiceNow, les informations suivantes sont requises :

- **Instance URL** : L'URL de votre instance ServiceNow, par ex. `https://<instance>.service-now.com`
- **Authentication** : Choisissez entre **Basic auth** et **OAuth 2.0**

### Basic auth

- **Username** : Le nom d'utilisateur de votre compte ServiceNow
- **Password** : Le mot de passe de votre compte ServiceNow

<img className="screenshot-full img-full" src="/img/marketplace/plugins/servicenow/basic-auth.png" alt="Authentification de base ServiceNow" />

### OAuth 2.0

- **Client ID** : L'identifiant client de votre registre d'application OAuth ServiceNow
- **Client secret** : Le secret client de votre registre d'application OAuth ServiceNow
- **Authorization URL** : Le point de terminaison d'autorisation OAuth de votre instance, par ex. `https://<instance>.service-now.com/oauth_auth.do`
- **Access token URL** : Le point de terminaison de jeton OAuth de votre instance, par ex. `https://<instance>.service-now.com/oauth_token.do`
- **Scopes** : Optionnel. Portées OAuth séparées par des espaces, par ex. `useraccount`

<img className="screenshot-full img-full" src="/img/marketplace/plugins/servicenow/oauth.png" alt="OAuth ServiceNow" />

:::tip
Pour utiliser OAuth 2.0, créez un **Application Registry** dans ServiceNow (**System OAuth > Application Registry > New > Create an OAuth API endpoint for external clients**) et définissez son **Redirect URL** sur l'URL de rappel affichée sur la page de configuration de la source de données de ToolJet.
:::

### Paramètres optionnels {#optional-settings}

Ces champs sont uniquement requis si vous prévoyez d'utiliser les opérations liées aux workflows :

- **Action Fabric MCP endpoint** : Optionnel. L'URL ou le chemin du serveur MCP Action Fabric de votre instance, utilisé par **List Workflows** et **Invoke Workflow**. S'il est laissé vide, il utilise par défaut `{instance_url}/sncapps/mcp-server/mcp/sn_mcp_server_default`.
- **Flow trigger path** : Requis uniquement pour l'opération **Trigger Flow**. Le chemin ou l'URL d'une ressource Scripted REST de votre instance qui exécute un sous-flux Flow Designer, par ex. `/api/<scope>/tooljet_flow/run`.

Lorsque vous cliquez sur **Test connection**, ToolJet vérifie les identifiants en récupérant un seul enregistrement depuis la table `sys_user`.

## Interroger ServiceNow

1. Cliquez sur le bouton **+** dans le gestionnaire de requêtes en bas de l'éditeur et sélectionnez la source de données ServiceNow ajoutée précédemment.
2. Choisissez l'opération que vous souhaitez effectuer sur votre instance ServiceNow.

:::info
Les API Table, Stats et système de ServiceNow encapsulent leur payload dans une clé `result`. ToolJet déballe automatiquement cette clé, donc `data` est directement le tableau/objet, par ex. **List Records** renvoie le tableau des enregistrements à `queries.x.data`, et non `queries.x.data.result`.
:::

## Opérations prises en charge

ToolJet prend en charge les opérations ServiceNow suivantes :

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

#### Tables et schéma

- **[List Tables](#list-tables)**
- **[Get Table Schema](#get-table-schema)**
- **[Get Field Choices](#get-field-choices)**

#### Workflows (Action Fabric)

- **[List Workflows](#list-workflows)**
- **[Invoke Workflow](#invoke-workflow)**

#### Agrégation

- **[Aggregate / Stats](#aggregate--stats)**

</div>

<div style = {{ width:'5%' }} > </div>

<div style = {{ width:'50%' }} >

#### Enregistrements

- **[List Records](#list-records)**
- **[Get Record](#get-record)**
- **[Create Record](#create-record)**
- **[Update Record](#update-record)**
- **[Delete Record](#delete-record)**

#### Flows (Flow Designer)

- **[Trigger Flow](#trigger-flow)**
- **[List Flows](#list-flows)**

</div>

</div>

### List Tables

Cette opération liste les tables définies dans votre instance ServiceNow (interroge la table `sys_db_object`).

#### Paramètres optionnels :

- **Name filter** : Renvoie les tables dont le nom ou le libellé contient ce texte.
- **Limit** : Nombre maximal de tables à renvoyer.

#### Exemple :

```yaml
Name filter: incident
Limit: 100
```

### Get Table Schema

Cette opération récupère les définitions de colonnes/champs d'une table (interroge la table `sys_dictionary`).

#### Paramètre requis :

- **Table** : La table dont vous souhaitez inspecter les colonnes/le schéma.

#### Paramètre optionnel :

- **Limit** : Nombre maximal de colonnes à renvoyer.

#### Exemple :

```yaml
Table: incident
Limit: 500
```

### Get Field Choices

Cette opération récupère les options de liste de choix disponibles pour un champ de choix sur une table (interroge la table `sys_choice`).

#### Paramètres requis :

- **Table** : La table qui contient le champ de choix.
- **Field** : Le champ de choix (nom de colonne) pour lequel récupérer les options.

#### Paramètre optionnel :

- **Language** : Langue des choix, par défaut `en`.

#### Exemple :

```yaml
Table: incident
Field: state
Language: en
```

### List Records

Cette opération récupère des enregistrements d'une table, avec filtrage, pagination et sélection de champs optionnels.

#### Paramètre requis :

- **Table** : La table à interroger.

#### Paramètres optionnels :

- **Query (encoded)** : Une chaîne de requête encodée pour filtrer les enregistrements.
- **Limit** : Nombre maximal d'enregistrements à renvoyer.
- **Offset** : Nombre d'enregistrements à ignorer avant de renvoyer les résultats.
- **Fields** : Liste de champs à renvoyer, séparés par des virgules.
- **Display value** : `true`, `false`, ou `all` — indique si les valeurs de champ renvoyées sont la valeur d'affichage, la valeur brute, ou les deux.

#### Exemple :

```yaml
Table: incident
Query (encoded): active=true^priority=1
Limit: 100
Offset: 0
Fields: number,short_description,state
Display value: true
```

### Get Record

Cette opération récupère un seul enregistrement d'une table via son `sys_id`.

#### Paramètres requis :

- **Table** : La table à interroger.
- **Sys ID** : Le `sys_id` de l'enregistrement à récupérer.

#### Paramètres optionnels :

- **Fields** : Liste de champs à renvoyer, séparés par des virgules.
- **Display value** : `true`, `false`, ou `all`.

#### Exemple :

```yaml
Table: incident
Sys ID: a9e30c7dc61122760116894de7bcc7bd
Fields: number,short_description,state
Display value: true
```

### Create Record

Cette opération crée un nouvel enregistrement dans une table.

#### Paramètres requis :

- **Table** : La table dans laquelle insérer.
- **Body** : Les champs de l'enregistrement sous forme d'objet JSON.

#### Exemple :

```yaml
Table: incident
Body:
{
  "short_description": "Network outage",
  "urgency": "1"
}
```

### Update Record

Cette opération met à jour les champs d'un enregistrement existant.

#### Paramètres requis :

- **Table** : La table contenant l'enregistrement.
- **Sys ID** : Le `sys_id` de l'enregistrement à mettre à jour.
- **Body** : Les champs à mettre à jour, sous forme d'objet JSON.

#### Exemple :

```yaml
Table: incident
Sys ID: a9e30c7dc61122760116894de7bcc7bd
Body:
{
  "state": "2"
}
```

### Delete Record

Cette opération supprime un enregistrement d'une table.

#### Paramètres requis :

- **Table** : La table contenant l'enregistrement.
- **Sys ID** : Le `sys_id` de l'enregistrement à supprimer.

#### Exemple :

```yaml
Table: incident
Sys ID: a9e30c7dc61122760116894de7bcc7bd
```

### Aggregate / Stats

Cette opération utilise l'API Aggregate pour calculer des comptages et des statistiques sur une table, avec regroupement et filtrage optionnels.

#### Paramètre requis :

- **Table** : La table sur laquelle agréger.

#### Paramètres optionnels :

- **Count** : `true` ou `false` — indique s'il faut renvoyer un comptage d'enregistrements. Par défaut `true`.
- **Group by** : Champ selon lequel regrouper les résultats, par ex. `state`.
- **Query (encoded)** : Une requête encodée pour filtrer les enregistrements avant l'agrégation.
- **Average of field** : Champ numérique à moyenner, par ex. `reassignment_count`.
- **Sum of field** : Champ numérique à sommer, par ex. `business_duration`.

#### Exemple :

```yaml
Table: incident
Count: true
Group by: state
Query (encoded): active=true
Average of field: reassignment_count
```

### List Workflows

Cette opération liste les outils de workflow (sous-flux) exposés par le serveur MCP Action Fabric.

#### Paramètre optionnel :

- **Name filter** : Renvoie uniquement les outils de workflow dont le nom contient ce texte.

#### Exemple :

```yaml
Name filter: create_incident
```

### Invoke Workflow

Cette opération invoque un outil de workflow Action Fabric de manière synchrone et renvoie son résultat.

#### Paramètres requis :

- **Workflow** : Nom de l'outil de workflow Action Fabric (sous-flux) à invoquer.
- **Arguments** : Les entrées du workflow sous forme d'objet JSON.

#### Exemple :

```yaml
Workflow: create_incident
Arguments:
{
  "short_description": "VPN not working",
  "urgency": "2"
}
```

:::info
Si le workflow signale une erreur (`isError`), ToolJet la remonte comme une erreur de requête plutôt que de renvoyer le résultat partiel.
:::

### Trigger Flow

Cette opération exécute un sous-flux Flow Designer en envoyant une requête POST à une ressource Scripted REST que vous avez configurée dans votre instance. Cela nécessite que **Flow trigger path** soit configuré sur la source de données — voir [Paramètres optionnels](#optional-settings). ToolJet envoie `{ subflow, inputs }` à ce point de terminaison et renvoie la sortie du flow.

#### Paramètre requis :

- **Subflow** : Nom scopé ou `sys_id` du sous-flux à exécuter, par ex. `global.create_incident`.

#### Paramètre optionnel :

- **Inputs** : Les entrées du sous-flux sous forme d'objet JSON.

#### Exemple :

```yaml
Subflow: global.create_incident
Inputs:
{
  "short_description": "VPN not working"
}
```

:::tip
Contrairement à **Trigger Flow**, **List Flows** ne nécessite pas de ressource Scripted REST personnalisée — elle fonctionne immédiatement avec n'importe quelle instance ServiceNow disposant de Flow Designer.
:::

### List Flows

Cette opération liste les sous-flux actifs définis dans Flow Designer (interroge la table `sys_hub_flow` pour les enregistrements où `type=subflow` et `active=true`).

#### Paramètres optionnels :

- **Name filter** : Renvoie uniquement les sous-flux dont le nom ou le nom interne contient ce texte.
- **Limit** : Nombre maximal de sous-flux à renvoyer.

#### Exemple :

```yaml
Name filter: incident
Limit: 100
```
