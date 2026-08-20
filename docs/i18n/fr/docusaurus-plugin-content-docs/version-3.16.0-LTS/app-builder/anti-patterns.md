---
id: anti-patterns
title: Anti-patterns à éviter
---

Lors de la création d'applications avec ToolJet, il est essentiel de suivre les bonnes pratiques pour garantir que vos applications soient efficaces, maintenables et offrent une expérience utilisateur fluide. Cette documentation présente les anti-patterns courants à éviter lors de l'utilisation de ToolJet et propose des solutions pour optimiser vos applications.

## Nommage et organisation

#### Nommage non géré des composants

- **Anti-pattern** : Utiliser des noms par défaut ou non descriptifs pour les composants.
- **Solution** : **Renommez tous les composants avec des noms significatifs pour rendre les applications plus faciles à gérer à mesure qu'elles grandissent.**
- **Raison** : Des noms descriptifs améliorent la lisibilité, ce qui vous permet, à vous et aux autres, de comprendre et de maintenir plus facilement la structure de l'application.

#### Nommer les composants ou les queries avec des tirets ou des espaces

- **Anti-pattern** : Nommer des composants ou des queries avec des tirets ou des espaces, comme `run-py1` ou `my query`.
- **Solution** : **Utilisez des noms sans tirets ni espaces**, ou référencez-les à l'aide de la notation par crochets (par exemple, `{{queries['run-py1'].isLoading}}`).
- **Raison** : Les tirets et les espaces peuvent provoquer des problèmes de syntaxe. Utiliser la notation par crochets ou éviter ces caractères garantit la cohérence et évite les erreurs dans les références aux queries ou aux composants.

## Structure et limites de l'application

#### Dépassement des limites de composants

- **Anti-pattern** : Avoir plus de 2 500 composants dans une seule application.
- **Solution** : **Limitez chaque application à un maximum de 2 500 composants.**
- **Raison** : Dépasser ce nombre peut ralentir l'app-builder et les applications en production, impactant à la fois la vitesse de développement et l'expérience utilisateur.

#### Nombre excessif de pages dans une application

- **Anti-pattern** : Inclure trop de pages dans une seule application (par exemple, plus de 10 à 15 pages).
- **Solution** : **Gardez le nombre de pages par application en dessous de 10 à 15.** Si votre application en nécessite davantage, envisagez de la diviser en plusieurs applications reliées entre elles.
- **Raison** : Un nombre excessif de pages peut ralentir l'application et la rendre difficile à gérer. Chaque page ainsi que ses composants et queries associés sont chargés en mémoire, augmentant l'empreinte globale.

#### Imbrication excessive des containers

- **Anti-pattern** : Imbriquer des composants Container ou Modal sur plusieurs niveaux (par exemple, un Container à l'intérieur d'un Container, lui-même à l'intérieur d'un autre Container).
- **Solution** : **Aplatissez votre mise en page autant que possible.** Utilisez des pages ou des onglets (tabs) pour séparer le contenu plutôt que d'empiler des containers.
- **Raison** : Chaque niveau d'imbrication ajoute de la complexité de rendu. Une imbrication profonde augmente le nombre de composants que le navigateur doit évaluer, ce qui entraîne des rendus plus lents et des mises en page plus difficiles à déboguer.

#### Dépassement des limites d'import en masse de la ToolJet Database

