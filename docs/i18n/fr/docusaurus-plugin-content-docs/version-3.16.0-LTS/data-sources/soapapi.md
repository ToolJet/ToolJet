---
id: soap-api
title: SOAP API
---

ToolJet peut établir des connexions avec des API SOAP grâce à son intégration REST API.

## Configuration d'une source de données SOAP API

Pour établir une connexion avec une source de données SOAP API, vous devrez ajouter une source de données REST API, car ToolJet gère les API SOAP à l'aide de configurations REST API.

Vous pouvez consulter la [documentation de configuration de REST API](/docs/data-sources/restapi/) pour plus d'informations.

## Interroger une API SOAP

Une fois connecté à la source de données REST API, vous pouvez facilement écrire des requêtes et interagir avec l'API SOAP dans l'application ToolJet. Suivez ces étapes pour commencer :

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes, dans le panneau inférieur de l'éditeur.
2. Sélectionnez **REST API** dans la section Data Source.
3. Sélectionnez la méthode **POST** et saisissez l'endpoint de votre API SOAP.
4. Ajoutez des en-têtes
   - **Content-Type** : **text/xml** (indique que le corps de la requête est au format XML.)
   - Ajoutez tout autre en-tête requis (par exemple, Authorization, SOAPAction).
5. Ajoutez le corps (**Body**) de la requête au format XML.
6. Cliquez sur **Preview** pour visualiser les données renvoyées par la requête, ou sur **Run** pour exécuter la requête.

:::tip
Vous pouvez également transformer les résultats de la requête à l'aide de la fonctionnalité **[Transformations](/docs/app-builder/custom-code/transform-data)**.
:::

**Exemple d'URL de endpoint API :** `http://www.dneonline.com/calculator.asmx`

<img className="screenshot-full img-full" src="/img/datasource-reference/soap-api/post.png" alt="SOAP API Headers" />

**Exemple de corps de requête :**

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
   <soapenv:Header/>
   <soapenv:Body>
      <tem:Add>
         <tem:intA>100</tem:intA>
         <tem:intB>5</tem:intB>
      </tem:Add>
   </soapenv:Body>
</soapenv:Envelope>
```

<img className="screenshot-full img-full" src="/img/datasource-reference/soap-api/post-body.png" alt="SOAP API Headers" />

**Remarques supplémentaires :**

- Les API SOAP utilisent généralement la méthode POST. L'utilisation d'une autre méthode peut provoquer des erreurs.
- Assurez-vous d'avoir ajouté l'en-tête Content-Type: text/xml. Le serveur a besoin du bon en-tête pour interpréter la requête comme du SOAP.
- Incluez l'en-tête SOAPAction s'il est spécifié dans la documentation de l'API.
