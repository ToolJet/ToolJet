---
id: set-table-page
title: Set Table Page
---

L'action **Set Table Page** modifie l'index de page actuel d'un composant Table.

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| Table | Le composant Table à paginer | — |
| Page Index | Valeur numérique pour l'index de page, par ex. `{{2}}` | — |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/settablepage/settablepage-v2.png" alt="ToolJet - Action reference - Open webpage" />

## Déclenchement via RunJS

Cette action n'est pas exposée via l'API RunJS `actions.*`. Appelez plutôt directement l'action spécifique au composant (CSA) `setPage` propre au composant Table :

```js
await components.<tableName>.setPage(<pageIndex>);
```

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
