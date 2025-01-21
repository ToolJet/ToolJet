---
id: marketplace-plugin-anthropic
title: Anthropic
---

ToolJet enables you to integrate with Anthropic. With it's powerful capabilities, you can create interactive chatbots, generate detailed content, and handle complex queries efficiently.

## Connection

To connect with Anthropic, you will need the **API Key**, which can be generated from **[Anthropic Console](https://console.anthropic.com/)**.

<img className="screenshot-full" src="/img/marketplace/plugins/anthropic/config.png" alt="Anthropic Configuration" />

## Supported Operations

### Chat

This operation processes the user's input and generates appropriate, context-aware responses, simulating a natural, human-like conversation. It can handle multiple interactions, maintaining the flow of dialogue for dynamic and engaging conversations.

**Required Parameters**

- **Model**: The model to use for generating the chat response. The available models are:
    - claude-3-5-sonnet-20241022
    - claude-3-5-haiku-20241022
    - claude-3-opus-20240229
    - claude-3-sonnet-20240229
    - claude-3-haiku-20240307

- **Message**: Messages act as input interactions between the user and the model. In the Roles parameter, you can choose either User or Assistant.

- **Max Size**: Maximum tokens used in response.

**Optional Parameter**

- **System Prompt**: Defines role, context and/or role of the model to evaluate messages and send response.

- **Temperature**: Defines randomness of response. Takes the value between 0 and 1. Default is 1.

<img className="screenshot-full" src="/img/marketplace/plugins/anthropic/query.png" alt="Anthropic Configuration" />

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
