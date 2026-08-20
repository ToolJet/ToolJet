---
id: properties
title: Propriétés
---

Le **Chat Component** peut être personnalisé en configurant diverses propriétés ou en ajoutant des événements pour effectuer des actions spécifiques. Pour apprendre à créer un chatbot, consultez le guide [Chat Component Overview](/docs/widgets/chat/). Pour plus d'informations sur les CSA et les variables exposées, consultez le guide [Component Specific Actions](/docs/widgets/chat/csa).

## Propriétés

| Propriété | Description | Valeur attendue |
|----------|-------------|--------------- |
| Chat Title | Titre du composant chat. | Chaîne de caractères (par ex. `ToolJet Support Chatbot`) |
| Initial Chat | Messages initiaux à charger au démarrage du chat. | Tableau d'objets ( par ex. `{{[ { message: 'Hey! Welcome to ToolJet. How may I help you?' } ]}}` ) |
| User Name | Définit le nom de l'utilisateur. | Chaîne de caractères (par ex. `John Doe`) |
| User Avatar | Définit l'avatar de l'utilisateur. | URL d'image |
| Respondent Name | Définit le nom du répondant. | Chaîne de caractères (par ex. `ToolJet Bot`) |
| Respondent Avatar | Définit l'avatar du répondant. | URL d'image |

## Propriétés de l'objet Message

| Propriété | Description | Requis | Valeur attendue |
|----------|-------------|----------|----------------|
| Message | Le contenu du message. | Requis | Chaîne de caractères (par ex. `"Hey! How can I help you?"`) |
| Message ID | ID du message. | Généré automatiquement | Chaîne de caractères (par ex. `"e3dd6f60-d5e8-46c5-b73b-006f2f4a34f2"`) |
| Timestamp | Date et heure du message. | Généré automatiquement | DateTime au format ISO 8601 (par ex. `"2025-02-05T09:33:32.468Z"`) |
| Name | Nom de l'expéditeur du message. | Optionnel | Chaîne de caractères (par ex. `"John Doe"`) |
| Avatar | Avatar de l'expéditeur du message. | Optionnel | URL d'image |
| Type | Type du message. | Requis | Valeurs acceptées : `"response"`, `"message"` ou `"error"`. |

## Événements

| Événement | Description |
|-------|-------------|
| On history cleared | Se déclenche chaque fois que l'historique est effacé. |
| On message sent | Se déclenche chaque fois qu'un message est envoyé. |

## Actions supplémentaires

Toutes les actions suivantes peuvent être activées ou désactivées, soit à l'aide du bouton bascule, soit en configurant dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique.

| Action | Description |
|--------|-------------|
| Visibility | Contrôle la visibilité du composant. |
| Disable input state | Active ou désactive l'état du champ de saisie. |
| Histroy loading state | Active l'état de chargement de l'historique, souvent utilisé avec `isLoading` pour indiquer une progression. |
| Response loading state | Active l'état de chargement de la réponse, souvent utilisé avec `isLoading` pour indiquer une progression. |
| Enable clear history button | Active ou désactive le bouton d'effacement de l'historique. |
| Enable download history button | Active ou désactive le bouton de suppression de l'historique. | 

## Appareils

|<div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Message

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Name | Définit la couleur du nom de l'expéditeur. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |
| Message | Définit la couleur du texte du message. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |
| Timestamp | Définit la couleur de l'horodatage. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |

### Field

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Background | Définit la couleur d'arrière-plan du champ de saisie. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |
| Border | Définit la couleur de bordure du champ de saisie. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |
| Accent | Définit la couleur d'accent du champ de saisie. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |
| Text | Définit la couleur du texte du champ de saisie. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |
| Send icon | Définit la couleur de l'icône d'envoi. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |

### Container

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Background | Définit la couleur d'arrière-plan du conteneur du chat. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |
| Border | Définit la couleur de bordure du conteneur du chat. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |
| Box shadow | Définit la couleur de l'ombre du conteneur du chat. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |
| Border radius | Définit le rayon des coins du conteneur du chat. | Saisissez une valeur numérique (par défaut : `6`) ou définissez-la de manière programmatique avec **fx**. |

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
