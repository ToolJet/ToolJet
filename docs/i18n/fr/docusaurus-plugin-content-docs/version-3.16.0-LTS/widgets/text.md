---
id: text
title: Text
---

Le composant **Text** peut être utilisé pour créer des en-têtes, des sous-en-têtes, ajouter des libellés à côté de divers champs de saisie, et bien plus encore. Dans ce document, nous allons passer en revue toutes les options de configuration du composant **Text**.

## Data

| Type de données      | Description                                                                                                                                                         |
| :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Plain text** | Texte simple sans mise en forme. Idéal pour des messages directs ne nécessitant ni mise en valeur ni mise en page particulière.                                               |
| **Markdown**   | Permet une mise en forme simple du texte avec des éléments tels que les en-têtes, le gras, l'italique, les liens et les listes, ce qui le rend adapté à la rédaction de contenu nécessitant une mise en forme de base. |
| **HTML**       | Utilisé pour créer du texte formaté et divers éléments sur les pages web.                                                                                                    |

## Événements

| <div style={{ width:"100px"}}> Événement </div> | <div style={{ width:"100%"}}> Description </div>      |
| :------------------------------------------ | :---------------------------------------------------- |
| On click                                    | Se déclenche chaque fois que l'utilisateur clique sur le composant.   |
| On hover                                    | Se déclenche chaque fois que l'utilisateur survole le composant. |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant **Text** peuvent être contrôlées à l'aide des Component-Specific Actions (CSA) :

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>                                                                         |
| :------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------- |
| setText()                                    | Définit la valeur du champ de saisie.                | Utilisez une requête RunJS (par ex., <br/> `await components.text1.setText('this is input text')`) ou déclenchez-la à l'aide d'un événement. |
| clear()                                      | Efface le texte saisi dans le champ de saisie.       | Utilisez une requête RunJS (par ex., <br/> `await components.text1.clear()`) ou déclenchez-la à l'aide d'un événement.                       |
| setVisibility()                              | Définit la visibilité du composant.             | Utilisez une requête RunJS (par ex., <br/> `await components.text1.setVisibility(false)`) ou déclenchez-la à l'aide d'un événement.          |
| setLoading()                                 | Définit l'état de chargement du composant.          | Utilisez une requête RunJS (par ex., <br/> `await components.text1.setLoading(true)`) ou déclenchez-la à l'aide d'un événement.              |
| setDisable()                                 | Désactive le composant.                           | Utilisez une requête RunJS (par ex., <br/> `await components.text1.setDisable(true)`) ou déclenchez-la à l'aide d'un événement.              |

:::info
Consultez les **actions spécifiques au composant** disponibles pour ce composant **[ici](/docs/actions/control-component)**.
:::

## Variables exposées

|                     Variable                     |                Description                |                                 Comment y accéder                                 |
| :----------------------------------------------: | :---------------------------------------: | :---------------------------------------------------------------------------: |
|    <div style={{ width:"100px"}}> text </div>    | Contient la valeur du libellé du composant. |    Accessible dynamiquement en JS (par ex., `{{components.text1.text}}`).    |
| <div style={{ width:"100px"}}> isLoading </div>  |  Indique si le composant est en cours de chargement.   | Accessible dynamiquement en JS (par ex., `{{components.text1.isLoading}}`).  |
| <div style={{ width:"100px"}}> isVisible </div>  |  Indique si le composant est visible.   | Accessible dynamiquement en JS (par ex., `{{components.text1.isVisible}}`).  |
| <div style={{ width:"100px"}}> isDisabled </div> |  Indique si le composant est désactivé.  | Accessible dynamiquement en JS (par ex., `{{components.text1.isDisabled}}`). |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>                                                       | <div style={{ width:"250px"}}> Options de configuration </div>                                                                  |
| :------------------------------------------- | :------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| Dynamic height                               | Ajuste automatiquement la hauteur du composant en fonction de son contenu.                                      | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show loading state                           | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. À activer/désactiver ou à définir dynamiquement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility                                   | Contrôle la visibilité du composant. À activer/désactiver ou à définir dynamiquement.                                               | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable                                      | Active ou désactive le composant. À activer/désactiver ou à définir dynamiquement.                                           | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip                                      | Fournit des informations supplémentaires au survol. Définissez une valeur de chaîne à afficher.                               | String (par ex., `Enter your name here.` ).                                                                                     |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>                                                                              |
| ---------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Rend le composant visible en vue bureau.      | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile                                 | Rend le composant visible en vue mobile.       | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

