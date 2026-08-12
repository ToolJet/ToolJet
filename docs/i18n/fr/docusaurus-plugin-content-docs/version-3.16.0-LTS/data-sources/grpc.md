---
id: grpc
title: gRPC
---

<div className='badge badge--primary heading-badge'>Self-hosted only</div>

:::caution
Seules les instances auto-hébergées auront accès à une source de données gRPC capable de gérer les requêtes et réponses unaires.
:::

<div style={{paddingTop:'24px'}}>

## Configuration

### Étape 1 : mettre à niveau ToolJet vers la version 2.5 ou supérieure

Vous trouverez des instructions sur la façon de procéder dans les guides de configuration situés ici : [ToolJet Setup](/docs/setup/).

### Étape 2 : ajouter les fichiers proto

À la racine, créez un répertoire nommé « *protos* » et ajoutez un fichier « *service.proto* » à l'intérieur.


### Étape 3 : monter les volumes

Dans le fichier **docker-compose.yml**, ajoutez ce qui suit aux sections *volumes* pour **plugins** et **server**

```bash
./protos:/app/protos
```

<img className="screenshot-full" src="/img/datasource-reference/grpc/proto1.png" alt="gRPC: datasource" width='500' />

<img className="screenshot-full" src="/img/datasource-reference/grpc/proto2.png" alt="gRPC: datasource"  width='500'/>

### Étape 4 : redémarrer l'instance

```bash
docker-compose up -d
```

</div>

<div style={{paddingTop:'24px'}}>

## Interroger gRPC

Après avoir configuré vos fichiers proto, vous devriez pouvoir établir une connexion à gRPC en accédant à la page [source de données globale](/docs/data-sources/overview).

### Connecter la source de données gRPC

ToolJet nécessite les éléments suivants pour se connecter aux serveurs gRPC :

- **Server URL**
- **Authentication type** 
    - None
    - Basic
    - Bearer
    - API key

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/grpc/connection.png" alt="gRPC: connection" />

</div>

Une fois que vous avez ajouté gRPC depuis la page des sources de données globales, vous le trouverez dans le panneau de requêtes de l'application.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/grpc/grpcgds.png" alt="gRPC: connection" />

</div>

### Création d'une requête

Vous pouvez maintenant interroger une méthode RPC particulière des services ajoutés.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/grpc/query.png" alt="gRPC: connection" />

</div>

</div>
