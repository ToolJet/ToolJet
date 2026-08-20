---
id: go-to-app
title: Go to app
---

L'action **Go to app** ouvre une autre application ToolJet publiée lorsqu'un événement se produit. Seules les applications publiées peuvent être ouvertes de cette manière.

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| App | L'application publiée vers laquelle naviguer | — |
| Query params | Paires clé-valeur optionnelles ajoutées à l'URL de l'application cible | Vide |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/gotoapp/gotoapp-v4.png" alt="ToolJet - Action reference - Go To App" />

## Déclenchement via RunJS

```js
actions.goToApp('<slug>', queryParams);
```

- `slug` se trouve dans l'URL de l'application publiée après `application/`, ou dans la fenêtre modale Share qui s'ouvre lorsque vous cliquez sur le bouton **Share** en haut à droite de l'app builder.
- `queryParams` est un tableau de paires clé-valeur au format `[['key1', 'value1'], ['key2', 'value2']]`.

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
