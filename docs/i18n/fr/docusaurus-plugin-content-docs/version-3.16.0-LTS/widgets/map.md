---
id: map
title: Map
---

Le composant **Map** permet aux utilisateurs d'afficher une carte dans l'application. Il peut être utilisé pour afficher ou choisir un seul emplacement ou plusieurs emplacements sur la carte. Le composant Map peut être utilisé pour afficher l'emplacement d'une entreprise, d'un magasin ou d'un restaurant. Il peut également être utilisé pour afficher l'emplacement d'un utilisateur sur la carte. Il permet aux utilisateurs d'interagir avec l'interface de la carte et de choisir des points d'intérêt spécifiques.

:::tip Utilisation en auto-hébergement
Si vous utilisez la version auto-hébergée de ToolJet, il est nécessaire de configurer la clé API Google Maps en tant que variable d'environnement. Veuillez consulter la [documentation de configuration des variables d'environnement](/docs/setup/env-vars#google-maps-api).
:::

<img className="screenshot-full" src="/img/widgets/map/map2.png" alt="ToolJet - Component Reference - Map" />

## Propriétés

| <div style={{ width:"100px"}}> Propriétés </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :----------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Initial location | Emplacement par défaut lorsque l'application est chargée initialement. | Un objet contenant la **latitude** et la **longitude** sous forme de paires clé-valeur. ex : `{{ {"lat": 40.7128, "lng": -73.935242} }}`. |
| Default markers | Nombre de marqueurs à afficher sur la carte. | Un tableau d'objets contenant les coordonnées. ex : `{{ [{"lat": 40.7128, "lng": -73.935242}, {"lat": 40.7128, "lng": -73.935242}] }}`. |
| Polygon points | Créer un polygone sur la carte en utilisant les coordonnées données. | Un tableau d'objets contenant les coordonnées. ex : `{{ [{"lat": 40.7128, "lng": -73.935242}, {"lat": 40.7128, "lng": -73.935242}] }}`. |
| Add new markers | En cliquant sur la carte, un nouveau marqueur sera ajouté à la carte. | Par défaut, réglé sur `On`. Désactivez-le pour empêcher l'ajout de nouveaux marqueurs sur la carte. Cliquez sur **fx** pour définir `{{true}}` ou `{{false}}` de manière programmatique. |
| Search for places | Activez pour afficher la boîte de recherche sur la carte. | Par défaut, réglé sur `On`. Désactivez-le pour masquer la boîte de recherche sur la carte. Cliquez sur **fx** pour définir `{{true}}` ou `{{false}}` de manière programmatique. |

## Événements

| <div style={{ width:"135px"}}> Nom de l'événement </div> | <div style={{ width:"100px"}}> Description </div>                                                   |
| :----------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| On bounds change                                 | Se déclenche lorsque la zone de délimitation est modifiée. Cet événement se produit après que la variable `bounds` change. |
| On create marker                                 | Se déclenche lorsqu'un nouveau marqueur est ajouté à la carte. |
| On marker click                                  | Se déclenche lorsque l'utilisateur clique sur l'un des marqueurs de la carte. |
| On polygon click                                 | Se déclenche lorsque l'utilisateur clique sur le polygone sur la carte. |

:::info
Pour des informations détaillées sur toutes les **Actions** disponibles, veuillez consulter la documentation de la [Référence des actions](/docs/actions/run-query).
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant Map peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) :

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> Comment y accéder </div> |
| :-------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| setLocation                                   | Définissez l'emplacement du marqueur sur la carte en utilisant les valeurs de latitude et longitude comme paramètres via une action spécifique au composant dans n'importe quel gestionnaire d'événement. | Utilisez une requête RunJS pour exécuter des actions spécifiques au composant telles que : `component.map1.setLocation(40.7128, -73.935242)`. |

## Variables exposées

Les variables exposées peuvent être utilisées pour obtenir des données du composant.

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"135px"}}> Comment y accéder </div> |
| :---------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| center | Cette variable contiendra la latitude, la longitude et l'URL de la google map. |
| center.`lat` | Cette variable contient la valeur de latitude du marqueur sur le composant Map. | Accédez à la valeur dynamiquement en JS : `{{components.map1.center.lat}}`. |
| center.`lng` | Cette variable est mise à jour avec le code couleur RGB chaque fois qu'un utilisateur sélectionne une couleur depuis le sélecteur de couleur. | Accédez à la valeur dynamiquement en JS : `{{components.map1.center.lng}}`. |
| center.`googleMapUrl` | Cette variable contient l'URL de l'emplacement où le marqueur central est placé sur le composant Map. | Accédez à la valeur dynamiquement en JS : `{{components.map1.center.googleMapUrl}}`. |
| markers | La variable markers ne contiendra une valeur que si `add new markers` est activé dans les propriétés de la carte. Chaque marqueur est un objet et possédera les clés `lat` et `lng`. | Accédez aux valeurs dynamiquement en utilisant `{{components.map1.markers[1].lat}}`. |
| selectedMarker | Objet contenant le marqueur sélectionné par l'utilisateur. |
| bounds | Il construit un rectangle à partir des points situés à ses coins sud-ouest et nord-est. |
| bounds.northEast | Il contient la latitude et la longitude du coin nord-est du rectangle. | Accédez à la valeur dynamiquement en JS : `{{components.map1.bounds.northEast.lat}}` ou `{{components.map1.bounds.northEast.lng}}`. |
| bounds.southWest | Il contient la latitude et la longitude du coin sud-ouest du rectangle. | Accédez à la valeur dynamiquement en JS : `{{components.map1.bounds.southWest.lat}}` ou `{{components.map1.bounds.southWest.lng}}`. |

## Général

### Tooltip

Un Tooltip est souvent utilisé pour préciser des informations supplémentaires lorsque l'utilisateur survole le composant avec le pointeur de la souris. Une fois qu'une valeur est définie pour Tooltip, le survol de l'élément affichera la chaîne spécifiée comme texte d'infobulle.

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop                                | Rend le composant visible en vue bureau.      | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile                                 | Rend le composant visible en vue mobile.       | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

| <div style={{ width:"100px"}}> Propriétés </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :----------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Visibility | Activez ou désactivez pour contrôler la visibilité du composant. | Vous pouvez modifier sa valeur de manière programmatique en cliquant sur le bouton **fx** à côté. Si `{{false}}`, le composant ne sera pas visible après la mise en production de l'application. Par défaut, il est réglé sur `{{true}}`. |
| Disable | Ceci est désactivé par défaut, activez le bouton bascule pour verrouiller le composant et le rendre non fonctionnel. | Vous pouvez également définir la valeur de manière programmatique en cliquant sur le bouton **fx** à côté. Si réglé sur `{{true}}`, le composant sera verrouillé et deviendra non fonctionnel. Par défaut, sa valeur est réglée sur `{{false}}`. |
| Box shadow | Ajoutez un effet d'ombre au composant en fournissant des valeurs pour X, Y, Blur, Spread et Color. | Vous pouvez également définir la valeur de manière programmatique en cliquant sur le bouton **fx** à côté. Ex : `{{"x": 0, "y": 0, "blur": 0, "spread": 0, "color": "#000000"}}`. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::
