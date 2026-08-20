---
id: data-types
title: Types de données
---

ToolJet Database prend en charge plusieurs types de données pour s'adapter à différents types d'informations. Chaque type de données a ses propres caractéristiques et utilisations.

## Types de données pris en charge {#supported-data-types}

| Data Type           | Description | Example |
|:--------------------|:----------- |:------- |
| **serial**          | Utilisé pour générer une séquence d'entiers, souvent utilisé comme clé primaire d'une table. Lorsqu'une nouvelle table est créée dans la base de données ToolJet, une colonne **id** avec le type de données serial est automatiquement créée comme **clé primaire** de la table. | Nombres commençant à 1, 2, 3, 4, 5, etc. |
| **varchar**         | Utilisé pour stocker des caractères de longueur indéfinie | Toute valeur de type chaîne |
| **int**             | Un type de données numérique utilisé pour stocker des nombres entiers, sans composante fractionnaire. | Nombres allant de -2147483648 à 2147483647 |
| **bigint**          | Un type de données numérique utilisé pour stocker des nombres entiers plus grands, sans composante fractionnaire. | Nombres allant de -9223372036854775808 à 9223372036854775807 |
| **float**          | Un type de données numérique utilisé pour stocker des valeurs inexactes à précision variable. | Tout nombre à virgule flottante, ex : 3.14 |
| **boolean**        | Peut contenir les valeurs true, false et null. | `true` ou `false` |
| **date with time** | Stocke à la fois les informations de date et d'heure au format ISO 8601. Le fuseau horaire par défaut est celui de l'appareil de l'utilisateur, avec une option pour spécifier un fuseau horaire différent. Toutes les données d'horodatage sont stockées au format UTC et converties vers le fuseau horaire spécifié lors de l'affichage. | '2024-07-22 15:30:00' |
| **jsonb**          | Utilisé pour stocker des données JSON, peut stocker des données structurées comme des tableaux ou des objets imbriqués. | `{"name": "John Doe", "age": 30, "skills": ["JavaScript", "Python"], "address": {"city": "New York", "zip": "10001"}}` |
 
<img className="screenshot-full" src="/img/v2-beta/database/ux2/datatypes-v4.png" alt="Base de données ToolJet" />

## Contraintes autorisées par type de données {#permissible-constraints-per-data-type}

Le tableau suivant montre quelles contraintes sont autorisées pour chaque type de données. Pour des explications plus détaillées sur chaque type de contrainte, consultez la section [Contraintes de colonne](/docs/tooljet-db/database-editor#column-constraints).

|   Data Type    |  Primary Key   |  Foreign Key  | Unique | Not Null   |
|:--------------:|:--------------:|:-------------:|:------:|:----------:|
| serial         |  ✅            | ❌             | ✅     | ✅        |
| varchar        |  ✅            | ✅             | ✅     | ✅        |
| int            |  ✅            | ✅             | ✅     | ✅        |
| bigint         |  ✅            | ✅             | ✅     | ✅        |
| float          |  ✅            | ✅             | ✅     | ✅        |
| boolean        |  ❌            | ❌             | ❌     | ✅        |
| date with time |  ❌            | ❌             | ❌     | ✅        |
| jsonb          |  ❌            | ❌             | ❌     | ✅        |
