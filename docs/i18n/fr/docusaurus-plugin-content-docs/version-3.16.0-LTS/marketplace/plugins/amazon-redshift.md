---
id: marketplace-plugin-awsredshift
title: Amazon Redshift
---

ToolJet peut se connecter à Amazon Redshift, permettant à vos applications d'interroger directement les données d'un cluster Redshift.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus [Utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Configuration

Pour vous connecter à Amazon Redshift, vous devez fournir les informations suivantes :

#### Paramètres requis

- **Region** : la région où se trouve votre cluster Redshift. Par exemple, `us-east-1`.
- **Database Name** : le nom de la base de données à laquelle vous souhaitez vous connecter.
- **Authentication Type** : le type d'authentification à utiliser pour vous connecter au cluster Redshift. Actuellement, seul **IAM** est pris en charge.
- **Access Key** : la clé d'accès de l'utilisateur que vous souhaitez utiliser pour vous connecter au cluster Redshift.
- **Secret Key** : la clé secrète de l'utilisateur que vous souhaitez utiliser pour vous connecter au cluster Redshift.

#### Paramètres optionnels

- **Port** : le numéro de port du cluster Redshift. Le port par défaut est `5439`.
- **Workgroup name** : le nom du workgroup à utiliser pour vous connecter au cluster Redshift.

<div style={{textAlign: 'center'}}>
    <img style={{ marginBottom:'15px'}} className="screenshot-full" src="/img/marketplace/plugins/redshift/connection-v2.png" alt="Marketplace Plugin: Amazon Redshift" />
</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Requêtes prises en charge

Redshift prend en charge un ensemble complet de commandes SQL. Vous pouvez utiliser l'éditeur SQL pour exécuter n'importe quelle requête SQL sur le cluster Redshift connecté. Consultez la [documentation Redshift](https://docs.aws.amazon.com/redshift/latest/dg/c_SQL_commands.html) pour plus d'informations sur les commandes SQL prises en charge.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Lire des données

L'exemple suivant montre comment lire des données depuis une table du cluster Redshift connecté. La requête sélectionne toutes les colonnes de la table `employee`.

```sql
SELECT * FROM employee
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Écrire des données

L'exemple suivant montre comment écrire des données dans une table du cluster Redshift connecté. La requête insère une nouvelle ligne dans la table `employee`.

```sql
INSERT INTO employee (
    first_name,
    last_name,
    email,
    phone_number,
    hire_date,
    job_title,
    salary,
    department_id
) VALUES (
    'Tom',
    'Hudson',
    'tom.hudson@example.com',
    '234843294323',
    '2024-01-01',
    'Test Automation Engineer',
    245000.00,
    12
);
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Mettre à jour des données

L'exemple suivant montre comment mettre à jour des données dans une table du cluster Redshift connecté. La requête met à jour les colonnes `first_name` et `last_name` de la table `employee`.

```sql
UPDATE employee
SET first_name = 'Glenn',
    last_name = 'Jacobs'
WHERE employee_id = 8;
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Supprimer des données

L'exemple suivant montre comment supprimer des données d'une table du cluster Redshift connecté. La requête supprime une ligne de la table `employee`.

```sql
DELETE FROM employee
WHERE employee_id = 7;
```

</div>
