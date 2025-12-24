---
id: marketplace-plugin-xero
title: Xero
---

The Xero Plugin enables authenticated access to Xero’s APIs so you can perform supported operations across areas like accounting, payroll, projects, assets, and files from within ToolJet.

The Xero Plugin uses OAuth 2.0 authentication and allows you to interact with multiple Xero service domains through a single data source configuration.


### Generating Client ID and Client Secret

- Go to the Xero Developer Portal and sign in.
- Create a New App.
- Choose Web App as the application type.
- Copy the generated Client ID and Client Secret.
- In your Xero app settings, add the Redirect URI provided by ToolJet.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/xero/Xero-ClientID-secret.png" alt="Fetching Creds from Xero Developer Portal" />


## Connection
To connect to Xero, the following credentials are required:

 - **Client ID**: Enter your Client ID. This identifies your ToolJet application to Xero.

 - **Client Secret**: Enter your Client Secret. Click 'Edit' in ToolJet and enter the value. This secret will be stored in the encrypted form.

 - **Scope(s)**: Scope defines the permissions your ToolJet app will have in Xero. This field is pre-filled with commonly used scopes such as:
"openid, profile, email, accounting.transactions,  accounting.reports.read, accounting.reports.tenninetynine.read"

You can modify the scopes based on your use case.

**⚠️ Ensure the scopes entered here exactly match the scopes configured in your Xero app.**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/xero/Xero-connection.png" alt="Configuring Xero in ToolJet" />

- **Redirect URI**: ToolJet automatically generates a Redirect URI.

<details id="tj-dropdown">
  <summary>**Response Example**</summary>
```json
{
http://localhost:8082/oauth2/authorize
}
```
</details>

This redirect URI is required for completing the OAuth authentication flow.


## Supported Operations

Xero in ToolJet supports the following operations:

### Accounts 
Manage and retrieve the chart of accounts used for categorizing financial transactions in Xero.

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/ Accounts` | Retrieves the full chart of accounts. |
| PUT   | `/ Accounts` | Creates a new charts of accounts.     |

#### Account ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Accounts/{AccountID}` | Retrieves a single chart of accounts using a unique account ID . |
| POST    | `/Accounts/{AccountID}` | Updates a chart of accounts. |
| DELETE   | `/Accounts/{AccountID}` | Deletes a chart of accounts. |
| GET   | `/Accounts/{AccountID}/Attachments` | Retrieves attachments for a specific account. |
| GET   | `/Accounts/{AccountID}/Attachments/{AttachmentID}` | Retrieves a specific attachment using a unique attachment ID. |
| GET   | `/Accounts/{AccountID}/Attachments/{FileName}` |  Retrieves an attachment by filename. |
| POST   | `/Accounts/{AccountID}/Attachments/{FileName}` | Updates an attachment by filename. |
| PUT    | `/Accounts/{AccountID}/Attachments/{FileName}` | Creates an attachment on a specific account. |

### Contacts
Create, read, update, and manage business contact records like customers and suppliers.

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/ Contacts` | Retrieves all contacts in a Xero organization. |
| PUT   | `/ Contacts` | Creates multiple contacts (bulk) in a Xero organization. |
| POST  | `/ Contacts` | Updates or cretaes one or more contacts in a Xero organization. |
| GET   | `/ ContactGroups` | Retrieves the contact Id and name of each contact group. |
| PUT   | `/ ContactGroups` | Creates a contact group. |

#### CONTACTNUMBER

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/ Contacts/{ContactNumber}` | Retrieves a specific contacts by contact number in a Xero organization. |

#### CONTACTID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Contacts/{ContactID}` | Retrieves a specific contacts in a Xero organization using a unique contact Id. |
| POST  | `/Contacts/{ContactID}` | Updates a specific contact in a Xero organization. |
| GET   | `/Contacts/{ContactID}/Attachments` | Retrieves attachments for a specific contact in a Xero organization. |
| GET   | `/Contacts/{ContactID}/Attachments/{AttachmentID}` | Retrieves a specific attachment using a unique attachment ID. |
| GET   | `/Contacts/{ContactID}/Attachments/{FileName}` | Retrieves a specific attachment from a specific contact by filename. |
| POST  | `/Contacts/{ContactID}/Attachments/{FileName}` |   |
| PUT   | `/Contacts/{ContactID}/Attachments/{FileName}` |   |
| GET   | `/Contacts/{ContactID}/CISSettings` | Retrieves CIS Settings for a specific contact in a Xero organization. |
| GET   | `/Contacts/{ContactID}/History` | Retrieves history records for a specific contact. |
| PUT   | `/Contacts/{ContactID}/History` | Creates a new history record for a specific contact.     |

