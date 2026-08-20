---
id: button
title: Button
---

Le composant **Button** peut être utilisé pour déclencher une action — comme soumettre un formulaire, naviguer vers une autre page ou exécuter une requête. Dans ce document, nous passerons en revue toutes les options de configuration du composant **Button**.

## Propriétés

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"200px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Label | Texte à afficher sur le bouton. | Chaîne (par ex., `Submit`). |

## Événements

| Événement | Description |
| :---- | :---------- |
| On click | Se déclenche chaque fois que l'utilisateur clique sur le bouton. |
| On hover | Se déclenche chaque fois que l'utilisateur déplace le curseur de la souris sur le bouton. |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant Button peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA). Vous pouvez les déclencher via un événement ou une requête RunJS.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"200px"}}> Comment y accéder </div> |
| :------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| click() | Déclenche programmatiquement un clic de bouton. | `components.button1.click()` |
| setText() | Définit le label affiché sur le bouton. | `components.button1.setText('Update')` |
| setVisibility() | Définit la visibilité du composant. | `components.button1.setVisibility(false)` |
| setLoading() | Définit l'état de chargement du composant. | `components.button1.setLoading(true)` |
| setDisable() | Active ou désactive le composant. | `components.button1.setDisable(true)` |

## Variables exposées

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | Comment y accéder |
| :--------------------------------------------- | :------------------------------------------------ | :------------ |
| buttonText | Contient le texte actuellement affiché sur le bouton. | `{{components.button1.buttonText}}` |
| isLoading | Indique si le composant est en état de chargement. | `{{components.button1.isLoading}}` |
| isVisible | Indique si le composant est visible. | `{{components.button1.isVisible}}` |
| isDisabled | Indique si le composant est désactivé. | `{{components.button1.isDisabled}}` |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Collapse when hidden | Réduit l'espace occupé par le composant lorsqu'il est masqué, afin que les composants environnants remplissent l'espace. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Affiche une infobulle informative lorsque l'utilisateur survole le composant. | Chaîne (par ex., `Button to Submit Form`). |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

---

## Styles

### Button

| <div style={{ width:"130px"}}> Propriété du bouton </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :---------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Type | Définit le style de remplissage du bouton. | Sélectionnez `Solid` pour un bouton rempli ou `Outline` pour un bouton transparent avec une bordure. |
| Background | Définit la couleur d'arrière-plan du bouton. Disponible uniquement pour le type `Solid`. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement un code couleur Hex. |
| Text color | Définit la couleur du label du bouton. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement un code couleur Hex. |
| Font size | Définit la taille de police du label du bouton. | Saisissez un nombre (en pixels) ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement une valeur numérique. |
| Font weight | Définit le poids (épaisseur) du texte du label du bouton. | Sélectionnez parmi `Normal`, `Medium`, `Bold`, `Lighter` ou `Bolder`. |
| Border color | Définit la couleur de bordure du bouton. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement un code couleur Hex. |
| Loader color | Définit la couleur de l'indicateur de chargement affiché pendant l'état de chargement. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement un code couleur Hex. |
| Content alignment | Définit l'alignement horizontal du label et de l'icône du bouton. | Sélectionnez `Left`, `Center` ou `Right` à l'aide des boutons d'alignement. |
| Icon | Ajoute une icône à côté du label du bouton. | Activez la visibilité de l'icône, puis sélectionnez une icône et définissez sa couleur. |
| Icon color | Définit la couleur de l'icône. Visible uniquement lorsqu'une icône est activée. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement un code couleur Hex. |
| Icon direction | Définit si l'icône apparaît à gauche ou à droite du label. | Sélectionnez **Left** ou **Right** à l'aide des bascules d'icône. |
| Border radius | Arrondit les coins du bouton. | Saisissez un nombre ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement une valeur numérique. |
| Box shadow | Définit l'ombre du bouton. Disponible uniquement pour le type `Solid`. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées ou définissez-la programmatiquement via **fx**. |

### Container

| <div style={{ width:"130px"}}> Propriété du conteneur </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Hover background | Contrôle la couleur d'arrière-plan lorsque le bouton est survolé. Disponible uniquement pour le type `Solid`. | Sélectionnez `Auto` pour dériver automatiquement la couleur de survol, ou `Manual` pour définir une couleur personnalisée à l'aide du sélecteur de couleur ou de **fx**. |
| Padding | Contrôle le padding autour du bouton. | Sélectionnez `Default` pour conserver le padding standard ou `None` pour supprimer tout le padding. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée via les **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** est disponible uniquement si votre plan inclut la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::
