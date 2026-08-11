---
id: key-value-pair
title: Key Value Pair
---

Le composant **Key Value Pair** affiche des données dans un format structuré clé-valeur, ce qui le rend idéal pour présenter des détails d'enregistrement, des profils utilisateur, des paramètres de configuration ou toute donnée où chaque entrée possède un libellé et une valeur correspondante. Il prend en charge plusieurs types de champs, notamment texte, nombres, dates, listes déroulantes, liens, booléens et plus, avec édition en ligne et un workflow intégré de sauvegarde/annulation.

## Exemple d'utilisation

Une équipe support a besoin d'un **Customer Detail Panel** qui affiche les enregistrements client individuels extraits d'une base de données - nom, email, date d'inscription, statut d'abonnement et tags. Grâce au composant Key Value Pair, chaque champ est rendu avec le type de saisie approprié (sélecteur de date pour les dates, bouton bascule pour le statut, multiselect pour les tags), et les agents peuvent modifier directement les valeurs et enregistrer les changements dans la base de données via une requête déclenchée sur l'événement **Save changes**.

## Propriétés

### Data

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "300px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Data source | Sélectionne la façon dont les données sont fournies au composant. | Sélectionnez **Raw JSON** ou une requête dans la liste déroulante. |
| Data | L'objet JSON contenant les paires clé-valeur à afficher. | Objet (par ex., `{{ { name: 'Jane', email: 'jane@example.com', status: true } }}`). |

### Fields

Chaque clé de l'objet de données est automatiquement détectée comme un champ. Vous pouvez configurer les champs individuellement en cliquant sur eux dans la liste **Fields**. Chaque champ peut être configuré avec les éléments suivants :

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Field type | Le type de saisie utilisé pour afficher la valeur. | Sélectionnez parmi les types de champ pris en charge dans la liste déroulante. |
| Label | Nom d'affichage montré comme libellé de la clé. | Chaîne de caractères (par ex., `Full Name`). |
| Key | La clé de propriété dans l'objet de données à laquelle ce champ correspond. | Chaîne de caractères (par ex., `full_name`). |
| Make editable | Active l'édition en ligne pour ce champ. | Activez/désactivez le bouton bascule. |
| Visibility | Contrôle si ce champ est visible. | Activez/désactivez le bouton bascule. |

:::info
Vous pouvez réorganiser les champs en les faisant glisser dans la liste Fields. Utilisez le bouton **Add new field** pour créer des champs qui n'existent pas dans les données source. Le bouton bascule **Make all fields editable** active l'édition pour tous les champs en même temps.
:::

### Dynamic Fields

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Use dynamic field | Lorsqu'activé, les champs sont générés à partir d'un tableau de configuration dynamique au lieu de la liste de champs statique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Field data | Tableau d'objets définissant les champs de manière dynamique. | Tableau d'objets (par ex., `{{[{name: 'First name', key: 'firstName', fieldType: 'string'}, {name: 'Last name', key: 'lastName', fieldType: 'string'}]}}`). |

### Événements

| Événement | Description |
| :------------ | :---------- |
| Field clicked | Se déclenche lorsque l'utilisateur clique sur une ligne de champ. La variable `lastClickedField` est mise à jour avant que cet événement ne se déclenche. |
| Save changes | Se déclenche lorsque l'utilisateur clique sur le bouton **Save changes** après avoir modifié une ou plusieurs valeurs de champ. |

:::info
Lorsqu'un utilisateur modifie la valeur d'un champ, une fenêtre contextuelle apparaît en bas du composant avec les boutons **Cancel** et **Save changes**. Cliquer sur **Cancel** annule toutes les modifications en attente. Cliquer sur **Save changes** déclenche l'événement et réinitialise l'ensemble des modifications.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) :

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div> |
| :------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| setVisibility() | Définit la visibilité du composant. | `components.keyvaluepair1.setVisibility(false)` |
| setDisable() | Désactive ou active le composant. | `components.keyvaluepair1.setDisable(true)` |
| setLoading() | Définit l'état de chargement du composant. | `components.keyvaluepair1.setLoading(true)` |

## Variables exposées

| <div style={{ width:"100px"}}> Variable </div> | Description | Comment y accéder |
| :---------- | :---------- | :------------ |
| data | Contient l'objet de données original transmis au composant. | `{{components.keyvaluepair1.data}}` |
| changeSet | Contient uniquement les champs qui ont été modifiés par l'utilisateur mais pas encore enregistrés. Retourne un objet vide lorsqu'il n'y a aucune modification en attente. | `{{components.keyvaluepair1.changeSet}}` |
| lastClickedField | Un objet mis à jour lorsqu'une ligne de champ est cliquée. Contient deux champs : `key` (la clé de données du champ) et `value` (la valeur actuelle du champ). Mis à jour avant que l'événement **Field clicked** ne se déclenche. | `{{components.keyvaluepair1.lastClickedField}}` |
| isLoading | Indique si le composant est en cours de chargement. | `{{components.keyvaluepair1.isLoading}}` |
| isVisible | Indique si le composant est visible. | `{{components.keyvaluepair1.isVisible}}` |
| isDisabled | Indique si le composant est désactivé. | `{{components.keyvaluepair1.isDisabled}}` |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une valeur de chaîne à afficher. | Chaîne de caractères (par ex., `Customer details panel.`). |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Color | Définit la couleur des libellés des champs. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Alignment | Définit la position du libellé par rapport au champ de valeur. | Cliquez sur les options bascule pour sélectionner **Top** ou **Side**. |
| Direction | Définit la direction d'alignement des libellés positionnés sur le côté. Visible uniquement lorsque l'alignement est réglé sur **Side**. | Cliquez sur le bouton d'icône d'alignement à gauche ou à droite. |
| Width | Définit la largeur de la zone de libellé. Visible uniquement lorsque l'alignement est réglé sur **Side**. | Activez **Auto width** pour un ajustement automatique de la taille, ou désactivez-le pour ajuster manuellement la largeur avec le curseur. |

### Values

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Accent | Définit la couleur d'accentuation utilisée pour les éléments interactifs comme les boutons bascule et les sélections. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Text | Définit la couleur du texte des valeurs des champs. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |

### Container

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Padding | Contrôle l'espacement interne du composant. | Sélectionnez **Default** pour utiliser l'espacement standard, ou **None** pour supprimer tout l'espacement. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un email à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
