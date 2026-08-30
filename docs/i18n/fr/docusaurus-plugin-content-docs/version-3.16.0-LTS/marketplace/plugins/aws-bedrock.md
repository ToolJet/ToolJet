---
id: marketplace-plugin-aws-bedrock
title: AWS Bedrock
---

Utilisez le plugin AWS Bedrock dans ToolJet pour lister les foundation models disponibles et générer du contenu à partir de ceux-ci, directement depuis votre application ToolJet. Cela facilite la création de fonctionnalités basées sur l'IA telles que la génération de texte, le résumé et la classification, avec une configuration minimale.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus [Utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour connecter AWS Bedrock à ToolJet, les identifiants suivants sont requis :
- **Access Key ID**
- **Secret Access Key**
- **Region**
- **Session Token** (requis uniquement lors de l'utilisation d'identifiants temporaires.)

Vous pouvez générer les identifiants requis depuis la console AWS IAM ; consultez le guide [Generate Amazon Bedrock API keys](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html) pour plus d'informations.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/bedrock/connection-v2.png" alt="AWS Bedrock Connection"/>

## Opérations prises en charge

### Generate Content (générer du contenu)

Envoie une entrée au foundation model sélectionné et renvoie la sortie générée en fonction des capacités du modèle (par exemple, génération de texte ou résumé).

**Paramètres requis**

- **Model ID** : l'identifiant du foundation model à utiliser pour la génération de contenu.
- **Request body** : la charge utile envoyée au modèle sélectionné, contenant le prompt ou les données pour la génération.

**Paramètre optionnel**

- **Content-Type** : spécifie le format du corps de la requête, généralement `application/json`.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/bedrock/generate-v2.png" alt="AWS Bedrock query"/>

### List Foundation Models (lister les foundation models)

Récupère tous les foundation models disponibles depuis votre compte AWS Bedrock, y compris l'ID du modèle, le fournisseur et les types d'entrée/sortie pris en charge.

**Paramètres optionnels**

- **Provider** : filtrer les modèles par fournisseur (par exemple, Anthropic, Amazon, Cohere).
- **Customization Type** : filtrer par type de personnalisation, comme les modèles fine-tuned ou de base.
- **Inference Type** : filtrer les modèles selon le mode d'inférence, comme on-demand ou provisioned.
- **Output Modality** : filtrer par type de sortie pris en charge par le modèle, comme texte, embeddings ou images.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/bedrock/list-foundation-v2.png" alt="AWS Bedrock query"/>
