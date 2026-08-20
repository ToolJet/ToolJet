---
id: logout
title: Logout
---

L'action **Logout** déconnecte l'utilisateur actuel de sa session de workspace ToolJet active. Elle efface toutes les données de session stockées localement et redirige l'utilisateur vers la page de connexion. Utilisez cette action pour créer des parcours de déconnexion sécurisés déclenchés par des boutons, des minuteurs ou tout autre événement de composant.

## Configuration

| Paramètre | Description                                              | Par défaut          |
| --------- | -------------------------------------------------------- | ---------------- |
| Debounce  | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

Définissez une valeur numérique dans le champ **Debounce** pour retarder la déconnexion. Par exemple, saisir `300` déclenchera la déconnexion après 300 ms.

<img className="screenshot-full img-s" src="/img/actions/logout/logout-v3.png" alt="ToolJet - Action reference - Logout" />

## Comportement

- Efface toutes les données de session stockées localement.
- Redirige l'utilisateur vers la page de connexion du workspace après la déconnexion.

:::info Standalone App URLs
Si votre application est accessible via une URL autonome (standalone), la déconnexion redirige l'utilisateur vers la page de connexion spécifique à l'application plutôt que vers la page de connexion du workspace. Consultez [Authentication for Standalone Application URLs](/docs/development-lifecycle/release/share-app#authentication-for-standalone-application-urls) pour plus de détails.
:::

## Déclenchement via RunJS

Vous pouvez déclencher l'action de déconnexion de manière programmatique depuis une requête RunJS :

```js
await actions.logout();
```

:::info
Pour un guide complet sur le déclenchement d'actions depuis RunJS, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
