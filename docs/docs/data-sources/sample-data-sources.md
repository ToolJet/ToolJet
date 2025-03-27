---
id: sample-data-sources
title: Sample Data Sources
---

# Sample Data Source in ToolJet

ToolJet includes a built-in PostgreSQL sample data source that allows you to familiarize yourself with its features and components before connecting your own data. This database contains example tables and data for hands-on experimentation. The sample data source is a shared PostgreSQL connection available across all workspaces and applications. This means any changes or updates made to the data will be reflected in real-time for all users, regardless of the application or workspace. If are using ToolJet Cloud, the sample data resets daily at midnight. However, if you are using a self-hosted version of ToolJet, the data will not be reset.


### Getting Started with Sample Data Sources

When you create a new application, the empty state will guide you on the next steps for connecting a data source. If you don't have your own data source ready, you can immediately start exploring and building by connecting to our sample data source.

<img className="screenshot-full img-full" src="/img/datasource-reference/sample-data-sources/canvas.png" alt="Canvas View" />

## Connecting to Sample Data Sources

You can connect to the sample data source in three different ways, depending on your requirements:

### 1. Connect the Sample Data Source to a Newly Created Application.

This method allows you to add a sample data source to an existing application that is in an empty state (i.e., has no pre-existing components)

  1. Select/Create the application you want to connect to the sample data source.
  2. Once you select/create the new application, the empty state guides you through the initial setup for connecting the sample data source.
  3. Click on the **Connect to sample data source** button. This will create a query in the query panel which will retrieve all the tables names from the sample data source.



<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/datasource-reference/sample-data-sources/connect-via-canvas-v2.png" alt="Connect via Canvas" />
</div>


### 2. Connect the Sample Data Source to an Existing Application.

This method allows you to connect the sample data source to an existing application from the query panel.

  1. Open the **Query Panel** of the application you want to connect to the **Sample Data Source**.
  2. In the **Query Panel**, click on the **+Add** button to add a new query, and select **Sample Data Source**.
  3. This will create a new empty query. You can now write your SQL query to retrieved data from the sample data source. You can checkout the sample data source [schema](#sample-data-source-schema) to understand the tables and columns available in the sample data source.



<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/datasource-reference/sample-data-sources/connect-via-query-manager-v2.png" alt="Connect via query manager" />
</div>


### 3. Create a Sample Application Using the Sample Data Source.

This method enables the creation of a sample application with a pre-configured connection to the sample data source. The data will be already visualized on the application's canvas upon creation.

   1. Navigate to the Data Sources page within the dashboard's left-hand sidebar.
   2. Under the **DATA SOURCES ADDED** section in the sidebar, you will find the **Sample Data Source (postgres)**. This is a default data source and cannot be deleted.
   3. Select **Sample Data Source (postgres)**. You can click on the **Test Connection** button to test your connection to your sample database.
   4. Click **Create sample application** to generate the new application. This application automatically includes the sample data source.
   5. By default, this application will feature a table component with tabs. These tabs will visually display the data retrieved from your sample data source.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/datasource-reference/sample-data-sources/create-sample-app-v2.png" alt="Create Sample App" />
</div>

 ## Sample Data Source Schema

The sample data source contains various tables with different data types.

| Table Name                       | Column Names| Number of Rows |
|:-------|:---------|:---------------|
| `public.sample_data_organizations`   | `index`, `organization_id`, `name`, `website`, `country`, `description`, `founded`, `industry`, `number_of_employees`         | 100              |
| `public.sample_data_country_gdp`      | `country`, `area_sq_km, population`, `exports`, `imports, gdp`, `gdp_per_capita`, `gdp_real_growth_rate`, `inflation_rate_consumer_prices`, `investment_gross_fixed_of_gdp`, `labor_force`, `unemployment_rate` | 263              |
| `public.sample_data_users`           | `first_name`, `last_name`, `company_name`, `address`, `city`, `county`, `state`, `zip`, `phone1`, `phone2`, `email`, `web`     | 499              |
| `public.sample_data_orders`          | `row_id`, `order_id`, `order_date`, `ship_date`, `ship_mode`, `customer_id`, `customer_name`, `segment`, `country`, `city`, `state`, `postal_code`, `region`, `product_id`, `category`, `sub_category`, `product_name`, `sales`, `quantity`, `discount`, `profit` | 500              |
| `public.sample_data_product_cars` | `car`, `mpg`, `cylinders`, `displacement`, `horsepower`, `weight`, `acceleration`, `model`, `origin`                          | 406              |
