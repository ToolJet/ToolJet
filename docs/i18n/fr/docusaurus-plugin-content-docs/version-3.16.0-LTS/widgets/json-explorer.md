---
id: json-explorer
title: JSON Explorer
---

Le composant **JSON Explorer** affiche les données JSON sous forme d'arborescence repliable au sein de votre application. Il fournit une visualisation en lecture seule d'objets et de tableaux imbriqués complexes avec des valeurs en coloration syntaxique, ce qui le rend utile pour afficher les réponses d'API, déboguer les résultats de requêtes, ou permettre aux utilisateurs d'inspecter des données structurées sans les modifier.

## Exemple d'utilisation

Une équipe support utilise un outil interne pour consulter les détails clients par ID. L'application récupère la fiche client depuis une API et affiche la réponse JSON complète dans un JSON Explorer, permettant à l'agent support d'explorer rapidement des champs imbriqués tels que l'historique des commandes, les moyens de paiement et les préférences, sans avoir à construire d'interface personnalisée pour chaque forme de données.

## Propriétés

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
|:----------- |:----------- |:----------------- |
| JSON | Définit les données JSON à afficher dans la vue arborescente. | Un `Object` ou `Array` JSON valide. |
| Theme | Définit le thème de couleur de la vue arborescente. | Sélectionnez parmi : `monokai`, `solarized` (par défaut), `tomorrow`, ou `bespin`. |

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) :

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
| :------------ | :---------- | :------------ |
| setValue | Définit les données JSON affichées dans l'explorateur. Accepte un objet ou un tableau JSON. | `components.jsonexplorer1.setValue({key: "value"})` |
| setLoading | Bascule l'état de chargement de l'explorateur. | `components.jsonexplorer1.setLoading(true)` |
| setVisibility | Bascule la visibilité de l'explorateur. | `components.jsonexplorer1.setVisibility(false)` |
| setDisable | Bascule l'état désactivé de l'explorateur. | `components.jsonexplorer1.setDisable(true)` |

## Variables exposées

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
|:--------|:-----------|:------------|
| value | Contient les données JSON actuellement affichées dans l'explorateur. | `{{components.jsonexplorer1.value}}` |
| isVisible | Renvoie l'état de visibilité actuel du composant. | `{{components.jsonexplorer1.isVisible}}` |
| isLoading | Renvoie l'état de chargement actuel du composant. | `{{components.jsonexplorer1.isLoading}}` |
| isDisabled | Renvoie l'état désactivé actuel du composant. | `{{components.jsonexplorer1.isDisabled}}` |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:------------------|:------------|:------------------------------|
| Expand entire JSON | Contrôle si l'arborescence JSON est entièrement développée ou repliée au chargement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show root node | Contrôle si le libellé du nœud racine est affiché dans l'arborescence. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Dynamic height | Ajuste automatiquement la hauteur du composant en fonction de son contenu. S'applique uniquement en mode visualisation. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Loading state      | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility         | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable            | Désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip            | Fournit des informations supplémentaires au survol. Définissez une chaîne de caractères à afficher. | Chaîne de caractères (ex. `Inspect the API response below.`). |

## Appareils

|<div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Container

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Background | Définit la couleur de fond de l'explorateur. | Sélectionnez une couleur dans le sélecteur de couleur ou définissez-la de manière programmatique avec **fx**. |
| Border color | Définit la couleur de la bordure du conteneur de l'explorateur. | Sélectionnez une couleur dans le sélecteur de couleur ou définissez-la de manière programmatique avec **fx**. |
| Border radius | Définit le rayon des coins du conteneur de l'explorateur. | Saisissez une valeur numérique (par défaut : `6`) ou définissez-la de manière programmatique avec **fx**. |
| Box shadow | Définit l'ombre autour du conteneur de l'explorateur. | Utilisez le sélecteur d'ombre ou définissez-la de manière programmatique avec **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide de **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::

:::info
Toute propriété disposant d'un bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Signalez-le via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
