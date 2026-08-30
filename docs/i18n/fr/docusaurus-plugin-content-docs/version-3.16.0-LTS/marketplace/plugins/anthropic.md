---
id: marketplace-plugin-anthropic
title: Anthropic
---

L'intégration d'Anthropic avec ToolJet permet de créer des chatbots interactifs qui analysent les messages précédents pour générer des réponses contextuelles. Ces bots peuvent également être personnalisés avec des rôles définis, ce qui les rend adaptés à des tâches telles que le support client, l'assistance virtuelle ou la personnalisation des conversations.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus [Utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour vous connecter à Anthropic, vous aurez besoin de la **clé API**, que vous pouvez générer depuis la **[Anthropic Console](https://console.anthropic.com/)**.

<img className="screenshot-full imf-full" src="/img/marketplace/plugins/anthropic/connection-v2.png" alt="Anthropic Configuration" />

## Opérations prises en charge

### Chat

Cette opération traite l'entrée de l'utilisateur et génère des réponses appropriées et contextuelles, simulant une conversation naturelle et humaine. Elle peut gérer plusieurs interactions tout en maintenant la fluidité du dialogue, permettant des conversations dynamiques et engageantes.

**Paramètres requis**

- **Model** : le modèle à utiliser pour générer la réponse du chat. Les modèles disponibles sont :

    - **claude-sonnet-4-5-20250929**
    - **claude-sonnet-4-20250514**
    - **claude-opus-4-5-20251101**
    - **claude-opus-4-1-20250805**
    - **claude-opus-4-20250514**
    - **claude-haiku-4-5**

- **Message** : les messages agissent comme des interactions d'entrée entre l'utilisateur et le modèle. Dans le paramètre Roles, vous pouvez choisir soit User, soit Assistant.

- **Max Size** : le nombre maximal de tokens utilisés dans la réponse.

**Paramètres optionnels**

- **System Prompt** : définit le rôle et le contexte du modèle pour évaluer les messages et générer une réponse.

- **Temperature** : contrôle le caractère aléatoire de la réponse. Accepte des valeurs comprises entre 0 et 1, avec une valeur par défaut de 1.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/anthropic/query-v2.png" alt="Anthropic Query" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```json
[
  {
    "type": "text",
    "text": "AI has numerous significant benefits in healthcare. Here are some key advantages:nn1. Diagnosis and Disease Detectionn- Faster and more accurate diagnosis through image analysis (X-rays, MRIs, CT scans)n- Early detection of diseases like cancern- Pattern recognition in patient symptoms and medical historynn2. Treatment Planningn- Personalized treatment recommendationsn- Drug interaction predictionsn- Treatment outcome forecastingn- Precision medicine based on patient datann3. Administrative Tasksn- Automated appointment schedulingn- Medical record managementn- Billing and insurance processingn- Reducing paperwork and administrative burdennn4. Patient Caren- Remote patient monitoringn- Virtual health assistantsn- Personalized care recommendationsn- Medication adherence trackingnn5. Research and Drug Developmentn- Accelerated drug discoveryn- Clinical trial matchingn- Analysis of medical research datan- Identification of new treatment approachesnn6. Preventive Caren- Risk prediction and assessmentn- Population health managementn- Lifestyle recommendationsn- Early intervention opportunitiesnn7. Cost Reductionn- Improved efficiencyn- Reduced medical errorsn- Better resource allocationn- Streamlined operationsnn8. Accessibilityn- 24/7 availability of basic healthcare informationn- Improved access to healthcare in remote areasn- Reduced wait timesn- Better distribution of medical expertisennThese benefits continue to expand as AI technology advances and becomes more integrated into healthcare systems."
  }
]
```

</details>
