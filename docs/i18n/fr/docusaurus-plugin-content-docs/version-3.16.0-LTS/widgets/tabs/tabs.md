---
id: tabs
title: Tabs
slug: /widgets/tabs/
---

Le composant **Tabs** vous permet d'organiser le contenu en plusieurs onglets, ce qui facilite la gestion et l'affichage de différentes sections d'informations dans un espace compact. Chaque onglet peut contenir d'autres composants et widgets, offrant ainsi un moyen clair de structurer l'interface de votre application.

:::caution Composants restreints
Certains composants, à savoir **Calendar** et **Kanban**, ne peuvent pas être placés à l'intérieur de Tabs.
:::

## Options

Ajoutez, supprimez et configurez les onglets du composant. Vous pouvez également utiliser **Dynamic options** pour générer des onglets à partir d'un tableau d'objets.

### Dynamic Options

Utilisez **Dynamic options** pour peupler dynamiquement les onglets à partir d'un tableau d'objets, qui peut inclure les propriétés suivantes :

| Propriété | Type   | Description | 
|--------- |--------|-------------|
| title    | String | Le libellé affiché sur l'onglet. | 
| id       | String | Un identifiant unique pour l'onglet.| 
| icon     | String | L'icône à afficher à côté du titre de l'onglet. | 
| iconVisibility | Boolean	| Contrôle si l'icône de l'onglet est affichée. |
| backgroundColor | String	| Définit la couleur d'arrière-plan de l'onglet. |
| loading | Boolean | Affiche l'état de chargement de l'onglet lorsque défini sur `true`. |
| visible  | Boolean | Contrôle si l'onglet est visible. |
| disable  | Boolean | Désactive l'onglet lorsque défini sur `true`. |


L'exemple suivant montre la structure d'objet acceptée par la propriété Dynamic options.
 
```javascript
[
  {
    title: "Home",
    id: "home",
    visible: true,
    disable: false,
    icon: "IconHome2",
    iconVisibility: true,
    backgroundColor: "#FFFFFF"
  }
]
```

## Événements

| Événement         | Description                                                    |
| :------------ | :------------------------------------------------------------- |
| On tab switch | Se déclenche chaque fois que l'utilisateur passe d'un onglet à un autre.   |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des Component Specific Actions (CSA) ; vous pouvez les déclencher via un événement ou à l'aide d'une requête RunJS.

| <div style={{ width:"130px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"200px"}}> Comment y accéder </div> |
| :-------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| setTab()                                     | Définit l'onglet actuellement actif par son ID.                   | `components.tabs1.setTab('0')`                        |
| setTabDisable()                              | Désactive ou active un onglet spécifique.                    | `components.tabs1.setTabDisable('0', true)`           |
| setTabLoading()                              | Définit l'état de chargement d'un onglet spécifique.              | `components.tabs1.setTabLoading('0', true)`           |
| setTabVisibility()                           | Affiche ou masque un onglet spécifique.                         | `components.tabs1.setTabVisibility('0', false)`       |
| setVisibility()                              | Définit la visibilité de l'ensemble du composant.           | `components.tabs1.setVisibility(false)`               |
| setLoading()                                 | Définit l'état de chargement du composant.               | `components.tabs1.setLoading(true)`                   |
| setDisable()                                 | Désactive le composant.                                | `components.tabs1.setDisable(true)`                   |


## Variables exposées

| <div style={{ width:"100px"}}> Variable </div> | Description | Comment y accéder |
| :----------- | :-----------| :------------ |
| currentTab       | Contient l'ID de l'onglet actuellement actif.            | `{{components.tabs1.currentTab}}`       |
| currentTabTitle  | Contient le titre de l'onglet actuellement actif.         | `{{components.tabs1.currentTabTitle}}`  |
| isVisible        | Indique si le composant est visible.                | `{{components.tabs1.isVisible}}`        |
| isDisabled       | Indique si le composant est désactivé.               | `{{components.tabs1.isDisabled}}`       |
| isLoading        | Indique si le composant est en cours de chargement.                | `{{components.tabs1.isLoading}}`        |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Collapse when hidden | Réduit l'espace de mise en page du composant lorsqu'il est masqué. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Hide tabs | Masque les en-têtes d'onglets tout en gardant le contenu visible. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Render only active tab | Lorsque cette option est activée, seul le contenu de l'onglet actuellement actif est rendu. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Scroll to top on tab switch | Fait défiler automatiquement vers le haut le nouvel onglet sélectionné chaque fois que l'utilisateur change d'onglet. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Dynamic height | Ajuste automatiquement la hauteur du composant pour s'adapter au contenu de l'onglet actif. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une valeur de chaîne à afficher. | String (par ex., `Switch between sections.` ). |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Tabs

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div>                        | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------- | :----------------------------------------------------------------------- | :---------------------------------------------------------- |
| Header background                              | Définit la couleur d'arrière-plan de l'en-tête.                                | Sélectionnez un thème ou choisissez dans le sélecteur de couleurs.                 |
| Divider                                        | Définit la couleur du séparateur.                                                  | Sélectionnez un thème ou choisissez dans le sélecteur de couleurs.                 |
| Unselected text                                | Définit la couleur du texte non sélectionné.                                      | Sélectionnez un thème ou choisissez dans le sélecteur de couleurs.                 |
| Selected text                                  | Définit la couleur du texte sélectionné.                                        | Sélectionnez un thème ou choisissez dans le sélecteur de couleurs.                 |
| Hover Background                               | Définit la couleur d'arrière-plan de l'onglet survolé.                               | Sélectionnez un thème ou choisissez dans le sélecteur de couleurs.                 |
| Unselected Icon                                | Définit la couleur de l'icône non sélectionnée.                                      | Sélectionnez un thème ou choisissez dans le sélecteur de couleurs.                 |
| Selected Icon                                  | Définit la couleur de l'icône sélectionnée.                                        | Sélectionnez un thème ou choisissez dans le sélecteur de couleurs.                 |
| Accent                                         | Définit la couleur d'accentuation.                                                   | Sélectionnez un thème ou choisissez dans le sélecteur de couleurs.                 |
| Tab width                                      | Sélectionne la largeur des onglets.                                                    | Choisissez entre **Auto** ou **Equally split**.               |
| Transition                                     | Choisit un effet de transition pour contrôler la façon dont le contenu change entre les onglets. | Choisissez entre **Slide** ou **None**.                       |

### Container

| <div style={{ width:"200px"}}> Propriété </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------- | :------------------------------------------------ | :------------------------------------------------------------------------------- |
| Common background color | Définit la couleur d'arrière-plan par défaut de toutes les zones de contenu des onglets. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique un code couleur Hex. |
| Border | Définit la couleur de bordure du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique un code couleur Hex. |
| Border radius | Modifie le rayon de bordure du composant. | Saisissez un nombre ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique une valeur numérique. |
| Box shadow | Définit les propriétés d'ombre du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées, ou définissez-la de manière programmatique via **fx**. |
| Padding | Contrôle le remplissage à l'intérieur du composant. | Sélectionnez **Default** pour un remplissage standard ou **None** pour aucun remplissage. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide de **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan inclut la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::

:::info
Toute propriété disposant d'un bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
::: 
