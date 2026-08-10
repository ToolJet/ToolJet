---
id: set-variable
title: Set variable
---

L'action **Set variable** crée une variable au niveau de l'application et lui assigne une valeur.

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| Key | Nom (chaîne de caractères) de la variable | — |
| Value | Une chaîne, un nombre, un booléen, une expression, un tableau ou un objet | — |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/setvar/setvar-v2.png" alt="ToolJet - Action reference -Set variable" />

## Déclenchement via RunJS

```js
actions.setVariable('<variableName>', <variableValue>);
```

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
