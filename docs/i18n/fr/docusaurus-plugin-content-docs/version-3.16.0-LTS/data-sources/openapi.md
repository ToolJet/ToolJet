---
id: openapi
title: OpenAPI
---

OpenAPI est une spécification permettant de concevoir et de documenter des API RESTful. Grâce à la source de données OpenAPI, ToolJet peut générer des opérations REST API à partir de spécifications OpenAPI.

## Connexion

Les connexions sont créées à partir de spécifications OpenAPI. Les méthodes d'authentification actuellement prises en charge sont Basic Auth, API Key, Bearer Token et OAuth 2.0. Il est également possible d'utiliser des spécifications nécessitant plusieurs authentifications. Pour en savoir plus, consultez [cette page](https://swagger.io/docs/specification/authentication/).

La source de données OpenAPI n'accepte les spécifications qu'au format JSON ou YAML. Après avoir fourni une spécification JSON ou YAML valide et sélectionné OAuth2 comme type d'authentification, vous pouvez saisir des en-têtes personnalisés et des identifiants client.

Vous pouvez également configurer différents hosts pour différents environnements depuis la page de configuration. Le host configuré ici est prioritaire sur celui défini dans la requête ou dans les spécifications elles-mêmes.

Vous pouvez activer l'option **Authentication required for all users** dans la configuration. Lorsqu'elle est activée, les utilisateurs sont redirigés vers l'écran de consentement OAuth la première fois qu'une requête de cette source de données est déclenchée dans l'application. Cela garantit que chaque utilisateur connecte son propre compte OpenAPI de manière sécurisée.

<img className="screenshot-full img-full" src="/img/datasource-reference/openapi/connection-v6.png" alt="OpenAPI data source connection" />

## Interroger OpenAPI

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes, situé dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **OpenAPI** ajoutée à l'étape précédente.
3. Sélectionnez l'opération souhaitée.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat ou sur le bouton **Run** pour déclencher la requête.

**Remarque** : les opérations sont générées automatiquement à partir des spécifications, et chaque opération est distincte des autres.

### Champs

- **Host**
- **Operation**

<img className="screenshot-full img-full" src="/img/datasource-reference/openapi/get-query.png" alt="OpenAPI" />
