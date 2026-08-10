---
id: marketplace-plugin-easypost 
title: EasyPost
---

En utilisant le plugin **EasyPost** dans votre application ToolJet, vous pouvez simplifier la gestion des opérations d'expédition et de logistique telles que l'achat d'étiquettes, le suivi des envois, la vérification des adresses, et plus encore.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[utilisation des plugins du Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour connecter **EasyPost** à ToolJet, vous aurez besoin d'une clé API EasyPost. Suivez ce [guide](https://support.easypost.com/hc/en-us/articles/360004588571-API-Keys) pour générer la clé API requise.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/easypost/connection.png" alt="Marketplace EasyPost Plugin"/>

## Opérations prises en charge

### Addresses

| Méthode | Point de terminaison                       | Description                                    |
| ------ | ------------------------------ | ---------------------------------------------- |
| POST   | `/addresses`                   | Créer une nouvelle adresse.                          |
| GET    | `/addresses/{id}`              | Récupérer une adresse existante par son ID.            |
| POST   | `/addresses/create_and_verify` | Créer et vérifier une adresse en un seul appel. |

### Parcels

| Méthode | Point de terminaison        | Description                                 |
| ------ | --------------- | ------------------------------------------- |
| POST   | `/parcels`      | Créer un colis avec ses dimensions et son poids. |
| GET    | `/parcels/{id}` | Récupérer les détails d'un colis spécifique.      |

### Rates

| Méthode | Point de terminaison | Description                                   |
| ------ | -------- | --------------------------------------------- |
| GET    | `/rates` | Récupérer les tarifs d'expédition disponibles pour les envois. |

### Orders

| Méthode | Point de terminaison           | Description                           |
| ------ | ------------------ | ------------------------------------- |
| POST   | `/orders`          | Créer une nouvelle commande.                   |
| GET    | `/orders`          | Lister toutes les commandes.                      |
| GET    | `/orders/{id}`     | Récupérer les détails d'une commande spécifique. |
| POST   | `/orders/{id}/buy` | Acheter l'envoi d'une commande.         |

### Shipments

| Méthode | Point de terminaison                           | Description                                  |
| ------ | ----------------------------------- | -------------------------------------------- |
| POST   | `/shipments`                       | Créer un envoi.                           |
| GET    | `/shipments`                       | Lister tous les envois.                          |
| GET    | `/shipments/{id}`                  | Récupérer les détails d'un envoi spécifique.     |
| POST   | `/shipments/{id}/buy`              | Acheter l'étiquette d'un envoi.                 |
| POST   | `/shipments/{id}/regenerate_rates` | Régénérer les tarifs pour un envoi.             |
| GET    | `/shipments/{id}/label`            | Récupérer l'étiquette d'un envoi.           |
| POST   | `/shipments/{id}/forms`            | Créer des formulaires (par ex., douane) pour un envoi. |

### Pickups

| Méthode | Point de terminaison               | Description                            |
| ------ | ---------------------- | -------------------------------------- |
| POST   | `/pickups`             | Créer une demande de collecte.               |
| GET    | `/pickups`             | Lister toutes les collectes.                      |
| GET    | `/pickups/{id}`        | Récupérer les détails d'une collecte spécifique. |
| POST   | `/pickups/{id}/buy`    | Acheter une collecte.                          |
| POST   | `/pickups/{id}/cancel` | Annuler une collecte.                       |

### Customs

| Méthode | Point de terminaison             | Description                   |
| ------ | -------------------- | ----------------------------- |
| POST   | `/custom_items`      | Créer un nouvel élément de douane.     |
| GET    | `/custom_items/{id}` | Récupérer un élément de douane.       |
| POST   | `/custom_infos`      | Créer des informations douanières.   |
| GET    | `/custom_infos/{id}` | Récupérer des informations douanières. |

### End Shippers

| Méthode | Point de terminaison             | Description                    |
| ------ | -------------------- | ------------------------------ |
| POST   | `/end_shippers`      | Créer un profil d'expéditeur final. |
| GET    | `/end_shippers/{id}` | Récupérer un expéditeur final par son ID. |

### Reports

| Méthode | Point de terminaison        | Description              |
| ------ | --------------- | ------------------------ |
| POST   | `/reports`      | Créer un nouveau rapport.     |
| GET    | `/reports`      | Lister tous les rapports.        |
| GET    | `/reports/{id}` | Récupérer un rapport par son ID. |

### Batches

| Méthode | Point de terminaison                  | Description                       |
| ------ | ------------------------- | --------------------------------- |
| POST   | `/batches`                | Créer un lot d'envois.      |
| GET    | `/batches`                | Lister tous les lots.                 |
| GET    | `/batches/{id}`           | Récupérer un lot par son ID.           |
| POST   | `/batches/{id}/buy`       | Acheter un lot d'envois.         |
| POST   | `/batches/{id}/label`     | Générer les étiquettes pour un lot.      |
| POST   | `/batches/{id}/scan_form` | Générer un formulaire de scan pour un lot. |

### Carrier Accounts & Types

| Méthode | Point de terminaison                 | Description                       |
| ------ | ------------------------ | --------------------------------- |
| GET    | `/carrier_accounts`      | Lister tous les comptes transporteurs.        |
| GET    | `/carrier_accounts/{id}` | Récupérer un compte transporteur par son ID. |
| GET    | `/carrier_types`         | Lister les types de transporteurs disponibles.     |

### Trackers

| Méthode | Point de terminaison         | Description               |
| ------ | ---------------- | ------------------------- |
| POST   | `/trackers`      | Créer un nouveau tracker.     |
| GET    | `/trackers`      | Lister tous les trackers.        |
| GET    | `/trackers/{id}` | Récupérer un tracker par son ID. |

### Insurance

| Méthode | Point de terminaison          | Description                       |
| ------ | ----------------- | --------------------------------- |
| POST   | `/insurance`      | Créer un nouvel enregistrement d'assurance.    |
| GET    | `/insurance`      | Lister tous les enregistrements d'assurance.       |
| GET    | `/insurance/{id}` | Récupérer les détails d'une assurance par son ID. |

### Events

| Méthode | Point de terminaison       | Description                     |
| ------ | -------------- | ------------------------------- |
| GET    | `/events`      | Lister tous les événements de webhook.        |
| GET    | `/events/{id}` | Récupérer un événement de webhook par son ID. |

## Exemples

### Créer un colis (Parcel)

Pour créer un nouveau colis, utilisez l'opération `POST /parcels` et fournissez l'objet colis dans le corps de la requête.

#### Exemple de corps de requête

```js
{
  "length": "12",
  "width": "8",
  "height": "6",
  "weight": "10.5"
}
```

Cela créera un objet colis qui pourra être référencé ultérieurement lors de la création d'envois ou de commandes.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/easypost/parcel-query.png" alt="Marketplace EasyPost Plugin"/>

<details id="tj-dropdown">
<summary>**Exemple de réponse de la requête**</summary>
```
{
  "id": "prcl_30106aae68104ea6a1e20eb01c927548",
  "object": "Parcel",
  "created_at": "2026-01-28T15:55:03Z",
  "updated_at": "2026-01-28T15:55:03Z",
  "length": 12,
  "width": 8,
  "height": 6,
  "predefined_package": null,
  "weight": 10.5,
  "mode": "test"
}
```
</details>

### Créer un envoi (Shipment)

Pour créer un envoi, utilisez l'opération `POST /shipments` et fournissez l'objet envoi dans le corps de la requête.

#### Exemple de corps de requête

```js
{
  "to_address": {
    "name": "John Doe",
    "street1": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94105",
    "country": "US",
    "phone": "555-123-4567"
  },
  "from_address": {
    "name": "Jane Smith",
    "street1": "456 Oak Ave",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90001",
    "country": "US",
    "phone": "555-987-6543"
  },
  "parcel": {
    "length": 10,
    "width": 5,
    "height": 8,
    "weight": 15.5
  },
  "options": {
    "label_format": "PDF",
    "invoice_number": "INV-12345"
  }
}
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/easypost/shipment-query.png" alt="Marketplace EasyPost Plugin"/>

<details id="tj-dropdown">
<summary>**Exemple de réponse de la requête**</summary>
```
{
  "id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
  "created_at": "2026-01-28T15:58:19Z",
  "is_return": false,
  "messages": [
    {
      "carrier": "UPSDAP",
      "carrier_account_id": "ca_ef958467851f40ea94382ab10d689d3a",
      "type": "rate_error",
      "message": "account_number: none is not an allowed value"
    }
  ],
  "mode": "test",
  "options": {
    "label_format": "PDF",
    "invoice_number": "INV-12345",
    "currency": "USD",
    "payment": {
      "type": "SENDER"
    },
    "date_advance": 0
  },
  "reference": null,
  "status": "unknown",
  "tracking_code": null,
  "updated_at": "2026-01-28T15:58:21Z",
  "batch_id": null,
  "batch_status": null,
  "batch_message": null,
  "customs_info": null,
  "from_address": {
    "id": "adr_022b9a51898111f08a19ac1f6bc53342",
    "object": "Address",
    "created_at": "2026-01-28T15:58:19+00:00",
    "updated_at": "2026-01-28T15:58:19+00:00",
    "name": "Jane Smith",
    "company": null,
    "street1": "456 Oak Ave",
    "street2": null,
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90001",
    "country": "US",
    "phone": "5559876543",
    "email": null,
    "mode": "test",
    "carrier_facility": null,
    "residential": null,
    "federal_tax_id": null,
    "state_tax_id": null,
    "verifications": {}
  },
  "insurance": null,
  "order_id": null,
  "parcel": {
    "id": "prcl_0104a31bbadf4be0a19f9aab1eb61a0a",
    "object": "Parcel",
    "created_at": "2026-01-28T15:58:19Z",
    "updated_at": "2026-01-28T15:58:19Z",
    "length": 10,
    "width": 5,
    "height": 8,
    "predefined_package": null,
    "weight": 15.5,
    "mode": "test"
  },
  "postage_label": null,
  "rates": [
    {
      "id": "rate_53dafadd71634f03a7a56fc1d0b8fada",
      "object": "Rate",
      "created_at": "2026-01-28T15:58:19Z",
      "updated_at": "2026-01-28T15:58:19Z",
      "mode": "test",
      "service": "Express",
      "carrier": "USPS",
      "rate": "34.15",
      "currency": "USD",
      "retail_rate": "39.10",
      "retail_currency": "USD",
      "list_rate": "34.15",
      "list_currency": "USD",
      "billing_type": "easypost",
      "delivery_days": 1,
      "delivery_date": null,
      "delivery_date_guaranteed": false,
      "est_delivery_days": 1,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_c1f2671e8b544eb8b2d9bdfbb56a3f3b"
    },
    {
      "id": "rate_87dcdeb5586a4ef3b210a854effc7637",
      "object": "Rate",
      "created_at": "2026-01-28T15:58:19Z",
      "updated_at": "2026-01-28T15:58:19Z",
      "mode": "test",
      "service": "Priority",
      "carrier": "USPS",
      "rate": "8.19",
      "currency": "USD",
      "retail_rate": "10.90",
      "retail_currency": "USD",
      "list_rate": "9.12",
      "list_currency": "USD",
      "billing_type": "easypost",
      "delivery_days": 2,
      "delivery_date": null,
      "delivery_date_guaranteed": false,
      "est_delivery_days": 2,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_c1f2671e8b544eb8b2d9bdfbb56a3f3b"
    },
    {
      "id": "rate_884f44e916c14689ac463cfbdefdcaf4",
      "object": "Rate",
      "created_at": "2026-01-28T15:58:19Z",
      "updated_at": "2026-01-28T15:58:22Z",
      "mode": "test",
      "service": "GroundAdvantage",
      "carrier": "USPS",
      "rate": "6.30",
      "currency": "USD",
      "retail_rate": "9.70",
      "retail_currency": "USD",
      "list_rate": "6.53",
      "list_currency": "USD",
      "billing_type": "easypost",
      "delivery_days": 2,
      "delivery_date": null,
      "delivery_date_guaranteed": false,
      "est_delivery_days": 2,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_c1f2671e8b544eb8b2d9bdfbb56a3f3b"
    },
    {
      "id": "rate_5875b39ef7ec4e96803314f1cc5724b3",
      "object": "Rate",
      "created_at": "2026-01-28T15:58:22Z",
      "updated_at": "2026-01-28T15:58:22Z",
      "mode": "test",
      "service": "FIRST_OVERNIGHT",
      "carrier": "FedExDefault",
      "rate": "157.26",
      "currency": "USD",
      "retail_rate": null,
      "retail_currency": null,
      "list_rate": "157.26",
      "list_currency": "USD",
      "billing_type": "easypost",
      "delivery_days": 1,
      "delivery_date": "2026-01-29T09:10:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 1,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_eb5a66f608db4248a6ed9ea31e2e0ff2"
    },
    {
      "id": "rate_d23c8352107649c796ca416294f9703e",
      "object": "Rate",
      "created_at": "2026-01-28T15:58:19Z",
      "updated_at": "2026-01-28T15:58:19Z",
      "mode": "test",
      "service": "PRIORITY_OVERNIGHT",
      "carrier": "FedExDefault",
      "rate": "43.09",
      "currency": "USD",
      "retail_rate": null,
      "retail_currency": null,
      "list_rate": "120.45",
      "list_currency": "USD",
      "billing_type": "easypost",
      "delivery_days": 1,
      "delivery_date": "2026-01-29T11:30:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 1,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_eb5a66f608db4248a6ed9ea31e2e0ff2"
    },
    {
      "id": "rate_b0befae2ff004f95969b7a82690ef2c6",
      "object": "Rate",
      "created_at": "2026-01-28T15:58:19Z",
      "updated_at": "2026-01-28T15:58:19Z",
      "mode": "test",
      "service": "STANDARD_OVERNIGHT",
      "carrier": "FedExDefault",
      "rate": "39.96",
      "currency": "USD",
      "retail_rate": null,
      "retail_currency": null,
      "list_rate": "110.95",
      "list_currency": "USD",
      "billing_type": "easypost",
      "delivery_days": 1,
      "delivery_date": "2025-09-05T17:00:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 1,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_eb5a66f608db4248a6ed9ea31e2e0ff2"
    },
    {
      "id": "rate_35eacb6a31db425dbc537e2983ae58cc",
      "object": "Rate",
      "created_at": "2026-01-28T15:58:19Z",
      "updated_at": "2026-01-28T15:58:19Z",
      "mode": "test",
      "service": "FEDEX_2_DAY_AM",
      "carrier": "FedExDefault",
      "rate": "39.09",
      "currency": "USD",
      "retail_rate": null,
      "retail_currency": null,
      "list_rate": "48.30",
      "list_currency": "USD",
      "billing_type": "easypost",
      "delivery_days": 3,
      "delivery_date": "2026-01-30T10:30:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 3,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_eb5a66f608db4248a6ed9ea31e2e0ff2"
    },
    {
      "id": "rate_1d5f09237282402ebd87cb5de104d241",
      "object": "Rate",
      "created_at": "2026-01-28T15:58:19Z",
      "updated_at": "2026-01-28T15:58:19Z",
      "mode": "test",
      "service": "FEDEX_2_DAY",
      "carrier": "FedExDefault",
      "rate": "20.10",
      "currency": "USD",
      "retail_rate": null,
      "retail_currency": null,
      "list_rate": "40.80",
      "list_currency": "USD",
      "billing_type": "easypost",
      "delivery_days": 4,
      "delivery_date": "2026-01-30T14:00:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 4,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_eb5a66f608db4248a6ed9ea31e2e0ff2"
    },
    {
      "id": "rate_cfbeea8ad6d442ceaf0a8afcb41e2147",
      "object": "Rate",
      "created_at": "2026-01-28T15:58:19Z",
      "updated_at": "2026-01-28T15:58:19Z",
      "mode": "test",
      "service": "FEDEX_GROUND",
      "carrier": "FedExDefault",
      "rate": "20.55",
      "currency": "USD",
      "retail_rate": null,
      "retail_currency": null,
      "list_rate": "23.28",
      "list_currency": "USD",
      "billing_type": "easypost",
      "delivery_days": 2,
      "delivery_date": "2026-01-30T17:40:19Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 2,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_eb5a66f608db4248a6ed9ea31e2e0ff2"
    },
    {
      "id": "rate_9a14fea5c30241abac36dd2577feff2d",
      "object": "Rate",
      "created_at": "2026-01-28T15:58:19Z",
      "updated_at": "2026-01-28T15:58:19Z",
      "mode": "test",
      "service": "FEDEX_EXPRESS_SAVER",
      "carrier": "FedExDefault",
      "rate": "18.15",
      "currency": "USD",
      "retail_rate": null,
      "retail_currency": null,
      "list_rate": "37.07",
      "list_currency": "USD",
      "billing_type": "easypost",
      "delivery_days": 5,
      "delivery_date": "2026-01-29T15:58:19Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 5,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_eb5a66f608db4248a6ed9ea31e2e0ff2"
    },
    {
      "id": "rate_689fb275a85f43c5ba83df7356619e2e",
      "object": "Rate",
      "created_at": "2026-01-28T15:58:19Z",
      "updated_at": "2026-01-28T15:58:19ZZ",
      "mode": "test",
      "service": "SMART_POST",
      "carrier": "FedExDefault",
      "rate": "9.71",
      "currency": "USD",
      "retail_rate": null,
      "retail_currency": null,
      "list_rate": "19.99",
      "list_currency": "USD",
      "billing_type": "easypost",
      "delivery_days": 3,
      "delivery_date": "2026-01-30T15:58:19Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 3,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_eb5a66f608db4248a6ed9ea31e2e0ff2"
    },
    {
      "id": "rate_6f21a86890f844e7994cfd045ee7c893",
      "object": "Rate",
      "created_at": "2026-01-28T15:58:19Z",
      "updated_at": "2026-01-28T15:58:19Z",
      "mode": "test",
      "service": "FIRST_OVERNIGHT",
      "carrier": "FedEx",
      "rate": "157.26",
      "currency": "USD",
      "retail_rate": null,
      "retail_currency": null,
      "list_rate": "157.26",
      "list_currency": "USD",
      "billing_type": "carrier",
      "delivery_days": 1,
      "delivery_date": "2026-01-28T15:58:19Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 1,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_0b609d857a3d4328b84922c39d93728e"
    },
    {
      "id": "rate_3283af8eca614c59958c450738621a08",
      "object": "Rate",
      "created_at": "2026-01-28T15:58:19Z",
      "updated_at": "2026-01-28T15:58:19Z",
      "mode": "test",
      "service": "PRIORITY_OVERNIGHT",
      "carrier": "FedEx",
      "rate": "46.55",
      "currency": "USD",
      "retail_rate": null,
      "retail_currency": null,
      "list_rate": "120.45",
      "list_currency": "USD",
      "billing_type": "carrier",
      "delivery_days": 1,
      "delivery_date": "2026-01-29T15:50:19Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 1,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_0b609d857a3d4328b84922c39d93728e"
    },
    {
      "id": "rate_8c52023e7a2f4708a48556b7504e04df",
      "object": "Rate",
      "created_at": "2026-01-28T15:58:19Z",
      "updated_at": "2026-01-28T15:58:19Z",
      "mode": "test",
      "service": "STANDARD_OVERNIGHT",
      "carrier": "FedEx",
      "rate": "43.13",
      "currency": "USD",
      "retail_rate": null,
      "retail_currency": null,
      "list_rate": "110.95",
      "list_currency": "USD",
      "billing_type": "carrier",
      "delivery_days": 1,
      "delivery_date": "2026-01-29T11:28:19Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 1,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_0b609d857a3d4328b84922c39d93728e"
    },
    {
      "id": "rate_2b997ddca0934e8d97ca4db5b73f6afb",
      "object": "Rate",
      "created_at": "2026-01-28T15:58:19Z",
      "updated_at": "2026-01-28T15:58:19Z",
      "mode": "test",
      "service": "FEDEX_2_DAY_AM",
      "carrier": "FedEx",
      "rate": "31.61",
      "currency": "USD",
      "retail_rate": null,
      "retail_currency": null,
      "list_rate": "48.30",
      "list_currency": "USD",
      "billing_type": "carrier",
      "delivery_days": 3,
      "delivery_date": "2026-01-28T10:58:19Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 3,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_0b609d857a3d4328b84922c39d93728e"
    },
    {
      "id": "rate_210d72d23ed04e8bbaedcda329066c79",
      "object": "Rate",
      "created_at": "2026-01-28T15:59:19Z",
      "updated_at": "2026-01-28T15:59:19Z",
      "mode": "test",
      "service": "FEDEX_2_DAY",
      "carrier": "FedEx",
      "rate": "22.09",
      "currency": "USD",
      "retail_rate": null,
      "retail_currency": null,
      "list_rate": "40.80",
      "list_currency": "USD",
      "billing_type": "carrier",
      "delivery_days": 4,
      "delivery_date": "2026-01-31T09:18:19Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 4,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_0b609d857a3d4328b84922c39d93728e"
    },
    {
      "id": "rate_7e43fdca91624dec94d6473a5ad77ffd",
      "object": "Rate",
      "created_at": "2026-01-28T16:01:10Z",
      "updated_at": "2026-01-28T16:01:10Z",
      "mode": "test",
      "service": "FEDEX_GROUND",
      "carrier": "FedEx",
      "rate": "10.78",
      "currency": "USD",
      "retail_rate": null,
      "retail_currency": null,
      "list_rate": "23.28",
      "list_currency": "USD",
      "billing_type": "carrier",
      "delivery_days": 2,
      "delivery_date": "2026-01-30T10:01:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 2,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_0b609d857a3d4328b84922c39d93728e"
    },
    {
      "id": "rate_27dd6d63b8b341139ffe8c2b004d46f8",
      "object": "Rate",
      "created_at": "2026-01-28T16:01:10Z",
      "updated_at": "2026-01-28T16:01:10Z",
      "mode": "test",
      "service": "FEDEX_EXPRESS_SAVER",
      "carrier": "FedEx",
      "rate": "22.23",
      "currency": "USD",
      "retail_rate": null,
      "retail_currency": null,
      "list_rate": "37.07",
      "list_currency": "USD",
      "billing_type": "carrier",
      "delivery_days": 5,
      "delivery_date": "2026-01-31T08:05:10Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 5,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_0b609d857a3d4328b84922c39d93728e"
    }
  ],
  "refund_status": null,
  "scan_form": null,
  "selected_rate": null,
  "tracker": null,
  "to_address": {
    "id": "adr_0228f879898111f08a14ac1f6bc53342",
    "object": "Address",
    "created_at": "2026-01-28T16:02:12Z",
    "updated_at": "2026-01-28T16:02:12Z",
    "name": "John Doe",
    "company": null,
    "street1": "123 Main St",
    "street2": null,
    "city": "San Francisco",
    "state": "CA",
    "zip": "94105",
    "country": "US",
    "phone": "5551234567",
    "email": null,
    "mode": "test",
    "carrier_facility": null,
    "residential": null,
    "federal_tax_id": null,
    "state_tax_id": null,
    "verifications": {}
  },
  "usps_zone": 4,
  "return_address": {
    "id": "adr_022b9a51898111f08a19ac1f6bc53342",
    "object": "Address",
    "created_at": "2026-01-28T16:02:12Z",
    "updated_at": "2026-01-28T16:02:12Z",
    "name": "Jane Smith",
    "company": null,
    "street1": "456 Oak Ave",
    "street2": null,
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90001",
    "country": "US",
    "phone": "5559876543",
    "email": null,
    "mode": "test",
    "carrier_facility": null,
    "residential": null,
    "federal_tax_id": null,
    "state_tax_id": null,
    "verifications": {}
  },
  "buyer_address": {
    "id": "adr_0228f879898111f08a14ac1f6bc53342",
    "object": "Address",
    "created_at": "2026-01-28T16:02:12Z",
    "updated_at": "2026-01-28T16:02:12Z",
    "name": "John Doe",
    "company": null,
    "street1": "123 Main St",
    "street2": null,
    "city": "San Francisco",
    "state": "CA",
    "zip": "94105",
    "country": "US",
    "phone": "5551234567",
    "email": null,
    "mode": "test",
    "carrier_facility": null,
    "residential": null,
    "federal_tax_id": null,
    "state_tax_id": null,
    "verifications": {}
  },
  "forms": [],
  "fees": [],
  "object": "Shipment"
}
```
</details>
