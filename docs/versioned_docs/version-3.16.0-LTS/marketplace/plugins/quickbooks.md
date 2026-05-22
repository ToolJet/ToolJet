---
id: marketplace-plugin-quickbooks
title: QuickBooks
---

The QuickBooks plugin in ToolJet enables applications to connect with QuickBooks APIs directly from ToolJet. It allows users to manage resources such as customers, invoices, payments, vendors, and reports without building custom backend integrations.


QuickBooks exposes REST APIs that allow external applications to securely access and manage accounting data programmatically.

## Connection

To connect to QuickBooks, the following credentials are required:

 - **Client ID**: Enter your Client ID. This identifies your ToolJet application to QuickBooks.

 - **Client Secret**: Enter your Client Secret. This secret will be stored in the encrypted form.

 - **Scope(s)**: Scope defines the permissions your ToolJet app will have in QuickBooks. 

You can modify the scopes based on your use case.

**Note** : Ensure the scopes entered here exactly match the scopes configured in your QuickBooks app.

- **Redirect URI**: ToolJet automatically generates a Redirect URI.

This redirect URI is required for completing the OAuth authentication flow.

- **Username**: QuickBooks account username used for authentication, if required by the configured flow or environment. 

- **Password**: Password associated with the QuickBooks account used during authentication.

- **Compay ID**: Unique identifier of the QuickBooks company account whose resources and financial data will be accessed.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/quickbooks/connection.png" alt="Quickbooks connection page" />

## Supported Operations

ToolJet supports multiple QuickBooks operations through REST API calls, enabling you to manage customers, invoices, payments, vendors, accounts, reports, and other QuickBooks resources directly within your application.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/quickbooks/operations.png" alt="Quickbooks supported operations" />

#### COMPANY

