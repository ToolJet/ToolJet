---
id: pagination
title: Pagination
---

**Pagination** permet à l'utilisateur de sélectionner une page spécifique parmi une plage de pages. Il est utilisé pour séparer le contenu en pages distinctes.

:::tip
Vous pouvez associer le composant Pagination au composant List View.
:::

## Propriétés

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | 
|:------------ |:-------------|
| Number of pages | Vous pouvez l'utiliser pour prédéfinir le nombre total de pages. Il est calculé en divisant la longueur du tableau de données qui sera transmis, par la limite de données correspondant au nombre d'éléments affichés sur chaque page. |
| Default page index | Utilisé pour définir et afficher l'index de page par défaut au chargement initial de l'application. Vous pouvez également ajouter une logique conditionnelle pour définir sa valeur selon votre cas d'usage. |

## Événement

| <div style={{ width:"100px"}}> Événement </div> | <div style={{ width:"100px"}}> Description </div> |
|:------------------|:---------------------|
| On Page Change | Se déclenche chaque fois que l'utilisateur passe à un autre index de page. |

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant Pagination peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA). Vous pouvez les déclencher via un événement ou une requête RunJS.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"200px"}}> Comment y accéder </div> |
|:------------------|:---------------------|:---------------------|
| setPage() | Navigue de manière programmatique vers une page. Si l'index donné est 0 ou moins, il navigue vers la première page ; s'il est supérieur au nombre total de pages, il navigue vers la dernière page. | `components.pagination1.setPage(3)` |
| setVisibility() | Définit la visibilité du composant. | `components.pagination1.setVisibility(false)` |
| setDisable() | Active ou désactive le composant. | `components.pagination1.setDisable(true)` |
| setLoading() | Définit l'état de chargement du composant. Pendant le chargement, la navigation entre les pages est bloquée et un indicateur de chargement est affiché à la place du numéro de page actuel. | `components.pagination1.setLoading(true)` |

## Variables exposées

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"135px"}}> Comment y accéder </div> |
|:----------- |:----------- |:--------- |
| totalPages | Contient la valeur de `Number of Pages` définie dans les propriétés du composant Pagination.| Accessible dynamiquement avec du JS (par ex., `{{components.pagination1.totalPages}}`).|
| currentPageIndex | Contient l'index de l'option actuellement sélectionnée sur le composant Pagination. | Accessible dynamiquement avec du JS (par ex., `{{components.pagination1.currentPageIndex}}`). |
| isVisible | Indique si le composant est visible. | Accessible dynamiquement avec du JS (par ex., `{{components.pagination1.isVisible}}`). |
| isDisabled | Indique si le composant est désactivé. | Accessible dynamiquement avec du JS (par ex., `{{components.pagination1.isDisabled}}`). |
| isLoading | Indique si le composant est en cours de chargement. | Accessible dynamiquement avec du JS (par ex., `{{components.pagination1.isLoading}}`). |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
|:------------ |:-------------|:--------- |
| Loading state | Affiche un indicateur de chargement sur la page actuelle et bloque la navigation entre les pages tant qu'il est activé. Souvent utilisé avec `isLoading`. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Activez ou désactivez pour contrôler la visibilité du composant. Si `{{false}}`, le composant ne sera pas visible après le déploiement de l'application. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Ceci est désactivé par défaut. Activez-le pour verrouiller le composant et le rendre non fonctionnel. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Affiche une infobulle informative lorsque l'utilisateur survole le composant. | Chaîne de caractères (par ex., `Go to next page`). |

:::info
Toute propriété disposant d'un bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
|:------------ |:-------------|:--------- |
| Show on desktop  | Rend le composant visible en vue bureau. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |
| Alignment | Définit l'alignement horizontal des contrôles de pagination. | Par défaut, réglé sur `Left`. |
| Box shadow | Définit l'ombre de la boîte du composant. Vous pouvez également la définir de manière programmatique via **fx**. | Par défaut, aucune ombre n'est appliquée. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::

:::info
Toute propriété disposant d'un bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::

