---
id: intentionally-fail-js-query
title: Intentionally Throwing an Error in RunJS for Debugging
---

Dans ToolJet, les requêtes Run JavaScript (RunJS) peuvent être intentionnellement mises en échec afin de simuler des scénarios d'erreur, de valider la gestion des erreurs de l'application et de déboguer les flux d'exécution des requêtes. Ce document explique comment **provoquer intentionnellement l'échec d'une requête RunJS**, en utilisant également des logs personnalisés pour mieux visualiser l'exécution de la requête à l'aide du panneau Debugger.

## Faire échouer une requête RunJS à l'aide d'erreurs JavaScript

Une requête RunJS peut être intentionnellement mise en échec en levant une erreur JavaScript. Lorsqu'une erreur est levée :

- L'exécution de la requête s'arrête immédiatement
- ToolJet marque la requête comme échouée
- L'erreur apparaît dans le panneau Debugger


## Créer la requête RunJS qui lève l'erreur

1. Créez une nouvelle requête RunJS en cliquant sur le bouton `+ Add` sur le panneau de requêtes.

2. Collez le code suivant dans l'éditeur de la requête RunJS. Ce code utilise le constructeur `ReferenceError` pour générer intentionnellement une erreur.

    ```js
    throw new ReferenceError('This is a reference error.'); 
    ```
Cela provoque l'échec de la requête RunJS et permet aux développeurs de tester la manière dont l'application répond aux erreurs de requête.

## Ajouter un gestionnaire d'événements pour l'échec

3. Améliorez maintenant la requête en ajoutant un gestionnaire d'événements qui affichera une alerte lorsque la requête échoue.

4. Cliquez sur le bouton « Run » pour exécuter la requête et observez l'erreur intentionnelle qui est levée.

Consultez la capture d'écran ci-dessous :

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/custom-javascript/intentional-error.png" alt="RunJS query" />

En suivant ces étapes, vous pouvez simuler efficacement des erreurs dans vos requêtes RunJS, ce qui facilite le débogage et améliore la robustesse générale de votre code.

## Exemple de requête

L'exemple ci-dessous montre comment des échecs intentionnels peuvent être combinés avec des logs personnalisés pour tracer le flux d'exécution lors du débogage.

```javascript
actions.logInfo("RunJS query started");

// Intentionally fail the query
throw new Error("Intentional failure for debugging");

// This line will not be executed
actions.log("RunJS query finished");
```

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

    ```json
    {
      "message": "Intentional failure to test debugging and error handling",
      "description": "Intentional failure to test debugging and error handling",
      "lineNumber": 4
    }
    ```

</details>
