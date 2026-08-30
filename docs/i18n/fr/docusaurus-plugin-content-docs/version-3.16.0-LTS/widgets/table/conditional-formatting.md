---
id: conditional-formatting
title: Conditional Formatting
---

Le formatage conditionnel vous permet de modifier dynamiquement la **couleur du texte**, la **couleur de fond** et l'état **disable action button** des colonnes de la Table en fonction des valeurs de cellule ou des données de la ligne. Vous pouvez l'utiliser pour mettre en évidence des données importantes, signaler des anomalies, ou catégoriser visuellement des enregistrements, tout cela sans écrire de requête distincte ni ajouter de composants supplémentaires.

## Fonctionnement

Chaque colonne du composant Table possède les propriétés de style **Text Color** et **Cell Color**. Par défaut, elles acceptent une valeur de couleur statique. En cliquant sur l'icône **fx** à côté de ces propriétés, vous pouvez écrire des expressions JavaScript à l'intérieur de `{{ }}` qui s'évaluent pour chaque ligne au moment du rendu.

Deux identifiants sont disponibles dans ces expressions :

| Identifiant | Description |
|:-----------|:------------|
| `cellValue` | La valeur de la cellule actuelle dans cette ligne. Utilisez-le lorsque la condition de formatage dépend des données propres à la colonne. |
| `rowData`  | Un objet contenant toutes les valeurs de colonnes pour la ligne actuelle. Utilisez-le lorsque la condition de formatage dépend des données d'autres colonnes. |

:::info
Pour en savoir plus sur l'écriture d'expressions dynamiques, consultez [Using fx for Dynamic Behaviour](/docs/app-builder/custom-code/fx-dynamic-behaviour).
:::

## Configurer le formatage conditionnel

1. Cliquez sur le composant **Table** pour ouvrir le panneau de propriétés.
2. Allez dans la section **Columns** et sélectionnez la colonne que vous souhaitez formater.
3. Faites défiler jusqu'à la section **Styles** de la colonne.
4. Cliquez sur l'icône **fx** à côté de **Text Color** ou **Cell Color**.
5. Saisissez une expression JavaScript utilisant `cellValue` ou `rowData`.

L'expression doit renvoyer une valeur de couleur CSS valide — un nom de couleur (par ex., `red`), un code hexadécimal (par ex., `#D9534F`), ou tout autre format de couleur pris en charge par CSS.

### Types de colonnes pris en charge

Tous les types de colonnes ne prennent pas en charge les deux options de formatage. Le tableau ci-dessous résume la prise en charge selon les types de colonnes.

<div style={{ display: 'flex' }} >

<div style = {{ width:'50%' }} >

| Column Type | Text Color | Cell Background Color |
|:------------|:----------|:---------------------|
| String      | Oui | Oui |
| Number      | Oui | Oui |
| Text        | Oui | Oui |
| Date Picker | Oui | Oui |
| Boolean     | Oui | Oui |

</div>

<div style = {{ width:'50%' }} >

| Column Type | Text Color | Cell Background Color |
|:------------|:----------|:---------------------|
| Select      | Oui | Non  |
| Multiselect | Oui | Non  |
| Link        | Oui | Non  |
| Image       | Oui | Non  |
| Toggle      | Oui | Non  |

</div>

</div>

### Exemples

#### Couleur du texte selon la valeur de la cellule

Formatez une colonne **Rating** de sorte que les notes faibles apparaissent en rouge, les notes moyennes en orange, et les notes élevées en vert :

```js
{{cellValue >= 4 ? '#5CB85C' : cellValue >= 2.5 ? '#F0AD4E' : '#D9534F'}}
```

<img className="screenshot-full img-l" src="/img/widgets/table/conditional-formatting/text-cv.png" alt="Text Color Based on Cell Value" /> 

#### Couleur de fond de cellule selon la valeur de la cellule

Mettez en évidence une colonne **Sales** où les cellules à valeur élevée reçoivent un fond vert et les cellules à faible valeur un fond rouge :

```js
{{cellValue >= 1000 ? '#e8f5e9' : cellValue >= 500 ? '#fff3e0' : '#ffebee'}}
```

