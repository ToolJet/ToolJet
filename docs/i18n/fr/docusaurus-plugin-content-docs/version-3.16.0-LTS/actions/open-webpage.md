---
id: open-webpage
title: Open webpage
---

L'action **Open webpage** ouvre une URL dans un nouvel onglet du navigateur lorsqu'un événement se produit.

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| URL | L'URL de la page web à ouvrir | — |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/open-webpage/open-v3.png" alt="ToolJet - Action reference - Open webpage"/>

## Déclenchement via RunJS

Cette action n'est pas exposée via l'API RunJS `actions.*`. Puisqu'une requête RunJS peut exécuter du JavaScript arbitraire, vous pouvez ouvrir une page web directement avec l'API native du navigateur :

```js
window.open('<url>', '_blank');
```

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
