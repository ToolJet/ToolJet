---
id: marketplace-plugin-aftership
title: AfterShip
---

L'intégration d'AfterShip avec ToolJet permet aux équipes de créer des outils internes personnalisés pour le suivi et la gestion des expéditions en temps réel. Grâce à cette intégration, vous pouvez récupérer les statuts de livraison, surveiller les mises à jour des transporteurs et centraliser les données logistiques au sein de votre application ToolJet, ce qui simplifie les opérations et améliore l'efficacité du support client.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus [Utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour connecter AfterShip à ToolJet, vous aurez besoin de la clé API, que vous pouvez générer depuis [Aftership Tracking API](https://www.aftership.com/tracking-api).

<img className="screenshot-full img-full" src="/img/marketplace/plugins/aftership/connection-v2.png" alt="Aftership Configuration" style={{ marginBottom:'15px' }} />

## Entités prises en charge
- Shipping (expéditions)
- Tracking (suivi)
- Retours

<img className="screenshot-full img-full" src="/img/marketplace/plugins/aftership/list-entities.png" alt="Aftership supported entities" style={{ marginBottom:'15px'}} />

### Shipping

#### Opérations de suivi de base

<img className="screenshot-full img-full" src="/img/marketplace/plugins/aftership/shipping-ops.png" alt="Aftership supported entities" style={{ marginBottom:'15px'}} />

#### Labels (étiquettes)

| Method | Endpoint       | Description       |
| ------ | -------------- | ----------------- |
| GET    | `/labels`      | Récupérer les étiquettes        |
| POST   | `/labels`      | Créer une étiquette    |
| GET    | `/labels/{id}` | Récupérer une étiquette par ID |

#### Cancel Labels (annulation d'étiquettes)

| Method | Endpoint              | Description                 |
| ------ | --------------------- | --------------------------- |
| GET    | `/cancel-labels`      | Récupérer les étiquettes annulées    |
| POST   | `/cancel-labels`      | Annuler une étiquette              |
| GET    | `/cancel-labels/{id}` | Récupérer une étiquette annulée par ID |

#### Rates (tarifs)

| Method | Endpoint      | Description      |
| ------ | ------------- | ---------------- |
| GET    | `/rates`      | Récupérer les tarifs        |
| POST   | `/rates`      | Calculer les tarifs  |
| GET    | `/rates/{id}` | Récupérer un tarif par ID |

#### Manifests

| Method | Endpoint          | Description          |
| ------ | ----------------- | -------------------- |
| GET    | `/manifests`      | Récupérer les manifestes        |
| POST   | `/manifests`      | Créer un manifeste    |
| GET    | `/manifests/{id}` | Récupérer un manifeste par ID |

#### Couriers (transporteurs)

| Method | Endpoint    | Description      |
| ------ | ----------- | ---------------- |
| GET    | `/couriers` | Récupérer tous les transporteurs |

#### Address Validations (validation d'adresses)

| Method | Endpoint               | Description                  |
| ------ | ---------------------- | ---------------------------- |
| POST   | `/address-validations` | Créer une validation d'adresse |

#### Location (localisation)

| Method | Endpoint     | Description                                 |
| ------ | ------------ | ------------------------------------------- |
| GET    | `/locations` | Récupérer les emplacements des transporteurs (nécessite la production) |

#### Pickup (enlèvement)

| Method | Endpoint        | Description                                          |
| ------ | --------------- | ---------------------------------------------------- |
| GET    | `/pickups`      | Récupérer les enlèvements                                          |
| POST   | `/pickups`      | Créer un enlèvement (FedEx, UPS, DHL Express, Purolator) |
| GET    | `/pickups/{id}` | Récupérer un enlèvement par ID                                   |

#### Cancel Pickups (annulation d'enlèvements)

| Method | Endpoint               | Description                  |
| ------ | ---------------------- | ---------------------------- |
| GET    | `/cancel-pickups`      | Récupérer les enlèvements annulés    |
| POST   | `/cancel-pickups`      | Annuler un enlèvement              |
| GET    | `/cancel-pickups/{id}` | Récupérer un enlèvement annulé par ID |

#### Shipper Accounts (comptes expéditeur)

| Method | Endpoint                             | Description                               |
| ------ | ------------------------------------ | ----------------------------------------- |
| GET    | `/shipper-accounts`                  | Récupérer les comptes expéditeur                      |
| POST   | `/shipper-accounts`                  | Créer un compte expéditeur                  |
| GET    | `/shipper-accounts/{id}`             | Récupérer un compte expéditeur par ID               |
| DELETE | `/shipper-accounts/{id}`             | Supprimer un compte expéditeur                  |
| PUT    | `/shipper-accounts/{id}/info`        | Mettre à jour les informations du compte expéditeur      |
| PUT    | `/shipper-accounts/{id}/credentials` | Mettre à jour les identifiants du compte expéditeur      |
| PUT    | `/shipper-accounts/{id}/settings`    | Mettre à jour les paramètres du compte expéditeur (FedEx) |

### Tracking

#### Opérations de suivi de base

<img className="screenshot-full img-full" src="/img/marketplace/plugins/aftership/tracking-ops.png" alt="Aftership supported entities" style={{ marginBottom:'15px'}} />


