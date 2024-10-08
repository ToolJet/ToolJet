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

<img className="screenshot-full" src="/img/datasource-reference/woocommerce/woocomerce-auth-v2.png" alt="ToolJet - Data Source - Woocommerce" />

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
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/tutorial/transformations)**
:::

</div>

<div style={{paddingTop:'24px'}}>

## Resource

### Customer

#### Supported Operations

- **list customer**
- **update customer**
- **delete customer**
- **batch update customer**
- **create customer**
- **retrieve customer**

### Product

#### Supported Operations

- **list product**
- **update product**
- **delete product**
- **batch update product**
- **create product**
- **retrieve product**

### Order

#### Supported Operations

- **list order**
- **update order**
- **delete order**
- **batch update order**
- **create order**
- **retrieve order**

### Coupon

#### Supported Operations

- **list coupon**
- **create coupon**

:::info
NOTE: For more info visit https://woocommerce.github.io/woocommerce-rest-api-docs/?javascript.
:::

</div>
