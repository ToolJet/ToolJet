---
id: show-modal
title: Show modal
---

L'action **Show modal** ouvre un composant Modal lorsqu'un événement se produit.

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| Modal | Le composant Modal à ouvrir | — |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/showmodal/showmodal-v3.png" alt="ToolJet - Action reference - Show modal" />

## Déclenchement via RunJS

```js
actions.showModal('<modalName>');
```

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
