---
id: bounded-box
title: Bounded Box
---

Une **Bounded Box** est un composant d'annotation d'image infiniment personnalisable qui peut être utilisé pour sélectionner et étiqueter des zones à l'intérieur d'une image. Il prend en charge la sélection à l'aide de points spécifiques (repérage) ou en dessinant des zones rectangulaires (boîtes englobantes). Il peut être utilisé pour créer des jeux de données pour des modèles de machine learning ou pour annoter des images à d'autres fins.

<img className="screenshot-full" src="/img/widgets/bounded-box/bounded-box.png" alt="Bounded Box" />

## Propriétés {#properties}

<img className="screenshot-full" src="/img/widgets/bounded-box/propnew.png" alt="Bounded Box"/>

| <div style={{ width:"100px"}}> **Propriété** </div> | <div style={{ width:"100px"}}> **Description** </div> | <div style={{ width:"150px"}}> **Valeur attendue** </div> |
| :------------------------------------------------- | :---------------------------------------------------- | :------------------------------------------------------- |
| Image URL | L'URL ou les données d'image à afficher sur le composant. | Récupérez dynamiquement l'URL de l'image depuis la base de données : `{{queries.queryname.data[0].url}}` ou utilisez les [données base64 de l'image](/docs/widgets/image/loading-image-pdf-from-db/). |
| Default value | Les données qui chargeront les boîtes englobantes par défaut sur l'image au chargement de l'application.     | Tableau d'objets. Consultez les propriétés de données de [Default value](#default-value). |
| Selector | La boîte englobante prend en charge la sélection par rectangle ou par point. | Cliquez sur **fx** pour définir la valeur `RECTANGLE` ou `POINT`. |
| List of labels | La liste des labels qui seront affichés dans la liste déroulante pendant la sélection dans la bounded-box. | Labels au format tableau : `{{['Tree', 'Car', 'Stree light']}}`. |

#### Default value

Fournissez les données qui chargeront les boîtes englobantes par défaut sur l'image au chargement de l'application. Les données doivent être au format d'un tableau d'objets.

| <div style={{ width:"100px"}}> **Propriété** </div> | <div style={{ width:"100px"}}> **Description** </div> | <div style={{ width:"150px"}}> **Valeur attendue** </div> |
| :------------------------------------------------- | :---------------------------------------------------- | :------------------------------------------------------- |
| type | Définit le type de la Bounded Box. | `RECTANGLE` ou `POINT`. |
| width | Définit la largeur de la Bounded Box en pixels. | Valeur numérique. Si la valeur `type` est `POINT`, définissez-la à `0`. |
| height | Définit la hauteur de la Bounded Box en pixels. | Valeur numérique. Si la valeur `type` est `POINT`, définissez-la à `0`. |
| x | Définit la position en coordonnée x (horizontale) de la Bounded Box dans l'image. | Valeur numérique, ex. : `41`. |
| y | Définit la position en coordonnée y (verticale) de la Bounded Box dans l'image.   | Valeur numérique, ex. : `22`. |
| text | Définit la valeur textuelle de la Bounded Box. | Elle doit correspondre à l'un des labels fournis dans la propriété **[List of labels](#properties)**. |

**Exemple de valeurs par défaut :**

```js
[
  {
    type: "RECTANGLE",
    width: 40,
    height: 24,
    x: 41,
    y: 12,
    text: "Tree",
  },
  {
    type: "POINT",
    width: 0,
    height: 0,
    x: 10.28,
    y: 81.14,
    text: "Car",
  },
];
```

## Événements

Les événements sont des actions qui peuvent être déclenchées programmatiquement lorsque l'utilisateur interagit avec le composant. Cliquez sur la poignée du composant pour ouvrir ses propriétés sur la droite. Allez dans l'accordéon **Events** et cliquez sur **+ Add handler**.

| <div style={{ width:"100px"}}> **Événement** </div> | <div style={{ width:"100px"}}> **Description** </div>                                     |
| :---------------------------------------------- | :---------------------------------------------------------------------------------------- |
| On change                                       | Se déclenche lorsque le label de la liste déroulante du sélecteur est modifié dans la Bounded Box. |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Il n'existe actuellement aucune CSA (action spécifique au composant) implémentée pour réguler ou contrôler le composant bounding box.

## Variables exposées

| Variable | Description |
| :------- | :---------- |
| annotations | Cette variable est un tableau d'objets, où chaque objet représente une annotation ajoutée à une image. L'objet contient les clés suivantes : type, x, y, width, height, text et id. |
| annotations.`type` | Il existe deux types d'annotations : `RECTANGLE` et POINT`. |
| annotations.`x` | coordonnées sur l'axe x. |
| annotations.`y` | coordonnées sur l'axe y. |
| annotations.`width` | largeur de l'annotation. |
| annotations.`height` | hauteur de l'annotation. |
| annotations.`text` | label sélectionné pour l'annotation. |
| annotations.`id` | identifiant unique de l'annotation (généré par le système). |

Les valeurs peuvent être accédées dynamiquement en utilisant `{{components.boundedbox1.annotations[0].text}}` ou `{{components.boundedbox1.annotations[1].width}}`.

## Général

#### Tooltip

Un Tooltip est souvent utilisé pour préciser des informations supplémentaires lorsque l'utilisateur survole le composant avec le pointeur de la souris. Une fois qu'une valeur est définie pour Tooltip, le survol de l'élément affichera la chaîne spécifiée comme texte d'infobulle.

<img className="screenshot-full" src="/img/widgets/bounded-box/tooltip1.png" alt="Bounded box Tooltip"/>

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"150px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau.      | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile.       | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Valeur attendue </div> |
| :------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Visibility | Activez ou désactivez pour contrôler la visibilité du composant au chargement de l'application. | `{{true}}` ou `{{false}}`, par défaut, elle est définie sur `{{true}}`. |
| Disable | Activez pour désactiver le composant. | `{{true}}` ou `{{false}}`, par défaut, elle est définie sur `{{false}}`. |
| Box shadow | Définit les effets d'ombre ajoutés autour du cadre d'un composant. Vous pouvez spécifier les décalages horizontal et vertical (via les curseurs X et Y), le rayon de flou et de propagation, ainsi que la couleur de l'ombre. | Valeurs représentant x, y, blur, spread et color. Ex. : `9px 11px 5px 5px #00000040`. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée via les **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** est disponible uniquement si votre plan inclut la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::