| Method | API Endpoint            | Description                                                  |
| ------ | ----------------------- | ------------------------------------------------------------ |
| POST | `/v3/company/{companyId}/account` | Update an account |
| GET | `/v3/company/{companyId}/account/1` | Get the Account which has accountId as 1 |
| POST | `/v3/company/{companyId}/query` | VendorCredit - ReadAll |
| POST | `/v3/company/{companyId}/attachable` | Attachable Delete |
| GET | `/v3/company/{companyId}/attachable/5000000000000028383` | Attachable Readby Id |
| POST | `/v3/company/{companyId}/upload` | Upload Attachments |
| POST | `/v3/company/{companyId}/batch` | Batch |
| POST | `/v3/company/{companyId}/bill` | Bill Delete |
| GET | `/v3/company/{companyId}/bill/1` | Bill-GetById |
| POST | `/v3/company/{companyId}/billpayment` | BillPayment Update |
| GET | `/v3/company/{companyId}/billpayment/118` | BillPayment ReadById |
| GET | `/v3/company/{companyId}/cdc` | CDC Read |
| POST | `/v3/company/{companyId}/class` | Class Delete |
| GET | `/v3/company/{companyId}/class/5000000000000018727` | Class ReadById |
| GET | `/v3/company/{companyId}/companyinfo/{companyId}` | CompanyInfo ReadById |
| POST | `/v3/company/{companyId}/creditmemo` | CreditMemo Delete |
| GET | `/v3/company/{companyId}/creditmemo/160` | CreditMemo ReadById |
| POST | `/v3/company/{companyId}/customer` | Customer Delete |
| GET | `/v3/company/{companyId}/customer/63` | Customer ReadById |
| POST | `/v3/company/{companyId}/department` | Department Delete |
| GET | `/v3/company/{companyId}/department/1` | Department ReadById |
| POST | `/v3/company/{companyId}/deposit` | Deposit Delete |
| GET | `/v3/company/{companyId}/deposit/162` | Deposit ReadById |
| POST | `/v3/company/{companyId}/employee` | Employee Delete |
| GET | `/v3/company/{companyId}/employee/68` | Employee ReadById |
| POST | `/v3/company/{companyId}/estimate` | Estimate Delete |
| GET | `/v3/company/{companyId}/estimate/163` | Estimate ReadById |
| GET | `/v3/company/{companyId}/exchangerate` | Exchange Rate - Get Details|
| POST | `/v3/company/{companyId}/inventoryadjustment` | Create InventoryAdjustment copy |
| POST | `/v3/company/{companyId}/invoice` | Invoice Delete |
| GET | `/v3/company/{companyId}/invoice/147` | Invoice ReadById |
| POST | `/v3/company/{companyId}/item` | Item Delete |
| GET | `/v3/company/{companyId}/item/<id>` | Item ReadById |
| POST | `/v3/company/{companyId}/journalentry` | JournalEntry Delete |
| GET | `/v3/company/{companyId}/journalentry/8` | JournalEntry ReadById |
| POST | `/v3/company/{companyId}/payment` | Payment Delete |
| GET | `/v3/company/{companyId}/payment/174` | Payment ReadById |
| POST | `/v3/company/{companyId}/paymentmethod` | PaymentMethod Delete |
| GET | `/v3/company/{companyId}/paymentmethod/8` | PaymentMethod ReadById |
| GET | `/v3/company/{companyId}/preferences` | Preferences Read |
| POST | `/v3/company/{companyId}/preferences` | Preferences Update |
| POST | `/v3/company/{companyId}/purchase` | Purchase Delete |
| GET | `/v3/company/{companyId}/purchase/175` | Purchase ReadById |
| POST | `/v3/company/{companyId}/purchaseorder` | PurchaseOrder Delete |
| GET | `/v3/company/{companyId}/purchaseorder/178` | PurchaseOrder ReadById |
| POST | `/v3/company/{companyId}/refundreceipt` | RefundReceipt Delete |
| GET | `/v3/company/{companyId}/refundrecipt/66` | RefundRecipt-ReadBy Id |
| GET | `/v3/company/{companyId}/reports/AccountList` | Report Account List |
| GET | `/v3/company/{companyId}/reports/AgedPayablesDetail` | Report Aged Payables Detail |
| GET | `/v3/company/{companyId}/reports/AgedPayables` | Report Aged Payables |
| GET | `/v3/company/{companyId}/reports/AgedReceivableDetail` | Report Aged Receivable Detail |
| GET | `/v3/company/{companyId}/reports/AgedReceivables` | Report Aged Receivables |
| GET | `/v3/company/{companyId}/reports/BalanceSheet` | Report Balance Sheet |
| GET | `/v3/company/{companyId}/reports/CashFlow` | Report Cash Flow |
| GET | `/v3/company/{companyId}/reports/ClassSales` | Report Class Sales |
| GET | `/v3/company/{companyId}/reports/CustomerBalance` | Report Customer Balance |
| GET | `/v3/company/{companyId}/reports/CustomerBalanceDetail` | Report Customer BalanceDetail |
| GET | `/v3/company/{companyId}/reports/CustomerIncome` | Report Customer Income |
| GET | `/v3/company/{companyId}/reports/CustomerSales` | Report Customer Sales |
| GET | `/v3/company/{companyId}/reports/DepartmentSales` | Report Department Sales |
| GET | `/v3/company/{companyId}/reports/GeneralLedger` | Report General Ledger |
| GET | `/v3/company/{companyId}/reports/InventoryValuationSummary` | Report Inventory Valuation Summary |
| GET | `/v3/company/{companyId}/reports/ItemSales` | Report Item Sales |
| GET | `/v3/company/{companyId}/reports/ProfitAndLoss` | Report Profit And Loss |
| GET | `/v3/company/{companyId}/reports/ProfitAndLossDetail` | Report Profit And Loss Detail |
| GET | `/v3/company/{companyId}/reports/TrialBalance` | Report Trial Balance |
| GET | `/v3/company/{companyId}/reports/TransactionList` | Report Transaction List |
| GET | `/v3/company/{companyId}/reports/VendorBalance` | Report Vendor Balance |
| GET | `/v3/company/{companyId}/reports/VendorBalanceDetail` | Report Vendor Balance Detail |
| GET | `/v3/company/{companyId}/reports/VendorExpenses` | Report Vendor Expenses |
| POST | `/v3/company/{companyId}/salesrecipt` | SalesRecipt-Void |
| GET | `/v3/company/{companyId}/salesreceipt/181` | SalesReceipt ReadById |
| POST | `/v3/company/{companyId}/taxagency` | TaxAgency Create |
| GET | `/v3/company/{companyId}/taxagency/3` | TaxAgency ReadById |
| GET | `/v3/company/{companyId}/taxcode/2` | TaxCode ReadById |
| GET | `/v3/company/{companyId}/taxrate/1` | TaxRate ReadById |
| POST | `/v3/company/{companyId}/taxservice/taxcode` | TaxService Create |
| POST | `/v3/company/{companyId}/term` | Term Delete |
| GET | `/v3/company/{companyId}/term/8` | Term ReadById |
| POST | `/v3/company/{companyId}/timeactivity` | TimeActivity Delete |
| GET | `/v3/company/{companyId}/transfer` | Transfer delete |
| GET | `/v3/company/{companyId}/transfer/184` | Transfer ReadById |
| POST | `/v3/company/{companyId}/vendor` | Vendor Delete |
| GET | `/v3/company/{companyId}/vendor/70` | Vendor ReadById |
| POST | `/v3/company/{companyId}/vendorcredit` | VendorCredit Delete |
| GET | `/v3/company/{companyId}/vendorcredit/185` | VendorCredit ReadById |

## Example Queries

Operation : **GET /`v3/company/{companyid}/account/1`**

Get the account which has accountId as 1.

**Required Parameter:** 
- companyid

**Optional Parameter:** 
- minorversion

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/quickbooks/get-operation-query.png" alt="Quickbooks example query GET" />

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

Operation : **POST /`v3/company/{companyid}/account`**

This query updates an account.

**Required Parameter:** 
- companyid

**Optional Parameters:** 
- minorversion
- requestbody

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/quickbooks/post-operation-query.png" alt="Quickbooks example query POST" />

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