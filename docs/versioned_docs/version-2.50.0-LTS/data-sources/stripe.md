---
id: stripe
title: Stripe
---

ToolJet can connect to your Stripe account to read or write customers' and payments' data.

:::info
Check out the **[Stripe Refund App tutorial](https://blog.tooljet.com/build-a-stripe-refund-tool-using-low-code/)**
:::

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the Stripe data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview/)** page from the ToolJet dashboard and choose Stripe as the data source.

ToolJet requires the following to connect to Stripe datasource.
- **Stripe API key**

<img className="screenshot-full" src="/img/datasource-reference/stripe/connect-v2.png" alt="ToolJet - Data source - Stripe" style={{marginBottom:'15px'}}/>

You can get the Stripe API key from the dashboard of your Stripe account. Go to the Stripe account dashboard, click on the **Developers** on the top right, then on the left-sidebar go to the **API Keys**, you can simple reveal the **Secret Key** and copy-paste on ToolJet.

<img className="screenshot-full" src="/img/datasource-reference/stripe/apikey.png" alt="ToolJet - Data source - Stripe"/>

</div>

<div style={{paddingTop:'24px'}}>

## Querying Stripe

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Stripe** datasource added in previous step.
3. Select the desired operation form the dropdown and enter the required parameter.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/tutorial/transformations)**
:::

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations

