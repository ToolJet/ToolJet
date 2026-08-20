---
id: accordion
title: Accordion
---

Le composant **Accordion** est un conteneur repliable qui vous permet de regrouper et d'organiser des composants sous une section extensible/repliable avec un en-tête. Il aide à réduire l'encombrement visuel en permettant aux utilisateurs d'afficher ou de masquer du contenu à la demande, ce qui le rend idéal pour créer des mises en page structurées, des panneaux de paramètres et des formulaires à plusieurs sections.

## Exemple d'utilisation

Une équipe de support client doit créer une page de détails de ticket où différentes sections (informations client, historique des commandes, notes internes) sont affichées. Grâce au composant Accordion, chaque section peut être placée dans son propre panneau repliable, ce qui permet aux agents de développer uniquement la section dont ils ont besoin, gardant ainsi l'interface claire et ciblée.

## Propriétés

| <div style={{ width:"150px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show header | Active ou désactive la visibilité de l'en-tête de l'accordéon, qui inclut la zone de titre et le chevron d'expansion/repli. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Événements

| Événement   | Description                                           |
| :---------- | :---------------------------------------------------- |
| On expand   | Se déclenche lorsque l'accordéon est développé.       |
| On collapse | Se déclenche lorsque l'accordéon est replié.           |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA). Vous pouvez les déclencher via un événement ou via une requête RunJS.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div> |
| :------------ | :---------- | :------------ |
| expand        | Développe l'accordéon pour révéler son contenu.    | `components.accordion1.expand()`          |
| collapse      | Replie l'accordéon pour masquer son contenu.       | `components.accordion1.collapse()`        |
| setVisibility | Définit la visibilité du composant.                | `components.accordion1.setVisibility(false)` |
| setDisable    | Désactive le composant.                            | `components.accordion1.setDisable(true)`  |
| setLoading    | Définit l'état de chargement du composant.         | `components.accordion1.setLoading(true)`  |

## Variables exposées

| Variable   | <div style={{ width:"250px"}}> Description </div>           | Comment y accéder                              |
| :--------- | :----------------------------------------------------------- | :----------------------------------------- |
| isExpanded | Indique si l'accordéon est actuellement développé.            | `{{components.accordion1.isExpanded}}`     |
| isVisible  | Indique si le composant est visible.                          | `{{components.accordion1.isVisible}}`      |
| isDisabled | Indique si le composant est désactivé.                        | `{{components.accordion1.isDisabled}}`     |
| isLoading  | Indique si le composant est en cours de chargement.           | `{{components.accordion1.isLoading}}`      |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :-------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une valeur de chaîne à afficher. | Chaîne (par ex., `Click to expand details.`). |
| Dynamic height | Permet à l'accordéon d'ajuster automatiquement sa hauteur en fonction du contenu qu'il contient. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Header

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :---------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Background | Définit la couleur d'arrière-plan de l'en-tête de l'accordéon. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement un code couleur Hex. |
| Chevron icon | Définit la couleur du chevron d'expansion/repli dans l'en-tête. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement un code couleur Hex. |
| Divider | Définit la couleur de la ligne de séparation entre l'en-tête et la zone de contenu. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement un code couleur Hex. |

### Container

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :---------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Background | Définit la couleur d'arrière-plan de la zone de contenu de l'accordéon. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement un code couleur Hex. |
| Border color | Définit la couleur de la bordure de l'accordéon. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement un code couleur Hex. |
| Border radius | Modifie le rayon de bordure de l'accordéon. | Saisissez un nombre ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement une valeur numérique. |
| Box shadow | Définit les propriétés d'ombre du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées ou définissez-la programmatiquement via **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée via les **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** est disponible uniquement si votre plan inclut la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [Communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