#### CONTACTGROUPID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/ContactGroups/{ContactGroupID}` | Retrieves a specific contact group by using a unique contact group Id. |
| POST  | `/ContactGroups/{ContactGroupsID}` | Updates a specific contact group. |
| PUT   | `/ContactGroups/{ContactGroupID}/Contacts` | Creates contacts to a specific contact group. |
| DELETE   | `/ContactGroups/{ContactGroupID}/Contacts` | Deletes all contacts from a specific contact group. |
| DELETE   | `/ContactGroups/{ContactGroupID}/Contacts` | Deleets a specific contact from a contact group using a unique contact ID. |


### INVOICES
Create, retrieve, update, and send sales invoices and purchase bills.

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Invoices` | Retrieves a specific sales invoices or purchase bills. |
| PUT   | `/Invoices` | Creates one or more sales invoices or purchase bills. |
| POST  | `/Invoices` | Updates or creates one or more sales invoices or purchase bills. |

#### INVOICEID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Invoices/{InvoiceID}` | Retrieves a specific sales invoice or purchase bill using a unique invoice Id. |
| POST  | `/Invoices/{InvoiceID}` | Updates a specific sales invoices or purchase bills. |
| GET   | `/Invoices/{InvoiceID}/pdf` | Retrieves invoices or purchase bills as PDF files. |
| GET   | `/Invoices/{InvoiceID}/Attachments` | Retrieves attachments for a specific invoice or purchase bill. |
| GET   | `/Invoices/{InvoiceID}/Attachments/{AttachmentID}` | Retrieves a specific attachment from a specific invoices or purchase bills using a unique attachment ID. |
| GET   | `/Invoices/{InvoiceID}/Attachments/{FileName}` | Retrieves an attachment from a specific invoice or purchase bill by filename. |
| POST  | `/Invoices/{InvoiceID}/Attachments/{FileName}` | Updates an attachment from a specific invoice or purchase bill by filename. |
| PUT   | `/Invoices/{InvoiceID}/Attachments/{FileName}` | Creates an attachment for a specific invoice or purchase bill by filename. |
| GET   | `/Invoices/{InvoiceID}/OnlineInvoice` | Retrieves a URL to an online invoice. |
| POST  | `/Invoices/{InvoiceID}/Email` | Sends a copy of a specific invoice to related contact via email. |
| GET   | `/Invoices/{InvoiceID}/History` | Retrieves history records for a specific invoice. |
| PUT   | `/Invoices/{InvoiceID}/History` | Creates an history records for a specific invoice. |

#### SETTINGS

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/InvoiceReminders/Settings` | Retrieves invoice reminder settings. |


### PAYMENTS
Retrieve and record payments applied to invoices, credit notes, and prepayments.

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Payments` | Retrieves payments for invoices credit notes. |
| PUT   | `/Payments` | Creates multiple payments for invoices or credit notes. |
| POST  | `/Payments` | Creates single payment invoices or credit notes. |
| GET   | `/PaymentServices` | Retrieves payment services. |
| PUT   | `/PaymentServices` | Creates payment services. |
| GET   | `/Prepayments` | Retrieves Prepayments. |

#### PAYMENTID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Payments/{PaymentID}` | Retrieves a specific payment for invoices and credit notes using a unique payment Id. |
| POST  | `/Payments/{PaymentID}` | Updates a specific payment for invoices and credit notes. |
| GET   | `/Payments/{PaymentID}/History` | Retrieves history records for a specific payment. |
| PUT   | `/Payments/{PaymentID}/History` | Creates a history records for a specific payment. |

