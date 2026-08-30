---
id: redis
title: Redis
---

ToolJet vous permet d'exécuter des commandes Redis sur vos instances Redis.

## Connexion à Redis

Pour établir une connexion avec la source de données Redis, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requêtes, soit naviguer vers la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet et choisir Redis comme source de données.

<img className="screenshot-full img-full" src="/img/datasource-reference/redis/connect-v2.png" alt="Redis data source Connection" />

Pour connecter ToolJet à Redis, vous devez fournir les détails de connexion suivants :

- **Host** : L'adresse ou le nom d'hôte du serveur Redis.
- **Port** : Le numéro de port utilisé par le serveur Redis (par défaut 6379).
- **Username** : Le nom d'utilisateur utilisé pour l'authentification.
- **Password** : Le mot de passe utilisé pour l'authentification.
- **TLS** : Bouton bascule pour activer/désactiver la connexion TLS.
- **TLS Certificate** : Choisissez le type de certificat TLS (None, CA certificate ou Client certificate).

Selon l'option de certificat TLS sélectionnée, vous devrez peut-être fournir des informations supplémentaires :
- Pour **CA certificate** :
  - **CA Cert** : Le certificat CA pour la connexion TLS.
- Pour **Client certificate** :
  - **CA Cert** : Le certificat CA pour la connexion TLS.
  - **Client Key** : La clé client pour la connexion TLS.
  - **Client Cert** : Le certificat client pour la connexion TLS.

## Effectuer des requêtes Redis

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **Redis** ajoutée à l'étape précédente.
3. Saisissez la requête.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat ou cliquez sur le bouton **Run** pour déclencher la requête.

Voici quelques exemples de commandes Redis et de leur utilisation. Vous pouvez consulter la [documentation officielle de Redis](https://redis.io/commands) pour obtenir la liste complète des commandes prises en charge.

### Commande PING

La commande `PING` est utilisée pour tester la connexion à Redis. Si la connexion réussit, le serveur Redis répondra avec **PONG**.

```shell
PING
```

<img className="screenshot-full img-full" src="/img/datasource-reference/redis/ping-query.png" alt="Redis querying" />

### Commande SET

La commande `SET` est utilisée dans Redis pour affecter une valeur à une clé spécifique.

```shell
SET key value
```

#### Exemple
Lorsque la valeur d'entrée contient des espaces, vous devez encoder la valeur avant de la fournir en entrée :

```shell
SET products {{encodeURI('John Doe')}}
```

<img className="screenshot-full img-full" src="/img/datasource-reference/redis/setprod-query.png" alt="Redis Example querying" />

### Commande GET

La commande `GET` est utilisée dans Redis pour récupérer la valeur associée à une clé spécifique.

```shell
GET key
```

#### Exemple
Pour récupérer une valeur qui a été précédemment encodée lors de sa définition, vous pouvez utiliser des transformations.

1. Saisissez la commande GET dans l'éditeur :
  ```shell
  GET products
  ```

2. Activez les transformations (JS) et utilisez `decodeURI` :
  ```js
  return JSON.parse(decodeURI(data));
  ```
  <img className="screenshot-full img-full" src="/img/datasource-reference/redis/get-query.png" alt="Redis Example querying" />
