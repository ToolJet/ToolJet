---
id: database-editor
title: Éditeur de base de données
---

Vous pouvez gérer la base de données ToolJet directement depuis l'éditeur de base de données. ToolJet Database organise les données en **tables** qui peuvent avoir des structures différentes. Toutes les tables seront listées par ordre alphabétique à gauche. Cliquez sur l'une des tables pour afficher les données de la table.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/tables-v2.png" alt="Base de données ToolJet" />

La barre latérale de gauche peut également être réduite pour donner plus d'espace à l'éditeur de base de données.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/collapse-v2.gif" alt="Base de données ToolJet"/>

<div style={{paddingTop:'24px'}}>

## Créer une nouvelle table

Pour créer une nouvelle table dans ToolJet Database :
 - Cliquez sur le bouton **Create New Table** en haut à gauche de l'éditeur de base de données.
 - Un tiroir s'ouvrira depuis la droite. Saisissez les détails de votre nouvelle table.

#### Pour créer une nouvelle table, vous devrez :
- Saisir un **Table name**.
- Par défaut, une colonne **id** avec le type de données **serial** est automatiquement créée comme **clé primaire** de la table. Vous pouvez changer la clé primaire vers n'importe quelle autre colonne.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/create-table-v2.png" alt="Base de données ToolJet" />

- Ajouter des colonnes :

| **Option** | **Description** |
| --- | --- |
| **Column name** | Saisissez un nom unique pour la colonne. |
| **Data type** | Sélectionnez le type de données approprié pour la colonne dans le menu déroulant. Pour plus d'informations sur les types de données disponibles, consultez la section [Types de données pris en charge](/docs/tooljet-db/data-types#supported-data-types). |
| **Default value (optional)** | Spécifiez toute valeur par défaut à attribuer à la colonne. Si laissé vide, la colonne autorisera les valeurs null. |
| **Primary Key** | Cochez cette case pour désigner la colonne comme [clé primaire](/docs/tooljet-db/constraints/primary-key). Plusieurs colonnes peuvent être sélectionnées, créant une clé primaire composite. |
| **NULL/NOT NULL toggle** | Utilisez ce bouton pour déterminer si la colonne doit autoriser les valeurs null ou exiger une valeur. Par défaut, les valeurs null sont autorisées. |
| **Unique toggle** | Cliquez sur le menu kebab et activez l'option **Unique** pour ajouter une contrainte d'unicité à la colonne, garantissant que toutes les valeurs sont distinctes. Par défaut, les valeurs en double sont autorisées. |
| **Foreign Key** | Cliquez sur le bouton **+ Add Relation** pour établir une relation de clé étrangère, liant cette colonne à une ou plusieurs colonnes de clé primaire ou de contrainte unique dans une autre table. |

</div>

<div style={{paddingTop:'24px'}}>

## Contraintes de colonne {#column-constraints}

ToolJet Database prend en charge plusieurs contraintes de colonne pour maintenir l'intégrité des données et appliquer des règles sur les données stockées dans les tables. Ces contraintes comprennent :

**Primary Key** : La contrainte de clé primaire garantit que les valeurs de la ou des colonnes désignées sont uniques et non nulles sur toutes les lignes de la table. Elle sert d'identifiant unique pour chaque enregistrement de la table.

**Foreign Key** : La contrainte de clé étrangère établit un lien entre les données de deux tables, garantissant l'intégrité référentielle. Elle exige que les valeurs de la ou des colonnes de clé étrangère de la table source correspondent aux valeurs de la ou des colonnes de clé primaire ou de contrainte unique de la table cible.
 - Table source : La table actuelle à laquelle la contrainte doit être ajoutée.
 - Table cible : La table qui contient la colonne à référencer.

**Unique** : La contrainte d'unicité garantit que les valeurs de la ou des colonnes désignées sont uniques sur toutes les lignes de la table, tout en autorisant les valeurs null.

**Not Null** : La contrainte not null garantit que la ou les colonnes désignées ne peuvent pas avoir de valeurs null, exigeant une valeur pour chaque ligne de la table.

