---
id: marketplace-plugin-quickbooks
title: QuickBooks
---

The QuickBooks plugin in ToolJet allows users to manage resources such as customers, invoices, payments, vendors, and reports without building custom backend integrations. QuickBooks exposes REST APIs that allow external applications to securely access and manage accounting data programmatically.

:::info NOTE
Before following this guide, it is assumed that you have already completed the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connection

To connect to QuickBooks, the following credentials are required:

 - **Client ID**: Enter your Client ID. This identifies your ToolJet application to QuickBooks.
 - **Client Secret**: Enter your Client Secret. This secret will be stored in the encrypted form.
 - **Scope(s)**: Scope defines the permissions your ToolJet app will have in QuickBooks. You can modify the scopes based on your use case.
    :::note
    Ensure the scopes entered in the ToolJet data source configuration exactly match the scopes configured in your QuickBooks application settings. Any mismatch between the configured scopes and the requested scopes may cause the OAuth authentication flow to fail or restrict access to certain QuickBooks resources.
    :::
- **Redirect URI**: ToolJet automatically generates a Redirect URI. This redirect URI is required for completing the OAuth authentication flow.
- **Username**: QuickBooks account username used for authentication, if required by the configured flow or environment. 
- **Password**: Password associated with the QuickBooks account used during authentication.
- **Company ID**: Unique identifier of the QuickBooks company account whose resources and financial data will be accessed.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/quickbooks/connection.png" alt="Quickbooks Connection page" />

