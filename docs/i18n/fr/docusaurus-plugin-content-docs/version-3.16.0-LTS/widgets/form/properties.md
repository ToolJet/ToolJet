---
id: properties
title: Propriétés
---

À l'aide du panneau de propriétés du composant **Form**, vous pouvez contrôler la structure du formulaire, générer le formulaire, ajouter des champs, configurer des événements, et plus encore.

## Structure

| <div style={{ width:"120px"}}> Propriété </div> | Description | Valeur attendue |
|:----------|:-------------|:---------------|
| Header | Affiche ou masque l'en-tête du formulaire. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Footer | Affiche ou masque le pied de page du formulaire. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Submit button | Sélectionnez un **Button** qui sera utilisé pour soumettre le formulaire. | Choisissez, dans le menu déroulant, n'importe quel **Button** qui est un composant enfant à l'intérieur du composant **Form**, ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Data

Choisissez comment le formulaire doit être généré et gérez tous les champs de saisie depuis un seul endroit. Le formulaire peut être généré des façons suivantes :
- En utilisant un schéma JSON
- En utilisant du JSON brut
- En utilisant la sortie d'une requête
- En utilisant le panneau de propriétés du formulaire
- En faisant glisser des composants dans le formulaire

Consultez le guide [Generate Form](/docs/widgets/form/) pour plus de détails.

## Événements

| <div style={{ width:"100px"}}> Événement </div> | <div style={{ width:"100px"}}> Description </div> |
|:------------|:-----------------|
| On submit  | Se déclenche lorsque le bouton de soumission est cliqué. |
| On invalid | Se déclenche lorsqu'il y a une saisie invalide dans le formulaire.  |

## Actions supplémentaires

| <div style={{ width:"100px"}}>Action</div> | <div style={{ width:"150px"}}>Description</div> | <div style={{ width:"250px"}}>Options de configuration</div> |
|:------------------|:------------|:------------------------------|
| Validate all fields on submission      | Valide tous les champs lors de la soumission du formulaire. | Activez/désactivez le bouton bascule, ou utilisez **fx** pour saisir une expression logique. |
| Reset form on submission               | Réinitialise tous les champs du formulaire après la soumission.         | Activez/désactivez le bouton bascule, ou utilisez **fx** pour saisir une expression logique. |
| Loading state                          | Active un indicateur de chargement pendant la soumission, souvent lié à `isLoading`. | Activez/désactivez le bouton bascule, ou utilisez **fx** pour saisir une expression logique. |
| Visibility                             | Contrôle si le composant est visible.       | Activez/désactivez le bouton bascule, ou utilisez **fx** pour saisir une expression logique. |
| Dynamic height                         | Ajuste automatiquement la hauteur en fonction du contenu.   | Activez/désactivez le bouton bascule, ou utilisez **fx** pour saisir une expression logique. |
| Disable                                | Active ou désactive l'ensemble du composant.        | Activez/désactivez le bouton bascule, ou utilisez **fx** pour saisir une expression logique. |
| Tooltip                                | Affiche une infobulle au survol.                     | Valeur de type chaîne de caractères (par ex., `Enter your password here.`) |

## Appareils

|<div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Header

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Background | Définit la couleur d'arrière-plan de l'en-tête du formulaire. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |
| Divider | Définit la couleur de la ligne de séparation entre l'en-tête et le corps du formulaire. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |

### Container

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Background | Définit la couleur d'arrière-plan du corps du formulaire. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |
| Border color | Définit la couleur de bordure du conteneur du formulaire. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |
| Border radius | Définit le rayon des coins du conteneur du formulaire. | Saisissez une valeur numérique (par ex., `6`) ou définissez-la de manière programmatique avec **fx**. |

### Footer

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Background | Définit la couleur d'arrière-plan du pied de page du formulaire. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |
| Divider | Définit la couleur de la ligne de séparation entre le corps du formulaire et le pied de page. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre forfait comprend la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::

:::info
Toute propriété disposant d'un bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::
