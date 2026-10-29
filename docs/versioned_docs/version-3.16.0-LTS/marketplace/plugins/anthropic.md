---
id: marketplace-plugin-anthropic
title: Anthropic
---

Integrating Anthropic with ToolJet enables the creation of interactive chatbots that analyze past messages to generate context-aware responses. These bots can also be customized with defined roles, making them suitable for tasks such as customer support, serving as virtual assistants, or enabling personalized conversations.

:::info NOTE
Before following this guide, it is assumed that you have already completed the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connection

To connect with Anthropic, you will need the **API Key**, which can be generated from **[Anthropic Console](https://console.anthropic.com/)**.

<img className="screenshot-full imf-full" src="/img/marketplace/plugins/anthropic/connection-v2.png" alt="Anthropic Configuration" />

## Supported Operations

### Chat

This operation processes the user's input and generates appropriate, context-aware responses, simulating a natural, human-like conversation. It can handle multiple interactions while maintaining the flow of dialogue, enabling dynamic and engaging conversations.

:::note
The **Chat (Deprecated)** operation is still available for existing queries. Instead of **Message History** and **User message**, it takes the whole conversation in a single **Message** field: a JSON array of objects with `role` and `content`.
:::

**Required Parameters**

- **Model**: The model to use for generating the chat response. The available models are:

    - **claude-sonnet-4-5-20250929**
    - **claude-sonnet-4-20250514**
    - **claude-opus-4-5-20251101**
    - **claude-opus-4-1-20250805**
    - **claude-opus-4-20250514**
    - **claude-haiku-4-5**

- **User message**: The message the model replies to. ToolJet sends it as the last `user` message, after **Message History**. The query fails if this field is empty.

- **Max Size**: Maximum tokens used in response.

**Optional Parameters**

- **System prompt**: Defines the role and context of the model to evaluate messages and generate a response.

- **Message History**: Earlier turns of the conversation, as a JSON array of objects with `role` (`user` or `assistant`) and `content`, for example `[{ "role": "user", "content": "Hello Claude!" }, { "role": "assistant", "content": "Hello! How can I assist you today?" }]`. If the value isn't valid JSON, ToolJet ignores it and sends only the **User message**.

- **Temperature**: Controls the randomness of the response. Accepts values between 0 and 1, with a default of 1.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/anthropic/query-v2.png" alt="Anthropic Query" />

<details id="tj-dropdown">
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
