---
id: marketplace-plugin-openai
title: OpenAI
---

ToolJet s'intègre avec OpenAI pour exploiter ses capacités d'IA. Cette intégration permet à ToolJet de générer du texte à partir d'invites (prompts) utilisateur, de faciliter les interactions de chat, de créer des images adaptées à des entrées spécifiques et de générer des embeddings vectoriels.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé la procédure d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour se connecter à OpenAI, les identifiants suivants sont requis :

- **API key** : la clé API pour OpenAI peut être générée [ici](https://platform.openai.com/account/api-keys).
- **Organization ID** : retrouvez l'Organization ID [ici](https://platform.openai.com/account/org-settings).

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/openai/connection-v4.png" alt="Configuring OpenAI in ToolJet" />
</div>

## Opérations prises en charge

- **[Chat](#chat)**
- **[Générer des image(s) IA](#generate-ai-images)**
- **[Générer un embedding](#generate-embedding)**

### Chat

Cette opération analyse l'entrée de l'utilisateur et génère une réponse adaptée qui simule une conversation humaine.

#### Paramètres requis

- **Model** : le modèle à utiliser pour générer la réponse de chat. Les modèles disponibles sont :
    - **GPT-5.2**
    - **GPT-5.1**
    - **GPT-5**
    - **GPT-5 Mini**
    - **GPT-5 Nano**
    - **o4 Mini**
    - **o3**
    - **o3 Mini**
    - **o1**
    - **GPT-4.1**
    - **GPT-4.1 Mini**
    - **GPT-4.1 Nano**
    - **GPT-4**
    - **GPT-4 Turbo**
    - **GPT-4o**
    - **GPT-4o Mini**
    - **GPT-3.5 Turbo**

- **Prompt** : un prompt est le message ou la question initiale fournie en entrée au modèle de chatbot pour démarrer une conversation.

#### Paramètres optionnels

- **Max Tokens** : ce paramètre spécifie le nombre maximal de tokens à générer dans la sortie de complétion de texte. Par exemple, si vous le définissez à 50, il générera une complétion de texte contenant jusqu'à 50 tokens.
- **Temperature** : la temperature est utilisée pour contrôler la créativité et le caractère aléatoire du texte généré. Elle varie de 0 à 2 ; une valeur plus élevée comme 0.8 augmentera le caractère aléatoire de la sortie, tandis qu'une valeur plus faible comme 0.2 la rendra plus ciblée et déterministe.
- **Stop sequence** : ce paramètre de séquence d'arrêt est utilisé pour spécifier quand l'API doit arrêter de générer des complétions de texte. Ce paramètre est optionnel et peut être utilisé pour personnaliser la longueur et la qualité du texte généré.
- **Suffix** : le suffixe qui suit le texte de complétion inséré.

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```yaml
Model: GPT-4 Turbo
Prompt: What are the key principles of machine learning?
Max Tokens: 100
Temperature: 0.7
Stop sequence: END
Suffix: \n
```
</details>

<img className="screenshot-full img-full" src="/img/marketplace/plugins/openai/chat-v4.png" alt="Chat Operation" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
"Machine learning, a subset of artificial intelligence, is fundamentally about designing and implementing algorithms that can learn from and make predictions or decisions based on data. The key principles of machine learning can be outlined as follows:nn1. **Learning from Data**: At its core, machine learning involves developing algorithms that can learn from and make predictions or inferences from data. Models are trained using a large set of data known as training data, which helps them make decisions or predictions without being explicitly programmed for the task.nn2"
```
</details>

### Générer des image(s) IA {#generate-ai-images}

Cette opération génère des images IA à partir du prompt fourni.

#### Paramètres requis

- **Model** : le modèle à utiliser pour générer l'image. Les modèles disponibles sont :
    - **GPT Image 1**
    - **DALL-E 3**
    - **DALL-E 2**
- **Prompt** : le prompt est le message ou la question initiale fournie en entrée au modèle IA pour générer une image.

#### Paramètres optionnels

- **Size (in pixels)** : la taille de l'image à générer, en pixels. La valeur par défaut est 1024x1024. Les tailles autorisées dépendent du modèle :
    - **GPT Image 1** : doit être l'une des valeurs `1792x1024`, `1024x1792` ou `1024x1024`.
    - **DALL-E 2** : doit être l'une des valeurs `256x256`, `512x512` ou `1024x1024`.
    - **DALL-E 3** : doit être l'une des valeurs `1024x1024`, `1792x1024` ou `1024x1792`.

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```yaml
Model: DALL-E 3
Prompt: A futuristic cityscape with flying cars and holographic billboards at sunset
Size(in pixels): 1024x1024
```
</details>

<img className="screenshot-full img-full" src="/img/marketplace/plugins/openai/generate-image-v4.png" alt="Generate AI Images Operation" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "status": "success",
  "message": "Image generated successfully",
  "data": {
    "url": "https://oaidalleapiprodscus.blob.core.windows.net/private/org-CpkCwFjT48kGZ33uOV2L4QxH/user-3QrXKnZO1PJUBeNP6xiQV9Rs/img-XXIds2QvTdcUfcJ2qmNWLwsC.png?st=2024-10-09T10%3A24%3A34Z&se=2024-10-09T12%3A24%3A34Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=d505667d-d6c1-4a0a-bac7-5c84a87759f8&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-10-09T03%3A29%3A32Z&ske=2024-10-10T03%3A29%3A32Z&sks=b&skv=2024-08-04&sig=qPBYkPdQjLwBWJAS8fWmhs3B5TNSYbxhuMe15NcmgM4%3D"
  }
}
```
</details>

### Générer un embedding {#generate-embedding}

Cette opération est utilisée pour générer des embeddings vectoriels à partir du texte fourni, qui peuvent être utilisés pour créer des applications d'IA.

#### Paramètres requis

- **Model** : le modèle à utiliser pour générer l'embedding vectoriel. Les modèles disponibles sont :
    - **text-embedding-3-small**
    - **text-embedding-3-large**
    - **text-embedding-ada-002**

- **Input** : le texte d'entrée utilisé pour générer l'embedding vectoriel.

#### Paramètres optionnels

- **Encoding format** : spécifie le format de sortie de l'embedding vectoriel à partir du menu déroulant, float ou base64.
- **Dimensions** : définit le nombre de valeurs dans le vecteur d'embedding généré, ce qui affecte sa taille et son niveau de détail.

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```yaml
Model: text-embedding-3-large
Input: ToolJet is a low code platform used to build internal tools
Encoding format: Float
Dimensions: 10
```
</details>

<img className="screenshot-full img-full" src="/img/marketplace/plugins/openai/generate-embed.png" alt="Generate Vector Embedding" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "embedding": [
    -0.49750686, -0.7019393, -0.23043627, -0.12421317, -0.076866604, 0.2191516,
    0.2548046, 0.1453106, -0.20050736, 0.10516006
  ]
}
```
</details>
