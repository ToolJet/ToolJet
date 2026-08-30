---
id: marketplace-plugin-fedex
title: FedEx
---

En utilisant ce plugin, vous pouvez intégrer directement les services d'expédition et de suivi FedEx dans vos applications ToolJet pour récupérer les détails des envois, créer des étiquettes d'expédition, suivre le statut des colis et calculer les tarifs, etc.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[utilisation des plugins du Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour connecter le plugin FedEx à votre application ToolJet, vous aurez besoin des identifiants suivants :

- **Client ID**
- **Client Secret**

Si vous êtes un client FedEx® Internal, Compatible, ou Integrator, ou un client FedEx® Proprietary Parent/Child, vous aurez également besoin de :

- **Child Key**
- **Child Secret**

Suivez [ce guide](https://developer.fedex.com/api/en-us/catalog/authorization/docs.html) pour générer les identifiants requis depuis le portail développeur FedEx.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/fedex/connection.png" alt="Marketplace: FedEx" />

## Opérations prises en charge

### Address Validation

| Méthode | Point de terminaison API | Description |
|--------|--------------|--------------|
| POST   | `/address/v1/addresses/resolve` | Valider et résoudre les adresses, en renvoyant des informations d'adresse standardisées ou corrigées. |

### Ground End of Day Close

| Méthode | Point de terminaison API | Description |
|--------|--------------|--------------|
| POST   | `/ship/v1/endofday/` | Créer une clôture de fin de journée (End of Day Close) – soumettre les données d'expédition à FedEx pour clôturer les envois du jour. |
| PUT    | `/ship/v1/endofday/` | Modifier une clôture de fin de journée – mettre à jour ou modifier une demande de clôture de fin de journée existante. |

### Ship Consolidation 

| Méthode | Point de terminaison API | Description |
|--------|--------------|--------------|
| POST   | `/ship/v1/consolidation/` | Créer une consolidation – créer une nouvelle demande de consolidation. |
| PUT    | `/ship/v1/consolidation/` | Modifier une consolidation – mettre à jour une demande de consolidation existante. |
| POST   | `/ship/v1/consolidation/shipments` | Ajouter des envois à une consolidation – ajouter un ou plusieurs envois à une consolidation existante. |
| POST   | `/ship/v1/consolidation/results` | Récupérer les résultats de consolidation – obtenir les résultats du traitement d'une consolidation. |
| POST   | `/ship/v1/consolidation/confirmations` | Soumettre la confirmation de consolidation – confirmer les envois consolidés. |
| POST   | `/ship/v1/consolidation/confirmationresults` | Récupérer les résultats de confirmation de consolidation – vérifier le statut de la confirmation. |
| POST   | `/ship/v1/consolidation/retrieve` | Récupérer une consolidation – récupérer une consolidation existante par son ID. |
| PUT    | `/ship/v1/consolidation/shipments/delete` | Supprimer un/des envoi(s) d'une consolidation – retirer un ou plusieurs envois d'une consolidation existante. |
| PUT    | `/ship/v1/consolidation/delete` | Supprimer une consolidation – supprimer un enregistrement de consolidation complet. |

### Open Ship

| Méthode | Point de terminaison API | Description |
|--------|--------------|--------------|
| POST   | `/ship/v1/openshipments/create` | Créer un envoi ouvert (Open Shipment) – initier un nouvel enregistrement d'envoi ouvert. |
| PUT    | `/ship/v1/openshipments/` | Mettre à jour un envoi ouvert – modifier un enregistrement d'envoi ouvert existant. |
| POST   | `/ship/v1/openshipments/` | Créer ou soumettre un envoi ouvert – soumettre les détails pour créer ou finaliser un envoi ouvert. |
| PUT    | `/ship/v1/openshipments/packages` | Mettre à jour les colis d'un envoi ouvert – modifier les détails des colis d'un envoi ouvert. |
| POST   | `/ship/v1/openshipments/packages` | Ajouter des colis à un envoi ouvert – ajouter de nouveaux colis à un envoi ouvert existant. |
| PUT    | `/ship/v1/openshipments/packages/delete` | Supprimer des colis – retirer un ou plusieurs colis d'un envoi ouvert. |
| POST   | `/ship/v1/openshipments/packages/retrieve` | Récupérer des colis – obtenir les détails des colis d'un envoi ouvert. |
| PUT    | `/ship/v1/openshipments/delete` | Supprimer un envoi ouvert – supprimer un enregistrement d'envoi ouvert complet. |
| POST   | `/ship/v1/openshipments/retrieve` | Récupérer un envoi ouvert – récupérer un enregistrement d'envoi ouvert existant par son ID. |
| POST   | `/ship/v1/openshipments/results` | Récupérer les résultats d'un envoi ouvert – obtenir les résultats du traitement d'un envoi ouvert. |

### Pickup

| Méthode | Point de terminaison API | Description |
|--------|--------------|--------------|
| POST   | `/pickup/v1/pickups` | Créer une collecte – créer une demande de collecte pour un colis. |
| POST   | `/pickup/v1/pickups/availabilities` | Vérifier la disponibilité de collecte – récupérer les dates, heures ou créneaux de collecte disponibles pour un lieu. |
| PUT    | `/pickup/v1/pickups/cancel` | Annuler une collecte – annuler une demande de collecte existante. |

### Postal Code Validation

| Méthode | Point de terminaison API | Description |
|--------|--------------|--------------|
| POST   | `/country/v1/postal/validate/` | Valider un code postal – valider et résoudre les codes postaux et renvoyer des informations standardisées ou corrigées. |

### Rates and Transit Times

| Méthode | Point de terminaison API | Description |
|--------|--------------|--------------|
| POST   | `/rate/v1/rates/quotes` | Récupérer les tarifs et délais de transit – obtenir des devis de tarifs d'expédition FedEx et des estimations de délai de transit optionnelles pour les détails d'un envoi donné. |

### Ship

| Méthode | Point de terminaison API | Description |
|--------|--------------|--------------|
| POST   | `/ship/v1/shipments` | Créer un envoi – créer un nouvel envoi, générer une étiquette, un numéro de suivi et les détails de l'envoi. |
| PUT    | `/ship/v1/shipments/cancel` | Annuler un envoi – annuler un envoi existant. |
| POST   | `/ship/v1/shipments/results` | Récupérer les résultats d'un envoi – obtenir les résultats du traitement ou les étiquettes d'un envoi. |
| POST   | `/ship/v1/shipments/packages/validate` | Valider des colis – valider les détails des colis avant de créer un envoi. |
| POST   | `/ship/v1/shipments/tag` | Créer une étiquette d'envoi (Shipment Tag) – créer une étiquette d'envoi pour une demande de retour ou de collecte. |
| PUT    | `/ship/v1/shipments/tag/cancel/{shipmentid}` | Annuler une étiquette d'envoi – annuler une étiquette d'envoi créée précédemment. |

### Tracking (Basic Integrated Visibility)

| Méthode | Point de terminaison API | Description |
|--------|--------------|--------------|
| POST   | `/track/v1/associatedshipments` | Récupérer les envois associés – récupérer les envois liés à un numéro de suivi principal ou lié. |
| POST   | `/track/v1/notifications` | Créer des notifications de suivi – configurer ou récupérer les notifications de suivi d'un envoi. |
| POST   | `/track/v1/referencenumbers` | Suivre par numéro de référence – récupérer les détails de suivi d'un envoi à l'aide de numéros de référence. |
| POST   | `/track/v1/tcn` | Suivre par TCN – récupérer les détails de suivi à l'aide du numéro de contrôle de transport (TCN). |
| POST   | `/track/v1/trackingdocuments` | Récupérer les documents de suivi – obtenir les preuves de livraison ou d'autres documents de suivi d'envoi. |
| POST   | `/track/v1/trackingnumbers` | Suivre par numéro de suivi – récupérer le statut d'un envoi à l'aide des numéros de suivi FedEx. |

### Trade Documents Upload

| Méthode | Point de terminaison API | Description |
|--------|--------------|--------------|
| POST   | `/documents/v1/etds/upload` | Envoyer un document eTDS – envoyer un document commercial électronique (ETD) unique à FedEx. |
| POST   | `/documents/v1/lhsimages/upload` | Envoyer une image LHS – envoyer une étiquette ou une image pour le traitement LHS. |
| POST   | `/documents/v1/etds/multiupload` | Envoyer plusieurs documents eTDS – envoyer plusieurs ETD en une seule requête. |
| POST   | `/documents/v1/etds/encodedmultiupload` | Envoyer des documents eTDS encodés en Base64 – envoyer plusieurs ETD encodés en Base64 en une seule requête. |

### FedEx Locations Search

| Méthode | Point de terminaison API | Description |
|--------|--------------|--------------|
| POST   | `/location/v1/locations` | Rechercher des emplacements – rechercher les emplacements FedEx les plus proches par adresse, coordonnées géographiques ou numéro de téléphone ; possibilité de filtrer par type d'emplacement et services proposés. |

### LTL Freight

| Méthode | Point de terminaison API | Description |
|--------|--------------|--------------|
| POST   | `/rate/v1/freight/rates/quotes` | Récupérer les tarifs de fret LTL – obtenir des devis de tarifs de fret LTL FedEx et des estimations de délai de transit optionnelles. |
| POST   | `/ship/v1/freight/shipments` | Créer un envoi de fret LTL – créer un nouvel envoi de fret LTL FedEx. |
| POST   | `/pickup/v1/freight/pickups/availabilities` | Vérifier la disponibilité de collecte de fret – récupérer les créneaux de collecte disponibles pour le fret LTL. |
| POST   | `/pickup/v1/freight/pickups/` | Créer une collecte de fret – créer une demande de collecte pour un envoi de fret LTL. |
| PUT    | `/pickup/v1/freight/pickups/cancel/` | Annuler une collecte de fret – annuler une demande de collecte de fret LTL existante. |

### Service Availability

| Méthode | Point de terminaison API | Description |
|--------|--------------|--------------|
| POST   | `/availability/v1/transittimes` | Récupérer les services et délais de transit – obtenir les délais de transit estimés pour un envoi donné. |
| POST   | `/availability/v1/packageandserviceoption` | Récupérer les options de colis et de service – obtenir les types de colis et services d'expédition disponibles pour une origine et une destination données. |
| POST   | `/availability/v1/specialserviceoptions` | Récupérer les options de service spéciales – obtenir les options de service spéciales (comme la livraison le samedi, les options de signature, etc.) disponibles pour un envoi. |

## Exemples de requêtes

### Valider une adresse

Opération : POST `/address/v1/addresses/resolve`

**Paramètre requis**

- addressesToValidate

**Paramètres optionnels**

- EffectAsOfTimestamp
- validateAddressControlParameters

**Exemple d'entrée**

```json
{{[
    {
      "address": {
        "streetLines": ["942 Test Street"],
        "city": "Memphis",
        "stateOrProvinceCode": "TN",
        "postalCode": "38120",
        "countryCode": "US"
      }
    }
  ]}}
```

<details id="tj-dropdown">
<summary>**Exemple de réponse de la requête**</summary>
```
{
  "isLoading": false,
  "data": {
    "transactionId": "APIF_SV_ADVC_TxID3c9aa161-bc90-459e-87f9-b74ba6e18862",
    "output": {
      "alerts": [
        {
          "code": "VIRTUAL.RESPONSE",
          "message": "This is a Virtual Response.",
          "alertType": "NOTE"
        }
      ],
      "resolvedAddresses": [
        {
          "streetLinesToken": [
            "942 TEST STREET"
          ],
          "city": "Memphis",
          "stateOrProvinceCode": "RegiÃ³n Metropolitana de Santia",
          "postalCode": "38120",
          "parsedPostalCode": {
            "base": "38120"
          },
          "countryCode": "CL",
          "classification": "UNKNOWN",
          "ruralRouteHighwayContract": false,
          "generalDelivery": false,
          "customerMessages": [],
          "normalizedStatusNameDPV": false,
          "standardizedStatusNameMatchSource": "Postal",
          "resolutionMethodName": "GENERIC_VALIDATE",
          "attributes": {
            "POBox": "false",
            "SuiteRequiredButMissing": "false",
            "StreetPointNotApplicable": "false",
            "InvalidSuiteNumber": "false",
            "ResolutionInput": "RAW_ADDRESS",
            "ResolutionMethod": "GENERIC_VALIDATE",
            "DataVintage": "February 2023",
            "MatchSource": "Postal",
            "CountrySupported": "true",
            "ValidlyFormed": "true",
            "Matched": "true",
            "StreetOrganizationAddress": "false",
            "MissingOrAmbiguousDirectional": "false",
            "StreetNameAddress": "false",
            "StreetPointNotValidated": "true",
            "Inserted": "false",
            "RuralRoute": "false",
            "PostalDataSource": "Correos de Chile (Chile Postal Authority)",
            "InterpolatedStreetAddress": "false",
            "MultiUnitBase": "false",
            "StreetBuildingAddress": "false",
            "StreetRange": "false",
            "UniqueZIP": "false",
            "StreetAddress": "false",
            "RRConversion": "false",
            "SuiteNotValidated": "false",
            "ValidMultiUnit": "false",
            "AddressType": "STANDARDIZED",
            "AddressPrecision": "StreetName",
            "MultipleMatches": "false"
          }
        }
      ]
    }
  },
  "rawData": {
    "transactionId": "APIF_SV_ADVC_TxID3c9aa161-bc90-459e-87f9-b74ba6e18862",
    "output": {
      "alerts": [
        {
          "code": "VIRTUAL.RESPONSE",
          "message": "This is a Virtual Response.",
          "alertType": "NOTE"
        }
      ],
      "resolvedAddresses": [
        {
          "streetLinesToken": [
            "942 TEST STREET"
          ],
          "city": "Memphis",
          "stateOrProvinceCode": "RegiÃ³n Metropolitana de Santia",
          "postalCode": "38120",
          "parsedPostalCode": {
            "base": "38120"
          },
          "countryCode": "CL",
          "classification": "UNKNOWN",
          "ruralRouteHighwayContract": false,
          "generalDelivery": false,
          "customerMessages": [],
          "normalizedStatusNameDPV": false,
          "standardizedStatusNameMatchSource": "Postal",
          "resolutionMethodName": "GENERIC_VALIDATE",
          "attributes": {
            "POBox": "false",
            "SuiteRequiredButMissing": "false",
            "StreetPointNotApplicable": "false",
            "InvalidSuiteNumber": "false",
            "ResolutionInput": "RAW_ADDRESS",
            "ResolutionMethod": "GENERIC_VALIDATE",
            "DataVintage": "February 2023",
            "MatchSource": "Postal",
            "CountrySupported": "true",
            "ValidlyFormed": "true",
            "Matched": "true",
            "StreetOrganizationAddress": "false",
            "MissingOrAmbiguousDirectional": "false",
            "StreetNameAddress": "false",
            "StreetPointNotValidated": "true",
            "Inserted": "false",
            "RuralRoute": "false",
            "PostalDataSource": "Correos de Chile (Chile Postal Authority)",
            "InterpolatedStreetAddress": "false",
            "MultiUnitBase": "false",
            "StreetBuildingAddress": "false",
            "StreetRange": "false",
            "UniqueZIP": "false",
            "StreetAddress": "false",
            "RRConversion": "false",
            "SuiteNotValidated": "false",
            "ValidMultiUnit": "false",
            "AddressType": "STANDARDIZED",
            "AddressPrecision": "StreetName",
            "MultipleMatches": "false"
          }
        }
      ]
    }
  },
  "id": "5320b5cf-0ac0-4d90-b407-8d6f32018fc2"
}
```
</details>


<img className="screenshot-full img-full" src="/img/marketplace/plugins/fedex/add-validation.png" alt="Marketplace: FedEx" />

### Créer un devis de tarif (Rate Quote)

Opération : POST `/rate/v1/rates/quotes`

**Paramètre requis**
- requesedShipment

**Paramètres optionnels**
- accountNumber
- rateRequestControlParameters
- carrierCodes

**Exemple d'entrée**

```json
{{{
    "shipper": {
      "address": {
        "postalCode": "65247",
        "countryCode": "US"
      }
    },
    "recipient": {
      "address": {
        "postalCode": "72348",
        "countryCode": "US"
      }
    },
    "pickupType": "DROPOFF_AT_FEDEX_LOCATION",
    "rateRequestType": [
      "ACCOUNT",
      "LIST"
    ],
    "requestedPackageLineItems": [
      {
        "weight": {
          "units": "LB",
          "value": "10"
        }
      }
    ]
}}}
```

<details id="tj-dropdown">
<summary>**Exemple de réponse de la requête**</summary>
```
{
  "isLoading": false,
  "data": {
    "transactionId": "0c547414-a28d-45a8-88a5-7d47e5542df1"
  },
  "rawData": {
    "transactionId": "0c547414-a28d-45a8-88a5-7d47e5542df1"
  },
  "id": "5320b5cf-0ac0-4d90-b407-8d6f32018fc2"
}
```
</details>


<img className="screenshot-full img-full" src="/img/marketplace/plugins/fedex/rate-quote.png" alt="Marketplace: FedEx" />
