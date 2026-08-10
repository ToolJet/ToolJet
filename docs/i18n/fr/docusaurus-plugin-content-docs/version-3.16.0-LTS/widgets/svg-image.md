---
id: svg-image
title: Svg Image
---
# SVG Image

Ce composant est utilisé pour restituer des images vectorielles. Nous pouvons afficher des images, des icônes et des textes à l'aide de ce composant. Les SVG sont des images vectorielles et sont donc généralement beaucoup plus légères en taille de fichier que les images bitmap.

Les développeurs préfèrent utiliser des fichiers SVG **(Scalable Vector Graphics)** car ils sont évolutifs et s'affichent parfaitement à n'importe quelle résolution, contrairement aux fichiers JPEG, PNG et GIF.

<div style={{paddingTop:'24px'}}>

## Propriétés

### SVG data

Saisissez les données SVG de l'image pour l'afficher sur le composant.

:::tip
Consultez les ressources où des fichiers SVG sont proposés gratuitement au téléchargement. Vous pouvez copier-coller les données ci-dessous dans ce champ pour voir une nouvelle icône s'afficher.
:::

```
<svg fill="#000000" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 16 16" width="32px" height="32px"><path d="M 7.5 1 C 3.910156 1 1 3.90625 1 7.488281 C 1 10.355469 2.863281 12.789063 5.445313 13.648438 C 5.769531 13.707031 6 13.375 6 13.125 C 6 12.972656 6.003906 12.789063 6 12.25 C 4.191406 12.640625 3.625 11.375 3.625 11.375 C 3.328125 10.625 2.96875 10.410156 2.96875 10.410156 C 2.378906 10.007813 3.011719 10.019531 3.011719 10.019531 C 3.664063 10.0625 4 10.625 4 10.625 C 4.5 11.5 5.628906 11.414063 6 11.25 C 6 10.851563 6.042969 10.5625 6.152344 10.378906 C 4.109375 10.019531 2.996094 8.839844 3 7.207031 C 3.003906 6.242188 3.335938 5.492188 3.875 4.9375 C 3.640625 4.640625 3.480469 3.625 3.960938 3 C 5.167969 3 5.886719 3.871094 5.886719 3.871094 C 5.886719 3.871094 6.453125 3.625 7.496094 3.625 C 8.542969 3.625 9.105469 3.859375 9.105469 3.859375 C 9.105469 3.859375 9.828125 3 11.035156 3 C 11.515625 3.625 11.355469 4.640625 11.167969 4.917969 C 11.683594 5.460938 12 6.210938 12 7.207031 C 12 8.839844 10.890625 10.019531 8.851563 10.375 C 8.980469 10.570313 9 10.84375 9 11.25 C 9 12.117188 9 12.910156 9 13.125 C 9 13.375 9.226563 13.710938 9.558594 13.648438 C 12.140625 12.785156 14 10.355469 14 7.488281 C 14 3.90625 11.089844 1 7.5 1 Z"/></svg>
```

</div>

<div style={{paddingTop:'24px'}}>

## Actions spécifiques au composant (CSA)

Il n'existe actuellement aucune CSA (Component-Specific Actions) mise en œuvre pour réguler ou contrôler le composant.

</div>

<div style={{paddingTop:'24px'}}>

## Variables exposées

Il n'existe actuellement aucune variable exposée pour ce composant.

</div>

<div style={{paddingTop:'24px'}}>

## Général

### Tooltip

Un Tooltip est souvent utilisé pour préciser des informations supplémentaires sur un élément lorsque l'utilisateur passe le curseur de la souris sur le composant.

Dans l'accordéon <b>Général</b>, vous pouvez définir la valeur au format chaîne de caractères. En survolant ensuite le composant, cette chaîne s'affichera comme infobulle.

</div>

<div style={{paddingTop:'24px'}}>

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile  | Rend le composant visible en vue mobile.  | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

</div>

<div style={{paddingTop:'24px'}}>

---

## Styles

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> | Options de configuration |
|:------------ |:-------------|:--------- |
| Visibility | Contrôle la visibilité du composant. Bascule ou définition dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Box-Shadow | Définit les propriétés d'ombre (box shadow) du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées, ou définissez-la de façon programmatique avec **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée avec les **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Avancé** est disponible uniquement si votre forfait inclut la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)**.
:::


</div>