| Method | Endpoint     | Description                 |
| ------ | ------------ | --------------------------- |
| GET    | `/trackings` | Récupérer la liste des suivis. |
| POST   | `/trackings` | Créer un nouveau suivi.      |
| GET	 | `/couriers` 	| Récupérer la liste des transporteurs pris en charge. |

#### ID

| Method | Endpoint                            | Description                  |
| ------ | ----------------------------------- | ---------------------------- |
| GET    | `/trackings/{id}`                   | Récupérer un suivi par ID.          |
| PUT    | `/trackings/{id}`                   | Mettre à jour un suivi par ID.       |
| DELETE | `/trackings/{id}`                   | Supprimer un suivi par ID.       |
| POST   | `/trackings/{id}/retrack`           | Relancer un suivi expiré. |
| POST   | `/trackings/{id}/mark-as-completed` | Marquer un suivi comme terminé.  |

#### Detect (détection)

| Method | Endpoint           | Description                        |
| ------ | ------------------ | ---------------------------------- |
| POST   | `/couriers/detect` | Détecter le transporteur à partir du numéro de suivi. |

#### All (tous)

| Method | Endpoint           | Description                        |
| ------ | ------------------ | ---------------------------------- |
| GET    | `/couriers/all`    | Récupérer tous les transporteurs disponibles.        |

#### Predict Batch (prédiction par lot)

| Method | Endpoint                                 | Description                           |
| ------ | ---------------------------------------- | ------------------------------------- |
| POST   | `/estimated-delivery-date/predict-batch` | Prédire la livraison estimée pour un lot. |


### Return (retour)

#### Opérations de suivi de base

<img className="screenshot-full img-full" src="/img/marketplace/plugins/aftership/returns-ops.png" alt="Aftership supported entities" style={{ marginBottom:'15px'}} />

#### Returns Management (gestion des retours)

| Method | Endpoint                    | Description                                  |
| ------ | --------------------------- | -------------------------------------------- |
| GET    | `/returns`                  | Récupérer les retours avec filtrage optionnel          |
| POST   | `/returns`                  | Créer un nouveau retour (prend en charge uniquement "Refund") |
| GET    | `/returns/{return_id}`      | Récupérer le détail d'un retour par ID de retour               |
| GET    | `/returns/rma/{rma_number}` | Récupérer le détail d'un retour par numéro RMA              |

#### Return Status Management (gestion du statut des retours)

| Method | Endpoint                            | Description                  |
| ------ | ----------------------------------- | ---------------------------- |
| POST   | `/returns/{return_id}/approve`      | Approuver un retour par ID de retour  |
| POST   | `/returns/rma/{rma_number}/approve` | Approuver un retour par numéro RMA |
| POST   | `/returns/{return_id}/resolve`      | Résoudre un retour par ID de retour  |
| POST   | `/returns/rma/{rma_number}/resolve` | Résoudre un retour par numéro RMA |
| POST   | `/returns/{return_id}/reject`       | Rejeter un retour par ID de retour   |
| POST   | `/returns/rma/{rma_number}/reject`  | Rejeter un retour par numéro RMA  |

#### Item Management (gestion des articles)

| Method | Endpoint                                    | Description                                    |
| ------ | ------------------------------------------- | ---------------------------------------------- |
| POST   | `/returns/{return_id}/receive-items`        | Enregistrer les articles reçus par ID de retour             |
| POST   | `/returns/rma/{rma_number}/receive-items`   | Enregistrer les articles reçus par numéro RMA            |
| PUT    | `/returns/{return_id}/items/{item_id}`      | Mettre à jour un article de retour (tags/images) par ID de retour  |
| PUT    | `/returns/rma/{rma_number}/items/{item_id}` | Mettre à jour un article de retour (tags/images) par numéro RMA |
| POST   | `/returns/{return_id}/remove-items`         | Supprimer des articles d'un retour par ID de retour          |
| POST   | `/returns/rma/{rma_number}/remove-items`    | Supprimer des articles d'un retour par numéro RMA         |

#### Shipping Management (gestion des expéditions)

| Method | Endpoint                                     | Description                        |
| ------ | -------------------------------------------- | ---------------------------------- |
| POST   | `/returns/{return_id}/attach-shipments`      | Téléverser les informations d'expédition par ID de retour  |
| POST   | `/returns/rma/{rma_number}/attach-shipments` | Téléverser les informations d'expédition par numéro RMA |

#### Dropoff Management (gestion des dépôts)

| Method | Endpoint                                                | Description                            |
| ------ | ------------------------------------------------------- | -------------------------------------- |
| POST   | `/returns/rma/{rma_number}/dropoffs/{dropoff_id}/drops` | Enregistrer les articles déposés (dépôts QR) |

#### Utility Endpoints (endpoints utilitaires)

| Method | Endpoint        | Description                                          |
| ------ | --------------- | ---------------------------------------------------- |
| POST   | `/returns/link` | Générer un lien direct vers la page de retour avec informations pré-remplies |
| GET    | `/item-tags`    | Récupérer tous les tags d'articles disponibles                     |
