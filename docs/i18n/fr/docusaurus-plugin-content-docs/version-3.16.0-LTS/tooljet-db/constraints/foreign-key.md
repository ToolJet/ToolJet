---
id: foreign-key
title: Clé étrangère
---

Une relation de clé étrangère fait référence à la liaison d'une colonne ou d'un ensemble de colonnes de la table actuelle avec une colonne ou un ensemble de colonnes d'une table existante. Cette relation établit une connexion entre les deux tables, permettant à la table source actuelle de référencer la table cible existante. Lors de la création d'une relation de clé étrangère, vous pouvez sélectionner l'[action](#foreign-key-actions) souhaitée à effectuer sur la ligne source lorsque la ligne référencée (cible) est mise à jour ou supprimée.

<div style={{paddingTop:'24px'}}>

## Contraintes
- La table cible doit contenir une colonne ayant le même type de données que la colonne de la table source.
- La colonne devant être référencée dans la table cible doit explicitement avoir une contrainte Unique.
- La table cible doit déjà exister avant d'ajouter la relation de clé étrangère dans la table source.

## Limitations
- Les auto-références ne sont pas autorisées, c'est-à-dire que la table cible et la table source ne peuvent pas être identiques.
- Aucune clé étrangère ne peut être créée avec une colonne de type de données serial dans la table source.
- Aucune clé étrangère ne peut référencer une colonne de la table cible qui fait partie de sa clé primaire composite.

## Exception
- La clé étrangère créée avec une colonne de type de données integer dans la table source peut également référencer une colonne de type de données serial dans la table cible.

</div>

<div style={{paddingTop:'24px'}}>

## Créer une clé étrangère

Lors de la création/modification d'une table (cible), vous pourrez ajouter une ou plusieurs clés étrangères référençant la ou les colonnes d'autres tables existantes (source).
Pour créer une relation de clé étrangère, suivez ces étapes :

 - Créez ou modifiez une table existante.
 - Cliquez sur le bouton `+ Add Relation` sous la section relation de clé étrangère.
 - La table en cours de création/modification est la table source.
 - Dans la section source, sélectionnez la colonne souhaitée dans le menu déroulant.
 - Dans la section cible, sélectionnez la table cible et la colonne souhaitées dans le menu déroulant.
 - Dans la section Actions, sélectionnez l'action souhaitée à effectuer lorsque la ligne référencée est mise à jour ou supprimée.
 - Cliquez sur le bouton `Create` pour créer la relation de clé étrangère.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/create-fk.gif" alt="Base de données ToolJet"/>

Lors de la définition de la colonne de clé étrangère, la valeur par défaut peut être définie sur Null. Cela garantit que si aucune valeur explicite n'est fournie pour la clé étrangère lors de la création ou de la mise à jour d'un enregistrement, la base de données attribuera automatiquement null à la colonne.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/default-value.png" alt="Valeur par défaut Null"/>

</div>

<div style={{paddingTop:'24px'}}>

## Actions de la clé étrangère {#foreign-key-actions}

Lors de la création d'une relation de clé étrangère, ToolJet Database vous permet de choisir parmi plusieurs actions à effectuer sur la ligne source lorsque la ligne référencée dans la table cible est mise à jour ou supprimée.

### On Update

| Option | Description |
| --- | --- |
| Restrict (par défaut) | Restreint toute mise à jour sur la table cible si une ligne référencée est en cours de mise à jour. |
| Cascade | Toute mise à jour de la ligne référencée dans la table cible apparaîtra également dans la table source. |
| Set NULL | Toute mise à jour de la ligne référencée dans la table cible définira ses instances dans la table source à NULL. |
| Set to Default | Toute mise à jour de la ligne référencée dans la table cible définira ses instances dans la table source à la valeur par défaut de la colonne de clé étrangère de la table source. |

### On Delete

| Option | Description |
| --- | --- |
| Restrict (par défaut) | Restreint toute suppression sur la table cible si une ligne référencée est en cours de mise à jour. |
| Cascade | Toute suppression de la ligne référencée dans la table cible supprimera également la ligne ayant son instance dans la table source. |
| Set NULL | Toute suppression de la ligne référencée dans la table cible définira ses instances dans la table source à NULL. |
| Set to Default | Toute suppression de la ligne référencée dans la table cible définira ses instances dans la table source à la valeur par défaut de la colonne de clé étrangère de la table source. |

</div>

<div style={{paddingTop:'24px'}}>

## Intégrité référentielle

La contrainte de clé étrangère garantit l'intégrité référentielle entre les tables source et cible. Cette contrainte impose que la colonne de clé étrangère dans la table source ait une des valeurs uniques présentes dans la colonne de clé étrangère de la table cible. <br/>
- Lors de la création d'une nouvelle ligne dans la table source, la colonne ayant la relation de clé étrangère aura un menu déroulant avec les valeurs uniques présentes dans la table cible. Cela garantit que les données de la table source sont toujours cohérentes avec les données de la table cible. 
- En bas du menu déroulant, il y a un bouton **Open referenced table** qui vous mènera à la table cible.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/create-new-row-fk.png" alt="Base de données ToolJet" />

- Lors de la modification de la valeur d'une cellule de clé étrangère dans une ligne existante de la table source, le menu déroulant affichera les valeurs uniques présentes dans la table cible. Cela garantit que même lorsque les données de la table source sont mises à jour, elles restent toujours cohérentes avec les données de la table cible.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/edit-row-fk.png" alt="Base de données ToolJet" style={{marginBottom:'15px'}}/>

### Exemple

Prenons un exemple où nous souhaitons créer une relation de clé étrangère entre les tables `Orders` et `Customers` dans une application e-commerce.

D'abord, créez les deux tables suivantes dans la base de données ToolJet :

**Customers**

| Column Name | Data Type | Primary Key    | Not Null | Unique   |
|-------------|-----------|:--------------:|:--------:|:--------:|
| customer_id | int       | ✅             | ✅        | ✅       |
| name        | varchar   | ❌             | ✅        | ❌       |
| email       | varchar   | ❌             | ✅        | ✅       |

**Orders**

| Column Name  | Data Type | Primary Key    | Not Null | Unique   |
|--------------|-----------|:--------------:|:--------:|:--------:|
| order_id     | int       |  ✅            | ✅        | ✅       |
| customer_id  | int       |  ❌            | ✅        | ❌       |
| order_date   | varchar   |  ❌            | ✅        | ❌       |
| total_amount | float     |  ❌            | ✅        | ❌       |

Nous voulons créer une relation de clé étrangère entre la colonne `customer_id` de la table `Orders` et la colonne `customer_id` de la table `Customers`.

1. **Définir la relation de clé étrangère**
   - Modifiez la table `Orders`.
   - Cliquez sur le bouton **+ Add Relation** sous la section relation de clé étrangère.
   - Dans la section **Source**, sélectionnez la colonne `customer_id`.
   - Dans la section **Target**, sélectionnez la table `Customers` et la colonne `customer_id`.
   - Choisissez l'action souhaitée, par exemple **RESTRICT** pour empêcher la suppression d'un client ayant des commandes associées.

3. **Enregistrer les modifications** : Cliquez sur le bouton **Save Changes** pour créer la relation de clé étrangère.

Désormais, chaque fois que vous essayez d'insérer ou de mettre à jour un enregistrement dans la table `Orders`, la valeur `customer_id` doit correspondre à une valeur `customer_id` existante dans la table `Customers`. Cela vous empêche également de supprimer un client ayant des commandes associées. Cela garantit que les commandes sont toujours associées à un client valide, maintenant l'intégrité et la cohérence des données.

</div>
