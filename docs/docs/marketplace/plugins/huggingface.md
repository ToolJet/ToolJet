---
id: marketplace-plugin-huggingface
title: Hugging Face
---

Hugging Face integration with ToolJet enables you to leverage advanced natural language processing capabilities. With Hugging Face's state-of-the-art models, you can generate high-quality content and summarize text seamlessly.

This plugin leverages the Inference API from Hugging Face to ensure seamless integration with supported models. To confirm if a model is supported, refer to the Inference API section on its page on the **[Hugging Face](https://huggingface.co/models)**.

<img className="screenshot-full" src="/img/marketplace/plugins/huggingface/inference-api.png" alt="Hugging Face Configuration" />


## Connection

To connect with Hugging Face, you will need the **Personal access token**, which can be generated from **[Hugging Face Platform](https://huggingface.co/settings/tokens)**.

You can use the following toggles:
- **Use Cache**: Use this to enable the cache layer on the inference API to accelerate response times for repeated requests. By default it is enabled.
- **Wait for Model**: Use this to wait for the model to load if it is not ready, avoiding any errors. By default it is off.

<img className="screenshot-full" src="/img/marketplace/plugins/huggingface/config.png" alt="Hugging Face Configuration" />


## Supported Operations

### Text Generation

Use this operation to generates text based on the input and model settings. It provides information or explanations tailored to the given context.

**Required Parameters**

- **Model**: Specifies the model to use for generating responses.

    Example Models -
    - [google/gemma-2-2b-it](https://huggingface.co/google/gemma-2-2b-it) (Recommended)
    - [microsoft/phi-4](https://huggingface.co/microsoft/phi-4)
    - [tiiuae/falcon-7b-instruct](https://huggingface.co/tiiuae/falcon-7b-instruct)
    - [HuggingFaceH4/zephyr-7b-beta](https://huggingface.co/HuggingFaceH4/zephyr-7b-beta)
    - [mistralai/Mistral-7B-Instruct-v0.2](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2)


- **Input**: The user input for generating responses.

**Optional Parameter**

- **Operation Parameters**: Additional parameters to configure the model response. These parameters might change based on model being used.

<img className="screenshot-full" src="/img/marketplace/plugins/huggingface/text-generation-query.png" alt="Gemini Query" />

<details>
<summary>**Response Example**</summary>

Once upon a time, in a land far away, lived a young princess named Aurora. She was known for her kindness, her vibrant spirit, and her love for adventure. One day, an evil sorceress named Maleficent cast a curse upon Aurora, trapping her in a deep slumber, where she would never wake until true love's kiss. 

But a brave group of friends, led by the valiant Prince Phillip, vowed to break the curse and save Aurora. With their courage, and the help of the magical fairy godmother, they embarked on a thrilling journey to find the source of the curse and defeat the villainous Maleficent.

Their journey took them through enchanted forests, over shimmering seas, and into deep caves, where they faced many obstacles and challenges. They encountered talking animals, mystical creatures, and fearsome beasts, all while searching for the hidden key to unlock the curse.

Finally, they reached Maleficent's lair, a dark and foreboding castle, and faced the sorceress herself. A fierce battle ensued, as Phillip and the other heroes fought to protect Aurora, and defeat Maleficent's evil plans.

In the final confrontation, Aurora, awakened by the kiss of true love, emerged from the deep sleep. She was stronger and wiser, ready to embrace her destiny as a princess and a queen. 

The story of Aurora and Phillip is a timeless tale of love, bravery, and the power of hope. It reminds us that even in the face of darkness, the light of love and courage can conquer all evil. 

</details>

### Summarisation

Use this operation to create a summary of the input text based on the model settings.

**Required Parameters**

- **Model**: Specifies the model to use for generating summary.

    Example Models -
    - [facebook/bart-large-cnn](https://huggingface.co/facebook/bart-large-cnn) (Recommended)
    - [philschmid/bart-large-cnn-samsum](https://huggingface.co/philschmid/bart-large-cnn-samsum)
    - [google/pegasus-xsum](https://huggingface.co/google/pegasus-xsum)
    - [ainize/bart-base-cnn](https://huggingface.co/ainize/bart-base-cnn)
    - [Falconsai/text_summarization](https://huggingface.co/Falconsai/text_summarization)


- **Input**: Input text that needs to be summarized.

**Optional Parameter**

- **Operation Parameters**: Additional parameters to configure the model response. These parameters might change based on model being used.

<img className="screenshot-full" src="/img/marketplace/plugins/huggingface/summary-query.png" alt="Gemini Query" />

<details>
<summary>**Response Example**</summary>

The story of Aurora and Phillip is a timeless tale of love, bravery, and the power of hope. It reminds us that even in the face of darkness, the light of love and courage can conquer all evil. An evil sorceress cast a curse upon Aurora, trapping her in a deep slumber, where she would never wake until true love's kiss.

</details>