:::info
For detailed steps to generate the **Client ID** and **Client Secret**, refer to the **[QuickBooks documentation](https://developer.intuit.com/app/developer/qbo/docs/get-started/get-client-id-and-client-secret)**.
:::

## Supported Operations

ToolJet supports multiple QuickBooks operations through REST API calls, enabling you to manage customers, invoices, payments, vendors, accounts, reports, and other QuickBooks resources directly within your application.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/quickbooks/operations.png" alt="Quickbooks supported operations" />

#### COMPANY

All QuickBooks API endpoints require a **Company ID**, which uniquely identifies the QuickBooks company account associated with the request. Queries are executed against the specified company's data.

| Method | API Endpoint            | Description                                                  |
| ------ | ----------------------- | ------------------------------------------------------------ |
| POST | `/v3/company/{companyid}/account` | Update an account |
| GET | `/v3/company/{companyid}/account/{id}` | Account Read by Id |
| POST | `/v3/company/{companyid}/query` | Vendor Credit - Read All |
| POST | `/v3/company/{companyid}/attachable` | Attachable Delete |
| GET | `/v3/company/{companyid}/attachable/{id}` | Attachable Read by Id |
| POST | `/v3/company/{companyid}/upload` | Upload Attachments |
| POST | `/v3/company/{companyid}/batch` | Batch |
| POST | `/v3/company/{companyid}/bill` | Bill Delete |
| GET | `/v3/company/{companyid}/bill/{id}` | Bill- Get by Id |
| POST | `/v3/company/{companyid}/billpayment` | Bill Payment Update |
| GET | `/v3/company/{companyid}/billpayment/{id}` | Bill Payment Read by Id |
| GET | `/v3/company/{companyid}/cdc` | CDC Read |
| POST | `/v3/company/{companyid}/class` | Class Delete |
| GET | `/v3/company/{companyid}/class/{id}` | Class Read by Id |
| GET | `/v3/company/{companyid}/companyinfo/{companyid}` | Company Info Read by Id |
| POST | `/v3/company/{companyid}/creditmemo` | Credit Memo Delete |
| GET | `/v3/company/{companyid}/creditmemo/{id}` | Credit Memo Read by Id |
| POST | `/v3/company/{companyid}/customer` | Customer Delete |
| GET | `/v3/company/{companyid}/customer/{id}` | Customer Read by Id |
| POST | `/v3/company/{companyid}/department` | Department Delete |
| GET | `/v3/company/{companyid}/department/{id}` | Department Read by Id |
| POST | `/v3/company/{companyid}/deposit` | Deposit Delete |
| GET | `/v3/company/{companyid}/deposit/{id}` | Deposit Read by Id |
| POST | `/v3/company/{companyid}/employee` | Employee Delete |
| GET | `/v3/company/{companyid}/employee/{id}` | Employee Read by Id |
| POST | `/v3/company/{companyid}/estimate` | Estimate Delete |
| GET | `/v3/company/{companyid}/estimate/{id}` | Estimate Read by Id |
| GET | `/v3/company/{companyid}/exchangerate` | Exchange Rate - Get Details|
| POST | `v3/company/{companyid}/inventoryadjustment` | Create Inventory Adjustment Copy |
| POST | `/v3/company/{companyid}/invoice` | Invoice Delete |
| GET | `/v3/company/{companyid}/invoice/{id}` | Invoice Read by Id |
| POST | `/v3/company/{companyid}/item` | Item Delete |
| GET | `/v3/company/{companyid}/item/<id>` | Item Read by Id |
| POST | `/v3/company/{companyid}/journalentry` | Journal Entry Delete |
| GET | `/v3/company/{companyid}/journalentry/{id}` | Journal Entry Read by Id |
| POST | `/v3/company/{companyid}/payment` | Payment Delete |
| GET | `/v3/company/{companyid}/payment/{id}` | Payment Read by Id |
| POST | `/v3/company/{companyid}/paymentmethod` | Payment Method Delete |
| GET | `/v3/company/{companyid}/paymentmethod/{id}` | Payment Method Read by Id |
| GET | `/v3/company/{companyid}/preferences` | Preferences Read |
| POST | `/v3/company/{companyid}/preferences` | Preferences Update |
| POST | `/v3/company/{companyid}/purchase` | Purchase Delete |
| GET | `/v3/company/{companyid}/purchase/{id}` | Purchase Read by Id |
| POST | `/v3/company/{companyid}/purchaseorder` | Purchase Order Delete |
| GET | `/v3/company/{companyid}/purchaseorder/{id}` | Purchase Order Read by Id |
| POST | `/v3/company/{companyid}/refundreceipt` | Refund Receipt Delete |
| GET | `/v3/company/{companyid}/refundreceipt/{id}` | Refund Recipt- Read by Id |
| GET | `/v3/company/{companyid}/reports/AccountList` | Report Account List |
| GET | `/v3/company/{companyid}/reports/AgedPayablesDetail` | Report Aged Payables Detail |
| GET | `/v3/company/{companyid}/reports/AgedPayables` | Report Aged Payables |
| GET | `/v3/company/{companyid}/reports/AgedReceivableDetail` | Report Aged Receivable Detail |
| GET | `/v3/company/{companyid}/reports/AgedReceivables` | Report Aged Receivables |
| GET | `/v3/company/{companyid}/reports/BalanceSheet` | Report Balance Sheet |
| GET | `/v3/company/{companyid}/reports/CashFlow` | Report Cash Flow |
| GET | `/v3/company/{companyid}/reports/ClassSales` | Report Class Sales |
| GET | `/v3/company/{companyid}/reports/CustomerBalance` | Report Customer Balance |
| GET | `/v3/company/{companyid}/reports/CustomerBalanceDetail` | Report Customer Balance Detail |
| GET | `/v3/company/{companyid}/reports/CustomerIncome` | Report Customer Income |
| GET | `/v3/company/{companyid}/reports/CustomerSales` | Report Customer Sales |
| GET | `/v3/company/{companyid}/reports/DepartmentSales` | Report Department Sales |
| GET | `/v3/company/{companyid}/reports/GeneralLedger` | Report General Ledger |
| GET | `/v3/company/{companyid}/reports/InventoryValuationSummary` | Report Inventory Valuation Summary |
| GET | `/v3/company/{companyid}/reports/ItemSales` | Report Item Sales |
| GET | `/v3/company/{companyid}/reports/ProfitAndLoss` | Report Profit And Loss |
| GET | `/v3/company/{companyid}/reports/ProfitAndLossDetail` | Report Profit And Loss Detail |
| GET | `/v3/company/{companyid}/reports/TrialBalance` | Report Trial Balance |
| GET | `/v3/company/{companyid}/reports/TransactionList` | Report Transaction List |
| GET | `/v3/company/{companyid}/reports/VendorBalance` | Report Vendor Balance |
| GET | `/v3/company/{companyid}/reports/VendorBalanceDetail` | Report Vendor Balance Detail |
| GET | `/v3/company/{companyid}/reports/VendorExpenses` | Report Vendor Expenses |
| POST | `/v3/company/{companyid}/salesreceipt` | Sales Receipt-Void |
| GET | `/v3/company/{companyid}/salesreceipt/{id}` | Sales Receipt Read by Id |
| POST | `/v3/company/{companyid}/taxagency` | Tax Agency Create |
| GET | `/v3/company/{companyid}/taxagency/{id}` | Tax Agency Read by Id |
| GET | `/v3/company/{companyid}/taxcode/{id}` | Tax Code Read by Id |
| GET | `/v3/company/{companyid}/taxrate/{id}` | Tax Rate Read by Id |
| POST | `/v3/company/{companyid}/taxservice/taxcode` | Tax Service Create |
| POST | `/v3/company/{companyid}/term` | Term Delete |
| GET | `/v3/company/{companyid}/term/{id}` | Term Read by Id |
| POST | `/v3/company/{companyid}/timeactivity` | Time Activity Delete |
| POST | `/v3/company/{companyid}/transfer` | Transfer delete |
| GET | `/v3/company/{companyid}/transfer/{id}` | Transfer Read by Id |
| POST | `/v3/company/{companyid}/vendor` | Vendor Delete |
| GET | `/v3/company/{companyid}/vendor/{id}` | Vendor Read by Id |
| POST | `/v3/company/{companyid}/vendorcredit` | Vendor Credit Delete |
| GET | `/v3/company/{companyid}/vendorcredit/{id}` | Vendor Credit Read by Id |

## Example Queries

### Get Account Details

Operation : GET `/v3/company/{companyid}/account/{id}`

This query retrieves the account details for the account with the given `id`. It can be used to fetch information such as account type, balance, classification, and other account-related metadata from QuickBooks. The `companyid` is not entered here — it is taken automatically from the **Company ID** configured on the data source connection.

**Required Parameter:** 
- id

**Optional Parameter:** 
- minorversion

<img className="screenshot-full img-full" src="/img/marketplace/plugins/quickbooks/get-operation-query.png" alt="Quickbooks example query GET" />

<details id="tj-dropdown">
<summary> **Response Example** </summary>
```
{
  "Account": {
    "Name": "Services",
    "SubAccount": false,
    "FullyQualifiedName": "Services",
    "Active": true,
    "Classification": "Revenue",
    "AccountType": "Income",
    "AccountSubType": "ServiceFeeIncome",
    "CurrentBalance": 0,
    "CurrentBalanceWithSubAccounts": 0,
    "CurrencyRef": {
      "value": "AUD",
      "name": "Australian Dollar"
    },
    "domain": "QBO",
    "sparse": false,
    "Id": "1",
    "SyncToken": "0",
    "MetaData": {
      "CreateTime": "2025-12-07T15:27:58-08:00",
      "LastUpdatedTime": "2025-12-07T15:27:58-08:00"
    }
  },
  "time": "2026-05-22T03:45:46.022-07:00"
}
```
</details>

### Update an Account

Operation : POST `/v3/company/{companyid}/account`

This query creates or updates an account in QuickBooks. It can be used to modify existing account information such as account name, account type, classification, or other account properties. The `companyid` is not entered here — it is taken automatically from the **Company ID** configured on the datasource connection.

**Optional Parameters:** 
- minorversion
- requestbody

<img className="screenshot-full img-full" src="/img/marketplace/plugins/quickbooks/post-operation-query.png" alt="Quickbooks example query POST" />

<details id="tj-dropdown">
<summary> **Response Example** </summary>
```
{
  "Account": {
    "Name": "MyJobs_testing",
    "SubAccount": false,
    "FullyQualifiedName": "MyJobs_testing",
    "Active": true,
    "Classification": "Asset",
    "AccountType": "Accounts Receivable",
    "AccountSubType": "AccountsReceivable",
    "CurrentBalance": 0,
    "CurrentBalanceWithSubAccounts": 0,
    "CurrencyRef": {
      "value": "AUD",
      "name": "Australian Dollar"
    },
    "domain": "QBO",
    "sparse": false,
    "Id": "1150040002",
    "SyncToken": "0",
    "MetaData": {
      "CreateTime": "2026-05-22T03:49:10-07:00"
    }
  },
  "time": "2026-05-22T03:49:10.529-07:00"
}
```
</details>