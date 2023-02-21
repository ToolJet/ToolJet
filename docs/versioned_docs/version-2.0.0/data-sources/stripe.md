---
id: stripe
title: Stripe
---

# Stripe

ToolJet can connect to your Stripe account to read or write customers' and payments' data.

:::info
Check out the **[Stripe Refund App tutorial](https://blog.tooljet.com/build-a-stripe-refund-tool-using-low-code/)**
:::

## Connection

To add a new Stripe data source, click on the `+` button on data sources panel at the left-bottom corner of the app editor. Select Stripe from the modal that pops up.

ToolJet requires the **Stripe API key** to connect to your database.

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Stripe](/img/datasource-reference/stripe/connect.png)

</div>

You can get the Stripe API key from the dashboard of your Stripe account. Go to the Stripe account dashboard, click on the **Developers** on the top right, then on the left-sidebar go to the **API Keys**, you can simple reveal the **Secret Key** and copy-paste on ToolJet.

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Stripe](/img/datasource-reference/stripe/apikey.png)

</div>

## Querying Stripe

Click on **+** button of the query manager at the bottom panel of the editor and select the Stripe datasource added in the previous step. Enter the query in the editor. Click on the `Save and Run` button to save and then run the query.

**NOTE**: Query should be saved before running.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/tutorial/transformations)**
:::

## Supported operations


You can check out the some of the operations mentioned below. All the operations for Stripe are available and can be performed from ToolJet. Check out the **[Stripe API documentation](https://stripe.com/docs/api/)** for the detailed information about each operation.

- **delete,/v1/account**
- **get,/v1/account**
- **post,/v1/account**
- **post,/v1/account/bank_accounts**
- **delete,/v1/account/bank_accounts/{id}**
- **get,/v1/account/bank_accounts/{id}**
- **post,/v1/account/bank_accounts/{id}**
- **get,/v1/account/capabilities**
- **get,/v1/account/capabilities/{capability}**
- **post,/v1/account/capabilities/{capability}**
- **get,/v1/account/external_accounts**
- **post,/v1/account/external_accounts**
- **delete,/v1/account/external_accounts/{id}**
- **get,/v1/account/external_accounts/{id}**
- **post,/v1/account/external_accounts/{id}**
- **post,/v1/account/login_links**
- **get,/v1/account/people**
- **post,/v1/account/people**
- **delete,/v1/account/people/{person}**
- **get,/v1/account/people/{person}**
- **post,/v1/account/persons**
- **delete,/v1/account/persons/{person}**
- **get,/v1/account/persons/{person}**
- **post,/v1/account/persons/{person}**
- **post,/v1/account_links**
- **get,/v1/accounts**
- **post,/v1/accounts**
- **delete,/v1/accounts/{account}**
- **get,/v1/accounts/{account}**
- **post,/v1/accounts/{account}**
- **post,/v1/accounts/{account}/bank_accounts**
- **delete,/v1/accounts/{account}/bank_accounts/{id}**
- **get,/v1/accounts/{account}/bank_accounts/{id}**
- **get,/v1/accounts/{account}/bank_accounts/{id}**
- **get,/v1/accounts/{account}/capabilities**
- **get,/v1/accounts/{account}/capabilities/{capability}**
- **post,/v1/accounts/{account}/capabilities/{capability}**
- **get,/v1/accounts/{account}/external_accounts**
- **post,/v1/accounts/{account}/external_accounts**
- **delete,/v1/accounts/{account}/external_accounts/{id}**
- **get,/v1/accounts/{account}/external_accounts/{id}**
- **get,/v1/accounts/{account}/external_accounts/{id}**
- **post,/v1/accounts/{account}/login_links**
- **get,/v1/accounts/{account}/people**
- **post,/v1/accounts/{account}/people**
- **delete,/v1/accounts/{account}/people/{person}**
- **get,/v1/accounts/{account}/people/{person}**
- **post,/v1/accounts/{account}/people/{person}**
- **get,/v1/accounts/{account}/persons**
- **post,/v1/accounts/{account}/persons**
- **delete,/v1/accounts/{account}/persons/{person}**
- **get,/v1/accounts/{account}/persons/{person}**
- **post,/v1/accounts/{account}/persons/{person}**
- **post,/v1/accounts/{account}/reject**
- **get,/v1/apple_pay/domains**
- **post,/v1/apple_pay/domains**
- **delete,/v1/apple_pay/domains/{domain}**
- **get,/v1/apple_pay/domains/{domain}**
- **get,/v1/application_fees**
- **get,/v1/application_fees/{fee}/refunds/{id}**
- **post,/v1/application_fees/{fee}/refunds/{id}**
- **get,/v1/application_fees/{id}**
- **post,/v1/application_fees/{id}/refund**
- **get,/v1/application_fees/{id}/refunds**
- **post,/v1/application_fees/{id}/refunds**
- **get,/v1/apps/secrets**


<!--
### delete,/v1/account

This operation can be used to delete the accounts that you manage in Stripe.

#### Required parameters:

- **account**: Enter the account id of account that you want to delete. example: `acct_1032D82eZvKYlo2C`

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Firestore](/img/datasource-reference/stripe/delete-account.png)

</div>

### get,/v1/account

This operation returns the basic account information such as account id, capabilities, currency, country etc.

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Firestore](/img/datasource-reference/stripe/get-account.png)

</div>

### post,/v1/account

This operation updates the connected account by setting the values of the parameters passed. Any parameters not provided are left unchanged.

### post,/v1/account/bank_accounts

This operation will create a bank account in your stripe account.

### delete,/v1/account/bank_accounts/{id}

This operation can be used to delete a specified external account for a given account.. You'll need to provide the **id** of the bank account in stripe.

### get,/v1/account/bank_accounts/{id}

This operation can be used to retrieve a specified external account whose **id** is provided in parameters.

### post,/v1/account/bank_accounts/{id}

This operation can be used to update the metadata, account holder name, account holder type of a bank account belonging to a Custom Account, and optionally sets it as the default for its currency. Other bank account details are not editable by design. You can re-enable a disabled bank account by performing an update call without providing any arguments or changes.

### get,/v1/account/capabilities

This operation returns a list of capabilities associated with the account. The capabilities are returned sorted by creation date, with the most recent capability appearing first.

### get,/v1/account/capabilities/{capability}

This operation retrieves information about the specified Account Capability.

###  post,/v1/account/capabilities/{capability}

This operation updates an existing Account Capability.

### get,/v1/account/external_accounts

List external accounts for an account.

### post,/v1/account/external_accounts

This operation creates an external account for a given account.

### delete,/v1/account/external_accounts/{id}

This operation deletes a specified external account for a given account.

-->






