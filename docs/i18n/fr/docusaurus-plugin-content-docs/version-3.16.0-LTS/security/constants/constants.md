---
id: constants
title: Constantes d'espace de travail
---

ToolJet vous permet de définir des constantes d'espace de travail pour stocker des valeurs prédéfinies pouvant être utilisées dans votre application afin de maintenir la cohérence, faciliter les mises à jour et stocker en toute sécurité des informations sensibles. Les constantes d'espace de travail sont spécifiques à l'espace de travail dans lequel elles sont créées et ne peuvent pas être accédées depuis d'autres espaces de travail. Pour renforcer la sécurité, toutes les constantes et secrets sont chiffrés avant d'être stockés dans la base de données, offrant une couche de protection supplémentaire pour les données sensibles.

Il existe deux types de constantes :
1. **Global Constants :** Ce sont des valeurs prédéfinies pouvant être utilisées dans vos applications au sein d'un espace de travail. Elles vous permettent de stocker des valeurs fréquemment utilisées, telles que des URL d'API, des paramètres de configuration, etc., et de y accéder au sein de l'espace de travail. Les Global Constants sont résolues côté client.
2. **Secret Constants :** Il s'agit d'un type spécifique de constantes d'espace de travail conçu pour stocker en toute sécurité des informations sensibles telles que des clés API et des identifiants de base de données. Les secrets sont masqués et stockés sous forme chiffrée pour éviter toute exposition aux utilisateurs non autorisés. Les Secret Constants sont résolues côté serveur, empêchant leur exposition au client. <br/>
        **Remarque** : Les Secret Constants ne peuvent pas être utilisées dans les requêtes RunJS ou RunPy.

## Caractéristiques et utilisation

|   Caractéristique        |       Global Constants        |         Secrets           |
|-------------------------|:-----------------------------:|:-------------------------:|
| Composants              |             ✅                |           ❌              |
| Requêtes de données            |             ✅                |           ✅              |
| Sources de données            |             ✅                |           ✅              |
| Workflows               |             ✅                |       Bientôt disponible         |
| Chiffrées en base         |             ✅                |           ✅              |
| Masquées dans le frontend      |             ❌                |           ✅              |
| Résolues côté client |             ✅                |           ❌              |
| Résolues côté serveur |             ❌                |           ✅              |
| Convention de nommage       | `{{constants.constant_name}}` | `{{secrets.secret_name}}` |
        
**Remarque** : 
1. Les Secret Constants ne peuvent pas être utilisées dans les requêtes RunJS ou RunPy.
2. Les Secret Constants ne peuvent être utilisées que comme clé singulière et ne peuvent pas être utilisées dans une clé composite.

## Configurations spécifiques à l'environnement

ToolJet permet aux utilisateurs de définir des configurations spécifiques à l'environnement en attribuant des valeurs différentes aux constantes et secrets selon les différents environnements. Cette approche est essentielle pour gérer des informations sensibles, telles que des clés API, des identifiants de base de données et des points de terminaison de services externes, qui peuvent différer entre les environnements de développement, de préproduction et de production. 

Par exemple, vous pouvez configurer des clés API uniques pour chaque environnement afin d'assurer une intégration et une sécurité sans faille.

<img className="screenshot-full" src="/img/security/constants/constants-secret/env-specific-const-v2.png" alt="Constantes spécifiques à l'environnement"/>

## Créer des constantes d'espace de travail {#creating-workspace-constants}

