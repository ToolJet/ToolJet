---
id: marketplace-plugin-quickbooks
title: QuickBooks
---

Le plugin QuickBooks apporte des fonctionnalités comptables essentielles directement dans vos applications ToolJet. Il vous permet de créer et de mettre à jour des clients, de générer des factures, d'enregistrer des paiements, de gérer des fournisseurs, et d'accéder à des rapports financiers ainsi qu'à d'autres données QuickBooks depuis une seule interface connectée.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé la procédure d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour se connecter à QuickBooks, les identifiants suivants sont requis :

 - **Client ID** : saisissez votre Client ID. Il identifie votre application ToolJet auprès de QuickBooks.
 - **Client Secret** : saisissez votre Client Secret. Ce secret sera stocké sous forme chiffrée.
 - **Scope(s)** : le scope définit les permissions dont disposera votre application ToolJet dans QuickBooks. Vous pouvez modifier les scopes selon votre cas d'usage.
    :::note
    Assurez-vous que les scopes saisis dans la configuration de la source de données ToolJet correspondent exactement aux scopes configurés dans les paramètres de votre application QuickBooks. Toute incohérence entre les scopes configurés et les scopes demandés peut entraîner l'échec du flux d'authentification OAuth ou restreindre l'accès à certaines ressources QuickBooks.
    :::
- **Redirect URI** : ToolJet génère automatiquement un Redirect URI. Cet URI de redirection est nécessaire pour finaliser le flux d'authentification OAuth.
- **Username** : nom d'utilisateur du compte QuickBooks utilisé pour l'authentification, si le flux ou l'environnement configuré le requiert.
- **Password** : mot de passe associé au compte QuickBooks utilisé lors de l'authentification.
- **Company ID** : identifiant unique du compte d'entreprise QuickBooks dont les ressources et les données financières seront accessibles.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/quickbooks/connection.png" alt="Quickbooks Connection page" />