#### PREPAYMENTID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Prepayments/{PrepaymentID}` | Allows you to retrieve a specified prepayments. |
| PUT  | `/Prepayments/{PrepaymentID}/Allocations` | Allows you to create a specified prepayments. |
| DELETE   | `/Prepayments/{PrepaymentID}/Allocations/{AllocationID}` | Deletes an allocation from a Prepayment. |
| GET  | `/Prepayments/{PrepaymentID}/History` | Retrieves history record for a specific prepayment. |
| PUT  | `/Prepayments/{PrepaymentID}/History` | Creates a history records for a specific prepayment. |

### REPORTS
Generate and access standard financial reports such as Balance Sheets and Profit & Loss statements.

#### TENNINETYNINE

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Reports/TenNinetyNine` | Retrieve reports for 1099 |

#### AGEDPAYABLESBYCONTACT

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Reports/AgedPayablesByContact` | Retrieves reports for aged payables by contact. |

#### AGEDRECEIVABLESBYCONTACT

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Reports/AgedReceivablesByContact` | Retrieves reports for aged receivables by contact. |

#### BALANCESHEET

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Reports/BalanceSheet` | Retrieves reports for balancesheet. |

#### BANKSUMMARY

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Reports/BankSummary` | Retrieves reports for bank summary. |

#### REPORTID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Reports/{ReportID}` | Retrieves a specific report using report Id. |

#### BUDGETSUMMARY

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Reports/BudgetSummary` | Retrieves reports for budget summary. |

#### EXECUTIVESUMMARY

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Reports/ExecutiveSummary` | Retrieves reports for executive summary. |
| GET   | `/Reports` | Retrieves a list of the organizations unique reports that require a uuid to fetch. |

#### PROFITANDLOSS

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Reports/ProfitAndLoss` | Retrieves reports for profit and loss. |

#### TRIALBALANCE

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Reports/TrialBalance` | Retrieves reports for trial balance. |


### FINANCE
Access financial insights and accounting activity metrics for analytics and BI use cases. 

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Payments` | Retrieves payments for invoices credit notes. |
| PUT   | `/Payments` | Creates multiple payments for invoices or credit notes. |
| POST  | `/Payments` | Creates single payment invoices or credit notes. |
| GET   | `/PaymentServices` | Retrieves payment services. |
| PUT   | `/PaymentServices` | Creates payment services. |
| GET   | `/Prepayments` | Retrieves Prepayments. |

#### PAYMENTID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Payments/{PaymentID}` | Retrieves a specific payment for invoices and credit notes using a unique payment Id. |
| POST  | `/Payments/{PaymentID}` | Updates a specific payment for invoices and credit notes. |
| GET   | `/Payments/{PaymentID}/History` | Retrieves history records for a specific payment. |
| PUT   | `/Payments/{PaymentID}/History` | Creates a history records for a specific payment. |

#### PREPAYMENTID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Prepayments/{PrepaymentID}` | Allows you to retrieve a specified prepayments. |
| PUT  | `/Prepayments/{PrepaymentID}/Allocations` | Allows you to create a specified prepayments. |
| DELETE | `/Prepayments/{PrepaymentID}/Allocations/{AllocationID}` | Deletes an allocation from a Prepayment. |
| GET  | `/Prepayments/{PrepaymentID}/History` | Retrieves history record for a specific prepayment. |
| PUT  | `/Prepayments/{PrepaymentID}/History` | Creates a history records for a specific prepayment. |


### IDENTITY
Handle authentication and identity management using Xero’s OAuth 2.0 identity service. (Used for app sign-in and securing API access.)

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Connections` | Retrieves the connections for this user. |

#### ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| DELETE | `/Connections/{id}` | Deletes connections for this user. (i.e.,disconnect a Tenant) |

### BANK FEEDS
Provide transaction feeds and bank connection data for supported financial institutions.

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/FeedConnections` | Searches for feed connections. |
| POST  | `/FeedConnections` | Creates one or more new feed connection. |
| GET   | `/Statements` | Retrieves all statements. |
| POST  | `/Statements` | Creates one or more new statements. |

#### ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/FeedConnections/{id}` | Retrieves single feed connection based on an unique id provided. |

#### DELETEREQUESTS

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/FeedConnections/DeleteRequests` | Deletes an existing feed connection. |

#### STATEMENTID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/Statements/{StatmentId}` | Retrieves single statement based on an unique id provided. |


### APP STORE
Browse and manage third-party apps and integrations available in the Xero marketplace. 