La permission sur les constantes/variables d'espace de travail est nécessaire pour créer, mettre à jour ou supprimer des constantes d'espace de travail ; consultez le guide **[Contrôle d'accès](/docs/user-management/role-based-access/access-control)** pour plus d'informations. Une fois la permission requise obtenue, suivez ces étapes pour créer une constante d'espace de travail :

1. Accédez à l'onglet Workspace Constants depuis la barre latérale gauche du tableau de bord ToolJet. <br/>
    (URL d'exemple - `https://app.corp.com/nexus/workspace-constants`)
    <img className="screenshot-full" src="/img/security/constants/constants-secret/dashboard.png" alt="Constantes spécifiques à l'environnement"/>

2. Cliquez sur le bouton **Create new constant** pour ouvrir le panneau de configuration.
    <img className="screenshot-full" src="/img/security/constants/constants-secret/create-new-v2.png" alt="Créer une nouvelle constante"/>

3. Saisissez un nom et une valeur pour la constante d'espace de travail.

4. Sélectionnez le type de constante d'espace de travail :
    - **Global constant**
    - **Secret**

5. Cliquez sur le bouton **Add constant** pour enregistrer.

:::info
Une fois qu'une constante ou un secret est créé, son type ne peut pas être modifié. Vous devrez le supprimer et en créer un nouveau du type souhaité.
:::

## Accéder aux constantes d'espace de travail

### Global Constants

Les global constants peuvent être accédées via la syntaxe `{{constants.constant_name}}` et peuvent être utilisées dans l'[app builder](#in-app-builder), les sources de données, les requêtes de données et les workflows.

#### Dans l'App Builder {#in-app-builder}

Dans l'App Builder, vous pouvez retrouver toutes les constantes dans l'élément inspecteur de la barre latérale gauche.

<img className="screenshot-full" src="/img/security/constants/constants-secret/global-const-app.png" alt="Utiliser les Global Constants dans l'App Builder"/>

#### Dans les sources de données et les requêtes

Les global constants dans ToolJet vous permettent de définir des valeurs une seule fois et de les réutiliser dans vos sources de données et requêtes.

- Formulaire de connexion de la source de données :
    <img className="screenshot-full" src="/img/security/constants/constants-secret/golbal-constants-data-source-connection-v2.png" alt="Utiliser les Global Constants dans le formulaire de connexion de la source de données"/>

- Dans les requêtes du gestionnaire de requêtes :
    <img className="screenshot-full" src="/img/security/constants/constants-secret/global-constants-queries.png" alt="Utiliser les Global Constants dans les requêtes du gestionnaire de requêtes"/>

### Utiliser les secrets

Les secrets sont conçus pour le stockage sécurisé d'informations sensibles telles que les clés API et les identifiants de base de données, et peuvent être accédés via la syntaxe `{{secrets.secret_name}}`.

#### Dans les sources de données et les requêtes

Dans les sources de données et les requêtes, les valeurs des secrets sont masquées dans le frontend et ne peuvent être consultées que depuis le tableau de bord Workspace Constants.

- Formulaire de connexion de la source de données :
    <img className="screenshot-full" src="/img/security/constants/constants-secret/secrets-data-source-connection-v2.png" alt="Utiliser les secrets dans le formulaire de connexion de la source de données"/>

- Dans les requêtes du gestionnaire de requêtes :
    <img className="screenshot-full" src="/img/security/constants/constants-secret/secrets-queries.png" alt="Utiliser les secrets dans les requêtes du gestionnaire de requêtes"/>

## Mapper les constantes d'espace de travail depuis les variables d'environnement

<PlanBadge type="enterprise" />
<PlanBadge type="self-hosted" />

Vous pouvez utiliser des variables d'environnement pour définir des global constants et des secrets. Les constantes d'espace de travail définies via des variables d'environnement porteront une étiquette `.env` devant elles. S'il existe deux constantes portant le même nom, celle définie via la variable d'environnement sera utilisée dans l'app builder, tandis que la constante définie via l'interface portera une étiquette `duplicate` devant elle.

Les utilisateurs ne peuvent pas modifier ou supprimer des constantes créées à partir de variables d'environnement via l'interface. Pour ajouter, mettre à jour ou supprimer des valeurs d'une variable d'environnement, le conteneur doit être redémarré.

<img className="screenshot-full" src="/img/security/constants/constants-secret/const-mapping.png" alt="Mapper les constantes d'espace de travail depuis les variables d'environnement"/>

### Définir des Global Constants

**Définir une Global Constant individuelle**

Syntaxe - `TOOLJET_GLOBAL_CONSTANTS__<environment>__constant_name`

Exemple - TOOLJET_GLOBAL_CONSTANTS__development__companyName = "Corp Pvt. Ltd."

**Définir plusieurs Global Constants**

Syntaxe - `TOOLJET_GLOBAL_CONSTANTS__<environment> = {“name1”: “value1", “name2”: “value2"}`

Exemple - TOOLJET_GLOBAL_CONSTANTS__development = `{"company1": "corp.com", "company2": "example.com"}`


### Définir des Secret Constants

**Définir une Global Constant individuelle**

Syntaxe - `TOOLJET_SECRET_CONSTANTS__<environment>__constant_name`

Exemple - TOOLJET_SECRET_CONSTANTS__development__apiKey = "agdagdagdg"

**Définir plusieurs Global Constants**

Syntaxe - `TOOLJET_SECRET_CONSTANTS__<environment> = {“name1”: “value1", “name2”: “value2"}`

Exemple - TOOLJET_SECRET_CONSTANTS__development = `{"api_url": "https://api.example.com", "password" : "12345", "key" : "agdagdagdg"}`