Pour un aperçu détaillé des contraintes autorisées pour chaque type de données, consultez le tableau [Contraintes autorisées par type de données](/docs/tooljet-db/data-types#permissible-constraints-per-data-type).

</div>

<div style={{paddingTop:'24px'}}>

## Ajouter et modifier des données

### Ajouter de nouvelles données

Le bouton Add new data en haut de l'éditeur de table vous permet d'ajouter des données à la table. Vous pouvez soit **[ajouter une nouvelle ligne](#add-new-row)** soit **[téléverser des données en masse](#bulk-upload-data)** pour ajouter des données à la table.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/v2-beta/database/ux2/add-new-data-v2.png" alt="Base de données ToolJet" />

### Ajouter une nouvelle ligne {#add-new-row}

Pour ajouter une nouvelle ligne à une table, cliquez sur le bouton `Add new data` en haut puis sélectionnez l'option **Add new row**, ou cliquez sur le bouton **+** présent en bas à gauche.<br/>
Un tiroir s'ouvrira depuis la droite où vous pourrez fournir les valeurs de la nouvelle ligne.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/v2-beta/database/ux2/add-new-row-v2.gif" alt="Base de données ToolJet"/>

### Modifier une ligne

Pour modifier une ligne, survolez la ligne que vous souhaitez modifier ; l'icône d'expansion apparaîtra à côté de la case à cocher de cette ligne. Cliquez sur l'icône d'expansion pour ouvrir le tiroir et modifier la ligne.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/v2-beta/database/ux2/edit-row-v2.png" alt="Base de données ToolJet" />

### Modifier une cellule

- Double-cliquez sur la cellule que vous souhaitez modifier.
- Saisissez la nouvelle valeur.
- Cliquez sur le bouton **Save** ou appuyez sur **Enter** pour enregistrer les modifications. 
- Pour les colonnes de type boolean, utilisez le bouton pour changer la valeur.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/v2-beta/database/ux2/edit-cell-v2.gif" alt="Base de données ToolJet"/>

### Téléverser des données en masse {#bulk-upload-data}

Vous pouvez téléverser des données en masse dans la base de données ToolJet en cliquant sur le bouton **Bulk upload data** en haut de l'éditeur de base de données. En cliquant sur le bouton, un tiroir s'ouvrira depuis la droite d'où vous pourrez téléverser un fichier **CSV**. Ce fichier est utilisé pour insérer des enregistrements dans la table. Si les données de la colonne id sont manquantes, un nouvel enregistrement sera inséré avec les données de la ligne ; si l'id est présent, l'enregistrement correspondant sera mis à jour avec les données de la ligne.

Depuis le tiroir, les utilisateurs peuvent télécharger le **fichier CSV modèle** dans lequel ils peuvent saisir les données à téléverser dans la table de la base de données ToolJet, ou formater leur fichier CSV de la même manière que le fichier modèle.

Une fois le fichier CSV prêt, cliquez sur le sélecteur de fichier pour sélectionner le fichier ou faites-le glisser-déposer dans le sélecteur de fichier. Cliquez ensuite sur le bouton **Upload data** pour téléverser les données dans la base de données ToolJet.

**Exigences** :
- Les types de données des colonnes du fichier CSV doivent correspondre à ceux de la table de la base de données ToolJet.
- La colonne `id` avec un type de données `serial` ne doit pas contenir de valeurs en double.
- Toutes les contraintes de colonne doivent être respectées. Par exemple, si une colonne est marquée comme `Unique`, elle ne doit pas contenir de valeurs en double dans le fichier CSV.

**Limitations** :
- Il y a une limite de 1000 lignes par fichier CSV pouvant être téléversé dans la base de données ToolJet.
- Le fichier CSV ne doit pas dépasser 2 Mo.

:::info
Vous pouvez contourner les limitations ci-dessus dans la version auto-hébergée en ajoutant les variables d'environnement suivantes :
- `TOOLJET_DB_BULK_UPLOAD_MAX_ROWS` : Spécifie le nombre maximal de lignes pouvant être téléversées. La valeur par défaut est 1 000 lignes.
- `TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB` : Spécifie la taille maximale du fichier CSV pour les téléversements en masse. La taille maximale par défaut est de 5 Mo.
:::

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/v2-beta/database/ux2/bulk-upload-data-v2.png" alt="Base de données ToolJet" />

### Supprimer des enregistrements

Pour supprimer un ou plusieurs enregistrements/lignes, cliquez sur la case à cocher à droite de l'enregistrement ou des enregistrements que vous souhaitez supprimer. Dès que vous sélectionnez un seul enregistrement, le bouton pour supprimer l'enregistrement apparaîtra en haut ; cliquez sur le bouton **Delete record** pour supprimer les enregistrements sélectionnés.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/delete-rows-v2.png" alt="Base de données ToolJet" />

</div>

<div style={{paddingTop:'24px'}}>

## Filtre

### Ajouter un filtre

Vous pouvez ajouter autant de filtres que vous le souhaitez dans la table en cliquant sur le bouton **Filter** présent en haut de l'éditeur de base de données.

#### Ajouter un filtre sur les données de la table
- Sélectionnez une **column** dans le menu déroulant Columns.
- Choisissez une **[opération](#available-operations-are)**.
- Saisissez une **valeur** pour l'opération sélectionnée.

#### Les opérations disponibles sont : {#available-operations-are}
| **Operation** | **Description** |
| --- | --- |
| **equals** | Cette opération est utilisée pour vérifier si la valeur de la colonne est égale à la valeur saisie dans le champ de saisie. |
| **greater than** | Cette opération est utilisée pour vérifier si la valeur de la colonne est supérieure à la valeur saisie dans le champ de saisie. |
| **greater than or equal** | Cette opération est utilisée pour vérifier si la valeur de la colonne est supérieure ou égale à la valeur saisie dans le champ de saisie. |
| **less than** | Cette opération est utilisée pour vérifier si la valeur de la colonne est inférieure à la valeur saisie dans le champ de saisie. |
| **less than or equal** | Cette opération est utilisée pour vérifier si la valeur de la colonne est inférieure ou égale à la valeur saisie dans le champ de saisie. |
| **not equal** | Cette opération est utilisée pour vérifier si la valeur de la colonne n'est pas égale à la valeur saisie dans le champ de saisie. |
| **like** | Cette opération est utilisée pour vérifier si la valeur de la colonne ressemble à la valeur saisie dans le champ de saisie. Cette opération est sensible à la casse. ex : `ToolJet` ne correspondra pas à `tooljet` |
| **ilike** | Cette opération est utilisée pour vérifier si la valeur de la colonne ressemble à la valeur saisie dans le champ de saisie. Cette opération est insensible à la casse. ex : `ToolJet` correspondra à `tooljet` |
| **match** | Cette opération est utilisée pour vérifier si la valeur de la colonne ressemble à la valeur saisie dans le champ de saisie. Cette opération est sensible à la casse. ex : `ToolJet` ne correspondra pas à `tooljet`. Cette opération utilise des expressions régulières. ex : `^ToolJet$` correspondra à `ToolJet` mais pas à `ToolJet Inc`. |
| **imatch** | Cette opération est utilisée pour vérifier si la valeur de la colonne ressemble à la valeur saisie dans le champ de saisie. Cette opération est insensible à la casse. Cette opération utilise des expressions régulières. ex : `^ToolJet$` correspondra à `ToolJet` mais pas à `ToolJet Inc`. |
| **in** | Cette opération est utilisée pour vérifier si la valeur de la colonne se trouve dans la liste de valeurs saisies dans le champ de saisie. ex : `(1,2,3)` |
| **is** | Cette opération est utilisée pour vérifier si la valeur de la colonne est égale à la valeur saisie dans le champ de saisie. Cette opération est utilisée pour les types de données booléens. |

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/v2-beta/database/ux2/filter-data-v2.png" alt="Base de données ToolJet" />

### Effacer les filtres

Vous pouvez soit supprimer les filtres individuellement, soit effacer tous les filtres en une seule fois.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/v2-beta/database/ux2/clear-all.png" alt="Base de données ToolJet" />

</div>

<div style={{paddingTop:'24px'}}>

## Trier

Pour trier les données de la table, cliquez sur le bouton **Sort** en haut, sélectionnez une **column** dans le menu déroulant, puis choisissez un ordre **ascending** ou **descending**.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/sort-v2.png" alt="Base de données ToolJet" />

</div>