:::info
Pour des instructions détaillées sur la génération du **Client ID** et du **Client Secret**, reportez-vous à la **[documentation QuickBooks](https://developer.intuit.com/app/developer/qbo/docs/get-started/get-client-id-and-client-secret)**.
:::

## Opérations prises en charge

ToolJet prend en charge de nombreuses opérations QuickBooks via des appels REST API, vous permettant de gérer clients, factures, paiements, fournisseurs, comptes, rapports et autres ressources QuickBooks directement au sein de votre application.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/quickbooks/operations.png" alt="Quickbooks supported operations" />

#### COMPANY

Tous les points de terminaison de l'API QuickBooks nécessitent un **Company ID**, qui identifie de manière unique le compte d'entreprise QuickBooks associé à la requête. Les requêtes sont exécutées sur les données de l'entreprise spécifiée.

| Method | API Endpoint            | Description                                                  |
| ------ | ----------------------- | ------------------------------------------------------------ |
| POST | `/v3/company/{companyid}/account` | Mettre à jour un compte |
| GET | `/v3/company/{companyid}/account/{id}` | Lire un compte par Id |
| POST | `/v3/company/{companyid}/query` | Avoir fournisseur - Lire tout |
| POST | `/v3/company/{companyid}/attachable` | Supprimer une pièce jointe |
| GET | `/v3/company/{companyid}/attachable/{id}` | Lire une pièce jointe par Id |
| POST | `/v3/company/{companyid}/upload` | Téléverser des pièces jointes |
| POST | `/v3/company/{companyid}/batch` | Batch |
| POST | `/v3/company/{companyid}/bill` | Supprimer une facture fournisseur |
| GET | `/v3/company/{companyid}/bill/{id}` | Lire une facture fournisseur par Id |
| POST | `/v3/company/{companyid}/billpayment` | Mettre à jour un paiement de facture fournisseur |
| GET | `/v3/company/{companyid}/billpayment/{id}` | Lire un paiement de facture fournisseur par Id |
| GET | `/v3/company/{companyid}/cdc` | Lire les CDC |
| POST | `/v3/company/{companyid}/class` | Supprimer une classe |
| GET | `/v3/company/{companyid}/class/{id}` | Lire une classe par Id |
| GET | `/v3/company/{companyid}/companyinfo/{companyid}` | Lire les infos de l'entreprise par Id |
| POST | `/v3/company/{companyid}/creditmemo` | Supprimer un avoir client |
| GET | `/v3/company/{companyid}/creditmemo/{id}` | Lire un avoir client par Id |
| POST | `/v3/company/{companyid}/customer` | Supprimer un client |
| GET | `/v3/company/{companyid}/customer/{id}` | Lire un client par Id |
| POST | `/v3/company/{companyid}/department` | Supprimer un département |
| GET | `/v3/company/{companyid}/department/{id}` | Lire un département par Id |
| POST | `/v3/company/{companyid}/deposit` | Supprimer un dépôt |
| GET | `/v3/company/{companyid}/deposit/{id}` | Lire un dépôt par Id |
| POST | `/v3/company/{companyid}/employee` | Supprimer un employé |
| GET | `/v3/company/{companyid}/employee/{id}` | Lire un employé par Id |
| POST | `/v3/company/{companyid}/estimate` | Supprimer un devis |
| GET | `/v3/company/{companyid}/estimate/{id}` | Lire un devis par Id |
| GET | `/v3/company/{companyid}/exchangerate` | Obtenir les détails du taux de change |
| POST | `v3/company/{companyid}/inventoryadjustment` | Créer une copie d'ajustement d'inventaire |
| POST | `/v3/company/{companyid}/invoice` | Supprimer une facture |
| GET | `/v3/company/{companyid}/invoice/{id}` | Lire une facture par Id |
| POST | `/v3/company/{companyid}/item` | Supprimer un article |
| GET | `/v3/company/{companyid}/item/<id>` | Lire un article par Id |
| POST | `/v3/company/{companyid}/journalentry` | Supprimer une écriture de journal |
| GET | `/v3/company/{companyid}/journalentry/{id}` | Lire une écriture de journal par Id |
| POST | `/v3/company/{companyid}/payment` | Supprimer un paiement |
| GET | `/v3/company/{companyid}/payment/{id}` | Lire un paiement par Id |
| POST | `/v3/company/{companyid}/paymentmethod` | Supprimer un mode de paiement |
| GET | `/v3/company/{companyid}/paymentmethod/{id}` | Lire un mode de paiement par Id |
| GET | `/v3/company/{companyid}/preferences` | Lire les préférences |
| POST | `/v3/company/{companyid}/preferences` | Mettre à jour les préférences |
| POST | `/v3/company/{companyid}/purchase` | Supprimer un achat |
| GET | `/v3/company/{companyid}/purchase/{id}` | Lire un achat par Id |
| POST | `/v3/company/{companyid}/purchaseorder` | Supprimer un bon de commande |
| GET | `/v3/company/{companyid}/purchaseorder/{id}` | Lire un bon de commande par Id |
| POST | `/v3/company/{companyid}/refundreceipt` | Supprimer un reçu de remboursement |
| GET | `/v3/company/{companyid}/refundreceipt/{id}` | Lire un reçu de remboursement par Id |
| GET | `/v3/company/{companyid}/reports/AccountList` | Rapport - Liste des comptes |
| GET | `/v3/company/{companyid}/reports/AgedPayablesDetail` | Rapport - Détail des dettes échues |
| GET | `/v3/company/{companyid}/reports/AgedPayables` | Rapport - Dettes échues |
| GET | `/v3/company/{companyid}/reports/AgedReceivableDetail` | Rapport - Détail des créances échues |
| GET | `/v3/company/{companyid}/reports/AgedReceivables` | Rapport - Créances échues |
| GET | `/v3/company/{companyid}/reports/BalanceSheet` | Rapport - Bilan |
| GET | `/v3/company/{companyid}/reports/CashFlow` | Rapport - Flux de trésorerie |
| GET | `/v3/company/{companyid}/reports/ClassSales` | Rapport - Ventes par classe |
| GET | `/v3/company/{companyid}/reports/CustomerBalance` | Rapport - Solde client |
| GET | `/v3/company/{companyid}/reports/CustomerBalanceDetail` | Rapport - Détail du solde client |
| GET | `/v3/company/{companyid}/reports/CustomerIncome` | Rapport - Revenu client |
| GET | `/v3/company/{companyid}/reports/CustomerSales` | Rapport - Ventes client |
| GET | `/v3/company/{companyid}/reports/DepartmentSales` | Rapport - Ventes par département |
| GET | `/v3/company/{companyid}/reports/GeneralLedger` | Rapport - Grand livre général |
| GET | `/v3/company/{companyid}/reports/InventoryValuationSummary` | Rapport - Résumé de valorisation des stocks |
| GET | `/v3/company/{companyid}/reports/ItemSales` | Rapport - Ventes par article |
| GET | `/v3/company/{companyid}/reports/ProfitAndLoss` | Rapport - Compte de résultat |
| GET | `/v3/company/{companyid}/reports/ProfitAndLossDetail` | Rapport - Détail du compte de résultat |
| GET | `/v3/company/{companyid}/reports/TrialBalance` | Rapport - Balance générale |
| GET | `/v3/company/{companyid}/reports/TransactionList` | Rapport - Liste des transactions |
| GET | `/v3/company/{companyid}/reports/VendorBalance` | Rapport - Solde fournisseur |
| GET | `/v3/company/{companyid}/reports/VendorBalanceDetail` | Rapport - Détail du solde fournisseur |
| GET | `/v3/company/{companyid}/reports/VendorExpenses` | Rapport - Dépenses fournisseur |
| POST | `/v3/company/{companyid}/salesreceipt` | Annuler un reçu de vente |
| GET | `/v3/company/{companyid}/salesreceipt/{id}` | Lire un reçu de vente par Id |
| POST | `/v3/company/{companyid}/taxagency` | Créer une agence fiscale |
| GET | `/v3/company/{companyid}/taxagency/{id}` | Lire une agence fiscale par Id |
| GET | `/v3/company/{companyid}/taxcode/{id}` | Lire un code de taxe par Id |
| GET | `/v3/company/{companyid}/taxrate/{id}` | Lire un taux de taxe par Id |
| POST | `/v3/company/{companyid}/taxservice/taxcode` | Créer un service de taxe |
| POST | `/v3/company/{companyid}/term` | Supprimer une condition de paiement |
| GET | `/v3/company/{companyid}/term/{id}` | Lire une condition de paiement par Id |
| POST | `/v3/company/{companyid}/timeactivity` | Supprimer une activité horaire |
| POST | `/v3/company/{companyid}/transfer` | Supprimer un transfert |
| GET | `/v3/company/{companyid}/transfer/{id}` | Lire un transfert par Id |
| POST | `/v3/company/{companyid}/vendor` | Supprimer un fournisseur |
| GET | `/v3/company/{companyid}/vendor/{id}` | Lire un fournisseur par Id |
| POST | `/v3/company/{companyid}/vendorcredit` | Supprimer un avoir fournisseur |
| GET | `/v3/company/{companyid}/vendorcredit/{id}` | Lire un avoir fournisseur par Id |

## Exemples de requêtes

### Obtenir les détails d'un compte

Opération : GET `/v3/company/{companyid}/account/{id}`

Cette requête récupère les détails du compte correspondant à l'`id` donné. Elle peut être utilisée pour obtenir des informations telles que le type de compte, le solde, la classification et d'autres métadonnées liées au compte depuis QuickBooks. Le `companyid` n'est pas saisi ici — il est récupéré automatiquement à partir du **Company ID** configuré sur la connexion à la source de données.

**Paramètre requis :** 
- id

**Paramètre optionnel :** 
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

### Mettre à jour un compte

Opération : POST `/v3/company/{companyid}/account`

Cette requête crée ou met à jour un compte dans QuickBooks. Elle peut être utilisée pour modifier des informations de compte existantes telles que le nom du compte, le type de compte, la classification ou d'autres propriétés du compte. Le `companyid` n'est pas saisi ici — il est récupéré automatiquement à partir du **Company ID** configuré sur la connexion à la source de données.

**Paramètres optionnels :** 
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
