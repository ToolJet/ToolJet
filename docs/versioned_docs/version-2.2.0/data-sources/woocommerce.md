---
id: woocommerce
title: WooCommerce
---
# WooCommerce

ToolJet can connect to WooCommerce databases to read and write data.

- [Connection](#connection)
- [Getting Started](#querying-woocommerce)

## Connection

Auth
You may use [HTTP Basic Auth] by providing the REST API Consumer Key as the username and the REST API Consumer Secret as the password.
- **Host**
- **Consumer key**
- **Consumer secret**

![ToolJet - Data Source - Woocommerce](/img/datasource-reference/woocommerce/woocomerce-auth.png)

:::info
NOTE: For generating keys visit admin dashboard of woocommerce , more info: https://woocommerce.github.io/woocommerce-rest-api-docs/?javascript#authentication
:::

## Querying Woocommerce

**Operations**

**Customer**

- list customer
- update customer
- delete customer
- batch update customer
- create customer
- retrieve customer

**PRODUCT**

- list product
- update product
- delete product
- batch update product
- create product
- retrieve product

**ORDER**

- list order
- update order
- delete order
- batch update order
- create order
- retrieve order

**Coupon**

- list coupon
- create coupon

:::info
NOTE: For more info visit https://woocommerce.github.io/woocommerce-rest-api-docs/?javascript.
:::