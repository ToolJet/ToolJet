---
id: set-page-variable
title: Set Page Variable
---

Les variables de page sont limitées à la page dans laquelle elles sont créées et ne peuvent pas être accessibles dans toute l'application comme les variables classiques. Utilisez cette action pour créer une variable et lui assigner une valeur au sein d'une [application multipage](/docs/app-builder/building-ui/pages).

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| Key | Nom (chaîne de caractères) de la variable de page | — |
| Value | La valeur à assigner à la variable | — |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/page/set-page-var-v2.png" alt="ToolJet - Action reference - Set Page Variable"/>

## Déclenchement via RunJS

```js
await actions.setPageVariable('<variableKey>', <variableValue>);
```

`variableKey` doit être fourni sous forme de chaîne de caractères (entre guillemets), tandis que `variableValue` ne nécessite pas de guillemets s'il s'agit d'une valeur numérique.

<img className="screenshot-full" src="/img/actions/page/setpagevar33.png" alt="ToolJet - Action reference - Set Page Variable" />

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
