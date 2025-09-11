---
id: marketplace-plugin-easypost 
title: EasyPost
---

Using the **EasyPost** plugin in your ToolJet application, you can simplify managing shipping and logistics operations such as purchasing labels, tracking shipments, verifying addresses, and more.

## Connection

To connect **EasyPost** with ToolJet, you will need an EasyPost API Key. Follow this [guide](https://support.easypost.com/hc/en-us/articles/360004588571-API-Keys) to generate the required API key.

<img className="screenshot-full img-l" src="/img/marketplace/plugins/easypost/connection.png" alt="Marketplace EasyPost Plugin"/>

## Supported Operations

### Addresses

| Method | Endpoint                       | Description                                    |
| ------ | ------------------------------ | ---------------------------------------------- |
| POST   | `/addresses`                   | Create a new address.                          |
| GET    | `/addresses/{id}`              | Retrieve an existing address by ID.            |
| POST   | `/addresses/create_and_verify` | Create and verify an address in a single call. |

### Parcels

| Method | Endpoint        | Description                                 |
| ------ | --------------- | ------------------------------------------- |
| POST   | `/parcels`      | Create a parcel with dimensions and weight. |
| GET    | `/parcels/{id}` | Retrieve details of a specific parcel.      |

### Rates

| Method | Endpoint | Description                                   |
| ------ | -------- | --------------------------------------------- |
| GET    | `/rates` | Fetch available shipping rates for shipments. |

### Orders

| Method | Endpoint           | Description                           |
| ------ | ------------------ | ------------------------------------- |
| POST   | `/orders`          | Create a new order.                   |
| GET    | `/orders`          | List all orders.                      |
| GET    | `/orders/{id}`     | Retrieve details of a specific order. |
| POST   | `/orders/{id}/buy` | Purchase an order’s shipment.         |

### Shipments

| Method | Endpoint                           | Description                                  |
| ------ | ---------------------------------- | -------------------------------------------- |
| POST   | `/shipments`                       | Create a shipment.                           |
| GET    | `/shipments`                       | List all shipments.                          |
| GET    | `/shipments/{id}`                  | Retrieve details of a specific shipment.     |
| POST   | `/shipments/{id}/buy`              | Purchase a shipment’s label.                 |
| POST   | `/shipments/{id}/regenerate_rates` | Regenerate rates for a shipment.             |
| GET    | `/shipments/{id}/label`            | Retrieve the label for a shipment.           |
| POST   | `/shipments/{id}/forms`            | Create forms (e.g., customs) for a shipment. |

### Pickups

| Method | Endpoint               | Description                            |
| ------ | ---------------------- | -------------------------------------- |
| POST   | `/pickups`             | Create a pickup request.               |
| GET    | `/pickups`             | List all pickups.                      |
| GET    | `/pickups/{id}`        | Retrieve details of a specific pickup. |
| POST   | `/pickups/{id}/buy`    | Buy a pickup.                          |
| POST   | `/pickups/{id}/cancel` | Cancel a pickup.                       |

### Customs

| Method | Endpoint             | Description                   |
| ------ | -------------------- | ----------------------------- |
| POST   | `/custom_items`      | Create a new custom item.     |
| GET    | `/custom_items/{id}` | Retrieve a custom item.       |
| POST   | `/custom_infos`      | Create customs information.   |
| GET    | `/custom_infos/{id}` | Retrieve customs information. |

### End Shippers

| Method | Endpoint             | Description                    |
| ------ | -------------------- | ------------------------------ |
| POST   | `/end_shippers`      | Create an end shipper profile. |
| GET    | `/end_shippers/{id}` | Retrieve an end shipper by ID. |

### Reports

| Method | Endpoint        | Description              |
| ------ | --------------- | ------------------------ |
| POST   | `/reports`      | Create a new report.     |
| GET    | `/reports`      | List all reports.        |
| GET    | `/reports/{id}` | Retrieve a report by ID. |

### Batches

| Method | Endpoint                  | Description                       |
| ------ | ------------------------- | --------------------------------- |
| POST   | `/batches`                | Create a batch of shipments.      |
| GET    | `/batches`                | List all batches.                 |
| GET    | `/batches/{id}`           | Retrieve a batch by ID.           |
| POST   | `/batches/{id}/buy`       | Buy a batch of shipments.         |
| POST   | `/batches/{id}/label`     | Generate labels for a batch.      |
| POST   | `/batches/{id}/scan_form` | Generate a scan form for a batch. |

### Carrier Accounts & Types

| Method | Endpoint                 | Description                       |
| ------ | ------------------------ | --------------------------------- |
| GET    | `/carrier_accounts`      | List all carrier accounts.        |
| GET    | `/carrier_accounts/{id}` | Retrieve a carrier account by ID. |
| GET    | `/carrier_types`         | List available carrier types.     |

### Trackers

| Method | Endpoint         | Description               |
| ------ | ---------------- | ------------------------- |
| POST   | `/trackers`      | Create a new tracker.     |
| GET    | `/trackers`      | List all trackers.        |
| GET    | `/trackers/{id}` | Retrieve a tracker by ID. |

### Insurance

| Method | Endpoint          | Description                       |
| ------ | ----------------- | --------------------------------- |
| POST   | `/insurance`      | Create a new insurance record.    |
| GET    | `/insurance`      | List all insurance records.       |
| GET    | `/insurance/{id}` | Retrieve insurance details by ID. |

### Events

| Method | Endpoint       | Description                     |
| ------ | -------------- | ------------------------------- |
| GET    | `/events`      | List all webhook events.        |
| GET    | `/events/{id}` | Retrieve a webhook event by ID. |

## Examples

### Creating a Parcel

To create a new parcel, use the `POST /parcels` operation and provide the parcel object in the request body.

#### Example Request Body

```js
{
  "length": "10",
  "width": "5",
  "height": "8",
  "weight": "15.5"
}
```

This will create a parcel object that can be referenced later when creating shipments or orders.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/easypost/parcel-object.png" alt="Marketplace EasyPost Plugin"/>

<details id="tj-dropdown">
<summary>**Query Response Example**</summary>
```
{
  "id": "prcl_30106aae68104ea6a1e20eb01c927548",
  "object": "Parcel",
  "created_at": "2025-09-04T11:11:41Z",
  "updated_at": "2025-09-04T11:11:41Z",
  "length": 10,
  "width": 5,
  "height": 8,
  "predefined_package": null,
  "weight": 15.5,
  "mode": "test"
}
```
</details>

### Creating a Shipment

To create a shipment, use the `POST /shipments` operation and provide the shipment object in the request body.

#### Example Request Body

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

<img className="screenshot-full img-full" src="/img/marketplace/plugins/easypost/create-shipment.png" alt="Marketplace EasyPost Plugin"/>

<details id="tj-dropdown">
<summary>**Query Response Example**</summary>
```
{
  "id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
  "created_at": "2025-09-04T11:19:22Z",
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
  "updated_at": "2025-09-04T11:19:24Z",
  "batch_id": null,
  "batch_status": null,
  "batch_message": null,
  "customs_info": null,
  "from_address": {
    "id": "adr_022b9a51898111f08a19ac1f6bc53342",
    "object": "Address",
    "created_at": "2025-09-04T11:19:22+00:00",
    "updated_at": "2025-09-04T11:19:22+00:00",
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
    "created_at": "2025-09-04T11:19:22Z",
    "updated_at": "2025-09-04T11:19:22Z",
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
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "delivery_date": "2025-09-05T08:00:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 1,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_eb5a66f608db4248a6ed9ea31e2e0ff2"
    },
    {
      "id": "rate_d23c8352107649c796ca416294f9703e",
      "object": "Rate",
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "delivery_date": "2025-09-05T10:30:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 1,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_eb5a66f608db4248a6ed9ea31e2e0ff2"
    },
    {
      "id": "rate_b0befae2ff004f95969b7a82690ef2c6",
      "object": "Rate",
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "delivery_date": "2025-09-08T10:30:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 3,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_eb5a66f608db4248a6ed9ea31e2e0ff2"
    },
    {
      "id": "rate_1d5f09237282402ebd87cb5de104d241",
      "object": "Rate",
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "delivery_date": "2025-09-08T17:00:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 4,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_eb5a66f608db4248a6ed9ea31e2e0ff2"
    },
    {
      "id": "rate_cfbeea8ad6d442ceaf0a8afcb41e2147",
      "object": "Rate",
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "delivery_date": "2025-09-08T23:59:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 2,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_eb5a66f608db4248a6ed9ea31e2e0ff2"
    },
    {
      "id": "rate_9a14fea5c30241abac36dd2577feff2d",
      "object": "Rate",
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "delivery_date": "2025-09-09T17:00:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 5,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_eb5a66f608db4248a6ed9ea31e2e0ff2"
    },
    {
      "id": "rate_689fb275a85f43c5ba83df7356619e2e",
      "object": "Rate",
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "delivery_date": "2025-09-09T23:59:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 3,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_eb5a66f608db4248a6ed9ea31e2e0ff2"
    },
    {
      "id": "rate_6f21a86890f844e7994cfd045ee7c893",
      "object": "Rate",
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "delivery_date": "2025-09-05T08:00:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 1,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_0b609d857a3d4328b84922c39d93728e"
    },
    {
      "id": "rate_3283af8eca614c59958c450738621a08",
      "object": "Rate",
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "delivery_date": "2025-09-05T10:30:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 1,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_0b609d857a3d4328b84922c39d93728e"
    },
    {
      "id": "rate_8c52023e7a2f4708a48556b7504e04df",
      "object": "Rate",
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "delivery_date": "2025-09-05T17:00:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 1,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_0b609d857a3d4328b84922c39d93728e"
    },
    {
      "id": "rate_2b997ddca0934e8d97ca4db5b73f6afb",
      "object": "Rate",
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "delivery_date": "2025-09-08T10:30:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 3,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_0b609d857a3d4328b84922c39d93728e"
    },
    {
      "id": "rate_210d72d23ed04e8bbaedcda329066c79",
      "object": "Rate",
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "delivery_date": "2025-09-08T17:00:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 4,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_0b609d857a3d4328b84922c39d93728e"
    },
    {
      "id": "rate_7e43fdca91624dec94d6473a5ad77ffd",
      "object": "Rate",
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "delivery_date": "2025-09-08T23:59:00Z",
      "delivery_date_guaranteed": true,
      "est_delivery_days": 2,
      "shipment_id": "shp_5a60ff01f56e45c18edd5f8a03ba989b",
      "carrier_account_id": "ca_0b609d857a3d4328b84922c39d93728e"
    },
    {
      "id": "rate_27dd6d63b8b341139ffe8c2b004d46f8",
      "object": "Rate",
      "created_at": "2025-09-04T11:19:24Z",
      "updated_at": "2025-09-04T11:19:24Z",
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
      "delivery_date": "2025-09-09T17:00:00Z",
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
    "created_at": "2025-09-04T11:19:22+00:00",
    "updated_at": "2025-09-04T11:19:22+00:00",
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
    "created_at": "2025-09-04T11:19:22+00:00",
    "updated_at": "2025-09-04T11:19:22+00:00",
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
    "created_at": "2025-09-04T11:19:22+00:00",
    "updated_at": "2025-09-04T11:19:22+00:00",
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

