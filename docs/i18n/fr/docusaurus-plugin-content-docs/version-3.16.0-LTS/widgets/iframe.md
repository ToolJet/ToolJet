---
id: iframe
title: Iframe
---

Le composant **Iframe** vous permet d'intégrer du contenu externe provenant d'autres sites web ou applications directement dans votre application ToolJet.

## Exemple d'utilisation

Une entreprise de logistique doit afficher le suivi d'expédition en temps réel depuis le portail de suivi de son transporteur tiers. À l'aide du composant Iframe, elle intègre directement la page de suivi du transporteur dans son tableau de bord opérationnel interne, permettant au personnel de l'entrepôt de suivre les expéditions sans changer d'application.

## Propriétés

| Propriété | Description | Valeur attendue |
|:---------|:------------|:---------------|
| URL | L'URL du contenu externe à intégrer dans l'iframe. | Chaîne de caractères (ex. `https://tooljet.io/`). |

## Événements

Le composant **Iframe** ne prend en charge aucun événement.

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) :

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
| :------------ | :---------- | :------------ |
| setURL | Définit l'URL de l'iframe pour afficher dynamiquement un contenu différent. | `components.iframe1.setURL('https://example.com')` |
| setVisibility | Définit la visibilité du composant. | `components.iframe1.setVisibility(true)` |
| setDisable | Désactive ou active le composant. | `components.iframe1.setDisable(false)` |
| setLoading | Définit l'état de chargement du composant. | `components.iframe1.setLoading(true)` |

## Variables exposées

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
|:--------|:-----------|:------------|
| url | Contient l'URL actuellement chargée dans l'iframe. | `{{components.iframe1.url}}` |
| isVisible | Indique si le composant est visible. | `{{components.iframe1.isVisible}}` |
| isDisabled | Indique si le composant est désactivé. | `{{components.iframe1.isDisabled}}` |
| isLoading | Indique si le composant est en état de chargement. | `{{components.iframe1.isLoading}}` |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:------------------|:------------|:------------------------------|
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. | Chaîne de caractères (ex. `View external content here.`). |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Box Shadow | Définit les propriétés de l'ombre du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées, ou définissez-la de manière programmatique avec **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide de **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Signalez-le via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
