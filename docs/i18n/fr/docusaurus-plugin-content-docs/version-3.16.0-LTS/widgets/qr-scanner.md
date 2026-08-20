---
id: qr-scanner
title: QR Scanner
---

Scannez des codes QR à l'aide de la caméra de l'appareil et conservez les données qu'ils contiennent.

:::note Problème connu
Vous devrez peut-être vous limiter au navigateur Safari sur IOS, car l'accès à la caméra est restreint pour les navigateurs tiers.
:::

<div style={{paddingTop:'24px'}}>

## Événements

| <div style={{ width:"100px"}}> Événement </div> | <div style={{ width:"100px"}}> Description </div>             |
| :------------------------------------------ | :------------------------------------------------------------ |
| On detect                                   | Se déclenche chaque fois que le composant scanne avec succès un code QR. |

:::info
Consultez la documentation de [référence des actions](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

:::caution Astuce de débogage

Les API de caméra des navigateurs limitent ce composant à ne fonctionner qu'en `localhost` ou en `https`.

Donc, si vous êtes en phase de test, veillez à utiliser soit `localhost`, soit `https`.
:::

## Actions spécifiques au composant (CSA)

Il n'existe actuellement aucune CSA (Component-Specific Actions) mise en œuvre pour réguler ou contrôler le composant.

## Variables exposées

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"200px"}}> Description </div>              | <div style={{ width:"135px"}}> Comment y accéder </div>                                       |
| :---------------------------------------------- | :------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| lastDetectedValue                               | Contient les données du dernier code QR scanné par le composant. | Accessible dynamiquement en JS (par ex., `{{components.qrscanner1.lastDetectedValue}}`). |

## Général

### Tooltip

Un Tooltip est souvent utilisé pour préciser des informations supplémentaires sur un élément lorsque l'utilisateur passe le curseur de la souris sur le composant.

Dans l'accordéon <b>Général</b>, vous pouvez définir la valeur au format chaîne de caractères.
En survolant ensuite le composant, cette chaîne s'affichera comme infobulle.

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div>                                                                              |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Rend le composant visible en vue bureau.      | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile                                 | Rend le composant visible en vue mobile.       | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Valeur par défaut </div> |
| :------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------- |
| Visibility                                  | Activez ou désactivez ce paramètre pour contrôler la visibilité du composant. Vous pouvez modifier sa valeur de façon programmatique en cliquant sur le bouton **fx** situé à côté. Si `{{false}}`, le composant ne sera pas visible une fois l'application déployée.                                            | Par défaut, ce paramètre est défini sur `{{true}}`.                 |
| Disable                                     | Ce paramètre est désactivé (`off`) par défaut ; activez le bouton bascule pour verrouiller le composant et le rendre non fonctionnel. Vous pouvez également définir la valeur de façon programmatique en cliquant sur le bouton **fx** situé à côté. Si la valeur est définie sur `{{true}}`, le composant sera verrouillé et deviendra non fonctionnel. | Par défaut, la valeur est définie sur `{{false}}`.        |

### Avancé

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée avec les **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Avancé** est disponible uniquement si votre forfait inclut la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)**.
:::

</div>
