---
id: timeline
title: Timeline
---

# Timeline

Le composant **Timeline** fournit une représentation visuelle d'une séquence d'événements. Il est utile pour afficher des données historiques, des jalons de projet ou toute information chronologique de manière claire et attrayante.

<div style={{paddingTop:'24px'}}>

## Propriétés

### Timeline Data

**Exigences relatives aux données :** les données doivent être un tableau d'objets. Chaque objet doit avoir les clés **title**, **subTitle**, **iconBackgroundColor** et **date**. **iconBackgroundColor** peut être un code couleur hexadécimal ou au format RGBA.

**Exemple avec un code couleur hexadécimal :**
```json
[ 
    { "title": "Product Launched", "subTitle": "First version of our product released to public", "date": "20/10/2021", "iconBackgroundColor": "#4d72fa"},
    { "title": "First Signup", "subTitle": "Congratulations! We got our first signup", "date": "22/10/2021", "iconBackgroundColor": "#4d72fa"}, 
    { "title": "First Payment", "subTitle": "Hurray! We got our first payment", "date": "01/11/2021", "iconBackgroundColor": "#4d72fa"} 
]
```

**Exemple avec RGBA :**
```json
[ 
    { "title": "Product Launched", "subTitle": "First version of our product released to public", "date": "20/10/2021", "iconBackgroundColor": "rgba(240,17,17,0.5)"},
    { "title": "First Signup", "subTitle": "Congratulations! We got our first signup", "date": "22/10/2021", "iconBackgroundColor": "rgba(60, 179, 113,0.5)"}, 
    { "title": "First Payment", "subTitle": "Hurray! We got our first payment", "date": "01/11/2021", "iconBackgroundColor": "rgba(60, 179, 113,0.5)"} 
]
```

### Hide Date

Activez cette option pour masquer les informations de date/heure dans le composant Timeline.

</div>

<div style={{paddingTop:'24px'}}>

## Actions spécifiques au composant (CSA)

Il n'existe actuellement aucune Component-Specific Action implémentée pour le composant Timeline.

</div>

<div style={{paddingTop:'24px'}}>

## Variables exposées

Il n'existe actuellement aucune variable exposée pour le composant Timeline.

</div>

<div style={{paddingTop:'24px'}}>

## Général
### Tooltip

Un Tooltip fournit des informations supplémentaires lorsque les utilisateurs survolent le composant. Définissez le contenu du tooltip dans l'accordéon **General** des propriétés du composant.

</div>

<div style={{paddingTop:'24px'}}>

## Appareils

| Propriété        | Description                               | Valeur attendue |
| :-------------- | :---------------------------------------- | :------------- |
| Show on desktop | Contrôle la visibilité du composant en vue bureau | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile  | Contrôle la visibilité du composant en vue mobile  | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

</div>

<div style={{paddingTop:'24px'}}>

## Styles

| Propriété | Description | Options de configuration |
| :------- | :---------- | :-------------------- |
| Visibility | Contrôle la visibilité du composant | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Box Shadow | Ajoute un effet d'ombre autour du composant | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées, ou définissez-la de manière programmatique via **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide de **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan inclut la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::

:::info
Toute propriété disposant d'un bouton **fx** à côté peut être **configurée de manière programmatique**.
:::

</div>
