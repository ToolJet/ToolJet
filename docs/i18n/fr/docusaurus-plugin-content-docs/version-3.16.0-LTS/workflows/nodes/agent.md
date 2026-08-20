---
id: agent
title: Nœud Agent
---

<br/>

Le **nœud Agent** permet une automatisation pilotée par l'IA au sein de vos workflows. Il se connecte à des modèles d'IA et peut utiliser des outils (Slack, Gmail, GitHub, etc.) pour effectuer un raisonnement multi-étapes et exécuter des tâches. L'agent décide de manière autonome quels outils utiliser et comment combiner leurs résultats pour accomplir des tâches complexes.

## Configuration

### Configurer l'agent

| Paramètre | Description |
|:--------|:------------|
| **System Prompt** | Instructions qui définissent le comportement, la persona et les contraintes de l'agent. |
| **User Prompt** | La tâche ou la question que l'agent doit traiter. Prend en charge les valeurs dynamiques via la syntaxe `{{ }}`. |
| **Output Format** | Définit la structure de la réponse finale de l'agent. Utilisez ce champ pour spécifier un schéma JSON ou un format que l'agent doit suivre lors du retour des résultats. |

### Modèle d'IA

Connectez le nœud Agent à une source de données de modèle d'IA en le reliant au point de connexion **ai-model** du nœud.

Fournisseurs d'IA pris en charge :
- OpenAI
- Anthropic
- Gemini
- Mistral AI

#### Paramètres du modèle

| Paramètre | Description |
|:----------|:------------|
| **Temperature** | Contrôle l'aléatoire des réponses. Des valeurs plus élevées (0-1) produisent des résultats plus créatifs. |
| **Max Tokens** | Nombre maximal de tokens que le modèle peut générer dans une réponse. |
| **Top P** | Alternative à la température pour contrôler l'aléatoire via l'échantillonnage par noyau (nucleus sampling) (0-1). |
| **Max Steps** | Nombre maximal d'étapes/itérations de raisonnement que l'agent peut effectuer. |
| **Max Retries** | Nombre de tentatives de nouvel essai pour les appels d'API échoués. |
| **Timeout** | Durée maximale en millisecondes pour que l'agent termine son exécution. |
| **Stop Sequences** | Séquences qui indiquent au modèle d'arrêter de générer du texte. |

### Outils (Tools)

Les outils permettent à l'agent d'interagir avec vos données et d'effectuer des actions. Chaque outil est un nœud de workflow que l'agent peut invoquer. L'agent décide de manière autonome quels outils utiliser en fonction de la tâche et des instructions de votre system prompt.

Pour ajouter des outils, faites glisser des nœuds depuis le point de connexion « tool » du nœud Agent pour connecter des requêtes de source de données, des appels REST API, des nœuds JavaScript ou tout autre nœud de workflow.

<img className="screenshot-full img-full" src="/img/workflows/nodes/agent/agent-tools.png" alt="Agent Tools Configuration" />

#### Types d'outils pris en charge

Vous pouvez utiliser n'importe quel nœud de workflow comme outil, notamment :

- **Requêtes de source de données** : requêtes PostgreSQL, MySQL, MongoDB et autres bases de données
- **REST API** : connexion à des services externes comme Slack, GitHub, Gmail, Twilio, etc.
- **JavaScript** : logique personnalisée pour la transformation de données ou des opérations complexes
- **ToolJet Database** : interrogez vos tables ToolJet Database

## Accéder aux données du nœud Agent

### À l'intérieur des outils

Lorsque l'agent invoque un outil, il transmet des paramètres que vous pouvez récupérer dans le nœud outil. Utilisez la syntaxe suivante pour récupérer ces valeurs :

```js
aiParameters.<paramName>
```

Les noms des paramètres sont déterminés par l'agent en fonction des instructions de votre system prompt. Par exemple, si votre system prompt demande à l'agent d'extraire `user_email` du message de l'utilisateur, vous pouvez y accéder dans votre outil comme suit :

```js
aiParameters.user_email
```

