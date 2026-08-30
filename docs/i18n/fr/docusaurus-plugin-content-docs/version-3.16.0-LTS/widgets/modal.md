---
id: modal-v2
title: Modal
---

Le composant Modal vous permet d'afficher du contenu dans une fenêtre de superposition, ce qui aide à concentrer l'attention de l'utilisateur sur des tâches ou des messages spécifiques sans quitter la page actuelle. Il est couramment utilisé pour les formulaires, les confirmations, les alertes ou les vues détaillées. Vous pouvez ouvrir ou fermer le modal de manière programmatique, contrôler sa visibilité en fonction de l'interaction utilisateur, et personnaliser sa taille, sa position et son contenu pour une expérience utilisateur fluide.

:::caution Composants restreints
Certains composants, à savoir **Calendar** et **Kanban**, ne peuvent pas être placés dans le composant Modal.
:::

## Propriétés

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"200px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Header | Activer ou désactiver la section header dans le modal. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Footer | Activer ou désactiver la section footer dans le modal. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Width | Sélectionnez la largeur du composant modal. | Sélectionnez dans la liste déroulante - small, medium, large, fullscreen ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Height | Spécifie la hauteur du modal. | Saisissez la hauteur en pixels ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Événements

| Événement | Description                            |
| :------- | :------------------------------------- |
| On open  | Se déclenche chaque fois que le modal est ouvert. |
| On close | Se déclenche chaque fois que le modal est fermé. |

:::info
Consultez la documentation de la **[Référence des actions](/docs/actions/run-query)** pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA), vous pouvez les déclencher via un événement ou utiliser une requête RunJS.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"170px"}}> Description </div> | <div style={{width: "200px"}}> Requête RunJS </div> |
| :------------------------------------------- | :------------------------------------------------ | :------------------------------------------------ |
| open                                         | Ouvre un modal.                                     | `components.modal1.open()`                        |
| close                                        | Ferme un modal.                                    | `components.modal1.close()`                       |
| setDisableTrigger                            | Désactive le bouton du modal.                        | `components.modal1.setDisableTrigger()`           |
| setDisableModal                              | Désactive la fenêtre contextuelle du modal.                        | `components.modal1.setDisableModal()`             |
| setVisibility( )                             | Définit la visibilité du composant.             | `components.modal1.setVisibility(false)`          |
| setLoading( )                                | Définit l'état de chargement du composant.          | `components.modal1.setLoading(true)`              |

## Variables exposées

| Variable          | <div style={{ width:"250px"}}> Description </div> | Comment y accéder                             |
| :---------------- | :------------------------------------------------ | :---------------------------------------- |
| show              | Indique si le modal est ouvert.                   | `{{components.modal1.show}}`              |
| isDisabledModal   | Indique si le modal est désactivé.               | `{{components.modal1.isDisabledModal}}`   |
| isDisabledTrigger | Indique si le bouton du modal est désactivé.        | `{{components.modal1.isDisabledTrigger}}` |
| isLoading         | Indique si le composant est en cours de chargement.            | `{{components.modal1.isLoading}}`         |
| isVisible         | Indique si le composant est visible.            | `{{components.modal1.isVisible}}`         |

## Trigger

| Propriété                   | Description                                            |
| -------------------------- | ------------------------------------------------------ |
| Modal trigger visibility   | Définit la visibilité du bouton du modal.                   |
| Disable modal trigger      | Désactive le bouton du modal.                                 |
| Use default trigger button | Choisissez d'utiliser ou non le bouton de modal par défaut. |
| Trigger button label       | Fournissez un libellé pour le bouton du modal.                    |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Dynamic height | Ajuste automatiquement la hauteur du modal en fonction de son contenu. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable modal window | Désactive la fenêtre contextuelle du modal. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Close on escape key | Ferme le modal lorsque la touche échap est enfoncée. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Close on clicking outside | Ferme le modal lorsqu'on clique à l'extérieur du modal. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Hide close button | Masque le bouton de fermeture du header du modal. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. | Chaîne de caractères (par ex., `Enter your password here.` ). |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Trigger Button

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| Icon | Ajoutez une icône au bouton déclencheur du modal. | Choisissez dans la bibliothèque d'icônes. |
| Icon color | Définit la couleur de l'icône. | Sélectionnez une couleur depuis le sélecteur de couleur ou définissez-la de manière programmatique via **fx**. |
| Icon position | Définit la position de l'icône. | Choisissez entre **Left** ou **Right**. |
| Background | Définit la couleur de fond du bouton déclencheur. | Sélectionnez une couleur depuis le sélecteur de couleur ou définissez-la de manière programmatique via **fx**. |
| Text | Définit la couleur du texte du bouton déclencheur. | Sélectionnez une couleur depuis le sélecteur de couleur ou définissez-la de manière programmatique via **fx**. |

### Header

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| Background | Définit la couleur de fond du header. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Divider | Définit la couleur du séparateur entre le header et le corps. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |

### Container

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| Background | Définit la couleur de fond du corps du modal. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |

### Footer

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| Background | Définit la couleur de fond du footer. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Divider | Définit la couleur du séparateur entre le corps et le footer. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::

:::info
Toute propriété disposant d'un bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::
