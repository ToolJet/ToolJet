---
id: marketplace-plugin-spanner
title: Google Cloud Spanner
---

L'intégration de Google Cloud Spanner avec ToolJet vous permet de connecter vos bases de données Spanner et d'interagir directement avec elles depuis votre application. Vous pouvez exécuter des requêtes SQL, récupérer des données et effectuer des opérations d'écriture sur vos instances Cloud Spanner.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Vous aurez besoin de la **clé privée** et de l'**ID d'instance** pour vous connecter à Google Cloud Spanner.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/spanner/connection.png" alt="Configuration de Cloud Spanner" />

## Dialectes SQL pris en charge

### Google Standard SQL

Utilisez ceci pour accéder aux fonctionnalités natives de Spanner et exploiter toutes ses capacités de scalabilité et de cohérence.

**Paramètres**
- **Database ID** : Identifiant de la base de données Spanner à laquelle se connecter et sur laquelle exécuter les requêtes.
- **SQL Query** : L'instruction SQL à exécuter sur la base de données Spanner sélectionnée.
- **Query Mode** : Spécifie le type d'opération à effectuer sur la base de données, comme l'exécution de requêtes de lecture/écriture ou l'application de modifications de schéma (CREATE, ALTER, DROP).
- **SQL Parameters** : Paires clé-valeur utilisées pour transmettre en toute sécurité des valeurs dynamiques dans la requête SQL.
- **Types** : Types de données attribués à chaque paramètre SQL pour garantir une exécution correcte de la requête.
- **Options** : Paramètres supplémentaires pour personnaliser le comportement de la requête.

```sql
INSERT INTO employees (employee_id, first_name, last_name, email) 
VALUES (2, 'Jane', 'Smith', 'jane.smith@example.com');
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/spanner/gs-sql-query.png" alt="Requête Google SQL Spanner" />

### PostgreSQL

Utilisez ceci pour accéder à Spanner avec une syntaxe et des outils compatibles PostgreSQL, idéal pour migrer des charges de travail PostgreSQL existantes.

**Paramètres**
- **Database ID** : Identifiant de la base de données Spanner à laquelle se connecter et sur laquelle exécuter les requêtes.
- **SQL Query** : L'instruction SQL à exécuter sur la base de données Spanner sélectionnée.
- **SQL Parameters** : Paires clé-valeur utilisées pour transmettre en toute sécurité des valeurs dynamiques dans la requête SQL.
- **Types** : Types de données attribués à chaque paramètre SQL pour garantir une exécution correcte de la requête.
- **Options** : Paramètres supplémentaires pour personnaliser le comportement de la requête.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/spanner/postgre-sql-query.png" alt="Spanner PostgreSQL" />