#### SUBSCRIPTIONID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Subscriptions/{SubscriptionId}` | Retrieves a subscription for a given subscriptionId. |
| POST  | `/Subscriptions/{SubscriptionId}/items//{SubscriptionItemId}/usage-records` | Send metered usage belonging to this subscription and subscription item. |
| PUT   | `/Subscriptions/{SubscriptionId}/items//{SubscriptionItemId}/usage-records/{usageRecordId}` | Update and existing metered usage belonging to this subscription and subscription item. |
| GET   | `/Subscriptions/{SubscriptionId}/usage-records` | Gets all usage records related to the subscription. |


### ASSETS
Manage fixed assets, including creation, depreciation tracking, and disposals.

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Assets` | Searches fixed asset. |
| POST  | `/Assets` | Adds a fixed asset. |
| GET   | `/AssetTypes` | Searches fixed asset types. |
| POST  | `/AssetTypes` | Adds a fixed asset type. |
| GET   | `/Settings` | Searches for fixed asset settings. |

#### ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/Assets/{id}` | Retrieves fixed asset by id. |


### PAYROLL AU
Access payroll features for Australian businesses, like syncing employees and pay details.

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Employees` | Searches payroll employees. |
| POST  | `/Employees` | Creates payroll employees. |
| GET   | `/LeaveApplications` | Retrieves leave applications. |
| POST  | `/LeaveApplications` | Creates a leave application. |
| GET   | `/PayItems` | Retrieves pay items. |
| POST  | `/PayItems` | Creates a pay item. |
| GET   | `/PayrollCalendars` | Retrieves payroll calendar. |
| POST  | `/PayrollCalendars` | Creates a payroll calendar. |
| GET   | `/PayRuns` | Retrieves pay runs. |
| POST  | `/PayRuns` | Creates a pay run. |
| GET   | `/Settings` | Retrieves payroll settings. |
| GET   | `/Superfunds` | Retrieves superfunds. |
| POST  | `/Superfunds` | Creates superfunds. |
| GET   | `/SuperfundProducts` | Retrieves superfund products. |
| GET   | `/Timesheets` | Retrieves timesheets. |
| POST  | `/Timesheets` | Creates timesheets. |

#### EMPLOYEEID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/Employees/{EmployeeID}` | Retrieves an employee's detail by unique employee id. |
| PUT | `/Employees/{EmployeeID}` | Updates an employee's detail. |

#### V2

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/LeaveApplications/v2` | Retrieves leave applications including leave requests. |

#### LEAVEAPPLICATIONID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/LeaveApplications/{LeaveApplicationID}` | Retrieves leave application by an unique leave application id . |
| PUT | `/LeaveApplications/{LeaveApplicationID}` | Updates specific leave application. |
| POST | `/LeaveApplications/{LeaveApplicationID}/approve` | Approves a requested leave application by an unique leave application id. |
| POST | `/LeaveApplications/{LeaveApplicationID}/reject` | Rejects a leave application by an unique leave application id. |

#### PAYROLLCALENDARID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/PayrollCalendars/{PayrollCalendarID}` | Retrieves payroll calendar by using an unique payroll calendar id. |

#### PAYRUNID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/PayRuns/{PayRunID}` | Retrieves pay run by using an unique pay run id. |
| PUT | `/PayRuns/{PayRunID}` | Updates a pay run. |

#### PAYSLIPID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/PaySlip/{PaySlipID}` | Retrieves for a payslip by an unique payslip id. |
| PUT | `/PaySlip/{PaySlipID}` | Updates a payslip. |

#### SUPERFUNDID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/Superfunds/{SuperFundID}` | Retrieves a superfund by using unique superfund id. |
| PUT | `/Superfunds/{SuperFundID}` | Updates a superfund. |

#### TIMESHEETID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Timesheets/{TimesheetId}` | Retrieves a timesheet by using unique timsheet id. |
| PUT  | `/Timesheets/{TimesheetId}` | updates a timesheet. |