### En dehors du nœud Agent

Seul le résultat final du nœud Agent peut être consulté par les autres nœuds du workflow. Si vous avez besoin de données spécifiques dans le résultat, définissez le format de sortie attendu dans votre system prompt.

Pour accéder au résultat de l'agent dans les nœuds suivants, utilisez la syntaxe suivante :

```js
<agentNodeName>.data
```

Par exemple, si votre nœud Agent se nomme `agent1` :

```js
agent1.data
```


## Cas d'usage
<!-- 
### Customer Support Agent

Create an agent that looks up customer information, creates support tickets, and retrieves order history.

**Tools:**
| Tool | Type | Description |
|:-----|:-----|:------------|
| `lookupCustomer` | PostgreSQL | Queries the database for customer details by email |
| `createTicket` | REST API | Creates a new support ticket in the ticketing system |
| `getOrderHistory` | PostgreSQL | Retrieves recent orders for a customer |

**System Prompt:**
```
You are a Customer Support Automation Agent.

Process the user's message and execute the following steps in order:

1. Extract: user_name, user_email, issue_summary, tags, priority ("critical", "normal", "low")
2. Look up the customer using "lookupCustomer"
3. Create a support ticket using "createTicket"
4. Retrieve order history using "getOrderHistory"

Rules:
- Always call lookupCustomer first
- Always call createTicket after verifying customer
- Do not ask follow-up questions
```

<img className="screenshot-full img-full" src="/img/workflows/nodes/agent/customer-support-agent.png" alt="Customer Support Agent" />

### GitHub Issue Triager

Automate issue management by analyzing new issues and assigning labels, assignees, and priorities.

**Tools:**
| Tool | Type | Description |
|:-----|:-----|:------------|
| `getIssueDetails` | GitHub | Fetches issue title, description, and metadata |
| `addLabels` | GitHub | Adds appropriate labels to the issue |
| `assignReviewer` | GitHub | Assigns a team member based on issue type |
| `postComment` | GitHub | Posts a welcome comment or asks for more details |

**System Prompt:**
```
You are a GitHub Issue Triage Agent.

When a new issue is created:
1. Analyze the issue content using "getIssueDetails"
2. Categorize it (bug, feature, documentation, question)
3. Add appropriate labels using "addLabels"
4. Assign to the right team member using "assignReviewer"
5. Post a helpful comment using "postComment"

Label guidelines:
- Bug reports: add "bug" and priority label
- Feature requests: add "enhancement"
- Questions: add "question" and post documentation links
```

<img className="screenshot-full img-full" src="/img/workflows/nodes/agent/github-issue-triager.png" alt="GitHub Issue Triage" /> -->

### Slack Notification Agent

Surveillez les événements et envoyez des notifications contextuelles vers les bons canaux Slack.

**Outils :**
| Outil | Type | Description |
|:-----|:-----|:------------|
| `getAlertDetails` | PostgreSQL | Récupère les informations d'alerte depuis la base de données |
| `getUserOnCall` | REST API | Récupère l'ingénieur d'astreinte actuel |
| `sendSlackMessage` | Slack | Envoie un message dans un canal Slack |
| `createIncident` | REST API | Crée un incident dans votre système de gestion des incidents |

**System Prompt :**
```
You are an Alert Notification Agent.

When an alert is triggered:
1. Get alert details using "getAlertDetails"
2. Determine severity (critical, warning, info)
3. For critical alerts:
   - Get on-call engineer using "getUserOnCall"
   - Create incident using "createIncident"
   - Send urgent Slack message using "sendSlackMessage"
4. For warnings: send Slack message to #engineering-alerts
5. For info: send Slack message to #system-logs

Always include: alert name, severity, timestamp, and recommended action.
```

<img className="screenshot-full img-m" src="/img/workflows/nodes/agent/slack-agent-sys.png" alt="Slack Agent" />

**Fonctionnement :**

