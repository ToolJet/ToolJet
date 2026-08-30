---
id: unset-page-variable
title: Unset page variable
---

Utilisez cette action pour effacer une variable créée avec l'action [Set Page Variable](/docs/actions/set-page-variable).

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| Key | Nom (chaîne de caractères) de la variable de page à effacer | — |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/page/unset-page-var-v2.png" alt="ToolJet - Action reference - Unset Page Variable"/>

## Déclenchement via RunJS

```js
await actions.unsetPageVariable('<variableName>');
```

`variableName` est la clé de la variable fournie lors de la création de celle-ci.

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
