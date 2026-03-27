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
- Base URL

You can follow the steps in the [Getting Started with UPS APIs](https://developer.ups.com/get-started) guide to generate these credentials.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/ups/connection-v2.png" alt="UPS datasource configuration" />

## Supported Entities

### Shipping

#### Version

| **Method** | **Endpoint** | **Description**  |
| ---------- | --------------| -----------------|
| POST   | `/shipments/{version}/ship`  | Create a new shipment.  |
| DELETE | <div style={{ width:"300px"}}> `/shipments/{version}/void/cancel/{shipmentIdentificationNumber}`  </div> | Cancel a shipment using its shipment ID. |
| POST  | `/labels/{version}/recovery`  | Recover a label for a previously created shipment. |

#### Deprecated Version

| **Method** | **Endpoint**  | **Description**  |
| ---------- | --------------| -----------------|
| POST | `/shipments/{deprecatedversion}/ship`  |  Create shipment using an older API version. |
| DELETE | <div style={{ width:"300px"}}> `/shipments/{deprecatedversion}/void/cancel/{shipmentIdentificationNumber}`  </div> |  Cancel shipment using an older API version. |

### Rating

#### Version

| Method | API Endpoint   | Description  |
| ------ | ----------------------------------- | ------------------------------------------------ |
| POST   | <div style={{ width:"300px"}}> `/rating/{version}/{requestoption}` </div> | Retrieve or calculate shipping rate quotes (UPS) |

#### Deprecated Version

| Method | API Endpoint  | Description  |
| ------ | --------------| ------------ |
| POST   | <div style={{ width:"300px"}}> `/rating/{deprecatedVersion}/{requestoption}` </div> | Retrieve shipping rate quotes using a deprecated UPS API version |

### Tracking

| Method | API Endpoint | Description  |
| ------ | -------------| -------------|
| GET | `/track/v1/details/{inquiryNumber}` | Retrieve shipment tracking details using the tracking (inquiry) number |
| GET | <div style={{ width:"300px"}}> `/track/v1/reference/details/{referenceNumber}` </div> | Retrieve tracking information using a shipment reference number |

### Address Validation

#### Version

| Method | API Endpoint | Description  |
| ------ | -------------| -------------|
| POST   | <div style={{ width:"300px"}}> `/addressvalidation/{version}/{requestoption}` </div> | Validate and verify shipping addresses to ensure accuracy (UPS) |

#### Deprecated Version

| Method | API Endpoint | Description  |
| ------ | -------------| -------------|
| POST | <div style={{ width:"300px"}}> `/addressvalidation/{deprecatedVersion}/{requestoption}` </div> | Validate shipping addresses using a deprecated UPS API version |

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
| DELETE | <div style={{ width:"300px"}}> `/shipments/{deprecatedVersion}/pickup/{CancelBy}` </div> | Cancel a scheduled pickup using a deprecated UPS API version   |
| POST   | <div style={{ width:"300px"}}> `/pickupcreation/{deprecatedVersion}/pickup` </div>       | Create a new pickup request using a deprecated UPS API version |

## Example Queries

### Rating

Operation: POST `/rating/{version}/{requestoption}`

**Required Parameters**

- version
- request option
- request body

**Optional Parameter**

- query

Here's the **Sample Input** query :

```json
{{ {
    "Request": {
        "TransactionReference": {
            "CustomerContext": "CustomerContext",
            "TransactionIdentifier": "TransactionIdentifier"
        }
    },
    "Shipment": {
        "Shipper": {
            "Name": "ShipperName",
            "ShipperNumber": "42334B",
            "Address": {
                "AddressLine": [
                    "ShipperAddressLine",
                    "ShipperAddressLine",
                    "ShipperAddressLine"
                ],
                "City": "TIMONIUM",
                "StateProvinceCode": "MD",
                "PostalCode": "21093",
                "CountryCode": "US"
            }
        },
        "ShipTo": {
            "Name": "ShipToName",
            "Address": {
                "AddressLine": [
                    "ShipToAddressLine",
                    "ShipToAddressLine",
                    "ShipToAddressLine"
                ],
                "City": "Alpharetta",
                "StateProvinceCode": "GA",
                "PostalCode": "30005",
                "CountryCode": "US"
            }
        },
        "ShipFrom": {
            "Name": "ShipFromName",
            "Address": {
                "AddressLine": [
                    "ShipFromAddressLine",
                    "ShipFromAddressLine",
                    "ShipFromAddressLine"
                ],
                "City": "TIMONIUM",
                "StateProvinceCode": "MD",
                "PostalCode": "21093",
                "CountryCode": "US"
            }
        },
        "PaymentDetails": {
            "ShipmentCharge": {
                "Type": "01",
                "BillShipper": {
                    "AccountNumber": "42334B"
                }
            }
        },
        "Service": {
            "Code": "03",
            "Description": "Ground"
        },
        "NumOfPieces": "1",
        "Package": {
            "SimpleRate": {
                "Description": "SimpleRateDescription",
                "Code": "XS"
            },
            "PackagingType": {
                "Code": "02",
                "Description": "Packaging"
            },
            "Dimensions": {
                "UnitOfMeasurement": {
                    "Code": "IN",
                    "Description": "Inches"
                },
                "Length": "5",
                "Width": "5",
                "Height": "5"
            },
            "PackageWeight": {
                "UnitOfMeasurement": {
                    "Code": "LBS",
                    "Description": "Pounds"
                },
                "Weight": "1"
            }
        }
    }
} }}
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/ups/rating-example.png" alt="UPS Rating example query" />

<details id="tj-dropdown">
<summary>**Query Response Example**</summary>
```
{
  "RateResponse": {
    "Response": {
      "ResponseStatus": {
        "Code": "1",
        "Description": "Success"
      },
      "Alert": [
        {
          "Code": "111730",
          "Description": "Changed to today's date"
        }
      ],
      "TransactionReference": {
        "CustomerContext": "CustomerContext",
        "TransactionIdentifier": "0ciewsso760Ta342JlB4kH"
      }
    },
    "RatedShipment": {
      "RatedShipmentAlert": [
        {
          "Code": "110971",
          "Description": "Your invoice may vary from the displayed reference rates"
        }
      ],
      "TransportationCharges": {
        "CurrencyCode": "USD",
        "MonetaryValue": "8.90"
      }
    }
  }
}
```
</details>