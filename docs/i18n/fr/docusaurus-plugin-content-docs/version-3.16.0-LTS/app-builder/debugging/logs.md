---
id: understanding-logs
title: Comprendre les journaux
---

Le débogage est une étape essentielle de la création d'applications, et ToolJet vous simplifie la tâche grâce à un Debugger intégré qui suit et affiche les journaux en temps réel. Qu'il s'agisse d'un succès ou d'un échec de query, ou d'un dysfonctionnement de composant, les journaux du debugger vous aident à identifier rapidement la source du problème.

Ce guide vous explique comment tirer le meilleur parti des journaux de ToolJet, avec des exemples concrets expliquant pourquoi ils sont importants et comment les utiliser efficacement.

## Fonctionnement des journaux

ToolJet capture les événements en temps réel et les organise dans le panneau du debugger.

Lorsque vous êtes dans l'app-builder, vous pouvez repérer l'icône Debugger dans la barre latérale gauche. Cliquez sur celle-ci pour ouvrir le panneau du debugger. Ce panneau devient votre console principale pour inspecter les résultats d'exécution des queries (succès/échec)
et les problèmes au niveau des composants.

<img className="screenshot-full img-s" src="/img/app-builder/debugging/error-logs/debugger.png" alt="Events Architecture Diagram"/>

## Journaux personnalisés

Dans ToolJet, vous pouvez utiliser des méthodes de journalisation personnalisées pour capturer les erreurs, les informations de débogage et les événements d'exécution dans votre application. Ces fonctions fonctionnent de manière similaire à console.log() de JavaScript, mais offrent une intention plus claire et une journalisation structurée.

### Journaliser les erreurs

Journalise une erreur. Utile pour les appels API échoués, les exceptions ou les problèmes critiques.

```js
actions.logError("API failed");
```

### Journaliser les informations

Journalise des messages informatifs. À utiliser pour les actions réussies ou les changements d'état.

```js
actions.logInfo("User logged in");
```

### Journaliser des messages

Journal générique pour le débogage ou les points de contrôle.

```js
actions.log("Reached step 2");
```

## Cas d'utilisation
 
### Déboguer les queries

Supposons que vous créez une application et que vous avez intégré une API REST pour récupérer des produits. Vous avez connecté cette query à un composant **Table**, mais lorsque vous l'exécutez, les données ne s'affichent pas. Pour résoudre ce problème, ouvrez le debugger et accédez à l'onglet Logs. Vous y trouverez des informations détaillées sur l'exécution de la query, notamment :
- Si la query a réussi ou échoué
- Les messages d'erreur éventuellement renvoyés
- La charge utile (payload) de la requête et le corps de la réponse
- Le code de statut renvoyé par le serveur

Ces informations vous aident à identifier ce qui s'est mal passé et par où commencer le dépannage.

### Résoudre les problèmes liés aux composants

Supposons que vous ayez récupéré des données utilisateur depuis une base de données via une query, et que vous les ayez connectées à un composant table. La query s'exécute sans erreur, mais la table reste vide. Pour investiguer, ouvrez le debugger et allez dans l'onglet Error Logs. Vous y trouverez les journaux d'erreurs liés au comportement du composant, notamment :
- Les erreurs liées à des propriétés mal configurées
- Les expressions invalides utilisées dans les bindings

Ces journaux vous aident à déterminer si le problème provient de la configuration du composant ou de son interaction avec le résultat de la query, ce qui facilite la résolution des problèmes et le bon fonctionnement de votre interface utilisateur.
