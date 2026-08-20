---
id: amazonses
title: Amazon SES
---

ToolJet peut se connecter à votre compte Amazon SES pour envoyer des e-mails.

## Connexion

Pour établir une connexion avec la source de données **Amazon SES**, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit accéder à la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet.

ToolJet requiert les éléments suivants pour se connecter à Amazon SES :

- **Region**
- **Authentication**
- **Access key**
- **Secret key**

Vous pouvez également sélectionner **AWS Instance Credentials** ou **AWS ARN Role** comme méthodes d'authentification dans la liste déroulante. Ces options permettent une authentification via des rôles gérés par AWS, ce qui évite de devoir fournir manuellement des clés d'accès IAM et permet une intégration basée sur la configuration de votre environnement AWS.

**Note :** il est recommandé de créer un nouvel utilisateur IAM pour la base de données afin de pouvoir contrôler les niveaux d'accès de ToolJet.

<img className="screenshot-full img-full" src="/img/datasource-reference/amazonses/connection-v2.png" alt="Amazon SES" />

## Interroger Amazon SES

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **Amazon SES** ajoutée à l'étape précédente.
3. Sélectionnez **Email service** comme opération dans la liste déroulante et saisissez les paramètres requis.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat, ou sur le bouton **Run** pour déclencher la requête.

<img className="screenshot-full img-full" src="/img/datasource-reference/amazonses/awsSES-listops.png" alt="Amazon SES" />

## Opération prise en charge

### Email service

#### Paramètres requis :
- **Send email to**
- **Send email from**
- **Subject**
- **Body**


#### Paramètres optionnels :
- **CC Addresses**
- **BCC Addresses**

<img className="screenshot-full img-full" src="/img/datasource-reference/amazonses/ses-query.png" alt="Amazon SES" />


:::info
**Send mail to** - accepte un tableau/liste d'e-mails séparés par une virgule.
Par exemple :
`{{["dev@tooljet.io", "admin@tooljet.io"]}}`.

**Send mail from** - accepte une chaîne de caractères.
Par exemple : `admin@tooljet.io`
:::

:::tip
**Envoyer un seul e-mail à plusieurs destinataires** - le champ `Send mail to` peut contenir un tableau de destinataires, ce qui permet d'envoyer un seul e-mail à tous les destinataires renseignés dans ce champ.
:::
