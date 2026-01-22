---
id: woocommerce
title: WooCommerce
---

ToolJet can connect to WooCommerce databases to read and write data.

<div style={{paddingTop:'24px'}}>

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

</div>

<div style={{paddingTop:'24px'}}>

## Querying WooCommerce

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **WooCommerce** datasource added in previous step.
3. Select the desired resource from the dropdown and then select the desired operation and enter the required parameters.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/app-builder/custom-code/transform-data)**
:::

</div>

<div style={{paddingTop:'24px'}}>

## List Resources

<img className="screenshot-full img-full" src="/img/datasource-reference/woocommerce/list-resources.png" alt="Woocommerce list resources" />

### Customer

#### Supported Operations

- **List customer** : Retrieves a list of all customers registered in the store.
- **Update customer** : Updates the details of an existing customer.
- **Delete customer** : Permanently deletes a customer from the store.
- **Batch update customers** : Performs bulk create, update, or delete operations on customers.
- **Create customer** : Creates a new customer account in WooCommerce.
- **Retrieve customer** : Fetches detailed information of a specific customer by ID.

<img className="screenshot-full img-full" src="/img/datasource-reference/woocommerce/customer-query.png" alt="Woocommerce customer querying" style={{ marginBottom:'15px' }} />

### Product

#### Supported Operations

- **List product** : Retrieves a list of all products available in the WooCommerce store.
- **Update product** : Updates the information of an existing product.
- **Delete product** : Permanently removes a product from the WooCommerce store.
- **Batch update product** : Creates, updates, or deletes multiple products in a single request.
- **Create product** : Creates a new product in the WooCommerce store with provided details.
- **Retrieve product** : Fetches detailed information of a specific product using its ID.

### Order

#### Supported Operations

- **List order** : Retrieves a list of all orders placed in the store.
- **Update order** : Updates the details or status of an existing order.
- **Delete order** : Permanently deletes an order from the store.
- **Batch update order** : Performs bulk create, update, or delete operations on orders.
- **Create order** : Creates a new order in the WooCommerce store.
- **Retrieve order** : Fetches detailed information of a specific order by ID.

<img className="screenshot-full img-full" src="/img/datasource-reference/woocommerce/order-query.png" alt="Woocommerce order querying" style={{ marginBottom:'15px' }} />

### Coupon

#### Supported Operations

- **List coupon** : Retrieves a list of all discount coupons available in the store.
- **Create coupon** : Creates a new discount coupon in WooCommerce.

<img className="screenshot-full img-full" src="/img/datasource-reference/woocommerce/coupon-query.png" alt="Woocommerce coupon querying" style={{ marginBottom:'15px' }} />

:::info
NOTE: For more info visit https://woocommerce.github.io/woocommerce-rest-api-docs/?javascript.
:::

</div>
