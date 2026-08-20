---
id: marketplace-plugin-cohere
title: Cohere
---

Cohere peut être intégré à ToolJet pour utiliser ses modèles d'IA avancés pour des tâches telles que la génération de texte ou la création d'un assistant chatbot en configurant des paramètres afin d'optimiser les résultats.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[utilisation des plugins du Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour vous connecter à Cohere, vous aurez besoin du **jeton d'accès (Access token)**, que vous pouvez générer depuis le **[tableau de bord Cohere](https://dashboard.cohere.com/api-keys)**.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/cohere/config.png" alt="Cohere Configuration" />

## Opérations prises en charge

### Génération de texte

Utilisez cette opération pour générer du contenu textuel créatif en sélectionnant le modèle souhaité et en définissant des paramètres supplémentaires.

**Paramètres requis**

- **Model** : Le modèle à utiliser pour générer le texte. Les modèles disponibles sont :
    - command-r7b-12-2024
    - command-r-plus-08-2024
    - command-r-plus-04-2024
    - command-r-plus
    - command-r-08-2024
    - command-r-03-2024
    - command-r
    - command
    - command-nightly
    - command-light
    - command-light-nightly
    - c4ai-aya-expanse-8b
    - c4ai-aya-expanse-32b

- **Message** : L'entrée principale de l'utilisateur pour générer la réponse.

**Paramètre optionnel**

- **Advanced parameters** : Paramètres supplémentaires pour configurer la réponse du modèle. Consultez [Paramètres avancés](#advanced-parameters) pour plus d'informations.

Exemple de paramètres :

```js 
{
    "response_format": {"type": "text"},
    "temperature": 0.3,
    "max_tokens": 512,
    "seed": 3,
    "p": 0.3,
    "k": 1,
    "frequency_penalty": 0.3,
    "presence_penalty": 0.3,
    "citation_options": {"mode": "fast"},
    "safety_mode": "off",
    "stop_sequences": ["spam", "fraud"]
}
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/cohere/text-gen-query.png" alt="Cohere Text generation" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

ToolJet is an open-source no-code platform that allows you to build your own tools and automate your workflows in minutes. It is built on top of the powerful Airbyte open-source standard for data integration, focusing on user-friendliness and extensibility. With ToolJet, you can create custom solutions for your business without any prior coding knowledge.

Here's a high-level overview of the features and capabilities of ToolJet:

1. **No-Code Builder**: ToolJet offers a visual interface where you can quickly create powerful applications, workflows, and automation scripts without writing a single line of code.

2. **Data Integration**: ToolJet leverages Airbyte to provide seamless data integration capabilities. You can sync data from various sources like databases, APIs, or SaaS applications to build custom dashboards, data pipelines, or extensions.

3. **Visual Automation Builder**: Create automated workflows using a drag-and-drop interface. Connect various tools, apps, and APIs to automate tasks, notifications, data manipulation, and more.

4. **Open Source**: Being open-source means you get full transparency over the platform's underlying code. Plus, you can contribute to the project and customize or extend it according to your needs.

5. **Extensions & APIs**: ToolJet provides a marketplace for sharing and discovering extensions, APIs, and pre-built workflows. You can extend the functionality of ToolJet with community-built solutions.

6. **Dashboard & Reports**: Create interactive dashboards and reports using the built-in charting and visualization tools. Visualize data from various sources in one place and share insights with your team.

7. **Forms & UI**: Easily create forms and user interfaces using ToolJet's intuitive form builder. Collect data, feedback, or insights from your users or systems.

8. **Collaboration & Security**: Control user access and permissions with robust security features. Collaborate with team members on different projects and ensure data privacy and compliance.

9. **Integration with External Tools**: ToolJet integrates with popular productivity, collaboration, and data tools, including Slack, Google Workspace, Microsoft Office, Airbyte, and more.

10. **Open API & Extensibility**: ToolJet has a robust application programming interface (API), which allows developers to extend its capabilities. You can customize and connect any external service or application.

ToolJet is a versatile platform that spans several use cases, including business process automation, data management, workflow optimization

</details>

### Chat

Utilisez cette opération pour une conversation de type chat, où le modèle répond en fonction des invites et instructions données. Elle fournit des réponses pertinentes et adaptées au contexte, tout en maintenant un flux de conversation fluide.

**Paramètres requis**

- **Model** : Spécifie le modèle à utiliser pour générer les réponses dans le chat. Les modèles disponibles sont :
    - command-r7b-12-2024
    - command-r-plus-08-2024
    - command-r-plus-04-2024
    - command-r-plus
    - command-r-08-2024
    - command-r-03-2024
    - command-r
    - command
    - command-nightly
    - command-light
    - command-light-nightly
    - c4ai-aya-expanse-8b
    - c4ai-aya-expanse-32b

- **History** : Conserve la trace des interactions précédentes pour maintenir le contexte de la conversation.

- **Message** : L'entrée principale de l'utilisateur pour générer la réponse dans le chat.

**Paramètre optionnel**

- **Advanced parameters** : Paramètres supplémentaires pour configurer la réponse du modèle. Consultez [Paramètres avancés](#advanced-parameters) pour plus d'informations.

```js 
 Advanced parameters :
{
    "response_format": {"type": "text"},
    "temperature": 0.3,
    "max_tokens": 512,
    "seed": 3,
    "p": 0.3,
    "k": 1,
    "frequency_penalty": 0.3,
    "presence_penalty": 0.3,
    "citation_options": {"mode": "fast"},
    "safety_mode": "off",
    "stop_sequences": ["spam", "fraud"]
}
```

**Exemple de paramètres** :

```yaml
History :
[{
  "role": "system",
  "content": "You are an advanced AI support chatbot for ToolJet."
},
 {
"role": "user",
"content": "Hello! I need help with Cohere and ToolJet."
  },
 {
"role": "assistant",
"content": "Hey! Can you please elaborate about your query?"
 }]
```

<img className="screenshot-full" src="/img/marketplace/plugins/cohere/chat-query.png" alt="Cohere Chat" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

ToolJet is a no-code platform that allows you to build custom internal tools with drag and drop functionality. You can integrate Cohere with ToolJet to enable an added advantage of AI features in your apps built on ToolJet. 

To integrate Cohere AI into your ToolJet app, you should have a Cohere AI API key. If you don't have one, you can sign up for a free Cohere AI account and get your API key. 

As a next step, you can refer to our documentation to see a step-by-step guide to integrate Cohere AI with ToolJet. If you have any further questions, please let me know!

</details>

## Paramètres avancés {#advanced-parameters}

| Paramètre| Description |
|----------|-------------|
| Response Format | Configure le modèle pour fournir une sortie dans le format spécifié. |
| Temperature | Contrôle le degré d'aléatoire de la sortie. |
| Max Tokens | Le nombre maximal de tokens que le modèle générera dans le cadre de la réponse. |
| Seed | Défini pour garantir des résultats cohérents en initialisant le générateur. |
| P | Utilisé pour limiter l'aléatoire en définissant un seuil de probabilité. |
| K | Définit l'utilisation des k tokens les plus probables pour la génération à chaque étape. | 
| Frequency Penalty | Utilisé pour décourager l'utilisation fréquente de mots afin d'obtenir des réponses plus variées. |
| Presence Penalty | Utilisé pour réduire la répétition de mots ou de phrases. |
| Citation Options | Options pour contrôler la génération des citations. |
| Safety Mode | Utilisé pour sélectionner l'instruction de sécurité insérée dans le prompt. Valeurs autorisées : CONTEXTUAL, STRICT, OFF  |
| Stop Sequences | Définit une liste d'au plus 5 chaînes qui, lorsqu'elles correspondent, arrêteront la génération et renverront le texte généré jusque-là. |
