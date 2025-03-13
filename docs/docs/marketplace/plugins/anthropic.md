---
id: marketplace-plugin-anthropic
title: Anthropic
---

Integrating Anthropic with ToolJet enables the creation of interactive chatbots that analyze past messages to generate context-aware responses. These bots can also be customized with defined roles, making them suitable for tasks such as customer support, serving as virtual assistants, or enabling personalized conversations.

## Connection

To connect with Anthropic, you will need the **API Key**, which can be generated from **[Anthropic Console](https://console.anthropic.com/)**.

<img className="screenshot-full" src="/img/marketplace/plugins/anthropic/config.png" alt="Anthropic Configuration" />

## Supported Operations

### Chat

This operation processes the user's input and generates appropriate, context-aware responses, simulating a natural, human-like conversation. It can handle multiple interactions while maintaining the flow of dialogue, enabling dynamic and engaging conversations.

**Required Parameters**

- **Model**: The model to use for generating the chat response. The available models are:
    - claude-3-5-sonnet-20241022
    - claude-3-5-haiku-20241022
    - claude-3-opus-20240229
    - claude-3-sonnet-20240229
    - claude-3-haiku-20240307

- **Message**: Messages act as input interactions between the user and the model. In the Roles parameter, you can choose either User or Assistant.

- **Max Size**: Maximum tokens used in response.

**Optional Parameters**

- **System Prompt**: Defines the role and context of the model to evaluate messages and generate a response.

- **Temperature**: Controls the randomness of the response. Accepts values between 0 and 1, with a default of 1.

<img className="screenshot-full" src="/img/marketplace/plugins/anthropic/query.png" alt="Anthropic Query" />

<details>
<summary>**Example Values**</summary>

```yaml
Model: claude-3-5-sonnet-20241022
System Prompt: You are an AI assistant that provides detailed, accurate, and polite responses.
Message: [
  {"role": "user", "content": "Hello!"},
  {"role": "assistant", "content": "Hello, How can I assist you today?"},
  {"role": "user", "content": "Can you explain the benefits of AI in healthcare?"}
]
Temperature: 0.7
Max size: 512
```

</details>

<details>
<summary>**Response Example**</summary>

```json
[
  {
    "type": "text",
    "text": "AI has numerous significant benefits in healthcare. Here are some key advantages:nn1. Diagnosis and Disease Detectionn- Faster and more accurate diagnosis through image analysis (X-rays, MRIs, CT scans)n- Early detection of diseases like cancern- Pattern recognition in patient symptoms and medical historynn2. Treatment Planningn- Personalized treatment recommendationsn- Drug interaction predictionsn- Treatment outcome forecastingn- Precision medicine based on patient datann3. Administrative Tasksn- Automated appointment schedulingn- Medical record managementn- Billing and insurance processingn- Reducing paperwork and administrative burdennn4. Patient Caren- Remote patient monitoringn- Virtual health assistantsn- Personalized care recommendationsn- Medication adherence trackingnn5. Research and Drug Developmentn- Accelerated drug discoveryn- Clinical trial matchingn- Analysis of medical research datan- Identification of new treatment approachesnn6. Preventive Caren- Risk prediction and assessmentn- Population health managementn- Lifestyle recommendationsn- Early intervention opportunitiesnn7. Cost Reductionn- Improved efficiencyn- Reduced medical errorsn- Better resource allocationn- Streamlined operationsnn8. Accessibilityn- 24/7 availability of basic healthcare informationn- Improved access to healthcare in remote areasn- Reduced wait timesn- Better distribution of medical expertisennThese benefits continue to expand as AI technology advances and becomes more integrated into healthcare systems."
  }
]
```

</details>
