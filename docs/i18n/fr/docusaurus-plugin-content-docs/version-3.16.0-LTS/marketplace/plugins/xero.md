---
id: marketplace-plugin-xero
title: Xero
---

Le plugin Xero permet un accès authentifié aux API de Xero afin que vous puissiez effectuer des opérations prises en charge dans des domaines tels que la comptabilité, la paie, les projets, les actifs et les fichiers, directement depuis ToolJet.

Le plugin Xero utilise l'authentification OAuth 2.0 et vous permet d'interagir avec plusieurs domaines de service Xero via une seule configuration de source de données.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé la procédure d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

### Générer le Client ID et le Client Secret

- Accédez au Xero Developer Portal et connectez-vous.
- Créez une nouvelle application (New App).
- Choisissez Web App comme type d'application.
- Copiez le Client ID et le Client Secret générés.
- Dans les paramètres de votre application Xero, ajoutez le Redirect URI fourni par ToolJet.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/xero/ClientID-secret.png" alt="Fetching Creds from Xero Developer Portal" />


## Connexion
Pour vous connecter à Xero, les identifiants suivants sont requis :

 - **Client ID** : Saisissez votre Client ID. Cela identifie votre application ToolJet auprès de Xero.

 - **Client Secret** : Saisissez votre Client Secret. Cliquez sur 'Edit' dans ToolJet et saisissez la valeur. Ce secret sera stocké sous forme chiffrée.

 - **Scope(s)** : Le scope définit les permissions dont disposera votre application ToolJet dans Xero. Ce champ est pré-rempli avec des scopes couramment utilisés tels que :
"openid, profile, email, accounting.transactions,  accounting.reports.read, accounting.reports.tenninetynine.read"

Vous pouvez modifier les scopes selon votre cas d'usage.

**⚠️ Assurez-vous que les scopes saisis ici correspondent exactement aux scopes configurés dans votre application Xero.**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/xero/connection.png" alt="Configuring Xero in ToolJet" />

- **Redirect URI** : ToolJet génère automatiquement un Redirect URI.

```yaml
{
http://localhost:8082/oauth2/authorize
}
```

Ce redirect URI est nécessaire pour finaliser le flux d'authentification OAuth.

## Sélection du Tenant ID 

Le plugin Xero dans ToolJet fournit un **mécanisme de sélection de tenant** au sein du générateur de requêtes afin d'identifier l'organisation Xero contre laquelle les opérations API sont exécutées.

Chaque requête API Xero doit être associée à un **Tenant ID**, qui représente une organisation Xero (tenant) spécifique à laquelle l'utilisateur authentifié a accès.


## Get Tenants

L'option **Get Tenants** permet à ToolJet de récupérer dynamiquement les tenants Xero disponibles après une connexion OAuth réussie et sécurisée.


## Saisie manuelle du Tenant ID

ToolJet prend également en charge la **saisie manuelle du Tenant ID** pour des cas d'usage avancés à l'aide de l'éditeur d'expressions `fx`.


<img className="screenshot-full img-full" src="/img/marketplace/plugins/xero/get-tenant-xero.png" alt="Configuring Xero in ToolJet" />


## Opérations prises en charge

Xero dans ToolJet prend en charge les opérations suivantes :

