---
id: reorderable-list
title: Reorderable List
---

Le composant **Reorderable List** permet aux utilisateurs d'organiser une liste d'éléments en les faisant glisser-déposer dans l'ordre souhaité. Il est utile pour créer des interfaces de priorisation, de tri de tâches, ou tout workflow où l'ordre des éléments compte.

Chaque élément de la liste prend en charge les formats de label texte brut, Markdown et HTML, ce qui vous donne de la flexibilité dans la façon dont les éléments sont affichés.

## Exemple d'utilisation

Un chef de projet doit créer un tableau de planification de sprint où l'équipe peut prioriser les éléments du backlog. À l'aide du composant Reorderable List, les membres de l'équipe peuvent faire glisser les tâches vers le haut ou le bas pour définir leur ordre de priorité. L'ordre mis à jour est capturé via l'événement `On change` et peut être renregistré dans la base de données.

## Propriétés

Les éléments de la liste peuvent être configurés soit statiquement, soit dynamiquement.

Pour ajouter une **Static options**, cliquez sur le bouton **+ Add new option**, puis configurez l'élément avec un label, une valeur et un format.

Pour utiliser les **dynamic options**, activez le bouton bascule **Dynamic options** et fournissez un schéma. Le schéma accepte un tableau d'objets, chacun avec les propriétés `label`, `value` et `format`.

<details id="tj-dropdown">
<summary>**Exemple de schéma**</summary>

```json
[
  { "label": "Card1", "value": "1", "format": "plain" },
  { "label": "Card2", "value": "2", "format": "plain" },
  { "label": "**Bold Card**", "value": "3", "format": "markdown" }
]
```

</details>

## Événements

| Événement     | Description                                              |
| :-------- | :------------------------------------------------------- |
| On change | Se déclenche chaque fois qu'un élément est réordonné par glisser-déposer. |

:::info
Consultez la documentation de [référence des actions](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA). Vous pouvez les déclencher via un événement ou à l'aide d'une requête RunJS.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div> |
| :------------ | :---------- | :------------ |
| setVisibility | Définit la visibilité du composant.    | `components.reorderablelist1.setVisibility(false)` |
| setDisable    | Désactive le composant.                  | `components.reorderablelist1.setDisable(true)`     |
| setLoading    | Définit l'état de chargement du composant. | `components.reorderablelist1.setLoading(true)`     |

## Variables exposées

| Variable   | <div style={{ width:"250px"}}> Description </div>                                    | Comment y accéder                                    |
| :--------- | :----------------------------------------------------------------------------------- | :----------------------------------------------- |
| options    | Contient la liste actuelle des éléments dans leur ordre présent, y compris le label, la valeur et le format. | `{{components.reorderablelist1.options}}`   |
| values     | Contient un tableau des valeurs des éléments de la liste dans leur ordre actuel.                  | `{{components.reorderablelist1.values}}`         |
| isVisible  | Indique si le composant est visible.                                                | `{{components.reorderablelist1.isVisible}}`      |
| isDisabled | Indique si le composant est désactivé.                                               | `{{components.reorderablelist1.isDisabled}}`     |
| isLoading  | Indique si le composant est en cours de chargement.                                                | `{{components.reorderablelist1.isLoading}}`      |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :-------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une valeur chaîne pour l'affichage. | Chaîne de caractères (par ex., `Drag items to reorder.`). |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Text

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :---------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Text | Définit la couleur de texte des éléments de la liste. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de façon programmatique un code couleur hexadécimal. |
| Padding | Ajoute un espacement entre le contenu du composant et la limite de son conteneur. | Sélectionnez `Default` pour un espacement standard ou `None` pour supprimer l'espacement. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée avec les **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Avancé** est disponible uniquement si votre forfait inclut la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)**.
:::

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
