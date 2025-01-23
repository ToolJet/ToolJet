---
id: marketplace-plugin-gemini
title: Gemini
---

Google Gemini can be integrated with ToolJet to build context-aware, intelligent chatbots or generate creative text content. 

## Connection

To connect with Gemini, you will need the **API Key**, which can be generated from **[Google AI Studio](https://aistudio.google.com/apikey)**.

<img className="screenshot-full" src="/img/marketplace/plugins/gemini/config.png" alt="Gemini Configuration" />

## Supported Operations

### Text Generation

Use this operation to generate text based on the prompt, system instructions, and model settings. It provides information or explanations tailored to the given context.

**Required Parameters**

- **Model**: Specifies the Gemini model to use for generating responses.
    - Gemini 1.5 Flash
    - Gemini 1.5 Flash-8B
    - Gemini 1.5 Pro
    - Gemini 2.0 Flash

- **Prompt**: The main user input for generating responses.

**Optional Parameter**

- **System Prompt**: A predefined instruction guiding the model's tone and behavior.

- **Max Tokens**: Limits the maximum number of tokens (words and characters) in the response.

- **Temperature**: Defines the randomness of the response. It takes a value between 0 and 1, with a default of 1.

<img className="screenshot-full" src="/img/marketplace/plugins/gemini/query.png" alt="Gemini Query" />

<details>
<summary>**Response Example**</summary>

Connecting ToolJet to a database involves several steps, and the specific method depends on the type of database you're using.  ToolJet primarily uses database connections through its built-in features, avoiding the need for complex configuration files or external tools.  Here's a general guide, focusing on common scenarios:

**1. Choose Your Database and Connection Method:**

ToolJet supports various database systems, including:

* **PostgreSQL:** A powerful, open-source relational database management system.
* **MySQL:** Another popular open-source relational database system.
* **SQLite:** A lightweight, file-based database system, often suitable for smaller projects.
* **MongoDB:** A NoSQL database system, ideal for handling unstructured or semi-structured data.

**2. Setting Up the Database:**

* **Ensure the database server is running and accessible.**  This includes having the database software installed and configured.
* **Create a database:**  Within the database server, you'll need to create a new database.
* **Create a user account with appropriate privileges:** This user account needs permissions to connect to the database and perform read/write operations.  Crucially, ensure the user has the necessary permissions for your application's needs.  For example, you will need `SELECT`, `INSERT`, `UPDATE`, and `DELETE` permissions if you're performing CRUD operations.
* **Determine the database credentials:** You'll need the database server's hostname/IP address, the database name, the username, and the password for the user account.

**3. Connecting in ToolJet:**

* **Navigate to the relevant ToolJet app/page where database interaction is needed.**
* **Utilize ToolJet's database connectors:**  Look for sections or widgets in ToolJet that allow you to interact with databases.  This is typically integrated into the data sources, data manipulation features, or custom functions.
* **Provide the database connection details:** Input the database server details (hostname/IP, port, database name, username, password).  ToolJet will validate the connection.
* **Choose the database type:** Select the correct database type (e.g., PostgreSQL, MySQL, SQLite, MongoDB).
* **Test the connection:** ToolJet will attempt to connect to the database. Verify the success of the connection.  If successful, you should be able to query the database within ToolJet's

</details>

### Chat

Use this operation for a chat-like conversation, where the model responds based on the given prompts and instructions. It provides relevant and context-appropriate answers, maintaining a smooth conversational flow.

**Required Parameters**

- **Model**: Specifies the Gemini model to use for generating responses in the chat.
    - Gemini 1.5 Flash
    - Gemini 1.5 Flash-8B
    - Gemini 1.5 Pro
    - Gemini 2.0 Flash

- **User Prompt**: The user's question or request that the model will respond to.

**Optional Parameter**

- **System Prompt**: Provides the model with guidance on the style and type of responses expected.

- **History**: Keeps track of previous interactions to maintain context in the conversation.

- **Max Tokens**: Limits the maximum number of tokens (words and characters) in the response.

- **Temperature**: Defines the randomness of the response. It takes a value between 0 and 1, with a default of 1.

<img className="screenshot-full" src="/img/marketplace/plugins/gemini/chat-query.png" alt="Gemini Query" />

<details>
<summary>**Response Example**</summary>

Integrating an API into ToolJet involves several steps, depending on the API's specifics (REST, GraphQL, etc.) and the desired functionality within your ToolJet application.  Here's a breakdown of the process:

**1. Understanding Your API:**

* **Authentication:** How does the API authenticate requests? (API Key, OAuth 2.0, Basic Auth, etc.)  This is crucial and will directly impact your ToolJet configuration.
* **Endpoints:** Identify the specific API endpoints you need to interact with.  Note the HTTP methods (GET, POST, PUT, DELETE) for each endpoint.
* **Request Parameters:**  Understand what parameters (query parameters, request body) each endpoint expects.  Data types are important (string, integer, JSON, etc.).
* **Response Format:**  Determine the format of the API's response (usually JSON or XML).  ToolJet primarily works with JSON.

</details>