- **Anti-pattern** : Tenter d'importer en masse plus de 1 000 lignes ou des fichiers de plus de 5 Mo dans la ToolJet Database en une seule opération.
- **Solution** : **Divisez les imports de données volumineux en lots de 1 000 lignes ou moins**, et gardez les fichiers CSV individuels sous 5 Mo.
- **Raison** : La ToolJet Database impose ces limites (configurables via les variables d'environnement `TOOLJET_DB_BULK_UPLOAD_MAX_ROWS` et `TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB`). Les dépasser entraîne l'échec de l'import.

## Gestion des données

#### Opérations côté client pour des jeux de données volumineux

- **Anti-pattern** : Gérer de grands jeux de données avec des opérations côté client sur le composant Table.
- **Solution** : **Implémentez des [opérations côté serveur](/docs/widgets/table/serverside-operations/overview/) pour gérer les grands jeux de données.** Le composant Table prend en charge la pagination, la recherche, le tri et le filtrage côté serveur — activez ceux pertinents pour votre cas d'usage plutôt que de tout traiter côté client.
- **Raison** : Les opérations côté serveur réduisent la quantité de données chargées en une seule fois, améliorant les temps de chargement et les performances.

#### Stockage de données Base64 dans des variables

- **Anti-pattern** : Capturer et stocker directement des données Base64 dans des variables.
- **Solution** : **Stockez les données volumineuses, comme les images en base64, dans une base de données et récupérez-les au besoin.**
- **Raison** : Stocker des données Base64 dans des variables peut consommer une mémoire importante et ralentir l'application. Récupérer les données depuis une base de données au besoin optimise les performances.

#### Déclenchement de queries inutiles au chargement de la page

- **Anti-pattern** : Déclencher toutes les queries au chargement de la page, indépendamment de leur nécessité.
- **Solution** : **Pour les applications multi-pages, ne déclenchez au chargement de la page que les queries nécessaires à cette page spécifique.**
- **Raison** : Charger des données inutiles consomme des ressources et ralentit les temps de chargement de la page. Optimiser les queries améliore les performances.

#### Mutation directe des données

- **Anti-pattern** : Muter directement des structures de données via du code JavaScript, comme utiliser `queries.getEmployees.data = []`.

```javascript
// Anti-pattern: directly overwriting query data
queries.getEmployees.data = [];
```

- **Solution** : Utilisez toujours les **[actions](/docs/actions/run-actions-from-runjs/)** intégrées de ToolJet pour manipuler les données.

```javascript
// Correct: use actions to update data
actions.setVariable("employees", []);
```

- **Raison** : La mutation directe des données peut entraîner des bugs inattendus et rendre le débogage plus complexe.

## Patterns de queries JavaScript

#### Exécution simultanée de plusieurs queries JavaScript

- **Anti-pattern** : Déclencher un grand nombre de queries JavaScript simultanément via un seul événement. Par exemple, utiliser un événement pour déclencher une query **Run JavaScript code** qui contient du code exécutant 15 à 20 autres queries **Run JavaScript code** au sein de l'application.
- **Solution** : **Limitez le nombre de queries JavaScript simultanées déclenchées par un seul événement.**
- **Raison** : Déclencher de nombreuses queries Run JavaScript en même temps peut considérablement dégrader les performances du navigateur, car chaque query JavaScript crée un **[nouvel environnement d'exécution](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth#javascript_execution_contexts)** dans le navigateur. Le JavaScript dans les navigateurs s'exécute sur un seul thread principal. Lorsque plusieurs scripts s'exécutent simultanément, ils entrent en compétition pour le temps d'exécution sur ce thread.

#### Utilisation de commandes non bloquantes pour des opérations synchrones

- **Anti-pattern** : Utiliser des commandes non bloquantes comme `Promise.all` et `setTimeout` dans la query **Run JavaScript code** lorsqu'un état isLoading précis est nécessaire.

```javascript
// Anti-pattern: the query finishes before the timeout fires
setTimeout(() => {
  actions.setVariable("status", "done");
}, 2000);
```

- **Solution** : **Évitez les opérations non bloquantes dans les queries JavaScript si vous avez besoin d'un statut isLoading précis. Assurez-vous que votre code est synchrone au sein de la query Run JavaScript code.**

```javascript
// Correct: use await so the query stays in a loading state until complete
const result = await queries.fetchData.run();
actions.setVariable("status", "done");
```

- **Raison** : Les opérations non bloquantes peuvent faire en sorte que la query **Run JavaScript code** se termine avant que ces commandes ne se terminent, entraînant un statut isLoading incorrect et pouvant potentiellement dérouter les utilisateurs.

#### Utilisation d'actions à l'intérieur de fonctions de boucle

- **Anti-pattern** : Utiliser des actions à l'intérieur de fonctions de boucle.

Exemple :
Vous avez un tableau (Table) affichant des données depuis `{{page.variables.data}}` et un bouton **Save Changes** qui met à jour les données. Lorsque les utilisateurs modifient des lignes et cliquent sur **Save Changes**, vous pourriez initialement implémenter la mise à jour ainsi :

```javascript
const data = page.variables.data;
Object.values(components.table1.dataUpdates).forEach((ele) => {
  data[ele.id] = ele;
  actions.setPageVariable("data", data);
});
```

L'action setPageVariable est exécutée à l'intérieur de la boucle pour chaque mise à jour de ligne. Cela entraîne un nouveau rendu du tableau à chaque mise à jour de la variable, provoquant une dégradation significative des performances, en particulier lorsque plusieurs lignes ou cellules sont mises à jour simultanément.

- **Solution** : **Modifiez votre code pour mettre à jour la variable de page une seule fois après le traitement de tous les changements** :

```javascript
const data = page.variables.data;
Object.values(components.table1.dataUpdates).forEach((ele) => {
  data[ele.id] = ele;
});
actions.setPageVariable("data", data);
```

- **Raison** : En mettant à jour la variable après la fin de la boucle, le tableau n'est rendu qu'une seule fois. Cela réduit le traitement inutile et améliore significativement les performances lors de la gestion de plusieurs mises à jour.

## Configuration des composants

#### Chargement simultané de tous les onglets

- **Anti-pattern** : Charger tous les éléments du composant Tab en une seule fois lorsqu'il y a de nombreux onglets.
- **Solution** : **Activez l'option "Render only active tabs".**
- **Raison** : Cela évite le chargement inutile des onglets inactifs, réduisant les temps de chargement initiaux et améliorant les performances.

#### Utilisation de propriétés ou d'événements de composants obsolètes

- **Anti-pattern** : Continuer à utiliser des propriétés ou événements obsolètes, comme `onRowClicked` dans le composant ListView.
- **Solution** : **Passez aux équivalents actuels.** Par exemple, utilisez `onRecordClicked` au lieu de `onRowClicked` dans ListView.
- **Raison** : Les propriétés obsolètes peuvent être supprimées dans les versions futures. Migrer tôt évite les changements cassants (breaking changes) lors de votre mise à niveau.

#### Ne pas utiliser la hauteur dynamique dans les containers et les onglets

- **Anti-pattern** : Laisser l'option `dynamicHeight` désactivée sur les composants Container, Tabs ou ListView lorsque le contenu à l'intérieur varie en taille.
- **Solution** : **Activez la propriété `dynamicHeight`**, afin que le composant s'ajuste automatiquement à son contenu.
- **Raison** : Sans hauteur dynamique, le contenu peut déborder ou laisser un espace vide excessif, ce qui nuit à l'expérience utilisateur. L'activer garantit que la mise en page s'adapte au contenu.

## Conclusion

Éviter ces anti-patterns lors de l'utilisation de ToolJet garantit que vos applications sont efficaces, réactives et maintenables. En suivant ces bonnes pratiques, vous pouvez améliorer l'expérience utilisateur et simplifier la gestion des applications. Tenez toujours compte de l'impact de vos choix de développement sur la performance et la scalabilité.

## <br/>

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un email à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
