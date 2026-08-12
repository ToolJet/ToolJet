---
id: sendgrid
title: SendGrid
---

ToolJet peut se connecter à votre compte SendGrid pour envoyer des e-mails.

<div style={{paddingTop:'24px'}}>

## Connexion

Pour établir une connexion avec la source de données SendGrid, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit naviguer vers la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet.

ToolJet nécessite les éléments suivants pour se connecter à votre base de données SendGrid :
- **SendGrid API key**

<img class="screenshot-full img-full" src="/img/datasource-reference/sendgrid/sendgrid-datasource-v2.png" alt="ToolJet - Data source - SendGrid" />

:::info
La source de données de l'API SendGrid prend en charge l'interaction avec le point de terminaison mail de l'[API SendGrid v3](https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api/authentication).
:::

</div>

<div style={{paddingTop:'24px'}}>

## Interroger SendGrid

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes situé dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **SendGrid** ajoutée à l'étape précédente.
3. Sélectionnez **Email service** dans le menu déroulant et saisissez les paramètres requis.
4. Cliquez sur le bouton **Preview** pour afficher un aperçu du résultat, ou sur le bouton **Run** pour créer et déclencher la requête.

</div>

<div style={{paddingTop:'24px'}}>

## Opérations prises en charge

### Email Service

#### Paramètres requis
- Multiple recipients
- Send email to
- Send email from
- Subject
- Body as text


#### Paramètre optionnel
- Sender Name
- Body as HTML

<img class="screenshot-full img-full" src="/img/datasource-reference/sendgrid/sendGrid-query.png" alt="ToolJet - Query SendGrid"/>


:::info
**Send mail to** - accepte un tableau/une liste d'e-mails séparés par une virgule.
Par exemple :
`{{["dev@tooljet.io", "admin@tooljet.io"]}}`.

**Send mail from** - accepte une chaîne de caractères.
Par exemple : `admin@tooljet.io`
:::

:::tip
**Envoyer un seul e-mail à plusieurs destinataires** - Le champ `Send mail to` peut contenir un tableau de destinataires, ce qui enverra un seul e-mail avec tous les destinataires présents dans le champ.

**Envoyer plusieurs e-mails individuels à plusieurs destinataires** - définissez le champ <b>Multiple recipients</b> sur `{{true}}` et le champ `Send mail to` sera divisé en plusieurs e-mails envoyés à chaque destinataire.
:::

</div>
