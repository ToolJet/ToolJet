---
id: marketplace-plugin-authorizenet
title: Authorize.net
---

ToolJet prend en charge le plugin Authorize.net pour vous aider à accepter des paiements en toute sécurité, gérer les profils clients et exécuter des cycles de paiement de bout en bout directement depuis vos applications. Vous pouvez débiter des cartes, enregistrer des moyens de paiement, gérer les remboursements et annulations, et gérer des profils clients tokenisés sans écrire de code backend.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus [Utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Configuration

Pour configurer le plugin Authorize.net dans ToolJet, vous aurez besoin des identifiants suivants provenant de votre compte Authorize.net :
- **API Login ID**
- **Transaction Key**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/authorizenet/config.png" alt="Authorize.net data source connection" style={{ marginBottom:'15px' }} />

Vous pouvez générer ces identifiants depuis Authorize.net `Merchant Interface → Settings → API Credentials & Keys section`.

## Opérations prises en charge

<img className="screenshot-full img-full" src="/img/marketplace/plugins/authorizenet/listops.png" alt="Authorize.net supported operations"  style={{ marginBottom:'15px' }} />

### Charge a Credit Card (débiter une carte de crédit)

Crée et soumet une transaction auth-and-capture.

**Corps de la requête**

```json
{
  "amount": "5.00",
  "cardNumber": "4007000000027",
  "expirationDate": "2027-04",
  "cardCode": "123",
  "refId": "123456",
  "lineItems": {
    "lineItem": [
      {
        "itemId": "1",
        "name": "Product Name",
        "description": "Product Description",
        "quantity": "1",
        "unitPrice": "5.00"
      }
    ]
  },
  "tax": {
    "amount": "0.50",
    "name": "Sales Tax",
    "description": "State Tax"
  },
  "billTo": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "city": "Seattle",
    "state": "WA",
    "zip": "98101",
    "country": "US"
  }
}
```

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

refId:"123456"
messages : resultCode:"Ok"
           code:"I00001"
           text:"Successful."
transactionResponse : responseCode:"1"
                      authCode:"IS0IR5"
                      avsResultCode:"Y"
                      cvvResultCode:"P"
                      cavvResultCode:"2"
                      transId:"80051037662"
                      refTransID:""
                      transHash:""
                      testRequest:"0"
                      accountNumber:"XXXX0027"
                      accountType:"Visa"

</details>

### Authorize a Credit Card (autoriser une carte de crédit)

Effectue une réservation sur le montant sans capturer les fonds.

**Corps de la requête**

```json
{
  "amount": "5.00",
  "cardNumber": "4111111111111111",
  "expirationDate": "2027-09",
  "cardCode": "123",
  "refId": "123456",
  "lineItems": {
    "lineItem": [
      {
        "itemId": "1",
        "name": "Product Name",
        "description": "Product Description",
        "quantity": "1",
        "unitPrice": "5.00"
      }
    ]
  },
  "tax": {
    "amount": "0.50",
    "name": "Sales Tax",
    "description": "State Tax"
  },
  "billTo": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "city": "Seattle",
    "state": "WA",
    "zip": "98101",
    "country": "US"
  }
}
```

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

refId:"123456"
networkTransId:"BR11UQFRDSM16890455GKA5"
responseCode:"1"
authCode:"XSRDNS"
avsResultCode:"Y"
cvvResultCode:"P"
cavvResultCode:"2"
transId:"80051037939"

</details>

### Capture a Previously Authorized Amount (capturer un montant préalablement autorisé)

Capture les fonds d'une transaction préalablement autorisée.

**Corps de la requête**

```json
{
  "refTransId": "1234567890",
  "amount": "5.00",
  "refId": "123456"
}
```

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

========= ORDER INFORMATION =========
Invoice :
Description : Goods or Services
Amount : 5.00 (USD)
Payment Method: Visa xxxx0027
Transaction Type: Authorization and Capture

</details>

### Refund a Transaction (rembourser une transaction)

Rembourse une transaction préalablement capturée.

**Corps de la requête**

```json
{
  "transId": "80051038433",
  "amount": "1.00",
  "cardNumber": "0015",
  "expirationDate": "XXXX"
}
```

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

============== RESULTS ==============
Response : Refund has been successful.
Auth Code : NRY5S0
Transaction ID : 80051038433

</details>

### Void a Transaction (annuler une transaction)

Annule une transaction non réglée.

**Corps de la requête**

```json
{
  "transId": "12345678",
  "refId": "optional-ref-123",
  "terminalNumber": "optional-terminal"
}
```

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

refId:"optional-ref-123"
resultCode:"Ok"
responseCode:"1"
authCode:"NRY5S0"
avsResultCode:"P"
cvvResultCode:""
cavvResultCode:""
transId:"80051038433"
refTransID:"80051038433"
transHash:""
testRequest:"0"
accountNumber:"XXXX0027"
accountType:"Visa"
transHashSha2:""

</details>

### Charge a Customer Profile (débiter un profil client)

Débite un profil de paiement client enregistré.

**Corps de la requête**

```json
{
  "customerProfileId": "40338125",
  "customerPaymentProfileId": "1000177237",
  "amount": "45.00",
  "refId": "123456",
  "lineItems": {
    "lineItem": [
      {
        "itemId": "1",
        "name": "vase",
        "description": "Cannes logo",
        "quantity": "18",
        "unitPrice": "45.00"
      }
    ]
  }
}
```

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

  "refId": "ref-789456",
  "resultCode": "Ok",
  "responseCode": "1",
  "authCode": "Q8YH72",
  "avsResultCode": "Y",
  "cvvResultCode": "M",
  "cavvResultCode": "",
  "transId": "90081234567",
  "refTransID": "",
  "transHash": "",
  "testRequest": "0",
  "accountNumber": "XXXX0027",
  "accountType": "Visa",
  "messages": "text": "This transaction has been approved."
  "transHashSha2": "",
  "message": "Customer profile charged successfully."

</details>

### Create a Customer Profile (créer un profil client)

Crée un nouveau profil client dans Authorize.net.

**Corps de la requête**

```json
{
  "email": "customer@example.com",
  "description": "Customer Name",
  "merchantCustomerId": "12345"
}
```

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

resultCode:"Ok"
code:"I00001"
text:"Successful."
customerProfileId:"123456"

</details>

### Get Customer Profile (récupérer un profil client)

Récupère les détails d'un profil client existant.

**Corps de la requête**

```json
{
  "customerProfileId": "123456",
  "refId": "ref123",
  "includeIssuerInfo": true
}
```

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

code:"I00001"
text:"Successful."
merchantCustomerId:"12345"
description:"Customer Name"
email:"customer@example.com"
customerProfileId:"123456"
profileType:"regular"

</details>

### Get Customer Profile IDs (récupérer les ID des profils clients)

Récupère tous les ID de profils clients.

- Aucun paramètre requis.

### Update Customer Profile (mettre à jour un profil client)

Met à jour un profil client existant.

**Corps de la requête**

```json
{
  "customerProfileId": "123456",
  "email": "newemail@example.com",
  "description": "Updated Name"
}
```
<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

resultCode:"Ok"
code:"I00001"
text:"Successful."

</details>

### Delete Customer Profile (supprimer un profil client)

Supprime un profil client existant.

**Corps de la requête**

```json
{
  "customerProfileId": "123456"
}
```
<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

resultCode:"Ok"
code:"I00001"
text:"Successful."

</details>

### Create Customer Payment Profile (créer un profil de paiement client)

Crée un nouveau profil de paiement sous un profil client existant.

**Corps de la requête**

```json
{
  "customerProfileId": "123456",
  "cardNumber": "4111111111111111",
  "expirationDate": "2028-10",
  "cardCode": "123",
  "billTo": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "city": "Bellevue",
    "state": "WA",
    "zip": "98004",
    "country": "US",
    "phoneNumber": "000-000-0000"
  },
  "defaultPaymentProfile": false,
  "validationMode": "liveMode"
}
```

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

Invoice : none
Description : Test transaction for ValidateCustomerPaymentProfile.
Amount : 10.00 (USD)
Payment Method: Visa xxxx1111
Transaction Type: Authorization Only
Response : This transaction has been approved.
Auth Code : ABS166

</details>

### Get Customer Payment Profile (récupérer un profil de paiement client)

Récupère les détails d'un profil de paiement spécifique.

**Corps de la requête**

```json
{
  "customerProfileId": "10000",
  "customerPaymentProfileId": "20000",
  "includeIssuerInfo": "true",
  "refId": "get-payment-001"
}
```

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

"refId": "get-payment-001",
  "resultCode": "Ok",
  "customerProfileId": "10000",
  "customerPaymentProfileId": "20000"
 "message": "Customer payment profile retrieved successfully." 

</details>

### Validate Customer Payment Profile (valider un profil de paiement client)

Valide un profil de paiement client enregistré.

**Corps de la requête**

```json
{
  "customerProfileId": "123456",
  "customerPaymentProfileId": "234567",
  "validationMode": "testMode"
}
```

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

"resultCode": "Ok",
  "customerProfileId": "123456",
  "customerPaymentProfileId": "234567"
"code": "I00001",
    "text": "Customer payment profile validation successful."

</details>

### Update Customer Payment Profile (mettre à jour un profil de paiement client)

Met à jour un profil de paiement client existant.

**Corps de la requête**

```json
{
  "customerProfileId": "10000",
  "customerPaymentProfileId": "20000",
  "cardNumber": "4111111111111111",
  "expirationDate": "2029-05",
  "billTo": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St.",
    "city": "Bellevue",
    "state": "WA",
    "zip": "98004",
    "country": "US",
    "phoneNumber": "000-000-0000"
  },
  "defaultPaymentProfile": false,
  "validationMode": "liveMode"
}
```

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

"resultCode": "Ok",
  "customerProfileId": "10000",
  "customerPaymentProfileId": "20000",
  "validationMode": "liveMode"
"message": "Payment profile updated."

</details>

### Delete Customer Payment Profile (supprimer un profil de paiement client)

Supprime un profil de paiement sous un profil client.

**Corps de la requête**

```json
{
  "customerProfileId": "123456",
  "customerPaymentProfileId": "234567",
  "refId": "delete-payment-001"
}
```

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

"code": "I00001",
"text": "Customer payment profile deleted successfully."

</details>

### Create a Customer Profile from a Transaction (créer un profil client à partir d'une transaction)

Crée un profil client et de paiement à partir d'une transaction réussie.

**Corps de la requête**

```json
{
  "transId": "1234567890",
  "customer": {
    "merchantCustomerId": "CUST123",
    "description": "Customer description",
    "email": "customer@example.com"
  },
  "profileType": "regular",
  "refId": "create-profile-001"
}
```

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

"refId": "create-profile-001",
  "resultCode": "Ok",
  "customerProfileId": "987654321"
  "customerPaymentProfileIdList": "555666777"
  "customerShippingAddressIdList":"888999000"
"code": "I00001",
"text": "Customer profile created successfully from transaction."

</details>
