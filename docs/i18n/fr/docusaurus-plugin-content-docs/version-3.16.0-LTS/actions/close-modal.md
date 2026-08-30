---
id: close-modal
title: Close modal
---

L'action **Close modal** ferme un composant Modal actuellement ouvert.

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| Modal | Le composant Modal à fermer | — |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/closemodal/closemodal-v2.png" alt="ToolJet - Action reference - Close modal"/>

## Déclenchement via RunJS

```js
actions.closeModal('<modalName>');
```

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