You can check out the some of the operations mentioned below. All the operations for Stripe are available and can be performed from ToolJet. Check out the **[Stripe API documentation](https://stripe.com/docs/api/)** for the detailed information about each operation.

| **Category**                       | **Method** | **Endpoint**                                      | **Description**                             |
|------------------------------------|------------|--------------------------------------------------|---------------------------------------------|
| **Account Operations**             | DELETE     | `/v1/account`                                    | Delete an account                          |
|                                    | GET        | `/v1/account`                                    | Retrieve account details                   |
|                                    | POST       | `/v1/account`                                    | Create or update account                   |
| **Bank Accounts (Account)**        | POST       | `/v1/account/bank_accounts`                      | Add a bank account                         |
|                                    | DELETE     | `/v1/account/bank_accounts/{id}`                 | Delete a bank account                      |
|                                    | GET        | `/v1/account/bank_accounts/{id}`                 | Retrieve bank account details              |
|                                    | POST       | `/v1/account/bank_accounts/{id}`                 | Update bank account details                |
| **Capabilities (Account)**         | GET        | `/v1/account/capabilities`                       | Retrieve account capabilities              |
|                                    | GET        | `/v1/account/capabilities/{capability}`          | Retrieve specific capability details       |
|                                    | POST       | `/v1/account/capabilities/{capability}`          | Update specific capability                 |
| **External Accounts (Account)**    | GET        | `/v1/account/external_accounts`                  | Retrieve external accounts                 |
|                                    | POST       | `/v1/account/external_accounts`                  | Add an external account                    |
|                                    | DELETE     | `/v1/account/external_accounts/{id}`             | Delete an external account                 |
|                                    | GET        | `/v1/account/external_accounts/{id}`             | Retrieve external account details          |
|                                    | POST       | `/v1/account/external_accounts/{id}`             | Update external account details            |
| **People (Account)**               | GET        | `/v1/account/people`                             | Retrieve people associated with account    |
|                                    | POST       | `/v1/account/people`                             | Add a person to account                    |
|                                    | DELETE     | `/v1/account/people/{person}`                    | Delete a person                            |
|                                    | GET        | `/v1/account/people/{person}`                    | Retrieve person details                    |
|                                    | POST       | `/v1/account/people/{person}`                    | Update person details                      |
| **Persons (Account)**              | POST       | `/v1/account/persons`                            | Add a person                               |
|                                    | DELETE     | `/v1/account/persons/{person}`                   | Delete a person                            |
|                                    | GET        | `/v1/account/persons/{person}`                   | Retrieve person details                    |
|                                    | POST       | `/v1/account/persons/{person}`                   | Update person details                      |
| **Other Account Operations**       | POST       | `/v1/account/login_links`                        | Create login link for account              |
|                                    | POST       | `/v1/account_links`                              | Create account links                       |
| **Accounts (Specific) Operations** | GET        | `/v1/accounts`                                   | Retrieve list of accounts                  |
|                                    | POST       | `/v1/accounts`                                   | Create a new account                       |
|                                    | DELETE     | `/v1/accounts/{account}`                         | Delete a specific account                  |
|                                    | GET        | `/v1/accounts/{account}`                         | Retrieve specific account details          |
|                                    | POST       | `/v1/accounts/{account}`                         | Update specific account details            |
| **Bank Accounts (Specific)**       | POST       | `/v1/accounts/{account}/bank_accounts`           | Add a bank account                         |
|                                    | DELETE     | `/v1/accounts/{account}/bank_accounts/{id}`      | Delete a bank account                      |
|                                    | GET        | `/v1/accounts/{account}/bank_accounts/{id}`      | Retrieve bank account details              |
| **Capabilities (Specific)**        | GET        | `/v1/accounts/{account}/capabilities`            | Retrieve account capabilities              |
|                                    | GET        | `/v1/accounts/{account}/capabilities/{capability}`| Retrieve specific capability details       |
|                                    | POST       | `/v1/accounts/{account}/capabilities/{capability}`| Update specific capability                 |
| **External Accounts (Specific)**   | GET        | `/v1/accounts/{account}/external_accounts`       | Retrieve external accounts                 |
|                                    | POST       | `/v1/accounts/{account}/external_accounts`       | Add an external account                    |
|                                    | DELETE     | `/v1/accounts/{account}/external_accounts/{id}`  | Delete an external account                 |
|                                    | GET        | `/v1/accounts/{account}/external_accounts/{id}`  | Retrieve external account details          |
| **People (Specific)**              | GET        | `/v1/accounts/{account}/people`                  | Retrieve people associated with account    |
|                                    | POST       | `/v1/accounts/{account}/people`                  | Add a person to account                    |
|                                    | DELETE     | `/v1/accounts/{account}/people/{person}`         | Delete a person                            |
|                                    | GET        | `/v1/accounts/{account}/people/{person}`         | Retrieve person details                    |
|                                    | POST       | `/v1/accounts/{account}/people/{person}`         | Update person details                      |
| **Persons (Specific)**             | POST       | `/v1/accounts/{account}/persons`                 | Add a person                               |
|                                    | DELETE     | `/v1/accounts/{account}/persons/{person}`        | Delete a person                            |
|                                    | GET        | `/v1/accounts/{account}/persons/{person}`        | Retrieve person details                    |
|                                    | POST       | `/v1/accounts/{account}/persons/{person}`        | Update person details                      |
| **Other Account-Specific Operations** | POST   | `/v1/accounts/{account}/login_links`             | Create login link for account              |
|                                    | POST       | `/v1/accounts/{account}/reject`                  | Reject an account                          |
| **Apple Pay Operations**           | GET        | `/v1/apple_pay/domains`                          | Retrieve Apple Pay domains                 |
|                                    | POST       | `/v1/apple_pay/domains`                          | Add a domain to Apple Pay                  |
|                                    | DELETE     | `/v1/apple_pay/domains/{domain}`                 | Delete a domain from Apple Pay             |
|                                    | GET        | `/v1/apple_pay/domains/{domain}`                 | Retrieve specific Apple Pay domain details |
| **Application Fees Operations**    | GET        | `/v1/application_fees`                           | Retrieve list of application fees          |
|                                    | GET        | `/v1/application_fees/{id}`                      | Retrieve specific application fee details  |
|                                    | POST       | `/v1/application_fees/{id}/refund`               | Refund an application fee                  |
|                                    | GET        | `/v1/application_fees/{id}/refunds`              | Retrieve list of refunds for an application fee |
|                                    | POST       | `/v1/application_fees/{id}/refunds`              | Create a refund for an application fee     |
| **Application Fee Refunds (Specific)** | GET    | `/v1/application_fees/{fee}/refunds/{id}`        | Retrieve details of a specific refund      |
|                                    | POST       | `/v1/application_fees/{fee}/refunds/{id}`        | Update a specific refund                   |
| **Apps Secrets Operations**        | GET        | `/v1/apps/secrets`                               | Retrieve app secrets                       |

</div>
