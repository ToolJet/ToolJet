---
id: primary-key
title: Clé primaire
---

ToolJet Database prend en charge les clés primaires à champ unique et les clés primaires composites.

<div style={{paddingTop:'24px'}}>

## Créer une clé primaire à champ unique

Lors de la création d'une nouvelle table, une colonne `id` avec le type de données `serial` est automatiquement générée pour servir de clé primaire. Cependant, vous pouvez désigner toute autre colonne comme clé primaire si vous le souhaitez. La colonne de clé primaire peut être de tout type de données pris en charge, sauf Boolean.
Les contraintes de la colonne de clé primaire garantissent l'intégrité et l'unicité de la clé primaire, ce qui est essentiel pour identifier et référencer correctement les enregistrements au sein de la table. Pour créer une clé primaire à champ unique, suivez ces étapes :

 - Créez ou modifiez une table existante.
 - Cochez la case **Primary** sur la colonne que vous souhaitez définir comme clé primaire. 
 - Cela ajoutera automatiquement la contrainte de clé primaire à la colonne.
 - Cliquez sur le bouton **Create** pour créer la table.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/v2-beta/database/ux2/single-field-pk.gif" alt="Base de données ToolJet"/>

### Contraintes
- La colonne de clé primaire ne peut pas contenir de valeurs null.
- La colonne de clé primaire doit avoir des valeurs uniques sur toutes les lignes.

### Limitations
- Chaque table doit avoir au moins une clé primaire.
- La colonne de clé primaire ne peut pas avoir le type de données Boolean.

</div>

<div style={{paddingTop:'24px'}}>

## Créer une clé primaire composite

Vous avez la possibilité de convertir une colonne de clé primaire existante en une clé primaire composite, composée de deux colonnes ou plus.
En utilisant une clé primaire composite, vous pouvez identifier de manière unique des enregistrements en fonction de plusieurs valeurs de colonnes, offrant une plus grande flexibilité et un meilleur contrôle sur votre structure de données. Pour créer une clé primaire composite, suivez ces étapes :

 - Créez ou modifiez une table existante.
 - Cochez la case **Primary** sur plusieurs colonnes pour les définir comme clé primaire composite. 
 - Cela ajoutera automatiquement la contrainte de clé primaire aux colonnes sélectionnées.
 - Cliquez sur le bouton **Save changes/Create** pour mettre à jour/créer la table.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/v2-beta/database/ux2/composite-pk.gif" alt="Base de données ToolJet"/>

### Contraintes
- Aucune des colonnes de la clé composite ne peut contenir de valeurs null.
- La combinaison des valeurs de toutes les colonnes de la clé composite doit être unique pour chaque ligne de la table.

### Limitation
- Les colonnes de la clé composite ne peuvent pas être du type de données Boolean.

</div>

<div style={{paddingTop:'24px'}}>

## Modifier la clé primaire

Après avoir créé une table, vous pouvez désigner n'importe quelle colonne comme clé primaire, à condition qu'elle respecte les contraintes requises. Si la colonne choisie contient déjà des données, les valeurs existantes doivent être conformes aux contraintes de clé primaire. Cependant, vous ne pouvez pas mettre à jour ou modifier la clé primaire d'une table cible si elle est actuellement référencée comme clé étrangère dans d'autres tables source. Pour modifier la clé primaire, suivez ces étapes :

 - Modifiez une table existante.
 - Cochez la case **Primary** sur la colonne que vous souhaitez définir comme clé primaire.
 - Cela ajoutera automatiquement la contrainte de clé primaire à la colonne.
 - Décochez la case **Primary** sur la colonne de clé primaire existante. Les contraintes de clé primaire resteront en place pour cette colonne mais ne sont plus nécessaires.
 - Cliquez sur le bouton **Save changes** pour mettre à jour la table.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/modify-pk.gif" alt="Base de données ToolJet"/>

</div>

<div style={{paddingTop:'24px'}}>

## Supprimer une clé primaire

Une colonne de clé primaire existante peut être supprimée via le panneau **Edit Table**. Pour supprimer la colonne de clé primaire, suivez ces étapes :

- Modifiez une table existante.
- Sélectionnez une autre colonne pour servir de nouvelle clé primaire pour la table.
- Une fois la nouvelle colonne de clé primaire désignée, vous pouvez passer à la colonne de clé primaire existante.
- Décochez la case **Primary** de la colonne de clé primaire existante pour supprimer son statut de clé primaire.
- Après avoir supprimé la contrainte de clé primaire, vous pouvez supprimer cette colonne de la table.

Vous ne pouvez pas supprimer une clé primaire d'une table cible si elle est utilisée comme clé étrangère dans une ou plusieurs tables source.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/delete-pk.gif" alt="Base de données ToolJet"/>

</div>
