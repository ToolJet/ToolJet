---
id: unset-all-var
title: Unset All Variables
---

Utilisez cette action pour désactiver (unset) en une seule fois toutes les variables au niveau de l'application.

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| Run Only If | Condition optionnelle déterminant si cette action s'exécute | Vide |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/unsetAllVar/unsetAllVar-v2.png" alt="ToolJet - Action reference - Unset All Variables" />

## Déclenchement via RunJS

```js
actions.unsetAllVariables();
```

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
