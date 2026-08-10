---
id: copy-to-clipboard
title: Copy to clipboard
---

L'action **Copy to clipboard** copie du texte dans le presse-papiers de l'utilisateur.

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| Content to copy | Le texte à copier dans le presse-papiers | — |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/copytoclipboard/copy-v3.png" alt="ToolJet - Action reference - Copy to clipboard" />

## Déclenchement via RunJS

```js
actions.copyToClipboard('<contentToCopy>');
```

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
