---
id: woocommerce
title: WooCommerce
---

ToolJet peut se connecter à des bases de données WooCommerce pour lire et écrire des données.

## Connexion

Pour établir une connexion avec la source de données WooCommerce, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit naviguer vers la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet et choisir WooCommerce comme source de données.

ToolJet nécessite les éléments suivants pour se connecter à WooCommerce

- **Host**
- **Consumer key**
- **Consumer secret**

<img className="screenshot-full img-full" src="/img/datasource-reference/woocommerce/woocomerce-auth-v2.png" alt="ToolJet - Data Source - Woocommerce" />

:::info
NOTE : pour générer des clés, rendez-vous sur le tableau de bord d'administration de WooCommerce ; plus d'informations : https://woocommerce.github.io/woocommerce-rest-api-docs/?javascript#authentication
:::

## Interroger WooCommerce

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes situé dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **WooCommerce** ajoutée à l'étape précédente.
3. Sélectionnez la ressource souhaitée dans le menu déroulant, puis sélectionnez l'opération souhaitée et saisissez les paramètres requis.
4. Cliquez sur le bouton **Preview** pour afficher un aperçu du résultat, ou sur le bouton **Run** pour déclencher la requête.

:::tip
Les résultats des requêtes peuvent être transformés à l'aide de transformations. Consultez notre documentation sur les transformations pour voir comment : **[lien](/docs/app-builder/custom-code/transform-data)**
:::

## Liste des ressources

<img className="screenshot-full img-full" src="/img/datasource-reference/woocommerce/list-resources.png" alt="Woocommerce list resources" />

### Customer

#### Opérations prises en charge

- **List customer** : récupère une liste de tous les clients enregistrés dans la boutique.
- **Update customer** : met à jour les détails d'un client existant.
- **Delete customer** : supprime définitivement un client de la boutique.
- **Batch update customers** : effectue des opérations de création, mise à jour ou suppression en masse sur les clients.
- **Create customer** : crée un nouveau compte client dans WooCommerce.
- **Retrieve customer** : récupère les informations détaillées d'un client spécifique par son ID.

<img className="screenshot-full img-full" src="/img/datasource-reference/woocommerce/customer-query.png" alt="Woocommerce customer querying"  />

### Product

#### Opérations prises en charge

- **List product** : récupère une liste de tous les produits disponibles dans la boutique WooCommerce.
- **Update product** : met à jour les informations d'un produit existant.
- **Delete product** : supprime définitivement un produit de la boutique WooCommerce.
- **Batch update product** : crée, met à jour ou supprime plusieurs produits en une seule requête.
- **Create product** : crée un nouveau produit dans la boutique WooCommerce avec les détails fournis.
- **Retrieve product** : récupère les informations détaillées d'un produit spécifique à l'aide de son ID.

### Order

#### Opérations prises en charge

- **List order** : récupère une liste de toutes les commandes passées dans la boutique.
- **Update order** : met à jour les détails ou le statut d'une commande existante.
- **Delete order** : supprime définitivement une commande de la boutique.
- **Batch update order** : effectue des opérations de création, mise à jour ou suppression en masse sur les commandes.
- **Create order** : crée une nouvelle commande dans la boutique WooCommerce.
- **Retrieve order** : récupère les informations détaillées d'une commande spécifique par son ID.

<img className="screenshot-full img-full" src="/img/datasource-reference/woocommerce/order-query.png" alt="Woocommerce order querying"  />

### Coupon

#### Opérations prises en charge

- **List coupon** : récupère une liste de tous les coupons de réduction disponibles dans la boutique.
- **Create coupon** : crée un nouveau coupon de réduction dans WooCommerce.

<img className="screenshot-full img-full" src="/img/datasource-reference/woocommerce/coupon-query.png" alt="Woocommerce coupon querying"  />

:::info
NOTE : pour plus d'informations, consultez https://woocommerce.github.io/woocommerce-rest-api-docs/?javascript.
:::
