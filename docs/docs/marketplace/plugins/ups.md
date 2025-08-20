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

| **Method** | **Endpoint**  | **Description**  |
| ---------- | --------------| -----------------|
| POST   | `/shipments/{version}/ship`  | Create a new shipment.  |
| DELETE | `/shipments/{version}/void/cancel/{shipmentIdentificationNumber}` | Cancel a shipment using its shipment ID. |
| POST  | `/labels/{version}/recovery`  | Recover a label for a previously created shipment. |

#### Deprecated Version

| **Method** | **Endpoint**  | **Description**  |
| ---------- | --------------| -----------------|
| POST | `/shipments/{deprecatedversion}/ship`  |  Create shipment using an older API version. |
| DELETE | `/shipments/{deprecatedversion}/void/cancel/{shipmentIdentificationNumber}` |  Cancel shipment using an older API version. |

### Rating

#### Version

| Method | API Endpoint   | Description  |
| ------ | ----------------------------------- | ------------------------------------------------ |
| POST   | `/rating/{version}/{requestoption}` | Retrieve or calculate shipping rate quotes (UPS) |

#### Deprecated Version

| Method | API Endpoint  | Description  |
| ------ | --------------| ------------ |
| POST   | `/rating/{deprecatedVersion}/{requestoption}` | Retrieve shipping rate quotes using a deprecated UPS API version |

### Tracking

| Method | API Endpoint | Description  |
| ------ | -------------| -------------|
| GET | `/track/v1/details/{inquiryNumber}` | Retrieve shipment tracking details using the tracking (inquiry) number |
| GET | `/track/v1/reference/details/{referenceNumber}` | Retrieve tracking information using a shipment reference number |

### Address Validation

#### Version

| Method | API Endpoint | Description  |
| ------ | -------------| -------------|
| POST   | `/addressvalidation/{version}/{requestoption}` | Validate and verify shipping addresses to ensure accuracy (UPS) |

#### Deprecated Version

| Method | API Endpoint | Description  |
| ------ | -------------| -------------|
| POST | `/addressvalidation/{deprecatedVersion}/{requestoption}` | Validate shipping addresses using a deprecated UPS API version |

### Time In Transit

| Method | API Endpoint | Description |
| ------ | ------------ | ----------- |
| POST   | `/shipments/{version}/{transittimes}` | Retrieve estimated transit times for shipments using UPS API |

### Pickup

#### Versions

| Method | API Endpoint | Description |
| ------ | ------------ | ----------- |
| POST   | `/shipments/{version}/pickup/{pickuptype}`  | Schedule a shipment pickup based on pickup type                    |
| GET    | `/shipments/{version}/pickup/{pickuptype}`  | Retrieve pickup availability or details for a specific pickup type |
| DELETE | `/shipments/{version}/pickup/{CancelBy}`    | Cancel a scheduled pickup using a specified cancellation method    |
| POST   | `/pickupcreation/{version}/pickup`          | Create a new UPS pickup request                                    |
| GET    | `/pickup/{version}/countries/{countrycode}` | Get pickup service availability for a specified country            |
| POST   | `/pickup/{version}/servicecenterlocations`  | Locate nearby UPS service centers for pickup services              |

#### Deprecated Version

| Method | API Endpoint | Description |
| ------ | -------------| ------------|
| DELETE | `/shipments/{deprecatedVersion}/pickup/{CancelBy}` | Cancel a scheduled pickup using a deprecated UPS API version   |
| POST   | `/pickupcreation/{deprecatedVersion}/pickup`       | Create a new pickup request using a deprecated UPS API version |

