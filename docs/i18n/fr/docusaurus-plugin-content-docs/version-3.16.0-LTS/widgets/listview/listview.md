---
id: listview
title: List View
slug: /widgets/listview/
---

Le composant **List View** permet de créer une liste de lignes de données répétables. Tout comme le composant Container, vous pouvez y imbriquer d'autres composants et contrôler combien de fois ils se répètent.

:::caution Composants restreints
Certains composants, à savoir **Calendar** et **Kanban**, ne peuvent pas être placés dans le composant List View via la fonctionnalité de glisser-déposer.
:::

## Définir les données de la liste

Pour peupler dynamiquement les composants List View, vous pouvez utiliser des propriétés de données spécifiques.

Considérez ces données transmises dans la propriété `List data` d'un composant List View :

```js
{{[
    { imageURL: 'https://www.svgrepo.com/show/34217/image.svg', text: 'Sample text 1', buttonText: 'Button 1' },
    { imageURL: 'https://www.svgrepo.com/show/34217/image.svg', text: 'Sample text 1', buttonText: 'Button 2' },
    { imageURL: 'https://www.svgrepo.com/show/34217/image.svg', text: 'Sample text 1', buttonText: 'Button 3' },
]}}
```

Sur la base des données ci-dessus, vous pouvez définir la propriété `Data` d'un composant Text à l'intérieur de List View en utilisant le code ci-dessous :

```js
{{listItem.text}}
```

De même, pour un composant Image à l'intérieur de List View, vous pouvez utiliser le code ci-dessous pour transmettre la valeur `imageURL` :

```js
{{listItem.imageURL}}
```

## Propriétés

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| List data | Les données que vous souhaitez afficher dans le composant List View. Il peut s'agir d'un tableau d'objets ou de données provenant d'une requête qui retourne un tableau d'objets. | Un tableau d'objets ou une requête qui retourne un tableau d'objets. |
| Mode | La mise en page du composant List View. Vous pouvez choisir entre le mode `List` et `Grid`. | `list` ou `grid` |
| Show bottom border | Afficher ou masquer la bordure inférieure d'une ligne. Cette option n'est disponible que lorsque **Mode** est réglé sur `List`. | `true` ou `false` |
| Columns | Le nombre de colonnes dans le composant List View. Cette option n'est disponible que lorsque **Mode** est réglé sur `Grid`. | N'importe quelle valeur numérique |
| Row height | La hauteur de chaque ligne dans le composant List View. | N'importe quel nombre entre 1 et 100 |
| Enable pagination | Activer ou non la pagination. Si activée, vous pouvez définir le nombre de lignes par page. | `true` ou `false` |
| Rows per page | Le nombre de lignes par page. Cette option n'est disponible que lorsque **Enable pagination** est activé. | N'importe quelle valeur numérique |

## Événements

Pour attacher un gestionnaire d'événement au composant List View, suivez ces étapes :

1. Cliquez sur la poignée du composant pour ouvrir ses propriétés dans la barre latérale droite.
2. Accédez à la section **Events**.
3. Cliquez sur le bouton **+Add handler**.

Il existe deux événements que vous pouvez utiliser avec le composant List View :

