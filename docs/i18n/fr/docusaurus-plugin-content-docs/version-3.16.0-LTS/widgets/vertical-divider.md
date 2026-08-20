---
id: vertical-divider
title: Vertical Divider
---
# Vertical Divider

Le composant **Vertical Divider** crée une séparation visuelle nette entre deux composants adjacents en ajoutant un séparateur vertical. Il est couramment utilisé pour renforcer la structure de la mise en page, améliorer la lisibilité et organiser le contenu en établissant une division distincte entre les sections d'une interface utilisateur.

<div style={{paddingTop:'24px'}}>

## Actions spécifiques au composant (CSA)

Il n'existe actuellement aucune CSA (Component-Specific Actions) implémentée pour réguler ou contrôler le composant.

</div>

<div style={{paddingTop:'24px'}}>

## Variables exposées

Il n'existe actuellement aucune variable exposée pour ce composant.

</div>

<div style={{paddingTop:'24px'}}>

## Général
### Tooltip

Un Tooltip est souvent utilisé pour préciser des informations supplémentaires sur un élément lorsque l'utilisateur survole le composant avec le pointeur de la souris.

Dans l'accordéon **General**, vous pouvez définir la valeur au format chaîne. Le survol du composant affichera alors cette chaîne comme tooltip.

</div>

<div style={{paddingTop:'24px'}}>

## Appareils

|  <div style={{ width:"100px"}}> Devices </div> |  <div style={{ width:"100px"}}> Description </div> |  <div style={{ width:"135px"}}> Valeur attendue </div> |
|:----- |:---------  |:------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile  | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

</div>


<div style={{paddingTop:'24px'}}>

## Styles

| <div style={{ width:"120px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"180px"}}> Options de configuration </div> |
| ----------- | ----------- | ----------- |
| Divider Color | Définit la couleur du séparateur. | Accepte toute valeur de couleur valide, comme un code hexadécimal (`#000000`), RGB, ou des noms de couleurs prédéfinis. |
| Visibility | Contrôle si le séparateur est visible. | Vous pouvez le définir sur `true` ou `false`, ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Box Shadow | Ajoute une ombre autour du séparateur pour créer de la profondeur. | Accepte des valeurs de box-shadow comme `none`, `2px 4px 6px rgba(0, 0, 0, 0.1)` |

:::info
Toute propriété disposant du bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide de **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan inclut la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::

</div>
