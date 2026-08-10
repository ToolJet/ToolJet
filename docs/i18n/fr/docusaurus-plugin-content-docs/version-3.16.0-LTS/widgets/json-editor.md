---
id: json-editor
title: JSON Editor
---

Le composant **JSON Editor** fournit un éditeur de code complet pour écrire et modifier des données JSON directement dans votre application. Il inclut la coloration syntaxique, le repliement de code, la correspondance des accolades et une validation en temps réel, ce qui en fait un choix idéal pour créer des panneaux de configuration, des constructeurs de requêtes API, ou toute interface où les utilisateurs doivent saisir du JSON structuré.

## Exemple d'utilisation

Une équipe DevOps développe un outil interne pour gérer des feature flags sur plusieurs services. Le composant JSON Editor permet aux ingénieurs de modifier directement la configuration des flags en JSON, avec une coloration syntaxique et une validation qui détecte immédiatement les entrées malformées avant leur enregistrement dans la base de données.

## Propriétés

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
|:----------- |:----------- |:----------------- |
| JSON | Définit les données JSON affichées dans l'éditeur. | Un `Object` ou `Array` JSON valide. |
| Theme | Définit le thème de couleur de l'éditeur. | Sélectionnez parmi : `monokai`, `solarized` (par défaut), `tomorrow`, ou `bespin`. |

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) :

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
| :------------ | :---------- | :------------ |
| setValue | Définit la valeur JSON de l'éditeur. Accepte un objet ou un tableau JSON. | `components.jsoneditor1.setValue({key: "value"})` |
| setLoading | Bascule l'état de chargement de l'éditeur. | `components.jsoneditor1.setLoading(true)` |
| setVisibility | Bascule la visibilité de l'éditeur. | `components.jsoneditor1.setVisibility(false)` |
| setDisable | Bascule l'état désactivé de l'éditeur. | `components.jsoneditor1.setDisable(true)` |

## Variables exposées

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
|:--------|:-----------|:------------|
| value | Contient la valeur JSON actuelle de l'éditeur sous forme d'objet analysé. | `{{components.jsoneditor1.value}}` |
| isValid | Renvoie `true` si le contenu actuel est un JSON valide, `false` sinon. | `{{components.jsoneditor1.isValid}}` |
| isVisible | Renvoie l'état de visibilité actuel du composant. | `{{components.jsoneditor1.isVisible}}` |
| isLoading | Renvoie l'état de chargement actuel du composant. | `{{components.jsoneditor1.isLoading}}` |
| isDisabled | Renvoie l'état désactivé actuel du composant. | `{{components.jsoneditor1.isDisabled}}` |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:------------------|:------------|:------------------------------|
| Expand entire JSON | Contrôle si l'arborescence JSON est entièrement développée ou repliée au chargement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Dynamic height | Ajuste automatiquement la hauteur du composant en fonction de son contenu. S'applique uniquement en mode visualisation. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Loading state      | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility         | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable            | Désactive le composant et rend l'éditeur en lecture seule. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip            | Fournit des informations supplémentaires au survol. Définissez une chaîne de caractères à afficher. | Chaîne de caractères (ex. `Edit your JSON configuration here.`). |

## Appareils

|<div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Container

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Background | Définit la couleur de fond de l'éditeur. | Sélectionnez une couleur dans le sélecteur de couleur ou définissez-la de manière programmatique avec **fx**. |
| Border color | Définit la couleur de la bordure du conteneur de l'éditeur. | Sélectionnez une couleur dans le sélecteur de couleur ou définissez-la de manière programmatique avec **fx**. |
| Border radius | Définit le rayon des coins du conteneur de l'éditeur. | Saisissez une valeur numérique (par défaut : `6`) ou définissez-la de manière programmatique avec **fx**. |
| Box shadow | Définit l'ombre autour du conteneur de l'éditeur. | Utilisez le sélecteur d'ombre ou définissez-la de manière programmatique avec **fx**. |

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
