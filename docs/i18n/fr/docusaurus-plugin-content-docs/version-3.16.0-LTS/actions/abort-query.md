---
id: abort-query
title: Abort Query
---

Cette action arrête une requête en cours d'exécution, déclenchée via **Run** ou **Preview** et toujours en attente d'une réponse, lorsqu'un événement se produit.

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| Query | La requête à interrompre | — |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/abort-query/abort-query.png" alt="ToolJet - Action reference -  Abort Query" />

## Comportement

- Abort annule uniquement la requête en attente côté client. Si la source de données (par exemple, une base de données) a déjà commencé à traiter la requête, celle-ci peut continuer à s'exécuter de son côté jusqu'à ce qu'elle se termine d'elle-même.
- Abort n'est pas disponible pour les requêtes **RunJS**, **RunPy** et **Workflow**, car elles ne s'exécutent pas sous forme de requêtes réseau annulables.

## Déclenchement via RunJS

```js
queries.<queryName>.abort();
```
ou
```js
await actions.abortQuery('<queryName>');
```

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
