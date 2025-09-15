---
id: marketplace-plugin-fedex
title: FedEx
---

Using this plugin, you can integrate FedEx shipping and tracking services directly into your ToolJet apps to fetch shipment details, create shipping labels, track package status, and calculate rates, etc.

## Connection

To connect the FedEx plugin to your ToolJet app, you’ll need the following credentials:

- Client ID
- Client Secret

If you’re a FedEx® Internal, Compatible, or Integrator Customer or a FedEx® Proprietary Parent/Child Customer, you’ll also need:

- Child Key
- Child Secret

Follow [this](https://developer.fedex.com/api/en-us/catalog/authorization/docs.html) to generate the required credentials from the FedEx Developer Portal.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/fedex/connection.png" alt="Marketplace: FedEx" />

## Supported Operation

### Address Validation

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST   | `/address/v1/addresses/resolve` | Validate and resolve addresses, returning standardized or corrected address information. |

### Ground End of Day Close

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST   | `/ship/v1/endofday/` | Create End of Day Close – submit shipping data to FedEx to close out the day’s shipments. |
| PUT    | `/ship/v1/endofday/` | Modify End of Day Close – update or modify an existing End of Day Close request. |

### Ship Consolidation 

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST   | `/ship/v1/consolidation/` | Create Consolidation – create a new consolidation request. |
| PUT    | `/ship/v1/consolidation/` | Modify Consolidation – update an existing consolidation request. |
| POST   | `/ship/v1/consolidation/shipments` | Add Shipments to Consolidation – add one or more shipments to an existing consolidation. |
| POST   | `/ship/v1/consolidation/results` | Retrieve Consolidation Results – get processing results for a consolidation. |
| POST   | `/ship/v1/consolidation/confirmations` | Submit Consolidation Confirmation – confirm consolidated shipments. |
| POST   | `/ship/v1/consolidation/confirmationresults` | Retrieve Consolidation Confirmation Results – check confirmation status. |
| POST   | `/ship/v1/consolidation/retrieve` | Retrieve Consolidation – fetch an existing consolidation by ID. |
| PUT    | `/ship/v1/consolidation/shipments/delete` | Delete Shipment(s) from Consolidation – remove shipment(s) from an existing consolidation. |
| PUT    | `/ship/v1/consolidation/delete` | Delete Consolidation – delete an entire consolidation record. |

### Open Ship

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST   | `/ship/v1/openshipments/create` | Create Open Shipment – initiate a new open shipment record. |
| PUT    | `/ship/v1/openshipments/` | Update Open Shipment – modify an existing open shipment record. |
| POST   | `/ship/v1/openshipments/` | Create or Submit Open Shipment – submit details to create or finalize an open shipment. |
| PUT    | `/ship/v1/openshipments/packages` | Update Package(s) in Open Shipment – modify package details in an open shipment. |
| POST   | `/ship/v1/openshipments/packages` | Add Package(s) to Open Shipment – add new packages to an existing open shipment. |
| PUT    | `/ship/v1/openshipments/packages/delete` | Delete Package(s) – remove package(s) from an open shipment. |
| POST   | `/ship/v1/openshipments/packages/retrieve` | Retrieve Package(s) – get package details from an open shipment. |
| PUT    | `/ship/v1/openshipments/delete` | Delete Open Shipment – delete an entire open shipment record. |
| POST   | `/ship/v1/openshipments/retrieve` | Retrieve Open Shipment – fetch an existing open shipment record by ID. |
| POST   | `/ship/v1/openshipments/results` | Retrieve Open Shipment Results – get processing results for an open shipment. |

### Pickup

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST   | `/pickup/v1/pickups` | Create Pickup – create a pickup request for a package. |
| POST   | `/pickup/v1/pickups/availabilities` | Check Pickup Availability – retrieve available pickup dates, times, or slots for a location. |
| PUT    | `/pickup/v1/pickups/cancel` | Cancel Pickup – cancel an existing pickup request. |

### Postal Code Validation

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST   | `/country/v1/postal/validate/` | Validate Postal Code – validate and resolve postal/ZIP codes and return standardized or corrected information. |

### Rates and Transit Times

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST   | `/rate/v1/rates/quotes` | Retrieve Rates and Transit Times – get FedEx shipping rate quotes and optional transit time estimates for given shipment details. |

### Ship

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST   | `/ship/v1/shipments` | Create Shipment – create a new shipment, generate label, tracking number, and shipment details. |
| PUT    | `/ship/v1/shipments/cancel` | Cancel Shipment – cancel an existing shipment. |
| POST   | `/ship/v1/shipments/results` | Retrieve Shipment Results – get processing results or labels for a shipment. |
| POST   | `/ship/v1/shipments/packages/validate` | Validate Packages – validate package details before creating a shipment. |
| POST   | `/ship/v1/shipments/tag` | Create Shipment Tag – create a shipment tag for a return or pickup request. |
| PUT    | `/ship/v1/shipments/tag/cancel/{shipmentid}` | Cancel Shipment Tag – cancel a previously created shipment tag. |

### Tracking (Basic Integrated Visibility)

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST   | `/track/v1/associatedshipments` | Retrieve Associated Shipments – fetch shipments linked to a master or related tracking number. |
| POST   | `/track/v1/notifications` | Create Tracking Notifications – set up or retrieve shipment tracking notifications. |
| POST   | `/track/v1/referencenumbers` | Track by Reference Number – retrieve shipment tracking details using reference numbers. |
| POST   | `/track/v1/tcn` | Track by TCN – retrieve tracking details using the Transportation Control Number (TCN). |
| POST   | `/track/v1/trackingdocuments` | Retrieve Tracking Documents – get proof-of-delivery documents or other shipment tracking docs. |
| POST   | `/track/v1/trackingnumbers` | Track by Tracking Number – retrieve shipment status using FedEx tracking numbers. |

### Trade Documents Upload

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST   | `/documents/v1/etds/upload` | Upload eTDS Document – upload a single electronic trade document (ETD) to FedEx. |
| POST   | `/documents/v1/lhsimages/upload` | Upload LHS Image – upload a label or image for LHS processing. |
| POST   | `/documents/v1/etds/multiupload` | Upload Multiple eTDS Documents – upload multiple ETDs in one request. |
| POST   | `/documents/v1/etds/encodedmultiupload` | Upload Base64 Encoded eTDS Documents – upload multiple Base64 encoded ETDs in one request. |

### FedEx Locations Search

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST   | `/location/v1/locations` | Find Locations – search for nearest FedEx locations by address, geographic coordinates, or phone number; optionally filter by location type and services offered. |

### LTL Freight

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST   | `/rate/v1/freight/rates/quotes` | Retrieve Freight LTL Rates – get FedEx LTL freight rate quotes and optional transit time estimates. |
| POST   | `/ship/v1/freight/shipments` | Create Freight LTL Shipment – create a new FedEx LTL freight shipment. |
| POST   | `/pickup/v1/freight/pickups/availabilities` | Check Freight Pickup Availability – retrieve available pickup slots for LTL freight. |
| POST   | `/pickup/v1/freight/pickups/` | Create Freight Pickup – create a pickup request for an LTL freight shipment. |
| PUT    | `/pickup/v1/freight/pickups/cancel/` | Cancel Freight Pickup – cancel an existing LTL freight pickup request. |

### Service Availability

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST   | `/availability/v1/transittimes` | Retrieve Services and Transit Times – get estimated transit times for a particular shipment. |
| POST   | `/availability/v1/packageandserviceoption` | Retrieve Package and Service Options – get available package types and shipping services for a given origin and destination. |
| POST   | `/availability/v1/specialserviceoptions` | Retrieve Special Service Options – get special service options (such as Saturday delivery, signature options, etc.) available for a shipment. |



