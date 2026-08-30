---
id: show-alert
title: Show alert
---

L'action **Show alert** affiche un message d'alerte sur le canvas de l'application. Utilisez-la pour donner un retour à l'utilisateur après un événement — par exemple, pour confirmer un enregistrement, ou avertir d'une saisie invalide.

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| Alert type | Le style de l'alerte : **Info**, **Success**, **Warning** ou **Error** | Info |
| Message | Le texte à afficher dans l'alerte | Vide |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/show-alert/show-alert-v2.png" alt="ToolJet - Action reference -  Show Alert"/>

## Déclenchement via RunJS

```js
actions.showAlert('<alertType>', '<message>');
```

`alertType` est l'un des types `info`, `success`, `warning` ou `danger` (`danger` correspond au type **Error** dans le panneau Events).

**Exemple :**

```js
actions.showAlert('error', 'This is an error');
```

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
