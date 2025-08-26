---
id: marketplace-plugin-hugging_face
title: Hugging Face
---

Hugging Face integration with ToolJet enables you to use advanced natural language processing capabilities. With Hugging Face's state-of-the-art models, you can generate high-quality content and summarize text seamlessly.

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

Use this operation to generate text based on the input and model settings. It provides information or explanations tailored to the given context. Check out all the available text generation models on [Hugging Face](https://huggingface.co/models?pipeline_tag=text-generation&sort=trending).

**Required Parameters**

- **Model**: Specifies the model to use for generating responses.

    Example Models -
    - [google/gemma-2-2b-it](https://huggingface.co/google/gemma-2-2b-it)
    - [tiiuae/falcon-7b-instruct](https://huggingface.co/tiiuae/falcon-7b-instruct)
    - [HuggingFaceH4/zephyr-7b-beta](https://huggingface.co/HuggingFaceH4/zephyr-7b-beta)
    - [mistralai/Mistral-7B-Instruct-v0.2](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2)

- **Input**: The user input for generating responses.

**Optional Parameter**

- **Operation Parameters**: Additional parameters to configure the model response. These parameters might change based on model being used.

<img className="screenshot-full" src="/img/marketplace/plugins/huggingface/text-generation-query.png" alt="Gemini Query" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

AI integration with ToolJet:

**Benefits of ToolJet Integration:**

* **Faster Development:**  Streamline the development process with pre-built integrations and templates for common workflows.
* **Reduced Costs:** Automate tasks and reduce the need for custom coding, saving development time and money.
* **Increased Productivity:**  Empower your team to build and deploy tools faster, allowing them to focus on more strategic tasks.
* **Improved Collaboration:**  Enable seamless collaboration between developers and business users by providing a unified platform for tool creation.

**ToolJet Integration with Existing Tooling:**

* **Integration with Popular Tools:**  ToolJet can integrate with various tools, including Slack, Jira, Google Drive, and more.
* **Customizability:**  Customize the integration to fit your specific workflows and requirements.

**How ToolJet Integrates with Existing Tooling:**

* **APIs:**  Leverage open APIs to connect ToolJet to other tools and services.
* **Webhook Integration:**  Integrate ToolJet with external services via webhooks to trigger actions based on events.
* **ToolJet Plugins:**  Explore a library of plugins that expand ToolJet's functionality and facilitate integrations.

**Example Use Cases:**

* **Automated Data Pipeline:**  Connect ToolJet to a data warehousing platform like Snowflake to automate data extraction and transformation.
* **Workflow Management:**  Integrate ToolJet with a project management tool like Jira to create automated workflows for tasks and approvals.
* **Customizable Reporting:**  Connect ToolJet to a reporting tool like Google Analytics to generate custom reports based on data analytics.
* **Automatic Notifications:**  Integrate ToolJet with a communication platform like Slack to trigger notifications for completed tasks or system updates.

**Conclusion:**

ToolJet's integration capabilities significantly enhance the power and flexibility of your development workflows, enabling you to build custom tools faster and more effectively. By leveraging pre-built integrations, customizability, and APIs, ToolJet empowers your team to achieve greater productivity and streamline their processes across various stages of the development lifecycle. 

</details>

### Summarisation

Use this operation to create a summary of the input text based on the model settings. Check out all the available summarisation models on [Hugging Face](https://huggingface.co/models?pipeline_tag=summarization&sort=trending).

**Required Parameters**

- **Model**: Specifies the model to use for generating summary.

    Example Models -
    - [facebook/bart-large-cnn](https://huggingface.co/facebook/bart-large-cnn)
    - [philschmid/bart-large-cnn-samsum](https://huggingface.co/philschmid/bart-large-cnn-samsum)
    - [google/pegasus-xsum](https://huggingface.co/google/pegasus-xsum)
    - [ainize/bart-base-cnn](https://huggingface.co/ainize/bart-base-cnn)
    - [Falconsai/text_summarization](https://huggingface.co/Falconsai/text_summarization)


- **Input**: Input text that needs to be summarized.

**Optional Parameter**

- **Operation Parameters**: Additional parameters to configure the model response. These parameters might change based on model being used.

<img className="screenshot-full" src="/img/marketplace/plugins/huggingface/summary-query.png" alt="Gemini Query" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

ToolJet can integrate with various tools, including Slack, Jira, Google Drive, and more. AI integration with ToolJet: capabilities significantly enhance the power and flexibility of your development workflows. By leveraging pre-built integrations, customizability, and APIs, ToolJet empowers your team to achieve greater productivity.

</details>
