---
id: metadata-and-cookies
title: Metadata and Cookies
---

## Métadonnées {#metadata}

Les métadonnées sont des informations supplémentaires sur les données renvoyées par la REST API. Ces informations incluent l'URL de la requête, la méthode, les en-têtes, ainsi que le code de statut, les en-têtes et le corps de la réponse. Les métadonnées peuvent être consultées dans les requêtes et les composants en utilisant la syntaxe `{{queries.<queryname>.metadata}}`.

:::info
Lors de l'accès aux propriétés de l'objet metadata qui contiennent un trait d'union, vous pouvez utiliser la notation avec crochets. Par exemple, pour accéder à la propriété `user-agent`, vous pouvez utiliser `{{queries.restapi1.metadata.request.headers["user-agent"]}}` ou `{{queries.restapi1.metadata.request.headers."user-agent"}}`.
:::

<details id="tj-dropdown">
<summary>**Exemple de métadonnées**</summary>

```json
{
  "request": {
    "url": "https://dummyjson.com/users",
    "method": "GET",
    "headers": {
      "user-agent": "got (https://github.com/sindresorhus/got)",
      "tj-x-forwarded-for": "103.171.99.41",
      "accept-encoding": "gzip, deflate, br"
    },
    "params": {}
  },
  "response": {
    "statusCode": 200,
    "headers": {
      "server": "[REDACTED]",
      "report-to": "{"group":"heroku-nel","max_age":3600,"endpoints":[{"url":"https://nel.heroku.com/reports?ts=1726207652&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&s=1ICCahr5yl4s1cOLwZ5JI7Le2a5Hp57L8DugEP6oEZQ%3D"}]}",
      "reporting-endpoints": "heroku-nel=https://nel.heroku.com/reports?ts=1726207652&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&s=1ICCahr5yl4s1cOLwZ5JI7Le2a5Hp57L8DugEP6oEZQ%3D",
      "nel": "{"report_to":"heroku-nel","max_age":3600,"success_fraction":0.005,"failure_fraction":0.05,"response_headers":["Via"]}",
      "connection": "close",
      "access-control-allow-origin": "*",
      "x-dns-prefetch-control": "off",
      "x-frame-options": "SAMEORIGIN",
      "strict-transport-security": "max-age=15552000; includeSubDomains",
      "x-download-options": "noopen",
      "x-content-type-options": "nosniff",
      "x-xss-protection": "1; mode=block",
      "x-ratelimit-limit": "100",
      "x-ratelimit-remaining": "99",
      "date": "Fri, 13 Sep 2024 06:07:32 GMT",
      "x-ratelimit-reset": "1726207656",
      "content-type": "application/json; charset=utf-8",
      "etag": "W/"7d39-+rQ7kyHBCLIn9tjTeKVf4oegWkQ"",
      "vary": "Accept-Encoding",
      "content-encoding": "gzip",
      "transfer-encoding": "chunked",
      "via": "1.1 vegur"
    }
  }
}
```
</details>

### En-têtes valides et invalides

#### En-têtes valides

| Clé d'en-tête | Valeur d'en-tête | Remarques |
|------------|--------------|-------|
| Content-Type | 'application/json' | Les valeurs de type chaîne sont valides et couramment utilisées pour spécifier le type de contenu. |
| X-Number | 42 | Les valeurs numériques sont valides (par exemple, 42, 3.14, -7). |
| X-Boolean | true | Les valeurs booléennes sont valides (true ou false). |
| X-Trim-Me | <div style={{ width:"130px"}}> ' needs trimming ' </div>  | Valide après suppression des espaces superflus. |
| X-Empty-String	 | '' | Les valeurs de chaîne vide sont valides. |

#### En-têtes invalides

| Clé d'en-tête             | Valeur d'en-tête                | Raison de l'invalidité                                |
|------------------------|-----------------------------|-----------------------------------------------|
| X-Null                 | null                        | null n'est pas une valeur d'en-tête valide.             |
| X-Undefined            | undefined                   | undefined n'est pas une valeur d'en-tête valide.        |
| X-NaN                  | NaN                         | Les valeurs numériques spéciales comme NaN sont invalides.  |
| X-Infinity             | Infinity                    | Infinity n'est pas un type primitif valide.            |
| X-NegativeInfinity     | -Infinity                   | -Infinity est également invalide.                    |
| X-Object               | `{ key: 'value' }  `        | Les objets ne sont pas autorisés comme valeurs d'en-tête.     |
| X-Array                | [1, 2, 3]                   | Les tableaux ne sont pas valides comme valeurs d'en-tête.        |
| X-Function             | ( ) => console.log('test')  | Les fonctions ne peuvent pas être sérialisées dans des en-têtes.  |
| X-Symbol               | Symbol('sym')               | Les symboles ne sont pas sérialisables et sont invalides.     |
| *(clé vide)*          | 'Empty key'                 | Les clés d'en-tête ne doivent pas être vides.                |

## Cookies

En plus des cookies au niveau de la source de données, vous pouvez ajouter des cookies spécifiques à une requête dans le Query builder. Ces cookies seront envoyés uniquement avec la requête spécifique créée à l'aide de cette instance de source de données.

Pour ajouter des cookies :

1. Dans le Query builder, accédez à l'onglet **Setup**.
2. Trouvez la section **Cookies**.
3. Ajoutez vos cookies sous forme de paires clé-valeur.

Vous pouvez utiliser des valeurs statiques et des valeurs dynamiques pour les valeurs de cookies.

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/cookies-query.png" alt="ToolJet - Query Builder - REST API Cookies" />

:::info
Les cookies spécifiques à une requête remplaceront les cookies au niveau de la source de données portant le même nom pour cette requête particulière.
:::
