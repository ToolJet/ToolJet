---
id: marketplace-plugin-gemini
title: Gemini
---

Le plugin **Google Gemini** peut être intégré à ToolJet pour permettre le développement de chatbots intelligents et contextuels, et pour faciliter la génération de contenu textuel créatif de haute qualité au sein des applications.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[utilisation des plugins du Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour vous connecter à Gemini, vous aurez besoin de la **clé API**, que vous pouvez générer depuis **[Google AI Studio](https://aistudio.google.com/apikey)**.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/gemini/config.png" alt="Gemini Configuration" />

## Opérations prises en charge

### Génération de texte

Utilisez cette opération pour générer du texte à partir du prompt, des instructions système et des paramètres du modèle. Elle fournit des informations ou des explications adaptées au contexte donné.

**Paramètres requis**

- **Model** : Spécifie le modèle Gemini à utiliser pour générer les réponses.
    - **Gemini 3 Pro Preview**
    - **Gemini 3 Flash Preview**
    - **Gemini 2.5 Pro**
    - **Gemini 2.5 Flash**
    - **Gemini 2.5 Flash Lite**
    - **Gemini 2.0 Flash**
    - **Gemini 2.0 Flash Lite**

- **Prompt** : L'entrée principale de l'utilisateur pour générer les réponses.

**Paramètres optionnels**

- **System Prompt** : Une instruction prédéfinie guidant le ton et le comportement du modèle.
- **Max Tokens** : Limite le nombre maximal de tokens (mots et caractères) dans la réponse.
- **Temperature** : Définit le degré d'aléatoire de la réponse. Elle prend une valeur entre 0 et 1, avec une valeur par défaut de 1.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/gemini/chat-v2.png" alt="Gemini Query" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

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

Utilisez cette opération pour une conversation de type chat, où le modèle répond en fonction des invites et instructions données. Elle fournit des réponses pertinentes et adaptées au contexte, tout en maintenant un flux de conversation fluide.

**Paramètres requis**

- **Model** : Spécifie le modèle Gemini à utiliser pour générer les réponses dans le chat.
    - **Gemini 3 Pro Preview**
- **User Prompt** : La question ou la demande de l'utilisateur à laquelle le modèle répondra.

**Paramètres optionnels**

- **System Prompt** : Fournit au modèle des indications sur le style et le type de réponses attendues.
- **History** : Conserve la trace des interactions précédentes pour maintenir le contexte de la conversation.
- **Max Tokens** : Limite le nombre maximal de tokens (mots et caractères) dans la réponse.
- **Temperature** : Définit le degré d'aléatoire de la réponse. Elle prend une valeur entre 0 et 1, avec une valeur par défaut de 1.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/gemini/chat-v2.png" alt="Gemini Query" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

Integrating an API into ToolJet involves several steps, depending on the API's specifics (REST, GraphQL, etc.) and the desired functionality within your ToolJet application.  Here's a breakdown of the process:

**1. Understanding Your API:**

* **Authentication:** How does the API authenticate requests? (API Key, OAuth 2.0, Basic Auth, etc.)  This is crucial and will directly impact your ToolJet configuration.
* **Endpoints:** Identify the specific API endpoints you need to interact with.  Note the HTTP methods (GET, POST, PUT, DELETE) for each endpoint.
* **Request Parameters:**  Understand what parameters (query parameters, request body) each endpoint expects.  Data types are important (string, integer, JSON, etc.).
* **Response Format:**  Determine the format of the API's response (usually JSON or XML).  ToolJet primarily works with JSON.

</details>