1. **[Accounts](#accounts)**
2. **[Finance](#finance)**
3. **[Identity](#identity)**
4. **[Bank Feeds](#bank-feeds)**
5. **[App Store](#app-store)**
6. **[Assets](#assets)**
7. **[Payroll AU](#payroll-au)**
8. **[Payroll UK](#payroll-uk)**
9. **[Payroll NZ](#payroll-nz)**
10. **[Projects](#projects)**
11. **[Files](#files)**

### Accounts
Gérer et récupérer le plan comptable utilisé pour catégoriser les transactions financières dans Xero.

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/ Accounts` | Récupère l'ensemble du plan comptable. |
| PUT | `/ Accounts` | Crée un nouveau plan comptable.     |
| GET | `/BatchPayments` | Récupère un ou plusieurs paiements groupés pour des factures. |
| PUT | `/BatchPayments` | Crée un ou plusieurs paiements groupés pour des factures. |
| POST | `/BatchPayments` | Met à jour un paiement groupé spécifique pour des factures et des avoirs. |
| GET | `/BankTransactions` | Récupère toutes les transactions d'argent dépensé ou reçu. |
| PUT | `/BankTransactions` | Crée une ou plusieurs transactions d'argent dépensé ou reçu. |
| POST | `/BankTransactions` | Met à jour ou crée une ou plusieurs transactions d'argent dépensé ou reçu. |
| GET | `/BankTransfers` | Récupère tous les virements bancaires. |
| PUT | `/BankTransfers` | Crée un virement bancaire. |
| GET | `/BrandingThemes` | Récupère tous les thèmes de marque. |
| GET | `/Budgets` | Récupère une liste de budgets. |
| GET | `/Contacts` | Récupère tous les contacts d'une organisation Xero. |
| PUT | `/Contacts` | Crée plusieurs contacts (en masse) dans une organisation Xero. |
| POST | `/Contacts` | Met à jour ou crée un ou plusieurs contacts dans une organisation Xero. |
| GET | `/ContactGroups` | Récupère l'ID de contact et le nom de chaque groupe de contacts. |
| PUT | `/ContactGroups` | Crée un groupe de contacts. |
| GET | `/CreditNotes` | Récupère les avoirs. |
| PUT | `/CreditNotes` | Crée un nouvel avoir. |
| POST | `/CreditNotes` | Met à jour ou crée un ou plusieurs avoirs. |
| GET | `/Currencies` | Récupère les devises de votre organisation Xero. |
| PUT | `/Currencies` | Crée une nouvelle devise pour une organisation Xero. |
| GET | `/Employees` | Récupère les employés utilisés dans la paie Xero. |
| PUT | `/Employees` | Crée de nouveaux employés utilisés dans la paie Xero. |
| POST | `/Employees` | Met à jour ou crée un seul nouvel employé utilisé dans la paie Xero. |
| GET | `/ExpenseClaims` | Récupère les notes de frais. |
| PUT | `/ExpenseClaims` | Crée des notes de frais. |
| GET | `/Invoices` | Récupère les factures de vente ou les factures d'achat. |
| PUT | `/Invoices` | Crée une ou plusieurs factures de vente ou factures d'achat. |
| POST | `/Invoices` | Met à jour ou crée une ou plusieurs factures de vente ou factures d'achat. |
| GET | `/Items` | Récupère les articles. |
| PUT | `/Items` | Crée un ou plusieurs articles. |
| POST | `/Items` | Met à jour ou crée un ou plusieurs articles. |
| GET | `/Journals` | Récupère les journaux. |
| GET | `/LinkedTransactions` | Récupère les transactions liées (dépenses facturables). |
| PUT | `/LinkedTransactions` | Crée des transactions liées (dépenses facturables). |
| GET | `/ManualJournals` | Récupère les journaux manuels. |
| PUT | `/ManualJournals` | Crée un ou plusieurs journaux manuels. |
| POST | `/ManualJournals` | Met à jour ou crée un seul journal manuel. |
| GET | `/Organisation` | Récupère les détails de l'organisation Xero. |
| GET | `/Overpayments` | Récupère les trop-payés. |
| GET | `/Payments` | Récupère les paiements pour les factures et les avoirs. |
| PUT | `/Payments` | Crée plusieurs paiements pour des factures ou des avoirs. |
| POST | `/Payments` | Crée un seul paiement pour une facture ou un avoir. |
| GET | `/PaymentServices` | Récupère les services de paiement. |
| PUT | `/PaymentServices` | Crée un service de paiement. |
| GET | `/Prepayments` | Récupère les paiements anticipés. |
| GET | `/PurchaseOrders` | Récupère les bons de commande. |
| PUT | `/PurchaseOrders` | Crée un ou plusieurs bons de commande. |
| POST | `/PurchaseOrders` | Met à jour ou crée un ou plusieurs bons de commande. |
| GET | `/Quotes` | Récupère les devis de vente. |
| PUT | `/Quotes` | Crée un ou plusieurs devis. |
| POST | `/Quotes` | Met à jour ou crée un ou plusieurs devis. |
| GET | `/Receipts` | Récupère les reçus de notes de frais en brouillon pour tout utilisateur. |
| PUT | `/Receipts` | Crée des reçus de notes de frais en brouillon pour tout utilisateur. |
| GET | `/RepeatingInvoices` | Récupère les factures récurrentes. |
| PUT | `/RepeatingInvoices` | Crée un ou plusieurs modèles de facture récurrente. |
| POST | `/RepeatingInvoices` | Met à jour ou supprime un ou plusieurs modèles de facture récurrente. |
| GET | `/Reports` | Récupère les rapports uniques de l'organisation qui nécessitent un GUID pour être récupérés. |
| POST | `/Setup` | Définit le plan comptable, la date de conversion et les soldes de conversion. |
| GET | `/TaxRates` | Récupère les taux de taxe. |
| PUT | `/TaxRates` | Crée un ou plusieurs taux de taxe. |
| POST | `/TaxRates` | Met à jour les taux de taxe. |
| GET | `/TrackingCategories` | Récupère les catégories de suivi et leurs options. |
| PUT | `/TrackingCategories` | Crée des catégories de suivi. |
| GET | `/Users` | Récupère les utilisateurs. |

#### Account ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Accounts/{AccountID}` | Récupère un seul compte du plan comptable à l'aide d'un ID de compte unique. |
| POST    | `/Accounts/{AccountID}` | Met à jour un compte du plan comptable. |
| DELETE   | `/Accounts/{AccountID}` | Supprime un compte du plan comptable. |
| GET   | `/Accounts/{AccountID}/Attachments` | Récupère les pièces jointes d'un compte spécifique. |
| GET   | `/Accounts/{AccountID}/Attachments/{AttachmentID}` | Récupère une pièce jointe spécifique à l'aide d'un ID de pièce jointe unique. |
| GET   | `/Accounts/{AccountID}/Attachments/{FileName}` |  Récupère une pièce jointe par nom de fichier. |
| POST   | `/Accounts/{AccountID}/Attachments/{FileName}` | Met à jour une pièce jointe par nom de fichier. |
| PUT    | `/Accounts/{AccountID}/Attachments/{FileName}` | Crée une pièce jointe sur un compte spécifique. |

#### Batch Payment ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/BatchPayments/{BatchPaymentID}` | Récupère un paiement groupé spécifique à l'aide d'un ID de paiement groupé unique. |
| POST | `/BatchPayments/{BatchPaymentID}` | Met à jour un paiement groupé spécifique pour des factures et des avoirs. |
| GET | `/BatchPayments/{BatchPaymentID}/History` | Récupère l'historique d'un paiement groupé spécifique. |
| PUT | `/BatchPayments/{BatchPaymentID}/History` | Crée un enregistrement d'historique pour un paiement groupé spécifique. |

#### Bank Transaction ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/BankTransactions/{BankTransactionID}` | Récupère une seule transaction d'argent dépensé ou reçu à l'aide d'un ID de transaction bancaire unique. |
| POST | `/BankTransactions/{BankTransactionID}` | Met à jour une seule transaction d'argent dépensé ou reçu. |
| GET | `/BankTransactions/{BankTransactionID}/Attachments` | Récupère les pièces jointes d'une transaction bancaire spécifique. |
| GET | `/BankTransactions/{BankTransactionID}/Attachments/{AttachmentID}` | Récupère une pièce jointe spécifique d'une transaction bancaire à l'aide d'un ID de pièce jointe unique. |
| GET | `/BankTransactions/{BankTransactionID}/Attachments/{FileName}` | Récupère une pièce jointe spécifique d'une transaction bancaire par nom de fichier. |
| POST | `/BankTransactions/{BankTransactionID}/Attachments/{FileName}` | Met à jour une pièce jointe spécifique d'une transaction bancaire par nom de fichier. |
| PUT | `/BankTransactions/{BankTransactionID}/Attachments/{FileName}` | Crée une pièce jointe pour une transaction bancaire spécifique par nom de fichier. |
| GET | `/BankTransactions/{BankTransactionID}/History` | Récupère l'historique d'une transaction bancaire spécifique à l'aide d'un ID de transaction bancaire unique. |
| PUT | `/BankTransactions/{BankTransactionID}/History` | Crée un enregistrement d'historique pour une transaction bancaire spécifique. |

#### Bank Transfer ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/BankTransfers/{BankTransferID}` | Récupère un virement bancaire spécifique à l'aide d'un ID de virement bancaire unique. |
| GET | `/BankTransfers/{BankTransferID}/Attachments` | Récupère les pièces jointes d'un virement bancaire spécifique. |
| GET | `/BankTransfers/{BankTransferID}/Attachments/{AttachmentID}` | Récupère une pièce jointe spécifique d'un virement bancaire à l'aide d'un ID de pièce jointe unique. |
| GET | `/BankTransfers/{BankTransferID}/Attachments/{FileName}` | Récupère une pièce jointe spécifique sur un virement bancaire par nom de fichier. |
| POST | `/BankTransfers/{BankTransferID}/Attachments/{FileName}` | Met à jour une pièce jointe spécifique sur un virement bancaire par nom de fichier. |
| PUT | `/BankTransfers/{BankTransferID}/Attachments/{FileName}` | Crée une pièce jointe pour un virement bancaire spécifique par nom de fichier. |
| GET | `/BankTransfers/{BankTransferID}/History` | Récupère l'historique d'un virement bancaire spécifique à l'aide d'un ID de virement bancaire unique. |
| PUT | `/BankTransfers/{BankTransferID}/History` | Crée un enregistrement d'historique pour un virement bancaire spécifique. |

#### Branding Theme ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/BrandingThemes/{BrandingThemeID}` | Récupère un thème de marque spécifique à l'aide d'un ID de thème de marque unique. |
| GET | `/BrandingThemes/{BrandingThemeID}/PaymentServices` | Récupère les services de paiement d'un thème de marque spécifique. |
| POST | `/BrandingThemes/{BrandingThemeID}/PaymentServices` | Crée un nouveau service de paiement personnalisé pour un thème de marque spécifique. |

#### Budget ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/Budgets/{BudgetID}` | Récupère un budget spécifique, y compris ses lignes budgétaires. |

#### Contact Number
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/Contacts/{ContactNumber}` | Récupère un contact spécifique par numéro de contact dans une organisation Xero. |

#### Contact ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/Contacts/{ContactID}` | Récupère un contact spécifique dans une organisation Xero à l'aide d'un ID de contact unique. |
| POST | `/Contacts/{ContactID}` | Met à jour un contact spécifique dans une organisation Xero. |
| GET | `/Contacts/{ContactID}/Attachments` | Récupère les pièces jointes d'un contact spécifique dans une organisation Xero. |
| GET | `/Contacts/{ContactID}/Attachments/{AttachmentID}` | Récupère une pièce jointe spécifique d'un contact à l'aide d'un ID de pièce jointe unique. |
| GET | `/Contacts/{ContactID}/Attachments/{FileName}` | Récupère une pièce jointe spécifique d'un contact par nom de fichier. |
| POST | `/Contacts/{ContactID}/Attachments/{FileName}` | Met à jour une pièce jointe spécifique d'un contact par nom de fichier. |
| PUT | `/Contacts/{ContactID}/Attachments/{FileName}` | Crée une pièce jointe pour un contact spécifique par nom de fichier. |
| GET | `/Contacts/{ContactID}/CISSettings` | Récupère les paramètres CIS d'un contact spécifique dans une organisation Xero. |
| GET | `/Contacts/{ContactID}/History` | Récupère les enregistrements d'historique d'un contact spécifique. |
| PUT | `/Contacts/{ContactID}/History` | Crée un nouvel enregistrement d'historique pour un contact spécifique. |

#### Contact Group ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/ContactGroups/{ContactGroupID}` | Récupère un groupe de contacts spécifique à l'aide d'un ID de groupe de contacts unique. |
| POST | `/ContactGroups/{ContactGroupID}` | Met à jour un groupe de contacts spécifique. |
| PUT | `/ContactGroups/{ContactGroupID}/Contacts` | Crée des contacts pour un groupe de contacts spécifique. |
| DELETE | `/ContactGroups/{ContactGroupID}/Contacts` | Supprime tous les contacts d'un groupe de contacts spécifique. |
| DELETE | `/ContactGroups/{ContactGroupID}/Contacts/{ContactID}` | Supprime un contact spécifique

:::info
L'entité **Accounts** prend en charge davantage d'opérations. Vous pouvez toutes les retrouver dans le panneau de requêtes.
:::

### Finance
Accéder aux informations financières et aux indicateurs d'activité comptable pour des cas d'usage d'analyse et de BI. 

| Method | API Endpoint | Description |
|--------|--------------|-------------|
| GET | `/CashValidation` | Récupère les détails de validation de trésorerie |

#### Account Usage
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/AccountingActivities/AccountUsage` | Récupère les détails d'utilisation des comptes |

#### Lock History
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/AccountingActivities/LockHistory` | Récupère les détails de l'historique de verrouillage |

#### Report History
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/AccountingActivities/ReportHistory` | Récupère les détails de l'historique des rapports |

#### User Activities
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/AccountingActivities/UserActivities` | Récupère les détails d'activité des utilisateurs |

#### Balance Sheet
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/FinancialStatements/BalanceSheet` | Récupère le rapport Balance Sheet |

#### Cashflow
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/FinancialStatements/Cashflow` | Récupère le rapport de flux de trésorerie |

#### Profit and Loss
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/FinancialStatements/ProfitAndLoss` | Récupère le rapport de résultat (Profit and Loss) |

#### Trail Balance
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/FinancialStatements/TrialBalance` | Récupère le rapport de balance générale (Trial Balance) |

#### Contacts
| Method | API Endpoint | Description |
|--------|--------------|--------------|
GET | `/FinancialStatements/contacts/revenue` | Récupère le rapport de revenus par contacts |
| GET | `/FinancialStatements/contacts/expense` | Récupère le rapport de dépenses par contacts |

#### Statements
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/BankStatementsPlus/statements` | Récupère les détails comptables des relevés bancaires |

### Identity
Gérer l'authentification et la gestion des identités à l'aide du service d'identité OAuth 2.0 de Xero. (Utilisé pour la connexion à l'application et la sécurisation de l'accès à l'API.)

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/Connections` | Récupère les connexions de cet utilisateur. |

#### ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| DELETE | `/Connections/{id}` | Supprime les connexions de cet utilisateur. (c.-à-d. déconnecter un tenant) |

### Bank Feeds
Fournir des flux de transactions et des données de connexion bancaire pour les institutions financières prises en charge.

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/FeedConnections` | Recherche des connexions de flux. |
| POST  | `/FeedConnections` | Crée une ou plusieurs nouvelles connexions de flux. |
| GET   | `/Statements` | Récupère tous les relevés. |
| POST  | `/Statements` | Crée un ou plusieurs nouveaux relevés. |

#### ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/FeedConnections/{id}` | Récupère une seule connexion de flux à l'aide d'un ID unique fourni. |

#### Delete Requests

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/FeedConnections/DeleteRequests` | Supprime une connexion de flux existante. |

#### Statement ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/Statements/{StatmentId}` | Récupère un seul relevé à l'aide d'un ID unique fourni. |

### App Store
Parcourir et gérer les applications et intégrations tierces disponibles sur le marketplace Xero. 

#### Subscription ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Subscriptions/{SubscriptionId}` | Récupère un abonnement pour un subscriptionId donné. |
| POST  | `/Subscriptions/{SubscriptionId}/items//{SubscriptionItemId}/usage-records` | Envoie l'utilisation mesurée appartenant à cet abonnement et à cet élément d'abonnement. |
| PUT   | `/Subscriptions/{SubscriptionId}/items//{SubscriptionItemId}/usage-records/{usageRecordId}` | Met à jour une utilisation mesurée existante appartenant à cet abonnement et à cet élément d'abonnement. |
| GET   | `/Subscriptions/{SubscriptionId}/usage-records` | Récupère tous les enregistrements d'utilisation liés à l'abonnement. |

### Assets
Gérer les immobilisations, y compris la création, le suivi de la dépréciation et les cessions.

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Assets` | Recherche des immobilisations. |
| POST  | `/Assets` | Ajoute une immobilisation. |
| GET   | `/AssetTypes` | Recherche des types d'immobilisations. |
| POST  | `/AssetTypes` | Ajoute un type d'immobilisation. |
| GET   | `/Settings` | Recherche les paramètres d'immobilisations. |

#### ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/Assets/{id}` | Récupère une immobilisation par id. |

### Payroll AU
Accéder aux fonctionnalités de paie pour les entreprises australiennes, telles que la synchronisation des employés et des détails de paie.

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Employees` | Recherche des employés de paie. |
| POST  | `/Employees` | Crée des employés de paie. |
| GET   | `/LeaveApplications` | Récupère les demandes de congé. |
| POST  | `/LeaveApplications` | Crée une demande de congé. |
| GET   | `/PayItems` | Récupère les éléments de paie. |
| POST  | `/PayItems` | Crée un élément de paie. |
| GET   | `/PayrollCalendars` | Récupère le calendrier de paie. |
| POST  | `/PayrollCalendars` | Crée un calendrier de paie. |
| GET   | `/PayRuns` | Récupère les cycles de paie. |
| POST  | `/PayRuns` | Crée un cycle de paie. |
| GET   | `/Settings` | Récupère les paramètres de paie. |
| GET   | `/Superfunds` | Récupère les fonds de retraite (superfunds). |
| POST  | `/Superfunds` | Crée des fonds de retraite (superfunds). |
| GET   | `/SuperfundProducts` | Récupère les produits de fonds de retraite. |
| GET   | `/Timesheets` | Récupère les feuilles de temps. |
| POST  | `/Timesheets` | Crée des feuilles de temps. |

#### Employee ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/Employees/{EmployeeID}` | Récupère les détails d'un employé à l'aide d'un ID d'employé unique. |
| POST | `/Employees/{EmployeeID}` | Met à jour les détails d'un employé. |

#### V2

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/LeaveApplications/v2` | Récupère les demandes de congé, y compris les requêtes de congé. |

#### Leave Application ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/LeaveApplications/{LeaveApplicationID}` | Récupère une demande de congé à l'aide d'un ID de demande de congé unique. |
| PUT | `/LeaveApplications/{LeaveApplicationID}` | Met à jour une demande de congé spécifique. |
| POST | `/LeaveApplications/{LeaveApplicationID}/approve` | Approuve une demande de congé à l'aide d'un ID de demande de congé unique. |
| POST | `/LeaveApplications/{LeaveApplicationID}/reject` | Rejette une demande de congé à l'aide d'un ID de demande de congé unique. |

#### Payroll Calendar ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/PayrollCalendars/{PayrollCalendarID}` | Récupère un calendrier de paie à l'aide d'un ID de calendrier de paie unique. |

#### Payrun ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/PayRuns/{PayRunID}` | Récupère un cycle de paie à l'aide d'un ID de cycle de paie unique. |
| POST | `/PayRuns/{PayRunID}` | Met à jour un cycle de paie. |

#### Payslip ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/PaySlip/{PaySlipID}` | Récupère un bulletin de paie à l'aide d'un ID de bulletin de paie unique. |
| POST | `/PaySlip/{PaySlipID}` | Met à jour un bulletin de paie. |

#### Superfund ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/Superfunds/{SuperFundID}` | Récupère un fonds de retraite à l'aide d'un ID de fonds de retraite unique. |
| POST | `/Superfunds/{SuperFundID}` | Met à jour un fonds de retraite. |

#### Timesheet ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Timesheets/{TimesheetId}` | Récupère une feuille de temps à l'aide d'un ID de feuille de temps unique. |
| POST  | `/Timesheets/{TimesheetId}` | met à jour une feuille de temps. |


### Payroll UK
Accéder aux fonctionnalités de paie pour les entreprises basées au Royaume-Uni, telles que les données des employés et des cycles de paie.

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET   | `/Employees` | Récupère les employés. |
| POST  | `/Employees` | Crée des employés. |
| GET   | `/Benifits` | Récupère les avantages des employés. |
| POST  | `/Benifits` | Crée un nouvel avantage employé. |
| GET   | `/Deductions` | Récupère les retenues. |
| POST  | `/Deductions` | Crée une nouvelle retenue. |
| GET   | `/PayrollCalendars` | Récupère le calendrier de paie. |
| POST  | `/PayrollCalendars` | Crée un calendrier de paie. |
| GET   | `/EarningsOrders` | Récupère les ordres de saisie sur salaire. |
| GET   | `/EarningsRates` | Récupère les taux de rémunération. |
| POST  | `/EarningsRates` | Crée un nouveau taux de rémunération. |
| GET   | `/LeaveTypes` | Récupère les types de congé. |
| POST  | `/LeaveTypes` | Crée un nouveau type de congé. |
| GET   | `/Reimbursements` | Récupère les remboursements. |
| POST  | `/Reimbursements` | Crée un nouveau remboursement. |
| GET   | `/Timesheets` | Récupère les feuilles de temps. |
| POST  | `/Timesheets` | Crée une nouvelle feuille de temps. |
| GET   | `/PayRunCalendars` | Récupère les calendriers de cycle de paie. |
| POST  | `/PayRunCalendars` | Crée un nouveau calendrier de cycle de paie. |
| GET | `/PayRuns` | Récupère les cycles de paie. |
| GET | `/Payslips` | Récupère les bulletins de paie. |
| GET | `/Settings` | Récupère les paramètres de paie. |

#### Employee ID

| Method |            API Endpoint                        | Description                                                                   |
|--------|------------------------------------------------|-------------------------------------------------------------------------------|
| GET    | `/Employees/{EmployeeID}`                      | Récupère un employé spécifique à l'aide d'un ID d'employé unique. |
| PUT | `/Employees/{EmployeeID}`                         | Met à jour les détails d'un employé spécifique. |
| POST| `/Employees/{EmployeeID}/Employment` |  Crée un détail d'emploi pour un employé spécifique à l'aide d'un ID d'employé unique. |
| GET | `/Employees/{EmployeeID}/Tax` | Récupère les enregistrements fiscaux d'un employé spécifique à l'aide d'un ID d'employé unique. |
| GET | ` /Employees/{EmployeeID}/ukopeningbalances` | Récupère les soldes d'ouverture d'un employé spécifique à l'aide d'un ID d'employé unique. |
| POST |  `/Employees/{EmployeeID}/ukopeningbalances` | Crée un solde d'ouverture pour un employé spécifique. |
| PUT  | `/Employees/{EmployeeID}/ukopeningbalances` |  Met à jour les soldes d'ouverture d'un employé spécifique. |
| GET  | `/Employees/{EmployeeID}/Leave`|  enregistrements de congé d'un employé spécifique à l'aide d'un ID d'employé unique.  |
| POST | `/Employees/{EmployeeID}/Leave`| Crée des enregistrements de congé pour un employé spécifique.|
| GET  | `/Employees/{EmployeeID}/Leave/{LeaveID}` | Récupère un enregistrement de congé d'un employé spécifique à l'aide d'un ID d'employé unique. |
| PUT  | `/Employees/{EmployeeID}/Leave/{LeaveID}` | Met à jour les enregistrements de congé d'un employé spécifique. |
| DELETE | `/Employees/{EmployeeID}/Leave/{LeaveID}` | Supprime un enregistrement de congé d'un employé spécifique. |
| GET  | `/Employees/{EmployeeID}/LeaveBalances` | Récupère les soldes de congé d'un employé spécifique à l'aide d'un ID d'employé unique. |
| GET    | `/Employees/{EmployeeID}/StatutoryLeaveBalance` | Récupère les soldes de congé d'un employé spécifique à l'aide d'un ID d'employé unique.   |
| GET    | `/Employees/{EmployeeID}/LeavePeriods` | Récupère les périodes de congé d'un employé spécifique à l'aide d'un ID d'employé unique.    |
| GET    | `/Employees/{EmployeeID}/LeaveTypes` | Récupère les types de congé d'un employé spécifique à l'aide d'un ID d'employé unique.      |
| POST   | `/Employees/{EmployeeID}/LeaveTypes` | Crée des enregistrements de type de congé pour un employé. |
| GET    | `/Employees/{EmployeeID}/PaymentMethods` | Récupère le mode de paiement d'un employé spécifique à l'aide d'un ID d'employé unique.   |
| POST   | `/Employees/{EmployeeID}/PaymentMethods` | Crée un mode de paiement pour un employé. |
| GET    | `/Employees/{EmployeeID}/PayTemplates` | Récupère les modèles de paie d'un employé spécifique à l'aide d'un ID d'employé unique. |
| POST   | `/Employees/{EmployeeID}/PayTemplates/earnings` | Crée des enregistrements de modèle de rémunération pour un employé spécifique. |
| PUT    | `/Employees/{EmployeeID}/PayTemplates/earnings/{PayTemplateEarningID}` | Met à jour les enregistrements de modèle de rémunération d'un employé spécifique. |
| DELETE | `/Employees/{EmployeeID}/PayTemplates/earnings/{PayTemplateEarningID}` | Supprime un enregistrement de modèle de rémunération d'un employé spécifique.|
| POST   | `/Employees/{EmployeeID}/paytemplateearnings` | Crée des enregistrements de modèle de rémunération d'un employé. |
| PUT    | `/Employees/{EmployeeID}/PayTemplates/earnings/{PayTemplateEarningID}` | Met à jour les enregistrements de modèle de rémunération d'un employé spécifique. |
| DELETE | `/Employees/{EmployeeID}/PayTemplates/earnings/{PayTemplateEarningID}` | Supprime un enregistrement de modèle de rémunération d'un employé spécifique. |
| POST   | `/Employees/{EmployeeID}/paytemplateearnings` | Crée plusieurs enregistrements de modèle de rémunération pour un employé spécifique à l'aide d'un ID d'employé unique. |
| GET    | `/Employees/{EmployeeID}/SalaryAndWages` | Récupère le salaire d'un employé spécifique à l'aide d'un ID d'employé unique. |
| POST   | `/Employees/{EmployeeID}/SalaryAndWages` | Crée un enregistrement de salaire pour un employé spécifique. |
| GET    | `/Employees/{EmployeeID}/SalaryAndWages/{SalaryAndWagesID}` | Récupère un enregistrement de salaire spécifique pour un employé spécifique à l'aide d'un ID de salaire unique. |
| PUT    | `/Employees/{EmployeeID}/SalaryAndWages/{SalaryAndWagesID}` | Met à jour l'enregistrement de salaire d'un employé. |
| DELETE | `/Employees/{EmployeeID}/SalaryAndWages/{SalaryAndWagesID}` | Supprime l'enregistrement de salaire d'un employé. |

#### Summary
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/StatutoryLeaves/Summary/{EmployeeID}` | Récupère le résumé des congés statutaires d'un employé spécifique à l'aide d'un ID d'employé unique. |


#### Sick
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST   | `/StatutoryLeaves/Sick` | Crée des enregistrements de congé maladie statutaire. |
| GET    | `/StatutoryLeaves/Sick/{StatutorySickLeaveID}` | Récupère un congé maladie statutaire pour un employé. |

#### ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/Benefits/{id}` | Récupère un avantage spécifique à l'aide d'un ID d'avantage unique. |
| GET    | `/EarningsOrders/{id}`| Récupère un ordre de saisie sur salaire spécifique à l'aide d'un ID d'ordre de saisie unique. |

#### Deduction ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/Deductions/{deductionId}` | Récupère une retenue spécifique à l'aide d'un ID de retenue unique. |

#### Earnings Rate ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/EarningsRates/{EarningsRateID}`| Récupère un taux de rémunération spécifique à l'aide d'un ID de taux de rémunération unique. |

#### Leave Type ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/LeaveTypes/{LeaveTypeID}` | Récupère un type de congé spécifique à l'aide d'un ID de type de congé unique. |

#### Reimbursement ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
 GET    | `/Reimbursements/{ReimbursementID}` | Récupère un remboursement spécifique à l'aide d'un ID de remboursement unique. |

#### Timesheet ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/Timesheets/{TimesheetID}` | Récupère une feuille de temps spécifique à l'aide d'un ID de feuille de temps unique. |
| DELETE | `/Timesheets/{TimesheetID}` | Supprime une feuille de temps spécifique. |
| POST   | `/Timesheets/{TimesheetID}/Lines` | Crée une nouvelle ligne de feuille de temps pour une feuille de temps spécifique à l'aide d'un ID de feuille de temps unique. |
| POST   | `/Timesheets/{TimesheetID}/Approve` | Approuve une feuille de temps spécifique. |
| POST   | `/Timesheets/{TimesheetID}/RevertToDraft` | Remet une feuille de temps spécifique à l'état brouillon.  |
| PUT    | `/Timesheets/{TimesheetID}/Lines/{TimesheetLineID}` | Met à jour une ligne de feuille de temps spécifique pour une feuille de temps donnée. |
| DELETE | `/Timesheets/{TimesheetID}/Lines/{TimesheetLineID}` | Supprime une ligne de feuille de temps spécifique. |

#### Payrun Calendar ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/PayRunCalendars/{PayRunCalendarID}` | Récupère un calendrier de cycle de paie spécifique à l'aide d'un ID de calendrier de cycle de paie unique. |

#### Payrun ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/PayRuns/{PayRunID}` | Récupère un cycle de paie spécifique à l'aide d'un ID de cycle de paie unique. |
| PUT    | `/PayRuns/{PayRunID}` | Met à jour un cycle de paie spécifique. |

#### Payslip ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/Payslips/{PayslipID}` | Récupère un bulletin de paie spécifique à l'aide d'un ID de bulletin de paie unique. |

#### Tracking Categories
| Method | API Endpoint                     | Description                 |
|--------|----------------------------------|-----------------------------|
| GET    | `/Settings/trackingCategories`   | Récupère les catégories de suivi. |

### Payroll NZ
Gérer les fonctions de paie pour les entreprises néo-zélandaises avec l'API de paie NZ.

| Method | API Endpoint                  | Description                                             |
|--------|-------------------------------|---------------------------------------------------------|
| GET    | `/Employees`                  | Récupère les employés.                                    |
| POST   | `/Employees`                  | Crée un employé.                                   |
| GET    | `/Deductions`                 | Récupère les retenues d'un employé spécifique.           |
| POST   | `/Deductions`                 | Crée une nouvelle retenue pour un employé spécifique.        |
| GET    | `/StatutoryDeductions`        | Récupère les retenues statutaires.                         |
| GET    | `/Superannuations`            | Récupère les régimes de retraite (superannuations).                              |
| POST   | `/Superannuations`            | Crée un nouveau régime de retraite (superannuation).                           |
| GET    | `/EarningsRates`              | Récupère les taux de rémunération.                               |
| POST   | `/EarningsRates`              | Crée un nouveau taux de rémunération.                            |
| GET    | `/LeaveTypes`                 | Récupère les types de congé.                                  |
| POST   | `/LeaveTypes`                 | Crée un nouveau type de congé.                               |
| GET    | `/Reimbursements`             | Récupère les remboursements.                               |
| POST   | `/Reimbursements`             | Crée un nouveau remboursement.                            |
| GET    | `/Timesheets`                 | Récupère les feuilles de temps.                                   |
| POST   | `/Timesheets`                 | Crée une nouvelle feuille de temps.                                |
| GET    | `/PayRunCalendars`            | Récupère les calendriers de cycle de paie.                             |
| POST   | `/PayRunCalendars`            | Crée un nouveau calendrier de cycle de paie.                          |
| GET    | `/PayRuns`                    | Récupère les cycles de paie.                                     |
| POST   | `/PayRuns`                    | Crée un cycle de paie.                                      |
| GET    | `/Payslips`                   | Récupère les bulletins de paie.                                     |
| GET    | `/Settings`                   | Récupère les paramètres.                                     |

#### Employee ID

| Method | API Endpoint                                      | Description                                                                                  |
|--------|---------------------------------------------------|----------------------------------------------------------------------------------------------|
| GET    | `/Employees/{EmployeeID}`     | Récupère un employé à l'aide d'un ID d'employé unique.                                                               |
| PUT    | `/Employees/{EmployeeID}`     | Met à jour un employé existant.                           |
| POST   | `/Employees/{EmployeeID}/Employment`| Crée un détail d'emploi pour un employé spécifique. |
| GET    | `/Employees/{EmployeeID}/Tax` | Récupère les enregistrements fiscaux d'un employé spécifique. |
| POST   | `/Employees/{EmployeeID}/Tax` | Met à jour les enregistrements fiscaux d'un employé spécifique. |
| GET    | `/Employees/{EmployeeID}/OpeningBalances`  | Récupère le solde d'ouverture d'un employé spécifique. |
| POST   | `/Employees/{EmployeeID}/OpeningBalances` | Crée des soldes d'ouverture pour un employé spécifique.   |
| GET    | `/Employees/{EmployeeID}/Leave` | Récupère les enregistrements de congé d'un employé spécifique. |
| POST   | `/Employees/{EmployeeID}/Leave` | Crée des enregistrements de congé pour un employé spécifique.  |
| PUT    | `/Employees/{EmployeeID}/Leave/{LeaveID}`  | Met à jour les enregistrements de congé d'un employé spécifique.  |
| DELETE  | `/Employees/{EmployeeID}/Leave/{LeaveID}`  | Supprime un enregistrement de congé d'un employé spécifique.   |
| GET    | `/Employees/{EmployeeID}/LeaveBalances`  | Récupère les soldes de congé d'un employé spécifique.  |
| GET    | `/Employees/{EmployeeID}/LeavePeriods` | Récupère les périodes de congé d'un employé spécifique.  |
| POST   | `/Employees/{EmployeeID}/LeaveSetup` | Crée une configuration de congé pour un employé spécifique. Cela est requis avant de consulter, configurer et demander un congé pour un employé. |
| GET    | `/Employees/{EmployeeID}/LeaveTypes`  | Récupère les types de congé d'un employé spécifique.  |
| POST   | `/Employees/{EmployeeID}/LeaveTypes` | Crée des enregistrements de type de congé pour un employé spécifique.  |
| GET    | `/Employees/{EmployeeID}/PaymentMethods` | Récupère les modes de paiement disponibles pour un employé spécifique.  |
| POST   | `/Employees/{EmployeeID}/PaymentMethods`  | Crée un mode de paiement pour un employé. |
| GET    | `/Employees/{EmployeeID}/PayTemplates`  | Récupère les modèles de paie d'un employé spécifique.  |
| POST   | `/Employees/{EmployeeID}/PayTemplates/Earnings`  | Crée des enregistrements de modèle de rémunération pour un employé.  |
| PUT    | `/Employees/{EmployeeID}/PayTemplates/Earnings/{PayTemplateEarningID}` | Met à jour les enregistrements de modèle de rémunération d'un employé.  |
| DELETE  | `/Employees/{EmployeeID}/PayTemplates/Earnings/{PayTemplateEarningID}` | Supprime un enregistrement de modèle de rémunération d'un employé. |
| POST   | `/Employees/{EmployeeID}/PayTemplateEarnings` | Crée plusieurs enregistrements de modèle de rémunération pour un employé spécifique. |
| GET    | `/Employees/{EmployeeID}/SalaryAndWages` | Récupère l'enregistrement de salaire d'un employé. |
| POST   | `/Employees/{EmployeeID}/SalaryAndWages`  | Crée un enregistrement de salaire pour un employé.   |
| GET    | `/Employees/{EmployeeID}/SalaryAndWages/{SalaryAndWagesID}` | Récupère l'enregistrement de salaire d'un employé à l'aide d'un ID de salaire unique. |
| PUT    | `/Employees/{EmployeeID}/SalaryAndWages/{SalaryAndWagesID}` | Met à jour l'enregistrement de salaire d'un employé.   |
| DELETE  | `/Employees/{EmployeeID}/SalaryAndWages/{SalaryAndWagesID}`   | Supprime l'enregistrement de salaire d'un employé.  |
| GET    | `/Employees/{EmployeeID}/Working-Patterns`  | Récupère les modèles de travail d'un employé. |
| POST   | `/Employees/{EmployeeID}/Working-Patterns` | Crée un modèle de travail pour un employé.  |
| GET    | `/Employees/{EmployeeID}/Working-Patterns/{EmployeeWorkingPatternID}`  | Récupère les modèles de travail d'un employé. |
| DELETE  | `/Employees/{EmployeeID}/Working-Patterns/{EmployeeWorkingPatternID}`  | Supprime les modèles de travail d'un employé.                                   |

#### Deduction ID

| Method | API Endpoint                                      | Description                                                                                  |
|--------|---------------------------------------------------|----------------------------------------------------------------------------------------------|
| GET    | `/Deductions/{deductionId}`                       | Récupère une seule retenue à l'aide d'un ID de retenue unique.                                 |

#### ID

| Method | API Endpoint                                      | Description                                                                                  |
|--------|---------------------------------------------------|----------------------------------------------------------------------------------------------|
| GET    | `/StatutoryDeductions/{id}`                       | Récupère une retenue statutaire spécifique à l'aide d'un ID de retenue statutaire unique.          |

#### Super Annuation ID

| Method | API Endpoint                                      | Description                                                                                  |
|--------|---------------------------------------------------|----------------------------------------------------------------------------------------------|
| GET    | `/Superannuations/{SuperannuationID}`             | Récupère un régime de retraite spécifique à l'aide d'un ID de régime de retraite unique.                        |

#### Earnings Rated ID

| Method | API Endpoint                                      | Description                                                                                  |
|--------|---------------------------------------------------|----------------------------------------------------------------------------------------------|
| GET    | `/EarningsRates/{EarningsRateID}`                 | Récupère un taux de rémunération spécifique à l'aide d'un ID de taux de rémunération unique.                      |

#### Leave Type ID

| Method | API Endpoint                                      | Description                                                                                  |
|--------|---------------------------------------------------|----------------------------------------------------------------------------------------------|
| GET    | `/LeaveTypes/{LeaveTypeID}`                       | Récupère un type de congé spécifique à l'aide d'un ID de type de congé unique.                             |

#### Reimbursement ID

| Method | API Endpoint                                      | Description                                                                                  |
|--------|---------------------------------------------------|----------------------------------------------------------------------------------------------|
| GET    | `/Reimbursements/{ReimbursementID}`               | Récupère un remboursement spécifique à l'aide d'un ID de remboursement unique.                       |

#### Timesheet ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/Timesheets/{TimesheetID}` | Récupère une feuille de temps spécifique à l'aide d'un ID de feuille de temps unique. |
| DELETE | `/Timesheets/{TimesheetID}` | Supprime une feuille de temps spécifique. |
| POST   | `/Timesheets/{TimesheetID}/Lines` | Crée une nouvelle ligne de feuille de temps pour une feuille de temps spécifique à l'aide d'un ID de feuille de temps unique. |
| POST   | `/Timesheets/{TimesheetID}/Approve` | Approuve une feuille de temps spécifique. |
| POST   | `/Timesheets/{TimesheetID}/RevertToDraft` | Remet une feuille de temps spécifique à l'état brouillon.  |
| PUT    | `/Timesheets/{TimesheetID}/Lines/{TimesheetLineID}` | Met à jour une ligne de feuille de temps spécifique pour une feuille de temps donnée. |
| DELETE | `/Timesheets/{TimesheetID}/Lines/{TimesheetLineID}` | Supprime une ligne de feuille de temps spécifique. |

#### Payrun Calendar ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/PayRunCalendars/{PayRunCalendarID}` | Récupère un calendrier de cycle de paie spécifique à l'aide d'un ID de calendrier de cycle de paie unique. |

#### Payrun ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/PayRuns/{PayRunID}` | Récupère un cycle de paie spécifique à l'aide d'un ID de cycle de paie unique. |
| PUT    | `/PayRuns/{PayRunID}` | Met à jour un cycle de paie spécifique. |

#### Payslip ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET    | `/Payslips/{PayslipID}` | Récupère un bulletin de paie spécifique à l'aide d'un ID de bulletin de paie unique. |
| PUT    | `/Payslips/{PayslipID}` | Crée un bulletin de paie pour un employé. |

#### Tracking Categories

| Method | API Endpoint                     | Description                 |
|--------|----------------------------------|-----------------------------|
| GET    | `/Settings/trackingCategories`   | Récupère les catégories de suivi. |

### Projects
Suivre le temps, les coûts et la rentabilité des projets (pour les entreprises de services et de projets).

| Method | API Endpoint  | Description                                                                                     |
|--------|---------------|-------------------------------------------------------------------------------------------------|
| GET    | `/Projects`   | Récupère tous les projets.                                                                         |
| POST   | `/Projects`   | Crée un ou plusieurs nouveaux projets.                                                               |
| GET    | `/ProjectsUsers` | Récupère la liste de tous les utilisateurs de projet.                                                       |

#### Project ID

| Method | API Endpoint                     | Description                 |
|--------|----------------------------------|-----------------------------|
| GET    | `/Projects/{projectId}`          | Récupère un projet.        |
| PUT    | `/Projects/{projectId}` | Met à jour un projet spécifique. |
| PATCH  | `/Projects/{projectId}` | Crée un projet pour un contact spécifié. |
| GET    | `/Projects/{projectId}/Tasks` | Récupère toutes les tâches du projet. |
| POST   | `/Projects/{projectId}/Tasks` | Vous permet de créer une tâche. |
| GET    | `/Projects/{projectId}/Tasks/{taskId}` | Récupère une seule tâche de projet. |
| PUT    | `/Projects/{projectId}/Tasks/{taskId}` | Vous permet de mettre à jour une tâche. |
| DELETE | `/Projects/{projectId}/Tasks/{taskId}` | Vous permet de supprimer une tâche. |
| GET    | `/Projects/{projectId}/Time`  | Récupère toutes les entrées de temps associées à un projet spécifique. |
| POST   | `/Projects/{projectId}/Time`  | Crée une entrée de temps pour un projet spécifique. |
| GET    | `/Projects/{projectId}/Time/{timeEntryId}` | Récupère une seule entrée de temps pour un projet spécifique. |
| PUT    | `/Projects/{projectId}/Time/{timeEntryId}` | Met à jour une entrée de temps pour un projet spécifique. |
| DELETE | `/Projects/{projectId}/Time/{timeEntryId}` | Supprime une entrée de temps pour un projet spécifique. |


### Files
Téléverser, récupérer et associer des documents comme des reçus et des factures à des enregistrements dans Xero.

| Method | API Endpoint                            |Description                      |
|--------|-----------------------------------------|---------------------------------|
| GET    | `/Files`                                | Récupère les fichiers.                |
| POST   | `/Files`                                | Téléverse un fichier vers la boîte de réception.    |
| GET    | `/Folders`                              | Récupère les dossiers.              |
| POST   | `/Folders`                              | Crée un nouveau dossier.           |
| GET    | `/Inbox`                                | Récupère le dossier de la boîte de réception.         |

#### File ID

| Method | API Endpoint                     | Description                 |
|--------|----------------------------------|-----------------------------|
| GET    | `/Files/{FileId}`                                          | Récupère un fichier à l'aide d'un ID de fichier unique.  |
| PUT    | `/Files/{FileId}`                                          | Met à jour un fichier.   |
| DELETE | `/Files/{FileId}`                                          | Supprime un fichier spécifique.    |
| GET    | `/Files/{FileId}/Content`                                  | Récupère le contenu d'un fichier spécifique.    |
| GET    | `/Files/{FileId}/Associations`                             | Récupère les associations d'un fichier spécifique.   |
| POST   | `/Files/{FileId}/Associations`                             | Crée une nouvelle association de fichier.  |
| DELETE | `/Files/{FileId}/Associations/{ObjectId}`                  | Supprime une association de fichier existante.  |

#### Folder ID

| Method | API Endpoint                     | Description                 |
|--------|----------------------------------|-----------------------------|
| POST   | `/Files/{FolderId}`                                        | Téléverse un fichier vers un dossier spécifique. |
| GET    | `/Folders/{FolderId}`                                      | Récupère un dossier spécifique à l'aide d'un ID de dossier unique. |
| PUT    | `/Folders/{FolderId}`                                      | Met à jour un dossier existant. |
| DELETE | `/Folders/{FolderId}`                                      | Supprime un dossier. |

#### Object ID

| Method | API Endpoint                     | Description                                                |
|--------|----------------------------------|------------------------------------------------------------|
| GET    | `/Associations/{ObjectId}`       | Récupère un objet d'association à l'aide d'un ID d'objet unique.  |

#### Count

| Method | API Endpoint                     | Description                                              |
|--------|----------------------------------|----------------------------------------------------------|
| GET    | `/Associations/Count`            | Récupère un compte des associations pour une liste d'objets. |


## Exemples de requêtes

### Accounts 
Get Accounts récupère tous les comptes associés au tenant Xero sélectionné. 

Opération : GET ` /Accounts`

**Paramètres optionnels**
- where : vous permet de filtrer les comptes selon des conditions spécifiques (par exemple, par Status ou Type).
- order : vous permet de trier les comptes retournés selon un champ sélectionné, par ordre croissant ou décroissant.

<details id="tj-dropdown">
<summary> **Response Example** </summary>
```
{
  "Id": "05263684-a3fe-48bf-ad06-4fa1835f9df1",
  "Status": "OK",
  "ProviderName": "test",
  "DateTimeUTC": "/Date(1767007119760)/",
  "Accounts": [
    {
      "AccountID": "d7c6f5e4",
      "Name": "Sales",
      "Type": "REVENUE",
      "Code": "200",
      "Status": "ACTIVE",
      "TaxType": "OUTPUT"
    }
  ]
}
```
</details>

<img className="screenshot-full img-l" src="/img/marketplace/plugins/xero/ex-query-get.png" alt="Example query in Xero" />

### Bank Transactions
Create Bank Transactions vous permet de créer une ou plusieurs transactions bancaires pour le tenant Xero sélectionné.

Opération : POST `/BankTransactions`

**Paramètres optionnels**
- summarizeErrors : Lorsqu'il est défini sur `true`, les erreurs de validation sont résumées au lieu de renvoyer des messages d'erreur détaillés pour chaque transaction.
- unitdp : Spécifie le nombre de décimales à utiliser pour les montants unitaires dans la transaction (par exemple, 2 ou 4).

**Request Body**
- Pagination : Utilisé pour contrôler le comportement de pagination dans le corps de la requête, le cas échéant.
- Warnings : Un tableau utilisé pour capturer les avertissements retournés lors du traitement des transactions bancaires.
- BankTransation : Un tableau contenant un ou plusieurs objets de transaction bancaire à créer, incluant des détails tels que le type de transaction, la date, les lignes et les montants.

<details id="tj-dropdown">
<summary> **Response Example** </summary>
```
{
  "Id": "61609765-4c78-45df-8bdf-d2415c77372b",
  "Status": "OK",
  "ProviderName": "app1abc",
  "DateTimeUTC": "/Date(1770616360380)/",
  "BankTransactions": [
    {
      "BankTransactionID": "b2a3f6d9-9c44-4f88-b2d1-0f7d9e6a1234",
      "Type": "SPEND",
      "Contact": {
        "ContactID": "e7a9c1b4-3d55-4a9e-8c22-7f6a8d9c5678",
        "Name": "Office Supplies Ltd"
      },
      "Date": "/Date(1770600000000)/",
      "LineAmountTypes": "Exclusive",
      "LineItems": [
        {
          "Description": "Stationery purchase",
          "Quantity": 2,
          "UnitAmount": 250,
          "AccountCode": "400",
          "LineAmount": 500
        }
      ],
      "SubTotal": 500,
      "TotalTax": 0,
      "Total": 500,
      "Status": "AUTHORISED"
    }
  ]
}
```
</details>

<img className="screenshot-full img-l" src="/img/marketplace/plugins/xero/ex-query-post.png" alt="Example query in Xero" />

### Projects
Get Projects récupère les projets associés au tenant Xero sélectionné. Cette opération prend en charge le filtrage et la pagination pour affiner les résultats.

Opération : GET `/Projects`

**Paramètres optionnels**
- projectIds : Une liste d'ID de projet spécifiques à récupérer. Lorsqu'elle est fournie, seuls les projets correspondant à ces ID sont retournés.
- contactID : Filtre les projets liés à un contact spécifique.
- states : Filtre les projets selon leur état actuel (par exemple, `ACTIVE`, `CLOSED`).
- page : Spécifie le numéro de page à récupérer. Utilisé pour les résultats paginés.
- pageSize : Définit le nombre de projets retournés par page.

<details id="tj-dropdown">
<summary> **Response Example** </summary>
```
{
  "projectIds": [
    "111-22-33-444-555555"
  ],
  "contactID": "aaa-bbb-ccc-dd-ee",
  "states": "ACTIVE",
  "page": 1,
  "pageSize": 20
}
```
</details>

<img className="screenshot-full img-l" src="/img/marketplace/plugins/xero/ex-query-get-proj.png" alt="Example query in Xero" />
