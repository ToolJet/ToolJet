---
id: scroll-component-into-view
title: Scroll Component into View
---

Utilisez cette action pour faire défiler un composant spécifique jusqu'à la zone visible de l'application. Ceci est utile pour guider les utilisateurs vers un composant après une interaction, par exemple, en descendant vers une erreur de validation, une ligne de tableau nouvellement ajoutée, ou une section actuellement en dehors de la fenêtre d'affichage.

## Configuration

| Paramètre | Description |
| --------- | ----------- |
| Component | Sélectionnez le composant cible dans la liste déroulante. Les composants imbriqués dans une Modal ne sont pas listés ici, car ils ne sont rendus que lorsque la modale est ouverte. |
| Behaviour | Contrôle l'animation de défilement. **Smooth** (par défaut) anime le défilement, **Instant** saute directement au composant sans animation, et **Auto** délègue au comportement de défilement par défaut du navigateur. |
| Block | Contrôle l'endroit où le composant se positionne dans la fenêtre d'affichage une fois qu'il devient visible. **Nearest** (par défaut) fait défiler la distance minimale nécessaire pour l'amener en vue, **Start** l'aligne en haut, **Center** l'aligne au milieu, et **End** l'aligne en bas. |
| Debounce  | Le champ Debounce est vide par défaut ; vous pouvez saisir une valeur numérique pour indiquer le délai en millisecondes après lequel l'action sera exécutée. ex : `300` |

<img className="screenshot-full img-s" src="/img/actions/scroll-component-into-view/scroll-component-into-view.png" alt="ToolJet - Action reference - Scroll Component into View" />

:::info
Vous pouvez également déclencher des actions depuis le **code JavaScript**. Découvrez comment [ici](/docs/actions/run-actions-from-runjs/).
:::

## Déclenchement via RunJS

```js
actions.scrollComponentInToView("<componentName>");
// remplacez <componentName> par le nom de votre composant, par ex. text1
```

:::info
Pour des instructions sur la façon d'exécuter des actions depuis une requête RunJS, consultez le guide pratique [Running Actions from RunJS Query](/docs/actions/run-actions-from-runjs/).
:::

:::note
Les options **Behaviour** et **Block** ne peuvent actuellement être configurées que lors de l'ajout de cette action via un gestionnaire d'événements dans l'App Builder. La syntaxe RunJS ci-dessus effectue toujours le défilement avec le comportement par défaut (smooth, aligné sur nearest).
:::
