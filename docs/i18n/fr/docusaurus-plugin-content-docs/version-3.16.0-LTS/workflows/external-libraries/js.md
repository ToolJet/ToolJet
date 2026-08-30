---
id: js
title: JavaScript
---

<br/>

Les workflows ToolJet vous permettent d'importer des **packages npm** dans votre workflow afin que chaque nœud JavaScript puisse les utiliser. Une fois qu'un package est ajouté, il est intégré (bundled) et disponible dans tous les nœuds JavaScript de cette version de workflow.

:::info
La prise en charge des bibliothèques externes pour les workflows est disponible sur les plans **Enterprise Edition**.
:::

## Ajouter des packages

1. Ouvrez votre workflow dans l'éditeur.
2. Cliquez sur l'icône **Packages** dans la barre latérale gauche pour ouvrir le panneau du gestionnaire de packages.
3. Saisissez un nom de package (par exemple, `lodash`) dans le champ de recherche — les résultats sont récupérés depuis le registre npm.
4. Sélectionnez le package et la version que vous souhaitez installer, puis cliquez sur **Add**.
5. Le package est ajouté à la liste des dépendances du workflow et une compilation du bundle démarre automatiquement.

Vous pouvez ajouter plusieurs packages avant la fin de la compilation du bundle. Le bundle est régénéré avec toutes les dépendances actuelles.

## Utiliser des packages dans les nœuds JavaScript

Une fois que le statut du bundle est **Ready**, vous pouvez `import` directement les packages dans n'importe quel nœud JavaScript :

```js
import lodash from 'lodash';
import { v4 as uuidv4 } from 'uuid';

const grouped = lodash.groupBy(getOrders.data, 'status');

return {
    requestId: uuidv4(),
    summary: grouped
};
```

Les packages sont disponibles pour tous les nœuds JavaScript du workflow — vous n'avez pas besoin de les importer séparément pour chaque nœud.

## Supprimer des packages

1. Ouvrez le panneau du gestionnaire de packages.
2. Cliquez sur l'icône **Remove** à côté du package que vous souhaitez supprimer.
3. Le bundle est régénéré automatiquement sans le package supprimé.

<!-- 
## Limitations

- **Enterprise only** — package management is not available in the Community Edition.
- **npm packages only** — packages must be published to the npm registry.
- **Bundle per workflow version** — each workflow version maintains its own independent set of dependencies.
- **No native add-ons** — packages that require native C/C++ compilation during install are not supported. Pure JavaScript and pre-compiled packages work. -->

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