- **[Row clicked (Déprécié)](#row-clicked)**
- **[Record clicked](#record-clicked)**

### Row clicked

L'événement **Row clicked** se déclenche lorsqu'une ligne à l'intérieur du List View est cliquée. Comme pour les autres événements dans ToolJet, vous pouvez définir plusieurs actions pour cet événement.

Lorsqu'une ligne est cliquée dans le composant List View, certaines données associées sont mises à disposition via les variables **selectedRowId** et **selectedRow**. Pour connaître les variables exposées disponibles pour le composant List View, référez-vous à la section **[ici](#exposed-variables)**.

:::warning
L'événement Row clicked est en cours de dépréciation, il est donc recommandé d'utiliser l'événement **Record Clicked** à la place.
:::

### Record clicked

L'événement **Record clicked** est similaire à l'événement row click, car il se déclenche chaque fois qu'une interaction est effectuée avec un enregistrement dans le composant.

Lorsqu'un enregistrement est cliqué dans le composant List View, les données pertinentes sont exposées via les variables **selectedRecordId** et **selectedRecord**. Pour connaître les variables exposées disponibles pour le composant List View, référez-vous à la section **[ici](#exposed-variables)**.

:::info
Pour obtenir des informations détaillées sur toutes les **Actions**, veuillez consulter la documentation de la [Référence des actions](/docs/actions/run-query).
:::

## Actions spécifiques au composant (CSA)

Il n'existe actuellement aucune CSA (action spécifique au composant) implémentée pour réguler ou contrôler ce composant.

## Variables exposées {#exposed-variables}

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> Comment y accéder </div> |
| :---------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| data | Cette variable stocke les données chargées dans le composant List View. | Récupérez les données de chaque enregistrement dans le list view en utilisant `{{components.listview1.data["0"].text1.text}}` |
| selectedRowId (déprécié) | Cette variable contient l'ID de la ligne cliquée dans le list view. L'ID de ligne commence à `0`.       | Accédez à selectedRowId en utilisant `{{components.listview1.selectedRowId}}` |
| selectedRow (déprécié) | Cette variable contient les données des composants de la ligne sélectionnée. | Accédez aux données en utilisant `{{components.listview1.selectedRow.text1}}` |
| selectedRecordId | Cette variable contient l'ID de l'enregistrement cliqué dans le list view. L'ID d'enregistrement commence à `0`. | Accédez à selectedRecordId en utilisant `{{components.listview1.selectedRecordId}}` |
| selectedRecord | Cette variable stocke les données des composants de l'enregistrement sélectionné. | Accédez aux données en utilisant `{{components.listview1.selectedRecord.text1}}` |
| children | Cette variable stocke les données des composants de tous les enregistrements du composant listview. | L'objectif d'exposer children est de permettre aux composants enfants d'être [contrôlés via des actions spécifiques au composant](#controlling-child-components). |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :------------------------------------------- | :----------------------------------------------- | :---------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Dynamic height | Ajuste automatiquement la hauteur du composant en fonction de son contenu. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une chaîne à afficher.    | Chaîne de caractères |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :--------------------------------------------- |
| Background color | Vous pouvez modifier la couleur de fond du composant en saisissant le code couleur Hex ou en choisissant une couleur de votre choix depuis le sélecteur de couleur. |
| Border color | Vous pouvez modifier la couleur de bordure du listview en saisissant le `code couleur Hex` ou en choisissant une couleur de votre choix depuis le sélecteur de couleur. |
| Visibility | Ceci permet de contrôler la visibilité du composant. Si `{{false}}`, le composant ne sera pas visible après le déploiement de l'application. Il ne peut avoir que des valeurs booléennes, c'est-à-dire `{{true}}` ou `{{false}}`. Par défaut, il est réglé sur `{{true}}`. |
| Disable | Cette propriété n'accepte que des valeurs booléennes. Si réglée sur `{{true}}`, le composant sera verrouillé et deviendra non fonctionnel. Par défaut, sa valeur est réglée sur `{{false}}`. |
| Border radius | Utilisez cette propriété pour modifier le rayon de bordure du list view. Le champ n'accepte que des valeurs numériques de `1` à `100`, la valeur par défaut étant `0`. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::

:::info
Toute propriété disposant d'un bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::

## Exemple : Afficher des données dans le List View

- Commençons par créer une nouvelle application puis en faisant glisser le composant List View sur le canevas.

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/widgets/list-view/emptylist.png" alt="ToolJet - List view component" />

    </div>

- Créons maintenant une requête et sélectionnons REST API dans la liste déroulante des sources de données. Choisissez la méthode `GET` et saisissez le point de terminaison de l'API - `https://reqres.in/api/users?page=1`. Enregistrez cette requête et exécutez-la. Inspectez les résultats de la requête depuis la barre latérale gauche, vous verrez que l'objet `data` obtenu contient un tableau d'objets.

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/widgets/list-view/data.gif" alt="ToolJet - List view component" />

    </div>

- Modifions maintenant la propriété `List data` du composant List View pour afficher les données de la requête. Nous utiliserons du JS pour récupérer les données de la requête - `{{queries.restapi1.data.data}}`. Ici le dernier `data` est un objet de données qui inclut un tableau d'objets, le premier `data` correspond aux données résultant de la requête `restapi1`. Cela créera automatiquement les lignes dans le composant en utilisant ces données.

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/widgets/list-view/datadisplay.png" alt="ToolJet - List view component" />

    </div>

- Enfin, nous devrons imbriquer des composants dans la première ligne du composant List View et le composant créera automatiquement les instances suivantes. Les lignes suivantes s'afficheront de la même manière que vous affichez les données dans la première ligne.

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/widgets/list-view/addingwidgets.gif" alt="ToolJet - List view component" />

    </div>

:::tip

Utilisez `{{listItem.key}}` pour afficher les données sur les composants imbriqués. Exemple : pour afficher les images, nous avons utilisé `{{listItem.avatar}}` où **avatar** est l'une des clés des objets issus du résultat de la requête.

:::

## Contrôler les composants enfants {#controlling-child-components}

Tous les composants enfants du composant List View sont exposés via la variable `children`. Cette variable est un tableau d'objets, où chaque objet représente un enregistrement dans le listview et contient les données des composants enfants.

Les composants à l'intérieur du list view peuvent être contrôlés à l'aide de requêtes javascript. Par exemple, si vous souhaitez désactiver le composant `button1` dans le premier enregistrement, vous pouvez utiliser l'expression suivante :

```js
components.listview1.children[0].button1.disable(true) // désactive le composant button1 dans le premier enregistrement
```