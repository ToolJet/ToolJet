---
id: accessing-query-results
title: Accéder aux résultats des queries
---

Une fois votre query créée et exécutée, l'étape suivante consiste à réellement utiliser les données, que vous les affichiez dans un tableau, que vous alimentiez des listes déroulantes, ou que vous les utilisiez dans la logique d'une autre query. Voyons comment travailler avec les résultats de queries.

Pour mieux comprendre ce que votre query renvoie, utilisez le panneau Inspector. Cliquez sur le bouton Inspect, sélectionnez votre query dans la liste déroulante des queries. Vous y trouverez les clés suivantes :
-	**data** : La réponse traitée renvoyée par la query. C'est généralement cette donnée que vous liez aux composants.
-	**rawData** : La réponse d'API d'origine. Utile pour le débogage.
-	**isLoading** : Un booléen indiquant si la query est en cours d'exécution. Très utile pour afficher des loaders ou désactiver des boutons pendant les requêtes.

<img className="screenshot-full img-s" src="/img/app-builder/accessing-query-data/inspector.png" alt="App Builder: Query Panel"/>

<br/>

Vous pouvez transmettre les résultats d'une query à un composant en utilisant la syntaxe `{{ }}`. Par exemple, si vous avez une query nommée *getEmployees*, vous pouvez transmettre ses données à un composant Table en définissant la propriété data du tableau sur `{{queries.getEmployees.data}}`. Découvrez comment lier des queries à des composants [ici](/docs/app-builder/connecting-with-data-sources/binding-data-to-components).

### Actions rapides
Dans le panneau Inspector, lorsque vous survolez une propriété comme data, deux icônes apparaissent. Ces icônes vous permettent de copier rapidement le chemin ou la valeur de cette propriété. Voici ce qu'elles font :
1. Copy Path - Copie le chemin complet (par exemple, `{{queries.getEmployees.data}}`) afin que vous puissiez le référencer directement dans les champs des composants.
2. Copy Value - Copie les données réellement renvoyées, utile pour inspecter des valeurs ou simuler des réponses.

Ces icônes sont disponibles pour chaque propriété, ce qui facilite la connexion de vos données aux composants.