### PAYROLL UK
Access payroll features for UK-based businesses, like employee and pay run data.

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Employees` | Retrieves employees. |
| POST  | `/Employees` | Creates employees. |
| GET   | `/Benifits` | Retrieves employee benifits. |
| POST  | `/Benifits` | Creates a new employee benifit. |
| GET   | `/Deductions` | Retrieves deductions. |
| POST  | `/Deductions` | Creates a new deduction. |
| GET   | `/PayrollCalendars` | Retrieves payroll calendar. |
| POST  | `/PayrollCalendars` | Creates a payroll calendar. |
| GET   | `/EarningsOrders` | Retrieves earnings orders. |
| GET   | `/EarningsRates` | Retrieves earnings rates. |
| POST  | `/EarningsRates` | Creates a new earnings rate. |
| GET   | `/LeaveTypes` | Retrieves leave types. |
| POST  | `/LeaveTypes` | Creates a new leave type. |
| GET   | `/Reimbursements` | Retrieves reimbursements. |
| POST  | `/Reimbursements` | Creates a new reimbursement. |
| GET   | `/Timesheets` | Retrieves timesheets. |
| POST  | `/Timesheets` | Creates a new timesheet. |
| GET   | `/PayRunCalendars` | Retrieves pay run calendars. |
| POST  | `/PayRunCalendars` | Creates a new pay run calendar. |
| GET | `/PayRuns` | Retrieves pay runs. |
| GET | `/Payslips` | Retrieves pay slips. |
| GET | `/Settings` | Retrieves payroll settings. |

#### EMPLOYEEID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/Employees/{EmployeeID}` | Retrieves specific employees' by using unique employee id. |
| PUT | `/Employees/{EmployeeID}` | Updates a specific employee's detail. |
| POST| `/Employees/{EmployeeID}/Employment` |  Creates employment detail for a specific employee using a unique employee ID. |
| GET | `/Employees/{EmployeeID}/Tax` | Retrieves tax records for a specific employee using a unique employee ID. |
| GET | ` /Employees/{EmployeeID}/ukopeningbalances` | Retrieves a specific employee's opening balances using a unique employee ID. |
| POST |  `/Employees/{EmployeeID}/ukopeningbalances` | Creates an opening balance for a specific employee. |
| PUT  | `/Employees/{EmployeeID}/ukopeningbalances` |  Updates a specific employee's opening balances. |
| GET  | `/Employees/{EmployeeID}/Leave`|  specific employee's leave records using a unique employee ID.  |
| POST | `/Employees/{EmployeeID}/Leave`| Creates leave records for a specific employee.|
| GET  | `/Employees/{EmployeeID}/Leave/{LeaveID}` | Retrieves a specific employee's leave record using a unique employee ID. |
| PUT  | `/Employees/{EmployeeID}/Leave/{LeaveID}` | Updates a specific employee's leave records. |
| DELETE | `/Employees/{EmployeeID}/Leave/{LeaveID}` | Deletes a specific employee's leave record. |
| GET  | `/Employees/{EmployeeID}/LeaveBalances` | Retrieves a specific employee's leave balances using a unique employee ID. |
| GET    | `/Employees/{EmployeeID}/StatutoryLeaveBalance` | Retrieves a specific employee's leave balances using a unique employee ID.   |
| GET    | `/Employees/{EmployeeID}/LeavePeriods` | Retrieves a specific employee's leave periods using a unique employee ID.    |
| GET    | `/Employees/{EmployeeID}/LeaveTypes` | Retrieves a specific employee's leave types using a unique employee ID.      |
| POST   | `/Employees/{EmployeeID}/LeaveTypes` | Creates employee leave type records. |
| GET    | `/Employees/{EmployeeID}/PaymentMethods` | Retrieves a specific employee's payment method using a unique employee ID.   |
| POST   | `/Employees/{EmployeeID}/PaymentMethods` | Creates an employee payment method. |
| GET    | `/Employees/{EmployeeID}/PayTemplates` | Retrieves a specific employee pay templates using a unique employee ID. |
| POST   | `/Employees/{EmployeeID}/PayTemplates/earnings` | Creates an earnings template records for a specific employee. |
| PUT    | `/Employees/{EmployeeID}/PayTemplates/earnings/{PayTemplateEarningID}` | Updates a specific employee's earnings template records. |
| DELETE | `/Employees/{EmployeeID}/PayTemplates/earnings/{PayTemplateEarningID}` | Deletes a specific employee's earnings template record.|
| POST   | `/Employees/{EmployeeID}/paytemplateearnings` | Creates an employee's earnings template records. |
| PUT    | `/Employees/{EmployeeID}/PayTemplates/earnings/{PayTemplateEarningID}` | Updates a specific employee's earnings template records. |
| DELETE | `/Employees/{EmployeeID}/PayTemplates/earnings/{PayTemplateEarningID}` | Deletes a specific employee's earnings template record. |
| POST   | `/Employees/{EmployeeID}/paytemplateearnings` | Creates multiple earnings template records for a specific employee using a unique employee ID. |
| GET    | `/Employees/{EmployeeID}/SalaryAndWages` | Retrieves a specific employee's salary and wages by using a unique employee ID. |
| POST   | `/Employees/{EmployeeID}/SalaryAndWages` | Creates a salary and wage record for a specific employee. |
| GET    | `/Employees/{EmployeeID}/SalaryAndWages/{SalaryAndWagesID}` | Retrieves a specific salary and wages record for a specific employee using a unique salary and wage id. |
| PUT    | `/Employees/{EmployeeID}/SalaryAndWages/{SalaryAndWagesID}` | Updates salary and wages record for a employee. |
| DELETE | `/Employees/{EmployeeID}/SalaryAndWages/{SalaryAndWagesID}` | Deletes a salary and wages record for a employee. |

