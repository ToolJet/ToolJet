---
id: ibmdb
title: IBM DB2
---

ToolJet peut se connecter aux bases de données IBM DB2 pour lire et écrire des données à l'aide de requêtes SQL.

## Connexion

Pour établir une connexion avec la source de données IBM DB2, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requêtes, soit accéder à la page **[Data Sources](/docs/data-sources/overview)** depuis le dashboard de ToolJet.

ToolJet a besoin des éléments suivants pour se connecter à votre base de données IBM DB2 :

- **Host**
- **Port** : par défaut `50000`, le port standard d'IBM DB2.
- **Database** : facultatif. DB2 pour Linux, UNIX et Windows (LUW) nécessite généralement un nom de base de données ; DB2 pour z/OS n'en nécessite pas.
- **Username**
- **Password**

<img class="screenshot-full img-full" src="/img/datasource-reference/ibmdb/connection.png" alt="ToolJet - Data source connection - IBM DB2" />

:::info
Veuillez vous assurer que le **Host/IP** de la base de données est accessible depuis votre VPC si vous utilisez une instance auto-hébergée de ToolJet. Si vous utilisez ToolJet Cloud, veuillez **whitelister** notre adresse IP : `130.131.224.28`.
:::

## Interroger IBM DB2

1. Créez une nouvelle requête et sélectionnez la source de données IBM DB2.
2. Saisissez la requête SQL dans l'éditeur.
3. Cliquez sur le bouton **Run** pour exécuter la requête.

**Exemple :**

```sql
SELECT * FROM SYSIBM.SYSTABLES
```

### Requêtes paramétrées

ToolJet prend en charge les requêtes SQL paramétrées pour IBM DB2 :

1. Utilisez `:nom_du_parametre` comme espace réservé dans votre requête SQL, à l'endroit où vous souhaitez insérer des paramètres.
2. Dans la section **SQL Parameters** située sous l'éditeur de requêtes, ajoutez des paires clé-valeur pour chaque paramètre.
3. Les clés doivent correspondre aux noms des paramètres utilisés dans la requête (sans les deux-points).
4. Les valeurs peuvent être statiques ou dynamiques via la notation `{{ }}`.

##### Exemple :

```yaml
Query: SELECT * FROM employees WHERE department = :department
```
SQL Parameters :
- Key : department
- Value : sales ou `{{ components.department.value }}`

:::info
Les valeurs des paramètres sont substituées dans la requête sous forme de littéraux correctement échappés avant son envoi à la base de données — les chaînes de caractères sont échappées avec des guillemets, et les nombres/booléens sont insérés tels quels. Cela s'explique par le fait que le driver DB2 sous-jacent ne prend en charge que la liaison de paramètres positionnels (`?`), et non les paramètres nommés.
:::
