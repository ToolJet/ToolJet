---
id: zendesk
title: Zendesk
---

ToolJet peut se connecter aux API Zendesk pour lire et écrire des données en utilisant OAuth 2.0, ce qui permet de limiter l'accès d'une application au compte d'un utilisateur.

## Connexion 

Pour établir une connexion avec la source de données Zendesk, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit naviguer vers la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet et choisir Zendesk comme source de données.

ToolJet se connecte à votre application Zendesk en utilisant :
- **Zendesk Sub-domain**
- **Client ID**
- **Client Secret**

### Scopes d'autorisation 

Vous pouvez créer une source de données Zendesk avec l'un des deux scopes d'autorisation suivants :
- **Read Only**
- **Read and Write**

<img className="screenshot-full img-full" src="/img/datasource-reference/zendesk/connection-v3.png" alt="ToolJet - Data source - Zendesk" />

:::info
Vous devez d'abord être un utilisateur vérifié pour effectuer des requêtes vers l'API Zendesk. Cela se configure dans l'interface de l'Admin Center, dans **Apps and integrations > APIs > Zendesk APIs.** Pour plus d'informations, consultez la section Security and Authentication de la [référence de l'API Zendesk Support](https://developer.zendesk.com/api-reference/ticketing/introduction/#security-and-authentication) ou [consultez la documentation de Zendesk](https://support.zendesk.com/hc/en-us/articles/4408845965210).
:::

## Interroger Zendesk

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes situé dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **Zendesk** ajoutée à l'étape précédente.
3. Sélectionnez l'opération souhaitée et saisissez les paramètres requis.
4. Cliquez sur le bouton **Preview** pour afficher un aperçu du résultat, ou sur le bouton **Run** pour déclencher la requête.

## Opérations prises en charge

- **[List Tickets](#list-tickets)**
- **[List requested Tickets](#list-requested-tickets)**
- **[Show a Ticket](#show-tickets)**
- **[Update a Ticket](#update-tickets)**
- **[List Users](#list-users)**
- **[Get User](#get-user)**
- **[Get Profile](#get-profile)**
- **[Search](#search)**

<img className="screenshot-full img-full" src="/img/datasource-reference/zendesk/listops.png" alt="Zendesk supported operations" style={{marginBottom:'15px'}} />

### List Tickets

Liste tous les tickets de votre compte Zendesk.

<img className="screenshot-full img-full" src="/img/datasource-reference/zendesk/list-tickets-query.png" alt="Zendesk list query"  />

### List Requested Tickets

Liste tous les tickets demandés par l'utilisateur. 

#### Paramètre requis

- **User ID** 

<img className="screenshot-full img-full" src="/img/datasource-reference/zendesk/list-req-query.png" alt="Zendesk list query"  />

### Show Tickets

Récupère les propriétés d'un ticket pour l'ID donné, mais pas les commentaires du ticket.

#### Paramètre requis

- **Ticket ID** 

<img className="screenshot-full img-full" src="/img/datasource-reference/zendesk/show-query.png" alt="Zendesk show query"  />

### Update Tickets

Met à jour les propriétés d'un ticket pour l'ID donné.

#### Paramètre requis

- **Ticket ID** 
- **Body**

<img className="screenshot-full img-full" src="/img/datasource-reference/zendesk/update-query.png" alt="Zendesk update query"  />

#### Exemple :

```yaml
{
    "ticket" : {
        "status" : "solved"
    }
}
```

### List Users

Liste tous les utilisateurs de votre compte Zendesk.

<img className="screenshot-full img-full" src="/img/datasource-reference/zendesk/list-users-query.png" alt="Zendesk list query"  />

### Get User

Récupère les informations d'un utilisateur pour l'ID donné.

#### Paramètre requis

- **User ID** 

<img className="screenshot-full img-full" src="/img/datasource-reference/zendesk/get-query.png" alt="Zendesk get query"  />

### Get Profile

Récupère le profil d'un utilisateur pour l'ID donné.

#### Paramètre requis

- **User ID** 

<img className="screenshot-full img-full" src="/img/datasource-reference/zendesk/get-profile-query.png" alt="Zendesk get query"  />

### Search

La requête Search utilise l'API de recherche de Zendesk pour renvoyer des tickets, des utilisateurs et des organisations selon des filtres définis.

#### Paramètre requis

- **Query** 

Les filtres courants incluent :
- `type:ticket`
- `type:user`
- `type:organization`
- `type:ticket organization:12345 status:open`

<img className="screenshot-full img-full" src="/img/datasource-reference/zendesk/search-query.png" alt="Zendesk search query" />