#### SUMMARY
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/StatutoryLeaves/Summary/{EmployeeID}` | Retrieves a specific employee's summary of statutory leaves using a unique employee ID. |


#### SICK
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST   | `/StatutoryLeaves/Sick` | Creates statutory sick leave records. |
| GET    | `/StatutoryLeaves/Sick/{StatutorySickLeaveID}` | Retrieves a statutory sick leave for an employee. |

#### ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/Benefits/{id}` | Retrieves a specific benefit by using a unique benefit ID. |
| GET    | `/EarningsOrders/{id}`| Retrieves a specific earnings orders by using a unique earnings orders id. |

#### DEDUCTIONID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/Deductions/{deductionId}` | Retrieves a specific deduction by using a unique deduction ID. |

#### EARNINGSRATEID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/EarningsRates/{EarningsRateID}`| Retrieves a specific earnings rates by using a unique earnings rate id. |

#### LEAVETYPEID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/LeaveTypes/{LeaveTypeID}` | Retrieves a specific leave type by using a unique leave type ID. |

#### REIMBURSEMENTID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
 GET    | `/Reimbursements/{ReimbursementID}` | Retrieves a specific reimbursement by using a unique reimbursement id. |

#### TIMESHEETID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/Timesheets/{TimesheetID}` | Retrieves a specific timesheet by using a unique timesheet ID. |
| DELETE | `/Timesheets/{TimesheetID}` | Deletes a specific timesheet. |
| POST   | `/Timesheets/{TimesheetID}/Lines` | Creates a new timesheet line for a specific timesheet using a unique timesheet ID. |
| POST   | `/Timesheets/{TimesheetID}/Approve` | Approves a specific timesheet. |
| POST   | `/Timesheets/{TimesheetID}/RevertToDraft` | Reverts a specific timesheet to draft.  |
| PUT    | `/Timesheets/{TimesheetID}/Lines/{TimesheetLineID}` | Updates a specific timesheet line for a specific timesheet. |
| DELETE | `/Timesheets/{TimesheetID}/Lines/{TimesheetLineID}` | Deletes a specific timesheet line. |
| GET    | `/PayRunCalendars/{PayRunCalendarID}` | Retrieves a specific payrun calendar by using a unique payrun calendar ID. |

#### PAYRUNCALENDARID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/PayRunCalendars/{PayRunCalendarID}` | Retrieves a specific payrun calendar by using a unique payrun calendar ID. |

#### PAYRUNID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/PayRuns/{PayRunID}` | Retrieves a specific pay run by using a unique pay run ID. |
| PUT    | `/PayRuns/{PayRunID}` | Updates a specific pay run. |

#### PAYSLIPID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/Payslips/{PayslipID}` | Retrieves a specific payslip by using a unique payslip ID. |

#### TRACKINGCATEGORIES
| Method | API Endpoint                     | Description                 |
|--------|----------------------------------|-----------------------------|
| GET    | `/Settings/trackingCategories`   | Retrieves tracking categories. |


- **Payroll NZ**
- **Projects**
- **Files**
