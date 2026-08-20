---
id: marketplace-plugin-portkey
title: Portkey
---

ToolJet peut s'intégrer avec Portkey pour accéder à des services d'IA tels que la complétion de texte, la complétion de chat, la complétion de prompt et la création d'embeddings. Cette intégration permet à ToolJet de tirer parti de la plateforme LMOps de Portkey pour développer, lancer, maintenir et itérer sur des fonctionnalités d'IA générative.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé la procédure d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

<div style={{textAlign: 'center', paddingBottom: '24px'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/portkey/overview.png" alt="Portkey Dashboard Overview" />
</div>

## Connexion

Pour se connecter à Portkey, les identifiants suivants sont requis :

- **API Key** : votre clé API Portkey. Reportez-vous à la **[documentation d'authentification de l'API Portkey](https://docs.portkey.ai/docs/api-reference/authentication#obtaining-your-api-key)** pour savoir comment obtenir votre clé API.

- **Default Virtual Key** (optionnel) : votre clé virtuelle Portkey par défaut. Consultez la **[documentation des clés virtuelles Portkey](https://docs.portkey.ai/docs/product/ai-gateway-streamline-llm-integrations/virtual-keys#creating-virtual-keys)** pour apprendre à créer et récupérer votre clé virtuelle.

- **Config** (optionnel) : votre configuration Portkey par défaut.

- **Gateway URL** (optionnel) : votre URL de Gateway Portkey par défaut. Consultez la **[documentation d'authentification de l'API Portkey](https://docs.portkey.ai/docs/api-reference/authentication#obtaining-your-api-key)** pour savoir comment obtenir votre URL de Gateway.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/portkey/configuration.png" alt="Configuring Portkey in ToolJet" />
</div>

## Opérations prises en charge

Portkey dans ToolJet prend en charge les opérations suivantes :

- **[Completion](#completion)**
- **[Chat](#chat)**
- **[Prompt Completion](#prompt-completion)**
- **[Create Embedding](#create-embedding)**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/portkey/listops.png" alt="Portkey supported operations" />

### Completion

Cette opération génère des complétions de texte à partir d'un prompt donné.

#### Paramètres requis :

- **Prompt** : le texte d'entrée pour lequel générer des complétions.
- **Model** : le modèle d'IA à utiliser.

#### Paramètres optionnels :

- **Max Tokens** : nombre maximal de tokens à générer.
- **Temperature** : contrôle le caractère aléatoire.
- **Stop Sequences** : séquences à partir desquelles l'API arrêtera de générer des tokens supplémentaires.
- **Metadata** : métadonnées supplémentaires pour la requête.
- **Other Parameters** : tout autre paramètre à inclure dans la requête.
- **Config** : objet JSON optionnel permettant de passer une configuration de requête Portkey supplémentaire, comme le cache, le routage, les tentatives (retries) ou les paramètres de timeout.
- **Virtual Key** : la clé API virtuelle Portkey utilisée pour authentifier et acheminer la requête via un fournisseur ou un espace de travail configuré spécifique.

<div style={{textAlign: 'center'}}>
    <img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/marketplace/plugins/portkey/completion-query.png" alt="Completion Operation for Portkey" />
</div>

    <details id="tj-dropdown">
    <summary>**Response Example**</summary>

```json
{
"id": "cmpl-9vNUfM8OP0SwSqXcnPwkqzR7ep8Sy",
"object": "text_completion",
"created": 1723462033,
"model": "gpt-4o-mini",
"choices": [
{
"text": "Write a short LinkedIn post announcing a new AI integration feature in ToolJet. Keep it professional and engaging.",
"index": 0,
"logprobs": null,
"finish_reason": "stop"
}
],
"usage": {
"prompt_tokens": 15,
"completion_tokens": 10,
"total_tokens": 25
}
}
```
</details>

### Chat

Cette opération génère des complétions de chat à partir d'une série de messages.

#### Paramètres requis :

- **Messages** : un tableau d'objets message représentant la conversation.
- **Model** : le modèle d'IA à utiliser.

#### Paramètres opérationnels :

- **Max Tokens** : nombre maximal de tokens à générer.
- **Temperature** : contrôle le caractère aléatoire.
- **Stop Sequence** : séquences à partir desquelles l'API arrêtera de générer des tokens supplémentaires.
- **Metadata** : métadonnées supplémentaires pour la requête.
- **Other Parameters** : tout autre paramètre à inclure dans la requête.

<div style={{textAlign: 'center'}}>
  <img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/marketplace/plugins/portkey/chat-query.png" alt="Chat Operation for Portkey" />
</div>

  <details id="tj-dropdown">
  <summary>**Response Example**</summary>

```json
{
  "id": "chatcmpl-9vNIlfllXOPEmroKFajK2nlJHzhXA",
  "object": "chat.completion",
  "created": 1723461295,
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "user",
        "content": "Developers and product teams.",
        "refusal": null
      },
      "logprobs": null,
      "finish_reason": "end"
    }
  ],
  "usage": {
    "prompt_tokens": 29,
    "completion_tokens": 7,
    "total_tokens": 36
  },
  "system_fingerprint": null
}
```
</details>

### Prompt Completion

Cette opération génère des complétions à partir d'un prompt prédéfini.

#### Paramètre requis :

- **Prompt ID** : l'ID du prompt prédéfini à utiliser.

#### Paramètres optionnels :

- **Variables** : variables à utiliser dans le prompt.
- **Parameters** : paramètres supplémentaires pour la complétion du prompt.
- **Metadata** : métadonnées supplémentaires pour la requête.

<div style={{textAlign: 'center'}}>
  <img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/portkey/prompt-comp-query.png" alt="Prompt Completion Operation for Portkey" />
</div>

  <details id="tj-dropdown">
  <summary>**Response Example**</summary>

```json
{
  "id": "chatcmpl-9w6D8jZciWVf1DzkgqNZK14KUvA4d",
  "object": "chat.completion",
  "created": 1723633926,
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Artificial Intelligence is transforming industries by automating tasks, improving efficiency, and enabling better decision-making through data analysis.",
        "refusal": null
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 145,
    "completion_tokens": 71,
    "total_tokens": 216
  },
  "system_fingerprint": "fp_48196bc67a"
}
```
</details>

### Create Embedding

Cette opération crée des embeddings pour le texte d'entrée fourni.

#### Paramètres requis :

- **Input** : le texte d'entrée pour lequel créer des embeddings.
- **Model** : le modèle d'IA à utiliser pour créer les embeddings.

#### Paramètres optionnels :

- **Metadata** : métadonnées supplémentaires pour la requête.
- **Config** : options de configuration pour la requête.
- **Virtual Key** : une clé virtuelle spécifique à utiliser pour la requête, remplaçant la clé par défaut.

<div style={{textAlign: 'center'}}>
  <img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/portkey/embed-query.png" alt="Create Embedding Operation for Portkey" />
</div>

  <details id="tj-dropdown">
  <summary>**Response Example**</summary>

```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [
        -0.02083237,
        -0.016892163,
        -0.0045676464,
        -0.05084554,
        -0.025968939,
        0.029597048,
        0.029987168,
        0.02907689,
        0.0105982395,
        -0.024356445,
        -0.00935636,
        0.0066352785,
        0.034018397,
        -0.042002838,
        0.03856979,
        -0.014681488,
        ...,
        0.024707552
      ]
    }
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "prompt_tokens": 9,
    "total_tokens": 9
  }
}
```
</details>