---

# Styles

## Text

| Propriété de texte   | Description                                                                                      | Options de configuration                                                                                                                          |
| :-------------- | :----------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| Size            | Dimensions des caractères d'une police.                                                          | Saisissez un nombre entre `1-100` ou configurez-le dynamiquement à l'aide de **fx**.                                                                     |
| Weight          | Détermine si votre texte apparaît en gras ou en léger.                                              | Sélectionnez `light`, `regular`, `semi-bold` ou `bold`, ou configurez-le dynamiquement à l'aide de **fx**.                                                |
| Style           | Vous permet d'appliquer des styles tels que italique ou normal, modifiant l'apparence générale du contenu textuel. | Sélectionnez `normal`, `italic` ou `oblique`, ou configurez-le dynamiquement à l'aide de **fx**.                                                          |
| Color           | Définit la couleur du texte.                                                                      | Choisissez une couleur à l'aide du sélecteur de couleurs ou configurez-la dynamiquement à l'aide de **fx**.                                                                |
| Scroll          | Crée une barre de défilement si le texte dépasse les dimensions du composant.                             | Choisissez entre `enable` ou `disable`, ou configurez-le dynamiquement à l'aide de **fx**.                                                                 |
| Line Height     | Détermine l'espace vertical entre les lignes de texte au sein d'un élément.                           | Saisissez un nombre comme valeur (exemple : `1.5`) ou configurez-le dynamiquement à l'aide de **fx**.                                                         |
| Text Indent     | Généralement utilisé pour créer un effet d'indentation.                                                   | Saisissez un nombre comme valeur (exemple : `10`) ou configurez-le dynamiquement à l'aide de **fx**.                                                          |
| Alignment       | Définit l'alignement du texte.                                                                  | Sélectionnez les options disponibles pour aligner le texte verticalement ou horizontalement, ou configurez-le dynamiquement à l'aide de **fx**.                            |
| Text Decoration | Ajoute un souligné, un surligné, une barre traversante, ou une combinaison de ces éléments au texte sélectionné.           | Sélectionnez l'une des options disponibles - `none(default)`, `underline`, `overline`, et `strike-through`, ou configurez-la dynamiquement à l'aide de **fx**. |
| Transformation  | Dicte la capitalisation du texte.                                                             | Sélectionnez l'une des options disponibles - `none (default)`, `uppercase`, `lowercase`, `capitalize`, ou configurez-la dynamiquement à l'aide de **fx**.       |
| Letter spacing  | Détermine l'espace entre chaque lettre.                                                        | Saisissez un nombre comme valeur (exemple : `15`) ou configurez-le dynamiquement à l'aide de **fx**.                                                          |
| Word spacing    | Détermine l'espace entre chaque mot.                                                        | Saisissez un nombre comme valeur (exemple : `15`) ou configurez-le dynamiquement à l'aide de **fx**.                                                          |
| Font variant    | Ajuste l'apparence du texte en appliquant des variantes de police.                                                         | Sélectionnez l'une des options disponibles - `normal`, `inherit`, `small-caps`, `initial`, ou configurez-la dynamiquement à l'aide de **fx**.                   |

## Container

| <div style={{ width:"100px"}}> Propriété du champ </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>                                            |
| :--------------------------------------------------- | :------------------------------------------------ | :----------------------------------------------------------------------------------------------------- |
| Background                                           | Définit la couleur d'arrière-plan du composant.       | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique un code couleur Hex.     |
| Border                                               | Définit la couleur de bordure du composant.           | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique un code couleur Hex.     |
| Border radius                                        | Modifie le rayon de bordure du composant.      | Saisissez un nombre ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique une valeur numérique.      |
| Box shadow                                           | Définit les propriétés d'ombre du composant.  | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées, ou définissez-la de manière programmatique via **fx**. |
| Padding                                              | Ajoute du remplissage au composant.                    | Sélectionnez `None` pour aucun remplissage et `Default` pour un remplissage standard.                                       |

## Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide de **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan inclut la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::
