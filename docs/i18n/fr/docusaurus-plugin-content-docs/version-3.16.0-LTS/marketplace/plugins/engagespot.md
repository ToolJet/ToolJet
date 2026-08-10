---
id: marketplace-plugin-engagespot
title: Engagespot
---

ToolJet se connecte à votre compte Engagespot, vous permettant d'envoyer des notifications, de créer ou de mettre à jour des utilisateurs directement depuis votre application ToolJet.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[utilisation des plugins du Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

- Établissez une connexion à Engagespot en cliquant sur `+Add new Data source` dans le panneau des requêtes ou en accédant à la page [Sources de données](/docs/data-sources/overview/) depuis le tableau de bord ToolJet.
- Saisissez votre clé API et votre secret API Engagespot dans les champs prévus. Pour générer des tokens utilisateur directement depuis ToolJet, vous pouvez éventuellement fournir une clé de signature.
- Cliquez sur **Test Connection** pour valider vos identifiants. Cliquez sur **Save** pour enregistrer la source de données.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/engagespot/connection.png" alt="Engagespot conenction" />

:::info
Vous pouvez changer l'URL de base (BaseURL) d'Engagespot en activant le point de terminaison personnalisé.
:::

## Interroger Engagespot

Cliquez sur le bouton **+ Add** du [gestionnaire de requêtes](/docs/app-builder/connecting-with-data-sources/creating-managing-queries) et sélectionnez la source de données ajoutée à l'étape précédente comme source de données. Sélectionnez l'opération que vous souhaitez effectuer, remplissez les paramètres requis puis cliquez sur le bouton **Run** pour exécuter la requête.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/engagespot/listops.png" alt="engagespot supported operations" />

:::info
Les résultats des requêtes peuvent être transformés à l'aide de transformations. Consultez notre [documentation sur les transformations](/docs/app-builder/custom-code/transform-data).
:::

## Opérations prises en charge

Vous pouvez créer une requête pour la source de données Engagespot afin d'effectuer plusieurs actions telles que :

1. **[Create or Update User](#create-or-update-user)**
2. **[Send Notification](#send-notification)**
3. **[Generate User Token](#generate-user-token)**

### Create OR Update User

#### Paramètre requis

- **User Identifier** - Identifiant unique de l'utilisateur.

#### Paramètre optionnel

- **User Profile JSON** - Objet JSON contenant des attributs supplémentaires de l'utilisateur, comme son e-mail ou son nom, pour la personnalisation des notifications.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/engagespot/create-query.png" alt="engagespot create user" />

:::info
La colonne du profil utilisateur accepte toute paire clé-valeur dans un format d'objet JSON valide.
:::

### Send Notification

#### Paramètres requis

- **Reciepient** - Identifiant unique de l'utilisateur.
- **Notification Title** - Le titre de votre notification.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/engagespot/send-query.png" alt="engagespot send notitication"/>

### Generate User Token

#### Paramètre requis

- **User Identifier** - Identifiant unique de l'utilisateur.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/engagespot/generate-query.png" alt="engagespot generate token" />

:::info
Pour générer des tokens utilisateur, assurez-vous de fournir une clé de signature (Signing Key) lors de l'établissement de la connexion à votre source de données Engagespot.
:::

### Ajouter l'élément In-App Inbox à votre application ToolJet

Pour configurer un élément In-App Inbox dans votre application ToolJet, consultez le guide [Adding In-App](https://docs.engagespot.co/docs/plugins/tooljet/adding-the-inbox-component).
