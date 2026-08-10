---
id: pass-values-in-rest-api
title: Passer des valeurs dans une requête REST API
---

Ce guide vous donne un aperçu de la manière de passer des valeurs dans une requête REST API en utilisant du JSON brut et des paires clé-valeur, permettant la récupération de données en temps réel, les mises à jour et des workflows pilotés par l'utilisateur.

## JSON brut

Dans le code JSON suivant, la syntaxe **`${}`** est utilisée pour l'interpolation de chaînes JavaScript au sein de template literals (aussi appelés template strings). Cela permet d'injecter directement des valeurs dynamiques provenant de variables ou d'expressions JavaScript dans la chaîne.

```javascript
{
  {
    `{
     "contents": [{
       "parts": [{
         "text": "Generate the following content for this image in markdown format:
            content type: ${components.typeOfContentInput.value},
            additional info: ${components.additionalInfoInput.value}"
        },
        {
            "inline_data": {
              "mime_type":"image/jpeg",
              "data": "${components.imageUploader.file[0].base64Data}"
            }
          },],
      },],
    }`;
  }
}
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/pass-values-in-rest-api/raw-2.png" alt="Passing Values Using Raw JSON" />

## Méthodes prises en charge pour passer des valeurs

ToolJet prend en charge plusieurs méthodes pour passer des valeurs dans les requêtes REST API :

| Méthode | Description | Exemple |
|--------|--------------|--------------|
| Headers | Authentification ou métadonnées | Authorization: Bearer `{{globals.token}}` |
| Params | Filtres, recherche et pagination | `?tone={{components.tone.value}}` |
| Body   | Envoi de données structurées ou complexes | `{ "prompt": {{components.prompt.value}} }` |
| Cookies | Envoi de données liées à la session | `{{globals.sessionId}}` |

## Saisir des paires clé-valeur

Dans cet exemple, de simples paires clé-valeur sont saisies dans les champs prévus à cet effet. Ici, les valeurs peuvent simplement être passées à l'aide de doubles accolades, comme cela se fait généralement dans ToolJet. Notez la clé status. Une chaîne de caractères est combinée à une autre valeur référencée à l'aide de doubles accolades.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/pass-values-in-rest-api/key-value-2.png" alt="Passing Values Using The Key Value Inputs" />

Pour voir des requêtes REST API en action, consultez les tutoriels suivants :

1. **[Gemini AI Content Generator](https://blog.tooljet.com/build-an-ai-content-generator-using-gemini-api-and-tooljet-in-10-minutes/)**
2. **[Open AI Audio Transcriber](https://blog.tooljet.com/building-an-audio-transcriber-and-analyzer-using-tooljet-and-openai/)**
