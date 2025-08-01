---
id: marketplace-plugin-ups
title: UPS
---

By integrating UPS with ToolJet you can track packages, calculate shipping rates, validate addresses, and automate logistics processes, all within your ToolJet applications to enhance operational visibility and reduce manual overhead.

## Connection

To connect with UPS you need the following credentials:
- Client ID
- Client secret
- Shipper number

You can follow the steps in the [Getting Staerted with UPS APIs](https://developer.ups.com/get-started) guide to generate these credentials.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/ups/connection.png" alt="UPS Install" />

## Supported Operations

### Shipping

#### Version

| **Method** | **Endpoint**                                                      | **Description**                                    |
| ---------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| POST       | `/shipments/{version}/ship`                                       | Create a new shipment.                             |
| DELETE     | `/shipments/{version}/void/cancel/{shipmentIdentificationNumber}` | Cancel a shipment using its shipment ID.           |
| POST       | `/labels/{version}/recovery`                                      | Recover a label for a previously created shipment. |

#### Deprecated Version

| **Method** | **Endpoint**                                                                | **Description**                                               |
| ---------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| POST       | `/shipments/{deprecatedversion}/ship`                                       |  Create shipment using an older API version. |
| DELETE     | `/shipments/{deprecatedversion}/void/cancel/{shipmentIdentificationNumber}` |  Cancel shipment using an older API version. |
