---
id: html
title: HTML Viewer
---

Le composant **HTML Viewer** vous permet de rendre des mises en page HTML et CSS personnalisées au sein de votre application ToolJet. Utilisez-le pour afficher du contenu formaté enrichi, intégrer des designs personnalisés, ou créer des sections visuellement distinctes allant au-delà des composants standards.

## Exemple d'utilisation

Une entreprise de logistique doit afficher des détails de suivi d'expédition avec un style à l'image de sa marque. Le HTML Viewer rend une carte de suivi personnalisée avec les couleurs et la mise en page de l'entreprise, qui se met à jour dynamiquement en fonction des données d'expédition provenant de la base de données.

## Propriétés

| <div style={{ width:"100px"}}> Propriété </div> | Description | Valeur attendue |
|:---------|:------------|:---------------|
| Raw HTML | Le contenu HTML à rendre. Du CSS en ligne peut être ajouté aux balises HTML pour le style. Le contenu est nettoyé à l'aide de DOMPurify pour la sécurité. | Chaîne HTML (ex. `<div style="color: blue;">Hello</div>`) |

**Exemple :**

```html
<body>
   <main>
       <section class="hero" style="height:306px;display:flex;justify-content: center;padding:0 1px;align-items: center;text-align:center">
           You can build your custom HTML-CSS template here
       </section>
   </main>
</body>
```

:::info
Les liens dans le contenu HTML s'ouvrent automatiquement dans un nouvel onglet avec `target="_blank"` et `rel="noopener"` pour des raisons de sécurité.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) :

| <div style={{ width:"120px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
| :------------ | :---------- | :------------ |
| setRawHTML( ) | Définit le contenu Raw HTML du composant. | `components.html1.setRawHTML('<h1>New Content</h1>')` |
| setVisibility( ) | Définit la visibilité du composant. | `components.html1.setVisibility(false)` |
| setLoading( ) | Définit l'état de chargement du composant. | `components.html1.setLoading(true)` |
| setDisable( ) | Désactive ou active le composant. | `components.html1.setDisable(true)` |

## Variables exposées

| Variable | Description | Comment y accéder |
|:--------|:-----------|:------------|
| rawHTML | Le contenu HTML actuel du composant. | `{{components.html1.rawHTML}}` |
| isLoading | Indique si le composant est en état de chargement. | `{{components.html1.isLoading}}` |
| isVisible | Indique si le composant est visible. | `{{components.html1.isVisible}}` |
| isDisabled | Indique si le composant est désactivé. | `{{components.html1.isDisabled}}` |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:------------------|:------------|:------------------------------|
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. Lorsqu'il est désactivé, le composant apparaît estompé et ne répond pas aux interactions. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip  | Fournit des informations supplémentaires au survol. Définissez une chaîne à afficher.  | Chaîne de caractères |

## Appareils

|<div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles


### Container


| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| Box shadow | Définit les propriétés de l'ombre du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées, ou définissez-la de manière programmatique avec **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide de **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::

:::info
Toute propriété disposant d'un bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Signalez-le via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
