---
id: stripe
title: Stripe
---

ToolJet peut se connecter à votre compte Stripe pour lire ou écrire des données de clients et de paiements.

:::info
Consultez le **[tutoriel de l'application Stripe Refund](https://blog.tooljet.com/build-a-stripe-refund-tool-using-low-code/)**
:::

## Connexion

Pour établir une connexion avec la source de données Stripe, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit naviguer vers la page **[Data Sources](/docs/data-sources/overview/)** depuis le tableau de bord ToolJet et choisir Stripe comme source de données.

ToolJet nécessite les éléments suivants pour se connecter à la source de données Stripe.

- **Stripe API key**

<img className="screenshot-full img-full" src="/img/datasource-reference/stripe/connect-v2.png" alt="ToolJet - Data source - Stripe" style={{marginBottom:'15px'}}/>

Vous pouvez obtenir les clés API Stripe depuis votre tableau de bord Stripe. Depuis la page d'accueil du tableau de bord, naviguez vers **Developers**, puis sélectionnez **API keys** dans la barre latérale gauche. Révélez la **Secret key** et copiez-la pour configurer la source de données Stripe dans ToolJet.

<img className="screenshot-full img-full" src="/img/datasource-reference/stripe/dashboard-stripe.png" alt="ToolJet - Data source - Stripe"/>

## Interroger Stripe

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes situé dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **Stripe** ajoutée à l'étape précédente.
3. Sélectionnez l'opération souhaitée dans le menu déroulant et saisissez le paramètre requis.
4. Cliquez sur le bouton **Preview** pour afficher un aperçu du résultat, ou sur le bouton **Run** pour déclencher la requête.

:::tip
Les résultats des requêtes peuvent être transformés à l'aide de transformations. Consultez notre documentation sur les transformations pour voir comment : **[lien](/docs/app-builder/custom-code/transform-data)**
:::

## Opérations prises en charge

Vous pouvez consulter certaines des opérations mentionnées ci-dessous. Toutes les opérations Stripe sont disponibles et peuvent être effectuées depuis ToolJet. Consultez la **[documentation de l'API Stripe](https://stripe.com/docs/api/)** pour des informations détaillées sur chaque opération.

<img className="screenshot-full img-full" src="/img/datasource-reference/stripe/listops.png" alt="Stripe supported operations"/>

<h3 style={{paddingTop: "15px"}}>Opérations sur les comptes</h3>

| **Method** | **Endpoint**  | **Description**          |
| ---------- | ------------- | ------------------------ |
| DELETE     | `/v1/account` | Supprimer un compte        |
| GET        | `/v1/account` | Récupérer les détails du compte |
| POST       | `/v1/account` | Créer ou mettre à jour un compte |

<h3 style={{paddingTop: "15px"}}>Comptes bancaires (Compte)</h3>

| **Method** | **Endpoint**                     | **Description**               |
| ---------- | -------------------------------- | ----------------------------- |
| POST       | `/v1/account/bank_accounts`      | Ajouter un compte bancaire            |
| DELETE     | `/v1/account/bank_accounts/{id}` | Supprimer un compte bancaire         |
| GET        | `/v1/account/bank_accounts/{id}` | Récupérer les détails d'un compte bancaire |
| POST       | `/v1/account/bank_accounts/{id}` | Mettre à jour les détails d'un compte bancaire   |

<h3 style={{paddingTop: "15px"}}>Capabilities (Compte)</h3>

| **Method** | **Endpoint**                            | **Description**               |
| ---------- | --------------------------------------- | ----------------------------- |
| GET        | `/v1/account/capabilities`              | Récupérer les capabilities du compte |
| GET        | `/v1/account/capabilities/{capability}` | Récupérer une capability spécifique  |
| POST       | `/v1/account/capabilities/{capability}` | Mettre à jour une capability spécifique    |

<h3 style={{paddingTop: "15px"}}>Comptes externes (Compte)</h3>

| **Method** | **Endpoint**                         | **Description**                   |
| ---------- | ------------------------------------ | --------------------------------- |
| GET        | `/v1/account/external_accounts`      | Récupérer les comptes externes        |
| POST       | `/v1/account/external_accounts`      | Ajouter un compte externe           |
| DELETE     | `/v1/account/external_accounts/{id}` | Supprimer un compte externe        |
| GET        | `/v1/account/external_accounts/{id}` | Récupérer les détails d'un compte externe |
| POST       | `/v1/account/external_accounts/{id}` | Mettre à jour les détails d'un compte externe   |

<h3 style={{paddingTop: "15px"}}>Personnes (Compte)</h3>

| **Method** | **Endpoint**                  | **Description**            |
| ---------- | ----------------------------- | -------------------------- |
| GET        | `/v1/account/people`          | Récupérer les personnes associées |
| POST       | `/v1/account/people`          | Ajouter une personne au compte    |
| DELETE     | `/v1/account/people/{person}` | Supprimer une personne            |
| GET        | `/v1/account/people/{person}` | Récupérer les détails d'une personne    |
| POST       | `/v1/account/people/{person}` | Mettre à jour les détails d'une personne      |

<h3 style={{paddingTop: "15px"}}>Persons (Compte)</h3>

| **Method** | **Endpoint**                   | **Description**         |
| ---------- | ------------------------------ | ----------------------- |
| POST       | `/v1/account/persons`          | Ajouter une personne            |
| DELETE     | `/v1/account/persons/{person}` | Supprimer une personne         |
| GET        | `/v1/account/persons/{person}` | Récupérer les détails d'une personne |
| POST       | `/v1/account/persons/{person}` | Mettre à jour les détails d'une personne   |

<h3 style={{paddingTop: "15px"}}>Autres opérations sur les comptes</h3>

| **Method** | **Endpoint**              | **Description**               |
| ---------- | ------------------------- | ----------------------------- |
| POST       | `/v1/account/login_links` | Créer un lien de connexion pour un compte |
| POST       | `/v1/account_links`       | Créer des liens de compte          |

<h3 style={{paddingTop: "15px"}}>Opérations sur les comptes (spécifiques)</h3>

| **Method** | **Endpoint**             | **Description**                   |
| ---------- | ------------------------ | --------------------------------- |
| GET        | `/v1/accounts`           | Récupérer la liste des comptes         |
| POST       | `/v1/accounts`           | Créer un nouveau compte              |
| DELETE     | `/v1/accounts/{account}` | Supprimer un compte spécifique         |
| GET        | `/v1/accounts/{account}` | Récupérer les détails d'un compte spécifique |
| POST       | `/v1/accounts/{account}` | Mettre à jour les détails d'un compte spécifique   |

<h3 style={{paddingTop: "15px"}}>Comptes bancaires (spécifiques)</h3>

| **Method** | **Endpoint**                                | **Description**               |
| ---------- | -------------------------------------------- | ----------------------------- |
| POST       | `/v1/accounts/{account}/bank_accounts`      | Ajouter un compte bancaire            |
| DELETE     | `/v1/accounts/{account}/bank_accounts/{id}` | Supprimer un compte bancaire         |
| GET        | `/v1/accounts/{account}/bank_accounts/{id}` | Récupérer les détails d'un compte bancaire |

<h3 style={{paddingTop: "15px"}}>Capabilities (spécifiques)</h3>

| **Method** | **Endpoint**                                       | **Description**                      |
| ---------- | -------------------------------------------------- | ------------------------------------ |
| GET        | `/v1/accounts/{account}/capabilities`              | Récupérer les capabilities du compte        |
| GET        | `/v1/accounts/{account}/capabilities/{capability}` | Récupérer les détails d'une capability spécifique |
| POST       | `/v1/accounts/{account}/capabilities/{capability}` | Mettre à jour une capability spécifique           |

<h3 style={{paddingTop: "15px"}}>Comptes externes (spécifiques)</h3>

| **Method** | **Endpoint**                                    | **Description**                   |
| ---------- | ------------------------------------------------ | --------------------------------- |
| GET        | `/v1/accounts/{account}/external_accounts`      | Récupérer les comptes externes        |
| POST       | `/v1/accounts/{account}/external_accounts`      | Ajouter un compte externe           |
| DELETE     | `/v1/accounts/{account}/external_accounts/{id}` | Supprimer un compte externe        |
| GET        | `/v1/accounts/{account}/external_accounts/{id}` | Récupérer les détails d'un compte externe |

<h3 style={{paddingTop: "15px"}}>Personnes (spécifiques)</h3>

| **Method** | **Endpoint**                             | **Description**            |
| ---------- | ----------------------------------------- | -------------------------- |
| GET        | `/v1/accounts/{account}/people`          | Récupérer les personnes associées |
| POST       | `/v1/accounts/{account}/people`          | Ajouter une personne au compte    |
| DELETE     | `/v1/accounts/{account}/people/{person}` | Supprimer une personne            |
| GET        | `/v1/accounts/{account}/people/{person}` | Récupérer les détails d'une personne    |
| POST       | `/v1/accounts/{account}/people/{person}` | Mettre à jour les détails d'une personne      |

<h3 style={{paddingTop: "15px"}}>Persons (spécifiques)</h3>

| **Method** | **Endpoint**                              | **Description**         |
| ---------- | ------------------------------------------ | ----------------------- |
| POST       | `/v1/accounts/{account}/persons`          | Ajouter une personne            |
| DELETE     | `/v1/accounts/{account}/persons/{person}` | Supprimer une personne         |
| GET        | `/v1/accounts/{account}/persons/{person}` | Récupérer les détails d'une personne |
| POST       | `/v1/accounts/{account}/persons/{person}` | Mettre à jour les détails d'une personne   |

<h3 style={{paddingTop: "15px"}}>Autres opérations spécifiques aux comptes</h3>

| **Method** | **Endpoint**                         | **Description**               |
| ---------- | ------------------------------------- | ----------------------------- |
| POST       | `/v1/accounts/{account}/login_links` | Créer un lien de connexion pour un compte |
| POST       | `/v1/accounts/{account}/reject`      | Rejeter un compte             |

<h3 style={{paddingTop: "15px"}}>Opérations Apple Pay</h3>

| **Method** | **Endpoint**                     | **Description**                    |
| ---------- | --------------------------------- | ---------------------------------- |
| GET        | `/v1/apple_pay/domains`          | Récupérer les domaines Apple Pay         |
| POST       | `/v1/apple_pay/domains`          | Ajouter un domaine à Apple Pay          |
| DELETE     | `/v1/apple_pay/domains/{domain}` | Supprimer un domaine d'Apple Pay     |
| GET        | `/v1/apple_pay/domains/{domain}` | Récupérer un domaine Apple Pay spécifique |

<h3 style={{paddingTop: "15px"}}>Opérations sur les frais d'application</h3>

| **Method** | **Endpoint**                        | **Description**                    |
| ---------- | ------------------------------------- | ---------------------------------- |
| GET        | `/v1/application_fees`              | Récupérer la liste des frais d'application  |
| GET        | `/v1/application_fees/{id}`         | Récupérer un frais d'application spécifique  |
| POST       | `/v1/application_fees/{id}/refund`  | Rembourser un frais d'application          |
| GET        | `/v1/application_fees/{id}/refunds` | Récupérer la liste des remboursements           |
| POST       | `/v1/application_fees/{id}/refunds` | Créer un remboursement pour un frais d'application |

<h3 style={{paddingTop: "15px"}}>Remboursements de frais d'application (spécifiques)</h3>

| **Method** | **Endpoint**                              | **Description**                  |
| ---------- | -------------------------------------------- | -------------------------------- |
| GET        | `/v1/application_fees/{fee}/refunds/{id}` | Récupérer les détails d'un remboursement spécifique |
