---
id: marketplace-plugin-ups
title: UPS
---

En intégrant UPS avec ToolJet, vous pouvez suivre des colis, calculer des tarifs d'expédition, valider des adresses et automatiser les processus logistiques, tout cela au sein de vos applications ToolJet, afin d'améliorer la visibilité opérationnelle et de réduire les tâches manuelles.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé la procédure d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour vous connecter à UPS, vous avez besoin des identifiants suivants :
- **Client ID**
- **Client secret**
- **Shipper number**

Vous pouvez suivre les étapes du guide [Getting Started with UPS APIs](https://developer.ups.com/get-started) pour générer ces identifiants.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/ups/connection-v2.png" alt="UPS datasource configuration" />

## Entités prises en charge

### Shipping

#### Version

| **Method** | **Endpoint** | **Description**  |
| ---------- | --------------| -----------------|
| POST   | `/shipments/{version}/ship`  | Créer une nouvelle expédition.  |
| DELETE | <div style={{ width:"300px"}}> `/shipments/{version}/void/cancel/{shipmentIdentificationNumber}`  </div> | Annuler une expédition à l'aide de son identifiant d'expédition. |
| POST  | `/labels/{version}/recovery`  | Récupérer une étiquette pour une expédition créée précédemment. |

#### Deprecated Version

| **Method** | **Endpoint**  | **Description**  |
| ---------- | --------------| -----------------|
| POST | `/shipments/{deprecatedversion}/ship`  |  Créer une expédition à l'aide d'une version antérieure de l'API. |
| DELETE | <div style={{ width:"300px"}}> `/shipments/{deprecatedversion}/void/cancel/{shipmentIdentificationNumber}`  </div> |  Annuler une expédition à l'aide d'une version antérieure de l'API. |

### Rating

#### Version

| Method | API Endpoint   | Description  |
| ------ | ----------------------------------- | ------------------------------------------------ |
| POST   | <div style={{ width:"300px"}}> `/rating/{version}/{requestoption}` </div> | Récupérer ou calculer des devis de tarifs d'expédition (UPS) |

#### Deprecated Version

| Method | API Endpoint  | Description  |
| ------ | --------------| ------------ |
| POST   | <div style={{ width:"300px"}}> `/rating/{deprecatedVersion}/{requestoption}` </div> | Récupérer des devis de tarifs d'expédition à l'aide d'une version antérieure de l'API UPS |

### Tracking

| Method | API Endpoint | Description  |
| ------ | -------------| -------------|
| GET | `/track/v1/details/{inquiryNumber}` | Récupérer les détails de suivi d'une expédition à l'aide du numéro de suivi (numéro de demande) |
| GET | <div style={{ width:"300px"}}> `/track/v1/reference/details/{referenceNumber}` </div> | Récupérer les informations de suivi à l'aide d'un numéro de référence d'expédition |

### Address Validation

#### Version

| Method | API Endpoint | Description  |
| ------ | -------------| -------------|
| POST   | <div style={{ width:"300px"}}> `/addressvalidation/{version}/{requestoption}` </div> | Valider et vérifier les adresses d'expédition pour garantir leur exactitude (UPS) |

#### Deprecated Version

| Method | API Endpoint | Description  |
| ------ | -------------| -------------|
| POST | <div style={{ width:"300px"}}> `/addressvalidation/{deprecatedVersion}/{requestoption}` </div> | Valider les adresses d'expédition à l'aide d'une version antérieure de l'API UPS |

### Time In Transit

| Method | API Endpoint | Description |
| ------ | ------------ | ----------- |
| POST   | `/shipments/{version}/{transittimes}` | Récupérer les délais de transit estimés pour les expéditions à l'aide de l'API UPS |

### Pickup

#### Versions

| Method | API Endpoint | Description |
| ------ | ------------ | ----------- |
| POST   | `/shipments/{version}/pickup/{pickuptype}`  | Planifier un enlèvement d'expédition selon le type d'enlèvement                    |
| GET    | `/shipments/{version}/pickup/{pickuptype}`  | Récupérer la disponibilité ou les détails d'un type d'enlèvement spécifique |
| DELETE | `/shipments/{version}/pickup/{CancelBy}`    | Annuler un enlèvement planifié à l'aide d'une méthode d'annulation spécifiée    |
| POST   | `/pickupcreation/{version}/pickup`          | Créer une nouvelle demande d'enlèvement UPS                                    |
| GET    | `/pickup/{version}/countries/{countrycode}` | Obtenir la disponibilité du service d'enlèvement pour un pays donné            |
| POST   | `/pickup/{version}/servicecenterlocations`  | Localiser les centres de service UPS à proximité pour les services d'enlèvement              |

#### Deprecated Version

| Method | API Endpoint | Description |
| ------ | -------------| ------------|
| DELETE | <div style={{ width:"300px"}}> `/shipments/{deprecatedVersion}/pickup/{CancelBy}` </div> | Annuler un enlèvement planifié à l'aide d'une version antérieure de l'API UPS   |
| POST   | <div style={{ width:"300px"}}> `/pickupcreation/{deprecatedVersion}/pickup` </div>       | Créer une nouvelle demande d'enlèvement à l'aide d'une version antérieure de l'API UPS |

## Exemples de requêtes

### Rating

Opération : POST `/rating/{version}/{requestoption}`

**Paramètres requis**

- version
- request option
- request body

**Paramètre optionnel**

- query

Voici la requête d'**exemple d'entrée** :

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
