---
id: statistics
title: Statistics
---

Le composant **Statistics** est utilisé pour afficher des indicateurs clés dans un format visuellement mis en avant. Il est idéal pour mettre en évidence des chiffres importants tels que le chiffre d'affaires, le nombre d'utilisateurs ou les taux d'achèvement des tâches.

**Pourquoi l'utiliser ?**
- Offre une vue d'ensemble instantanée sans avoir à analyser des données brutes.
- Couramment utilisé dans les dashboards, les résumés exécutifs et les applications analytiques.
- Aide les parties prenantes à prendre des décisions rapides et informées.

<img className="screenshot-full img-full" src="/img/widgets/statistics/preview.png" alt="Drag a New Chat Component" />

## Data

### Primary Values

| Propriété | Description |
|:---------|:------------|
| **Label** | Le texte descriptif qui explique ce que représente l'indicateur. |
| **Value** | Le chiffre principal ou le point de donnée affiché. |
| **Prefix text** | Texte ou symbole affiché avant la valeur (par ex., `$` pour une devise). |
| **Suffix text** | Texte ou symbole affiché après la valeur (par ex., `%` pour un pourcentage). |

### Secondary Values

| **Propriété**  | **Description** |
|:--------------|:----------------|
| **Hide Secondary Value** | Activez pour afficher ou masquer la valeur secondaire de l'indicateur. |
| **Label** | Le texte descriptif indiquant ce que représente la valeur secondaire. |
| **Value** | L'indicateur ou le point de donnée affiché comme valeur secondaire. |
| **Prefix Text** | Texte ou symbole affiché avant la valeur (par ex., `$` pour une devise). |
| **Suffix Text** | Texte ou symbole affiché après la valeur (par ex., `%` pour un pourcentage). |
| **Trend** | Indicateur montrant la tendance de performance, positive ou négative. |

### Layout

| **Propriété** | **Description** |
|:-------------|:----------------|
| **Data** | Choisissez l'alignement des données (gauche, centre ou droite). |
| **Secondary Value** | Décidez comment la valeur secondaire est alignée (verticalement ou horizontalement). |
| **Icon** | Sélectionnez une icône à afficher, ou masquez-la et ajustez son alignement (gauche ou droite). |

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) ; vous pouvez les déclencher via un événement ou à l'aide d'une requête RunJS.

| **Action** | **Description** | **RunJS Query** |
|:-----------|:----------------|:----------------|
| **setPrimaryValue**   | Met à jour la valeur principale de l'indicateur affichée dans le composant. | `{{components.statistics1.setPrimaryValue}}`  |
| **setSecondaryValue** | Met à jour la valeur secondaire de l'indicateur affichée. | `{{components.statistics1.setSecondaryValue}}` |
| **setLoading**        | Bascule l'état de chargement du composant. | `{{components.statistics1.setLoading}}`      |
| **setVisibility**     | Affiche ou masque le composant sur la page. | `{{components.statistics1.setVisibility}}`  |


## Variables exposées

| **Variable** | **Description** | **Comment y accéder** |
|:-------------|:----------------|:------------------|
| primaryLabel | Le texte du label de la valeur principale. | `{{components.statistics1.primaryLabel}}` |
| secondaryLabel | Le texte du label de la valeur secondaire. | `{{components.statistics1.secondaryLabel}}` |
| primaryValue | La valeur principale de l'indicateur affichée. | `{{components.statistics1.primaryValue}}` |
| secondaryValue | La valeur secondaire de l'indicateur affichée. | `{{components.statistics1.secondaryValue}}` |
| secondarySignDisplay | Affiche l'indicateur de tendance ou de signe pour la valeur secondaire. | `{{ components.statistics1.secondarySignDisplay }}` |
| isLoading | Indique si le composant est dans un état de chargement. | `{{components.statistics1.isLoading}}` |
| isVisible | Indique si le composant est visible sur la page. | `{{components.statistics1.isVisible}}` |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une chaîne d'affichage. | Chaîne de caractères (par ex., `Total Deals` ). |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Primary Label and Value

| **Propriété du label**      | **Description**                                     | **Options de configuration**                      |
|:----------------------- |:--------------------------------------------------- |:---------------------------------------------- |
| **Primary Label Size**  | Définit la taille de police du label principal.            | Saisie numérique (px)                             |
| **Primary Label Color** | Définit la couleur du texte du label principal.           | Sélecteur de couleur / HEX / RGBA / Thèmes personnalisés      |
| **Primary Value Size**  | Définit la taille de police de la valeur principale.            | Saisie numérique (px)                             |
| **Primary Value Color** | Définit la couleur du texte de la valeur principale.           | Sélecteur de couleur / HEX / RGBA / Thèmes personnalisés      |
| **Icon**                | Définit la couleur de l'icône (si activée).                   | Sélecteur de couleur / HEX / RGBA / Thèmes personnalisés      |

### Secondary Label and Value

| **Propriété du label**      | **Description**                                     | **Options de configuration**                      |
|:----------------------- |:--------------------------------------------------- |:---------------------------------------------- |
| **Label Size**     | Définit la taille de police du label secondaire.    | Saisie numérique (px) |
| **Label Color**    | Définit la couleur du texte du label secondaire.   | Sélecteur de couleur / HEX / RGBA / Thèmes personnalisés |
| **Value Size**     | Définit la taille de police de la valeur secondaire.    | Saisie numérique (px) |
| **Positive Secondary Value** | Définit la couleur pour les valeurs secondaires positives. | Sélecteur de couleur / HEX / RGBA / Thèmes personnalisés  |
| **Negative Secondary Value** | Définit la couleur pour les valeurs secondaires négatives. | Sélecteur de couleur / HEX / RGBA / Thèmes personnalisés  |

### Container

| **Propriété du label**      | **Description**                                     | **Options de configuration**                      |
|:----------------------- |:--------------------------------------------------- |:---------------------------------------------- |
| **Background**     | Définit la couleur de fond du conteneur. | Sélecteur de couleur / HEX / RGBA / Thèmes personnalisés         |
| **Border**         | Définit la couleur de la bordure. | Sélecteur de couleur / HEX / RGBA / Thèmes personnalisés |
| **Border Radius**  | Arrondit les coins du conteneur.        | Saisie numérique (px)          |
| **Box Shadow**     | Applique un effet d'ombre au conteneur.     | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées ou définissez-la de façon programmatique avec fx.    |
| **Padding**        | Définit l'espacement à l'intérieur du conteneur.      | Default / None          |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée avec les **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Avancé** est disponible uniquement si votre forfait inclut la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)**.
:::

:::info
Toute propriété disposant du bouton **fx** à côté de son champ peut être **configurée de façon programmatique**.
:::
