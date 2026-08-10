---
id: switch-page
title: Switch Page
---

L'action **Switch Page** navigue vers une autre page au sein d'une [application multipage](/docs/app-builder/events/use-case/page-nav). Utilisez-la avec n'importe quel gestionnaire d'événements pour créer une navigation interne à l'application.

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| Page | La page vers laquelle naviguer | — |
| Query params | Paires clé-valeur optionnelles ajoutées à l'URL de la page cible | Vide |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/switch-page/switch-page.png" alt="ToolJet - Action Reference - Page Switching"/>

## Query params

Les paramètres de requête (query params) sont composés de paires clé-valeur, où la `clé` et la `valeur` sont séparées par un signe égal (`=`), et sont ajoutés à la fin de l'URL de la page cible, précédés d'un point d'interrogation (`?`). Plusieurs paramètres de requête peuvent être ajoutés en cliquant sur le bouton `+`.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/actions/page/queryparam1.png" alt="ToolJet - Action Reference - Page Switching"/>

</div>

Dans la capture d'écran ci-dessus, `username` est la clé et sa valeur est `{{globals.currentUser.email}}`, qui se résout dynamiquement en l'e-mail de l'utilisateur connecté. Lorsque le bouton déclenche l'action `Switch Page`, l'URL de la page cible transporte ce paramètre. Les paramètres de requête sont couramment utilisés pour le filtrage, la pagination, le tri, ou pour transmettre du contexte à la page cible.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/actions/page/queryparam2.png" alt="ToolJet - Action Reference - Page Switching"/>

</div>

## Déclenchement via RunJS

```js
await actions.switchPage('<page-handle>');
```

### Changer de page avec des paramètres de requête

```js
actions.switchPage('<pageHandle>', [
  ['param1', 'value1'],
  ['param2', 'value2'],
]);
```

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
