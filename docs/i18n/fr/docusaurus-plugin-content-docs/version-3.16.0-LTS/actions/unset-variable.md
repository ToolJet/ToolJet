---
id: unset-variable
title: Unset variable
---

L'action **Unset variable** supprime une variable au niveau de l'application créée avec l'action [Set variable](/docs/actions/set-variable).

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| Key | Nom (chaîne de caractères) de la variable à supprimer | — |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/unsetvar/unsetvar-v2.png" alt="ToolJet - Action reference -Unset variable"/>

## Déclenchement via RunJS

```js
actions.unSetVariable('<variableName>');
```

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
