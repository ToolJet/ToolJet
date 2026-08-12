---
id: configuration
title: Configuration
slug: /data-sources/restapi/
---

ToolJet peut établir des connexions avec n'importe quel endpoint REST API disponible, vous permettant de créer des requêtes et d'interagir avec des sources de données externes de manière transparente.

## Configurer une source de données REST API

Pour établir une connexion avec la source de données REST API, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requêtes, soit naviguer vers la page **[Data Sources](/docs/data-sources/overview)** via le tableau de bord ToolJet.

ToolJet nécessite les éléments suivants pour se connecter à une source de données REST API :

- **[Credentials](#credentials)**
- **[Authentication](#authentication)**
- **[Secure Sockets Layer (SSL)](#secure-sockets-layer-ssl)**

### Credentials

- **Base URL** : L'URL de base spécifie l'adresse réseau du service API.
- **Headers** : Paires clé-valeur à inclure comme en-têtes avec les requêtes REST API.
- **URL Parameters** : Paires clé-valeur à inclure comme paramètres d'URL avec les requêtes REST API.
- **Body** : Paires clé-valeur à inclure comme corps de la requête.
- **Cookies** : Paires clé-valeur à inclure comme cookies avec les requêtes REST API. Ces cookies seront envoyés avec chaque requête créée à l'aide de cette instance de source de données.

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/credentials.png" alt="REST API - Credentials" />

### Authentication

:::info
Pour une explication détaillée des types d'authentification pris en charge par les sources de données REST API, consultez la section **[Authentication](/docs/data-sources/restapi/authentication)**.
:::

ToolJet prend en charge les types d'authentification suivants pour les sources de données REST API :

- **None** : Aucune authentification requise.
- **Basic** : Nécessite un nom d'utilisateur et un mot de passe.
- **Bearer** : Nécessite un jeton, généralement un JSON Web Token (JWT), pour accorder l'accès.
- **OAuth 2.0** : Prend en charge les types d'octroi Authorization Code et Client Credentials. Les paramètres requis varient selon le type d'octroi sélectionné et le fournisseur de service.
    - Access token URL
    - Access token URL custom headers
    - Client ID
    - Client secret
    - Scopes
    - Custom query parameters
    - Authorization URL
    - Custom authentication parameters
    - Client authentication method

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/authentication.png" alt="REST API - Authentication" />

### Secure Sockets Layer (SSL)

- **SSL Certificate** : Certificat SSL à utiliser avec les requêtes REST API. Types pris en charge :
  - **None** : Aucune vérification du certificat SSL.
  - **CA Certificate** : Nécessite un certificat CA pour vérifier le certificat du serveur.
  - **Client Certificate** : Nécessite un certificat client, une clé client et un certificat CA pour s'authentifier auprès du serveur.

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/ssl.png" alt="REST API - SSL Certificate" />

:::info
Pour interagir avec des API SOAP, consultez la [documentation de l'API SOAP](/docs/data-sources/soap-api).
:::
