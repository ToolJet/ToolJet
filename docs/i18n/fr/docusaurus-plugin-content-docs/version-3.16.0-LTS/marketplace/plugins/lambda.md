---
id: marketplace-plugin-aws-lambda
title: AWS Lambda
---

ToolJet peut se connecter à AWS Lambda pour exécuter des fonctions serverless.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[Utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Connexion

Pour vous connecter au plugin AWS Lambda, vous avez besoin des identifiants suivants :

- **Access Key ID** : L'access key ID de l'utilisateur IAM disposant des permissions requises pour accéder à AWS Lambda.
- **Secret Access Key** : La secret access key de l'utilisateur IAM disposant des permissions requises pour accéder à AWS Lambda.
- **Region** : La région où AWS Lambda est hébergé.

<div style={{textAlign: 'center'}}>
    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/marketplace/plugins/lambda/connection.png" alt="aws lambda connection" />
</div>

</div>

<div style={{ paddingBottom:'24px'}}>

## Opération prise en charge

### Invoke Lambda Function

Cette query est utilisée pour invoquer une fonction Lambda. Les paramètres suivants sont requis :

- **Function Name** : Le nom de la fonction Lambda à invoquer.
- **Payload** : Le payload JSON à envoyer à la fonction Lambda.

<div style={{textAlign: 'center'}}>
    <img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/lambda/query.png" alt="aws lambda querying" />
</div>

</div>
