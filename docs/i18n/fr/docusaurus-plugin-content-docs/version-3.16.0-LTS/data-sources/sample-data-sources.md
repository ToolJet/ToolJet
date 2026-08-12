---
id: sample-data-sources
title: Sample Data Sources
---

# Source de données d'exemple dans ToolJet

ToolJet inclut une source de données PostgreSQL d'exemple intégrée qui vous permet de vous familiariser avec ses fonctionnalités et ses composants avant de connecter vos propres données. Cette base de données contient des tables et des données d'exemple pour vous permettre de vous exercer concrètement. La source de données d'exemple est une connexion PostgreSQL partagée, disponible dans tous les workspaces et toutes les applications. Cela signifie que toute modification ou mise à jour apportée aux données sera reflétée en temps réel pour tous les utilisateurs, quelle que soit l'application ou le workspace. Si vous utilisez ToolJet Cloud, les données d'exemple sont réinitialisées chaque jour à minuit. En revanche, si vous utilisez une version auto-hébergée de ToolJet, les données ne seront pas réinitialisées.


### Prise en main des sources de données d'exemple

Lorsque vous créez une nouvelle application, l'état vide vous guide dans les prochaines étapes pour connecter une source de données. Si vous n'avez pas encore votre propre source de données prête, vous pouvez immédiatement commencer à explorer et à construire en vous connectant à notre source de données d'exemple.

<img style={{ marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/sample-data-sources/canvas-v3.png" alt="Canvas View" />

## Se connecter aux sources de données d'exemple

Vous pouvez vous connecter à la source de données d'exemple de trois manières différentes, selon vos besoins :

### 1. Connecter la source de données d'exemple à une application nouvellement créée

Cette méthode permet d'ajouter une source de données d'exemple à une application existante qui est dans un état vide (c'est-à-dire sans composants préexistants).

  1. Sélectionnez/créez l'application que vous souhaitez connecter à la source de données d'exemple.
  2. Une fois l'application sélectionnée/créée, l'état vide vous guide dans la configuration initiale pour connecter la source de données d'exemple.
  3. Cliquez sur le bouton **Connect to sample data source**. Cela créera une requête dans le panneau de requête qui récupérera les noms de toutes les tables de la source de données d'exemple.

<img style={{ marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/sample-data-sources/connect-via-canvas-v3.png" alt="Connect via Canvas" />

### 2. Connecter la source de données d'exemple à une application existante

Cette méthode permet de connecter la source de données d'exemple à une application existante depuis le panneau de requête.

  1. Ouvrez le **Query Panel** de l'application que vous souhaitez connecter à la **Sample Data Source**.
  2. Dans le **Query Panel**, cliquez sur le bouton **+Add** pour ajouter une nouvelle requête, et sélectionnez **Sample Data Source**.
  3. Cela créera une nouvelle requête vide. Vous pouvez désormais écrire votre requête SQL pour récupérer des données depuis la source de données d'exemple. Vous pouvez consulter le [schéma](#sample-data-source-schema) de la source de données d'exemple pour comprendre les tables et les colonnes disponibles.

<img style={{ marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/sample-data-sources/query-manager-v3.png" alt="Connect via query manager" />

### 3. Créer une application d'exemple utilisant la source de données d'exemple

Cette méthode permet de créer une application d'exemple avec une connexion préconfigurée à la source de données d'exemple. Les données seront déjà visualisées sur le canevas de l'application dès sa création.

   1. Naviguez vers la page Data Sources dans la barre latérale gauche du tableau de bord.
   2. Sous la section **DATA SOURCES ADDED** dans la barre latérale, vous trouverez la **Sample Data Source (postgres)**. C'est une source de données par défaut qui ne peut pas être supprimée.
   3. Sélectionnez **Sample Data Source (postgres)**. Vous pouvez cliquer sur le bouton **Test Connection** pour tester la connexion à votre base de données d'exemple.
   4. Cliquez sur **Create sample application** pour générer la nouvelle application. Cette application inclut automatiquement la source de données d'exemple.
   5. Par défaut, cette application comportera un composant de table avec des onglets. Ces onglets afficheront visuellement les données récupérées depuis votre source de données d'exemple.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/sample-data-sources/sample-app-v3.png" alt=" Create Sample App " />

## Schéma de la source de données d'exemple

La source de données d'exemple contient plusieurs tables avec différents types de données.

| Table Name                       | Column Names| Number of Rows |
|:-------|:---------|:---------------|
| `public.sample_data_organizations`   | `index`, `organization_id`, `name`, `website`, `country`, `description`, `founded`, `industry`, `number_of_employees`         | 100              |
| `public.sample_data_country_gdp`      | `country`, `area_sq_km, population`, `exports`, `imports, gdp`, `gdp_per_capita`, `gdp_real_growth_rate`, `inflation_rate_consumer_prices`, `investment_gross_fixed_of_gdp`, `labor_force`, `unemployment_rate` | 263              |
| `public.sample_data_users`           | `first_name`, `last_name`, `company_name`, `address`, `city`, `county`, `state`, `zip`, `phone1`, `phone2`, `email`, `web`     | 499              |
| `public.sample_data_orders`          | `row_id`, `order_id`, `order_date`, `ship_date`, `ship_mode`, `customer_id`, `customer_name`, `segment`, `country`, `city`, `state`, `postal_code`, `region`, `product_id`, `category`, `sub_category`, `product_name`, `sales`, `quantity`, `discount`, `profit` | 500              |
| `public.sample_data_product_cars` | `car`, `mpg`, `cylinders`, `displacement`, `horsepower`, `weight`, `acceleration`, `model`, `origin`                          | 406              |
