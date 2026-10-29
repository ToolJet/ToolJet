---
id: woocommerce
title: WooCommerce
---

ToolJet can connect to WooCommerce databases to read and write data.

## Connection

To establish a connection with the WooCommerce data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page from the ToolJet dashboard and choose WooCommerce as the data source.

ToolJet requires the following to connect to WooCommerce

- **Host**
- **Consumer key**
- **Consumer secret**

<img className="screenshot-full img-full" src="/img/datasource-reference/woocommerce/woocomerce-auth-v2.png" alt="ToolJet - Data Source - Woocommerce" />

:::info
NOTE: For generating keys visit admin dashboard of woocommerce , more info: https://woocommerce.github.io/woocommerce-rest-api-docs/?javascript#authentication
:::

## Querying WooCommerce

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **WooCommerce** datasource added in previous step.
3. Select the desired resource from the dropdown and then select the desired operation and enter the required parameters.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/app-builder/custom-code/transform-data)**
:::

## List Resources

<img className="screenshot-full img-full" src="/img/datasource-reference/woocommerce/list-resources.png" alt="Woocommerce list resources" />

### Customer

#### Supported Operations

- **List all customers** : Retrieves the customers registered in the store. Accepts optional [list filters](#list-filters).
- **Update a customer** : Updates the details of an existing customer. Requires **Customer ID** and **Data**.
- **Delete a customer** : Permanently deletes a customer from the store. Requires **Customer ID**.
- **Batch update customers** : Performs bulk create, update, or delete operations on customers. Requires **Data**.
- **Create a customer** : Creates a new customer account in WooCommerce. Requires **Data**.
- **Retrieve a customer** : Fetches detailed information of a specific customer. Requires **Customer ID**.

<img className="screenshot-full img-full" src="/img/datasource-reference/woocommerce/customer-query.png" alt="Woocommerce customer querying"  />

### Product

#### Supported Operations

- **List all products** : Retrieves the products available in the WooCommerce store. Accepts optional [list filters](#list-filters).
- **Update a product** : Updates the information of an existing product. Requires **Product ID** and **Data**.
- **Delete a product** : Permanently removes a product from the WooCommerce store. Requires **Product ID**.
- **Batch update products** : Creates, updates, or deletes multiple products in a single request. Requires **Data**.
- **Create a product** : Creates a new product in the WooCommerce store with provided details. Requires **Data**.
- **Retrieve a product** : Fetches detailed information of a specific product. Requires **Product ID**.

### Order

#### Supported Operations

- **List all orders** : Retrieves the orders placed in the store. Accepts optional [list filters](#list-filters).
- **Update a order** : Updates the details or status of an existing order. Requires **Order ID** and **Data**.
- **Delete a order** : Permanently deletes an order from the store. Requires **Order ID**.
- **Batch update orders** : Performs bulk create, update, or delete operations on orders. Requires **Data**.
- **Create a order** : Creates a new order in the WooCommerce store. Requires **Data**.
- **Retrieve a order** : Fetches detailed information of a specific order. Requires **Order ID**.

<img className="screenshot-full img-full" src="/img/datasource-reference/woocommerce/order-query.png" alt="Woocommerce order querying"  />

### Coupon

#### Supported Operations

- **List all coupons** : Retrieves the discount coupons available in the store. Accepts optional [list filters](#list-filters).
- **Create a coupon** : Creates a new discount coupon in WooCommerce. Requires **Data**.

<img className="screenshot-full img-full" src="/img/datasource-reference/woocommerce/coupon-query.png" alt="Woocommerce coupon querying"  />

## Query Fields

### ID and Data

- **Customer ID**, **Product ID**, **Order ID** : The ID of the record to retrieve, update, or delete. Delete operations always delete the record permanently.
- **Data** : The request body as a JSON object, for example `{"email": "jane@example.com", "first_name": "Jane"}` for **Create a customer**. For batch operations, **Data** uses the WooCommerce batch format: an object with optional `create`, `update`, and `delete` arrays.

### List Filters

All list operations accept optional filters. ToolJet sends each filter you fill in as the matching WooCommerce query parameter (for example, **Per Page** as `per_page` and **Decimal Point** as `dp`) and leaves out empty ones.

| Operation | Filters |
|-----------|---------|
| All list operations | **Page**, **Per Page**, **Offset**, **Context**, **Search**, **Include**, **Exclude**, **Order**, **Order By** |
| **List all customers** | **Email**, **Role** |
| **List all products** | **Slug**, **Status**, **Type**, **SKU**, **Featured**, **Category**, **Tag**, **Shipping Class**, **Attribute**, **Attribute Term**, **Tax Class**, **On Sale**, **Min Price**, **Max Price**, **Stock Status**, **Before**, **After**, **Parent**, **Parent Exclude** |
| **List all orders** | **Status**, **Customer**, **Product**, **Before**, **After**, **Parent**, **Parent Exclude**, **Decimal Point** |
| **List all coupons** | **Code**, **Before**, **After** |

:::info
NOTE: For more info visit https://woocommerce.github.io/woocommerce-rest-api-docs/?javascript.
:::