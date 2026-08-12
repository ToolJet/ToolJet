---
id: snowflake
title: Snowflake
---

ToolJet peut se connecter à des bases de données Snowflake pour lire et écrire des données.

## Connexion

Pour établir une connexion avec la source de données Snowflake, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit naviguer vers la page **[Data Sources](/docs/data-sources/overview/)** depuis le tableau de bord ToolJet et choisir Snowflake comme source de données.

## Méthodes d'authentification

### Authentification de base

Authentifie auprès de Snowflake à l'aide d'un nom d'utilisateur et d'un mot de passe pour établir une connexion directe avec le compte, le rôle et l'entrepôt (warehouse) spécifiés.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/datasource-reference/snowflake/basic-auth.png" alt="ToolJet - Snowflake connection" />

:::info
Assurez-vous que le **Host/IP** de la base de données est accessible depuis votre VPC si vous avez auto-hébergé ToolJet. Si vous utilisez ToolJet Cloud, veuillez **mettre en liste blanche** notre IP.

Vous pouvez consulter la documentation Snowflake sur les politiques réseau **[ici](https://docs.snowflake.com/en/user-guide/network-policies.html)**.
:::

ToolJet nécessite les éléments suivants pour se connecter à une base de données Snowflake.

- **Account**
- **Username/Login name**
- **Password**

Utilisez votre **identifiant de compte** Snowflake comme valeur pour le champ **Account**.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/snowflake/accounts-snowflake.png" alt="ToolJet - Snowflake" />

:::info
Vous pouvez également configurer des **[paramètres optionnels supplémentaires](https://docs.snowflake.com/en/user-guide/nodejs-driver-use.html#additional-connection-options)**.
:::

### OAuth 2.0 

#### Générer les identifiants OAuth depuis Snowflake

Suivez les étapes ci-dessous pour obtenir les identifiants OAuth requis : Client ID, Client Secret, Authorization URL, et plus encore.

**Étape 1 : créer une intégration de sécurité**

Exécutez la requête suivante dans une feuille de calcul Snowflake :

```sql
USE ROLE ACCOUNTADMIN;

CREATE OR REPLACE SECURITY INTEGRATION tooljet_oauth
TYPE = OAUTH
ENABLED = TRUE
OAUTH_CLIENT = CUSTOM
OAUTH_CLIENT_TYPE = 'CONFIDENTIAL'
OAUTH_REDIRECT_URI = <your-tooljet-instance-redirect-uri>
OAUTH_ISSUE_REFRESH_TOKENS = TRUE
OAUTH_REFRESH_TOKEN_VALIDITY = 7776000;
```
Remplacez **`your-tooljet-instance-redirect-uri`** par l'URI de redirection de votre instance ToolJet.

**Étape 2 : obtenir le Client Secret**

Exécutez la requête suivante :

```sql
SELECT SYSTEM$SHOW_OAUTH_CLIENT_SECRETS('TOOLJET_OAUTH');
```
Dans le résultat, copiez ceci : `OAUTH_CLIENT_SECRET`

**Étape 3 : obtenir le Client ID et les points de terminaison OAuth**

Exécutez la requête suivante :

```sql
DESC SECURITY INTEGRATION TOOLJET_OAUTH;
```
Dans le résultat, copiez les valeurs suivantes :

- `OAUTH_CLIENT_ID` > **Client ID**
- `OAUTH_AUTHORIZATION_ENDPOINT` > **Authorization URL**
- `OAUTH_TOKEN_ENDPOINT` > **Token URL**

**Note** : veuillez vous assurer que votre rôle ne figure pas dans la **BLOCKED_ROLES_LIST**. S'il y figure, vous devrez le retirer.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/generate-oauth-sf.png" alt="Generate Snowflake Credentials "/>

#### OAuth2.0 - Custom App
Utilise les identifiants de votre propre application OAuth pour authentifier et autoriser l'accès via une configuration de fournisseur OAuth personnalisée.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/datasource-reference/snowflake/oauth-custom-app2.png" alt="ToolJet - Snowflake connection" />

Vous pouvez activer **Authentication required for all users** dans la configuration afin de forcer l'authentification au niveau utilisateur. Une fois activée, les utilisateurs sont redirigés vers l'écran de consentement OAuth 2.0 la première fois qu'une requête de cette source de données est exécutée dans une application, garantissant une autorisation sécurisée et propre à chaque utilisateur. ToolJet prend en charge l'authentification OAuth 2.0 à la fois avec les configurations **Custom App** et **ToolJet App**, permettant une intégration flexible selon la configuration de votre fournisseur OAuth.

**Note** : une fois le flux OAuth terminé, la requête doit être déclenchée à nouveau pour charger les données.

:::info
Snowflake fournit plusieurs URL de points de terminaison OAuth, y compris des points de terminaison au niveau du compte et au niveau du profil.  

Assurez-vous d'utiliser au moins un ensemble valide d'URL Authorization et Token (de préférence provenant de la même source) lors de la configuration de la source de données. Mélanger des points de terminaison provenant de sources différentes peut entraîner des problèmes d'authentification.
:::

#### OAuth2.0 - ToolJet App

Utilise l'application OAuth préconfigurée de ToolJet pour simplifier l'authentification sans avoir à créer et gérer votre propre application OAuth.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/datasource-reference/snowflake/oauth-tj-app2.png" alt="ToolJet - Snowflake connection" />

:::info
Le paramètre **`scope`** pour les requêtes de jeton OAuth peut inclure plus qu'un simple rôle. Le format dépend du flux OAuth :

`session:role:<role_name>` spécifie le rôle (par exemple, `session:role:public`, `session:role:analyst`)
- Vous pouvez également laisser le scope vide pour utiliser le rôle par défaut de l'utilisateur.
- Pour External OAuth, le scope est configuré dans l'intégration de sécurité et peut correspondre à différents rôles Snowflake.

Pour plus d'informations, consultez **[ici](https://docs.snowflake.com/en/user-guide/oauth-ext-overview#scopes)**.
:::

### Authentification par Bearer Token
Cette méthode d'authentification utilise un jeton bearer pré-généré pour un accès sécurisé et basé sur des jetons à Snowflake, éliminant le besoin de transmettre un nom d'utilisateur et un mot de passe dans les requêtes. Les jetons Bearer authentifient les requêtes vers les API REST Snowflake via l'en-tête Authorization.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/datasource-reference/snowflake/bearer-auth.png" alt="ToolJet - Snowflake connection" />

:::info
- Une fois la configuration et l'autorisation terminées, Snowflake envoie un code d'autorisation à ToolJet, qui est automatiquement échangé contre un jeton d'accès Bearer utilisé pour les requêtes suivantes.

- Le jeton Bearer correspond à la clé du jeton PAT. Consultez **[ici](https://docs.snowflake.com/en/user-guide/programmatic-access-tokens)** pour savoir comment générer une clé de jeton.
:::

**Générer un jeton d'accès programmatique (PAT) dans Snowflake :**

Les jetons d'accès programmatique (PAT) permettent une authentification sécurisée et basée sur des jetons vers Snowflake, sans utiliser de mot de passe. Le PAT est utile lorsque le MFA est activé et que l'authentification par mot de passe est bloquée.

**Comment générer un PAT**

1. Depuis l'interface Snowflake, allez dans :
   **Settings > Authentication.**
2. Sous **Programmatic access tokens**, cliquez sur **Generate token.**
3. Renseignez les informations requises (nom, expiration, etc.)
4. Copiez et stockez le jeton en toute sécurité.
5. Pour utiliser le PAT, une **network policy** doit être configurée. Pour plus d'informations, consultez la **[documentation Snowflake](https://docs.snowflake.com/en/user-guide/network-policies.html).**

Exemple :

```sql
CREATE NETWORK POLICY allow_all_policy
ALLOWED_IP_LIST = ('0.0.0.0/0');
```

:::info
- Le jeton n'est affiché qu'une seule fois. Stockez-le en toute sécurité. 
- Le PAT ne peut pas être utilisé comme substitut au mot de passe lors de la connexion à Snowflake.
- L'adresse IP dans la network policy doit être configurée en fonction de la configuration réseau de votre système ou de votre organisation.
:::

### Authentification par paire de clés

Il s'agit d'une méthode d'authentification qui utilise une paire de clés RSA (publique/privée) au lieu d'un nom d'utilisateur/mot de passe. Elle est idéale pour les comptes de service, l'automatisation et les pipelines CI/CD.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/datasource-reference/snowflake/key-pair-auth.png" alt="ToolJet - Snowflake connection"/>

:::info
Veuillez consulter la **[documentation sur l'authentification par paire de clés](https://docs.snowflake.com/en/user-guide/key-pair-auth)** pour savoir comment générer la clé privée et la phrase secrète.
:::

## Paramètres de connexion dynamiques

Vous pouvez activer **Allow dynamic connection parameters** sur la page de configuration de la source de données pour utiliser directement les valeurs dans le générateur de requêtes.

<img className="screenshot-full img-s" src="/img/datasource-reference/snowflake/dynamic-conn-config.png" alt="ToolJet - Snowflake query connection" />

ToolJet permet de surcharger les paramètres de connexion Snowflake tels que **Database, Warehouse et Role** directement au **moment de l'exécution de la requête** lorsque les paramètres de connexion dynamiques sont activés. Cela permet à une seule source de données de prendre en charge plusieurs environnements ou locataires sans nécessiter de configurations distinctes.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/dynamic-conn-query-builder.png" alt="ToolJet - Snowflake query connection" />

## Interroger Snowflake

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes situé dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **Snowflake** ajoutée à l'étape précédente.
3. Sélectionnez le **SQL Mode** dans le menu déroulant et saisissez la requête.
4. Cliquez sur le bouton **Preview** pour afficher un aperçu du résultat, ou sur le bouton **Run** pour déclencher la requête.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/query-v5.png" alt="ToolJet - Snowflake query" />

```sql
select * from "SNOWFLAKE_SAMPLE_DATA"."WEATHER"."DAILY_14_TOTAL" limit 10;
```
## Interroger en mode GUI

1. Créez une nouvelle requête et sélectionnez la source de données Snowflake.
2. Sélectionnez le mode GUI dans le menu déroulant.
3. Sélectionnez l'opération que vous souhaitez effectuer.
4. Récupérez et sélectionnez le **Table name**.
5. Cliquez sur le bouton **Preview** pour afficher un aperçu du résultat, ou sur le bouton **Run** pour déclencher la requête.

### List Rows
Récupère et affiche les lignes de la table sélectionnée en fonction de filtres, d'un tri et de limites optionnels.

#### Paramètre requis
- **Table** : sélectionnez la table à partir de laquelle les lignes doivent être récupérées.

#### Paramètres optionnels
- **Filter** : applique des conditions pour ne renvoyer que les lignes correspondant aux critères spécifiés.
- **Sort** : ordonne les lignes renvoyées selon une ou plusieurs colonnes sélectionnées.
- **Aggregate** : effectue des calculs tels que le comptage, la somme ou la moyenne sur les colonnes sélectionnées.
- **Group by** : regroupe les lignes ayant les mêmes valeurs dans les colonnes spécifiées afin de permettre l'agrégation.
- **Limit** : limite le nombre de lignes renvoyées dans le résultat.
- **Offset** : ignore un nombre spécifié de lignes avant de commencer à renvoyer les résultats.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/list-rows-gui.png" alt="Snowflake list rows gui" />

### Create Row
Insère une nouvelle ligne dans la table sélectionnée en fournissant des valeurs pour les colonnes requises.

Dans l'éditeur, assurez-vous que la saisie de **Columns** est fournie au format `string`.

#### Paramètre optionnel
- **Columns** : spécifie les colonnes de la table et leurs valeurs correspondantes à insérer lors de la création d'une nouvelle ligne. 

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/create-rows-gui.png" alt="Snowflake create rows gui" />

### Update Rows
Modifie les valeurs des lignes existantes dans la table sélectionnée en fonction des conditions ou identifiants spécifiés.

Dans l'éditeur, assurez-vous que la saisie de **Columns** est fournie au format `string`.

#### Paramètre requis
- **Columns** : spécifiez les noms de colonnes et les valeurs à mettre à jour dans la/les ligne(s) sélectionnée(s).

#### Paramètre optionnel
- **Filter** : appliquez des conditions pour identifier la/les ligne(s) devant être mise(s) à jour.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/update-rows-gui.png" alt="Snowflake update rows gui" />

### Delete Rows
Supprime soit toutes les lignes de la table, soit celles correspondant aux conditions de filtre spécifiées.

#### Paramètre optionnel
- **Filter** : spécifie les conditions permettant de déterminer quelles lignes doivent être supprimées de la table.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/delete-rows-gui.png" alt="Snowflake delete rows gui" />

### Upsert Row
Insère une nouvelle ligne ou met à jour une ligne existante si une clé primaire correspondante existe déjà. Dans l'éditeur, assurez-vous de saisir les **Columns** au format `string`.

#### Paramètres requis
- **Primary Key column(s)** : spécifie la ou les colonnes utilisées pour déterminer si une ligne existe déjà pour une mise à jour, ou si une nouvelle ligne doit être insérée.
- **Columns** : définit les paires colonne–valeur qui seront insérées ou mises à jour dans la ligne.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/upsert-rows-gui.png" alt="Snowflake upsert rows gui" />

### Bulk Insert
Insère plusieurs lignes dans la table en une seule opération à l'aide d'un tableau d'enregistrements.

#### Paramètre requis
- **Records to Insert** : un tableau d'objets représentant plusieurs lignes à insérer dans la table sélectionnée en une seule opération.

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
[
  { "id": 101, "firstname": "John", "email": "john.doe@example.com", "age": 28 },
  { "id": 102, "firstname": "Alice", "email": "alice.smith@example.com", "age": 32 },
  { "id": 103, "firstname": "Bob", "email": "bob.johnson@example.com", "age": 25 },
  { "id": 104, "firstname": "Emma", "email": "emma.brown@example.com", "age": 30 }
]
```
</details>

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/bulk-insert-gui.png" alt="Snowflake bulk insert gui" />

### Bulk Update using Primary Key
Met à jour plusieurs lignes en une seule fois en associant chaque enregistrement à sa clé primaire correspondante.

#### Paramètres requis
- **Primary Key columns** : spécifie la ou les colonnes utilisées pour identifier de manière unique les lignes devant être mises à jour.
- **Records to Update** : un tableau d'objets contenant la clé primaire et les valeurs de colonnes à mettre à jour pour chaque ligne. 

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
[
  { "id": 101, "firstname": "John Doe", "age": 29 },
  { "id": 102, "firstname": "Alice Smith", "age": 33 },
  { "id": 103, "firstname": "Bob Johnson", "age": 26 },
  { "id": 104, "firstname": "Emma Brow", "age": 30 }
]  
```
</details>

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/bulk-update-gui.png" alt="Snowflake bulk update gui" />

### Bulk Upsert using Primary Key
Insère de nouvelles lignes ou met à jour des lignes existantes en masse en fonction des valeurs de clé primaire correspondantes.

#### Paramètres requis
- **Primary Key columns** : spécifie la ou les colonnes utilisées pour déterminer si une ligne existe déjà pour une mise à jour, ou si une nouvelle ligne doit être insérée.
- **Records to Upsert** : un tableau d'objets contenant les valeurs de clé primaire et les données de colonnes qui seront insérées comme nouvelles lignes ou utilisées pour mettre à jour des lignes existantes.

Cela signifie essentiellement que si la ligne existe, elle est mise à jour, sinon elle est insérée. 

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
[
  { "id": 101, "firstname": "John Michael", "age": 30 },
  { "id": 105, "firstname": "Taylor", "email": "taylor@example.com", "age": 27 },
  { "id": 106, "firstname": "Wilson", "email": "wilson@example.com", "age": 35 }
]
```
</details>

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/snowflake/bulk-upsert-gui.png" alt="Snowflake bulk update gui" />

:::tip
Les résultats des requêtes peuvent être transformés à l'aide de transformations. Consultez notre documentation sur les [transformations](/docs/app-builder/custom-code/transform-data) pour en savoir plus.
:::
