---
id: toggle-app-mode
title: Toggle App Mode
---

L'action **Toggle App Mode** bascule le thème rendu de l'application entre clair et sombre à l'exécution.

:::note
Cette action n'a d'effet que lorsque le paramètre global **App mode** de l'application (App Builder → barre latérale gauche → Global Settings) est défini sur **Auto**. Si App mode est fixé sur **Light** ou **Dark**, cette action n'a aucun effet.
:::

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| App mode | Le thème vers lequel basculer : **Light** ou **Dark**. Si ce champ est laissé vide, l'action bascule vers l'opposé du thème actuel de l'application. | Vide |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/toggle-app-mode/toggle-app-mode.png" alt="ToolJet - Action reference - Toggle App Mode" />

## Comportement

- Ne prend effet que lorsque le paramètre global **App mode** de l'application est réglé sur **Auto** — sinon, l'action n'a aucun effet.
- Si aucune valeur n'est fournie (dans le panneau Events ou via RunJS), elle bascule vers l'opposé du thème actuel.
- Persiste le thème sélectionné dans le stockage local du navigateur, afin qu'il soit conservé lors d'un rechargement.

## Déclenchement via RunJS

```js
actions.toggleAppMode();
// ou
actions.toggleAppMode('dark');
actions.toggleAppMode('light');
```

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