```
  Webhook Trigger (alert_id)
        │
        ▼
  Agent Node receives User Prompt
  "New alert triggered. Alert ID: {{ startTrigger.params.alert_id }}"
        │
        ▼
  Agent Reasoning
  AI model reads system + user prompt, plans tool calls
        │
        ▼
  Tool: getAlertDetails (PostgreSQL)
  Fetches severity, service name, timestamp
        │
        ▼
  Severity Check
  ┌─────────────┬─────────────────┬──────────────────┐
  │  Critical   │    Warning      │      Info        │
  │      │      │        │        │        │         │
  │      ▼      │        ▼        │        ▼         │
  │getUserOnCall│ sendSlackMessage│ sendSlackMessage │
  │      │      │ #eng-alerts     │ #system-logs     │
  │      ▼      │                 │                  │
  │createIncident                 │                  │
  │      │      │                 │                  │
  │      ▼      │                 │                  │
  │sendSlackMsg │                 │                  │
  │ #incidents  │                 │                  │
  └─────────────┴─────────────────┴──────────────────┘
        │
        ▼
  Output → agentNodeName.data
  Summary: incident ID, Slack message sent, on-call notified
```

<img className="screenshot-full img-full" src="/img/workflows/nodes/agent/slack-agent.png" alt="Slack Agent" />

### Email Assistant Agent

Traitez les e-mails entrants et rédigez des réponses ou acheminez-les vers l'équipe appropriée.

**Outils :**
| Outil | Type | Description |
|:-----|:-----|:------------|
| `getEmailContent` | Gmail | Récupère le sujet, le corps et les informations sur l'expéditeur de l'e-mail |
| `classifyEmail` | JavaScript | Analyse l'intention et l'urgence de l'e-mail |
| `draftReply` | Gmail | Crée un brouillon de réponse |
| `forwardEmail` | Gmail | Transfère vers le service approprié |
| `logEmail` | PostgreSQL | Enregistre l'e-mail pour le suivi |

**System Prompt :**
```
You are an Email Processing Agent.

For each incoming email:
1. Get email content using "getEmailContent"
2. Classify the email type (inquiry, complaint, order, spam)
3. Based on classification:
   - Inquiries: draft a helpful reply using "draftReply"
   - Complaints: forward to support team using "forwardEmail"
   - Orders: log in database using "logEmail"
   - Spam: ignore
4. Log all processed emails in the database

Maintain a professional and helpful tone in all responses.
```

<img className="screenshot-full img-m" src="/img/workflows/nodes/agent/email-agent-sys.png" alt="Slack Agent" />

**Fonctionnement :**

```
  Webhook / Cron Trigger (email_id)
        │
        ▼
  Agent Node receives User Prompt
  "Process incoming email. Email ID: {{ startTrigger.params.email_id }}"
        │
        ▼
  Agent Reasoning
  AI model reads system + user prompt, plans tool calls
        │
        ▼
  Tool: getEmailContent (Gmail)
  Fetches subject, body, sender details
        │
        ▼
  Tool: classifyEmail (JavaScript)
  Returns classification: inquiry / complaint / order / spam
        │
        ▼
  Classification Check
  ┌────────────┬────────────┬────────────┬──────────┐
  │  Inquiry   │ Complaint  │   Order    │   Spam   │
  │     │      │     │      │     │      │          │
  │     ▼      │     ▼      │     ▼      │  Ignore  │
  │ draftReply │forwardEmail│  logEmail  │          │
  │  (Gmail)   │  (Gmail)   │(PostgreSQL)│          │
  └────────────┴────────────┴────────────┴──────────┘
        │
        ▼
  Output → agentNodeName.data
  Summary: email classified, action taken, tracking ID
```

<img className="screenshot-full img-full" src="/img/workflows/nodes/agent/email-assistant.png" alt="Email Assistant" />

## Limitations

- La performance de l'agent dépend des capacités du modèle d'IA sous-jacent
- Les workflows complexes à outils multiples peuvent nécessiter des paramètres max steps plus élevés
- Les limites de débit (rate limits) des fournisseurs d'IA peuvent affecter l'exécution

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
