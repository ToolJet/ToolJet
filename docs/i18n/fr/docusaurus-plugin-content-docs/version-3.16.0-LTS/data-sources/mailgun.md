---
id: mailgun
title: Mailgun
---

ToolJet peut se connecter à votre compte Mailgun pour envoyer des e-mails.

:::info
La source de données API Mailgun permet l'interaction avec le endpoint mail de l'[API Mailgun](https://documentation.mailgun.com/en/latest/api-intro.html#authentication-1).
:::

## Connexion

Pour établir une connexion avec la source de données **Mailgun**, cliquez sur le bouton **+ Add new data source** situé sur le panneau de requêtes, ou accédez à la page [Data Sources](/docs/data-sources/overview) depuis le dashboard de ToolJet.

ToolJet a besoin de l'élément suivant pour se connecter à votre Mailgun :
- **API key**

<img class="screenshot-full img-full" src="/img/datasource-reference/mailgun/mailgun-datasource-v3.png" alt="ToolJet - Data source connection - Mailgun" />

:::tip
La clé API Mailgun est nécessaire pour créer une source de données Mailgun sur ToolJet. Vous pouvez générer une clé API en visitant la [page de compte Mailgun](https://app.mailgun.com/app/account/security/api_keys).
:::

## Opérations prises en charge

### Email Service

#### Paramètres requis :

- **Send email to**
- **Send email from**
- **Subject**
- **Body as text**

#### Paramètres facultatifs :

- **Body as HTML**

<img class="screenshot-full img-full" src="/img/datasource-reference/mailgun/query-v4.png" alt="ToolJet - Data source - Mailgun Query" />

:::info
**Send mail to** - accepte un identifiant d'e-mail unique. 
Par exemple :
`{{"dev@tooljet.io"}}`.

**Send mail from** - accepte une chaîne de caractères.
Par exemple : `admin@tooljet.io`
:::

:::tip
**Envoyer un seul e-mail à plusieurs destinataires** - Le champ `Send mail to` peut contenir un tableau de destinataires, ce qui envoie un seul e-mail à tous les destinataires renseignés dans le champ.

**Envoyer plusieurs e-mails individuels à plusieurs destinataires** - définissez le champ <b>Multiple recipients</b> sur `{{true}}` et le champ `Send mail to` sera scindé en plusieurs e-mails envoyés individuellement à chaque destinataire.
:::
