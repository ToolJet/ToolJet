---
id: set-localstorage
title: Set localStorage
---

L'action **Set localStorage** stocke une paire `key`/`value` dans le stockage local (local storage) du navigateur. Ceci est utile pour sauvegarder les valeurs d'un formulaire afin que les utilisateurs ne les perdent pas lors d'un rechargement, ou pour stocker des données qui ne doivent pas être persistées dans la base de données.

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| Key | Nom (chaîne de caractères) sous lequel la valeur est stockée | — |
| Value | La valeur à stocker | — |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/localstorage/set-local-storage-v2.png" alt="ToolJet - Action reference - Set Local Storage" />

## Déclenchement via RunJS

```js
actions.setLocalStorage('<key>', '<value>');
```

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