<img className="screenshot-full img-l" src="/img/widgets/table/conditional-formatting/cell-cv.png" alt="Cell Color Based on Cell Value" /> 

#### Couleur du texte selon les données de la ligne

Changez la couleur du texte d'une colonne **id** en fonction de la colonne `phone` de la même ligne :

```js
{{ rowData.id > 3 ? '#D9534F' : '#5CB85C' }}
```

<img className="screenshot-full img-l" src="/img/widgets/table/conditional-formatting/text-rowdata.png" alt="Text Color Based on Row Data" /> 


#### Couleur de fond de cellule selon les données de la ligne

Colorez une colonne **Title** en fonction de l'`interest` du produit :

```js
{{ 
  rowData.interest?.includes('Photography') ? '#030f16' : rowData.interest?.includes('Traveling') ? '#5ec522' : '#ed1717' 
}}
```

<img className="screenshot-full img-l" src="/img/widgets/table/conditional-formatting/cell-rowdata.png" alt="Cell Background Based on Row Data" /> 

#### Combiner plusieurs conditions

Utilisez des opérateurs ternaires imbriqués ou des opérateurs logiques pour créer des règles plus complexes. Par exemple, formatez une colonne **Name** en combinant `id` et `phone` issus des données de la ligne :

```js
{{ 
  rowData.id === 1 ? '#1565c0' : rowData.phone > 9000000000 ? '#212121' : '#bdbdbd' 
}}
```

<img className="screenshot-full img-l" src="/img/widgets/table/conditional-formatting/multiple-condition.png" alt="Combining Multiple Conditions" /> 

:::info
Vous pouvez utiliser des codes couleur hexadécimaux, des couleurs CSS nommées (`red`, `lightgreen`), ou des fonctions `rgb()`/`hsl()` dans vos expressions.
:::

#### Colonnes dynamiques

Lorsque vous utilisez les **[Dynamic Columns](/docs/widgets/table/dynamic-column)**, vous pouvez définir le formatage conditionnel directement dans la définition JSON de la colonne à l'aide des clés `textColor` et `cellBackgroundColor` :

```json
{
   "name": "Revenue",
   "columnType": "number",
   "key": "revenue",
   "textColor": "{{cellValue > 5000 ? '#2e7d32' : '#c62828'}}",
   "cellBackgroundColor": "{{cellValue > 5000 ? '#e8f5e9' : '#ffebee'}}",
   "isEditable": false
}
```

## Désactiver les boutons d'action

Vous pouvez désactiver conditionnellement les boutons d'action ligne par ligne en utilisant les mêmes identifiants `cellValue` et `rowData` disponibles dans le formatage conditionnel. Un bouton désactivé apparaît grisé et ne peut pas être cliqué.

### Configuration

1. Cliquez sur le composant **Table** pour ouvrir le panneau de propriétés.
2. Allez dans la section **Action Buttons** et sélectionnez le bouton d'action à configurer.
3. Trouvez la propriété **Disable action button**.
4. Cliquez sur l'icône **fx** pour passer à une expression dynamique.
5. Saisissez une expression JavaScript utilisant `cellValue` ou `rowData` qui renvoie `true` pour désactiver le bouton ou `false` pour le laisser activé.

### Exemples

**Désactiver selon le statut de la ligne**

Désactivez un bouton lorsque le `status` de la ligne est `completed` :

```js
{{rowData.status === 'completed'}}
```

**Désactiver selon un seuil numérique**

Désactivez un bouton "Refund" lorsque `amount` est nul ou négatif :

```js
{{rowData.amount <= 0}}
```

**Désactiver selon plusieurs conditions**

Désactivez un bouton "Approve" lorsque la ligne est déjà approuvée ou que le rôle de l'utilisateur est `viewer` :

```js
{{rowData.approved === true || rowData.role === 'viewer'}}
```

**Désactiver pendant qu'une requête est en cours de chargement**

Désactivez le bouton pendant qu'une requête associée est en cours pour éviter les soumissions en double :

```js
{{queries.updateRecord.isLoading}}
```

## Related

- [Using fx for Dynamic Behaviour](/docs/app-builder/custom-code/fx-dynamic-behaviour) — Écriture d'expressions dynamiques à travers les composants ToolJet.
