---
id: unset-all-page-var
title: Unset All Page Variables
---

Utilisez cette action pour désactiver (unset) en une seule fois toutes les variables au niveau de la page sur la page actuelle.

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| Run Only If | Condition optionnelle déterminant si cette action s'exécute | Vide |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/unsetAllPageVar/unsetAllPageVar-v2.png" alt="ToolJet - Action reference - Unset All Page Variables" />

## Déclenchement via RunJS

```js
actions.unsetAllPageVariables();
```

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
