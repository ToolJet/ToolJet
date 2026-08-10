---
id: ds
title: Nœud Data Source
---

<br/>

Le nœud **Data Source** vous permet de connecter votre workflow à des sources de données externes, telles que des bases de données, des API ou des services tiers. Avec le nœud **Data Source**, vous pouvez :

- Récupérer des données depuis des bases de données comme PostgreSQL, MySQL ou MongoDB
- Récupérer des informations depuis des API REST ou GraphQL
- Vous intégrer à des plateformes SaaS comme ClickUp, Salesforce ou Slack
- Vous intégrer à des API d'IA comme OpenAI ou Anthropic
- Effectuer des requêtes, des filtres ou des transformations avant de transmettre les données à d'autres nœuds

Le nœud **Data Source** est essentiel pour créer des workflows dynamiques qui dépendent de données en temps réel. Il permet l'automatisation, le reporting et la prise de décision au niveau de l'entreprise en intégrant de manière transparente des données externes dans votre workflow.

Chaque nœud **Data Source** dispose de configurations spécifiques selon son type :

- **PostgreSQL** : champs de requête SQL
- **REST API** : méthode HTTP, endpoint, en-têtes (headers)
- **Twilio** : champs de configuration SMS
- Et bien d'autres selon les sources que vous avez configurées

<img className="screenshot-full img-full" src="/img/workflows/nodes/v2/datasources.png" alt="Data Sources Node" />

## Exemple 1 - Workflow d'automatisation du support client

Prenons un workflow qui rédige automatiquement une réponse générée par IA à un ticket de support client.

Voici un aperçu du workflow.

<img className="screenshot-full img-full" src="/img/workflows/nodes/data-source/customer-support-automation/sneakPeek.png" alt="Sneak Peek" />

**Entrée**  
Pour cet exemple, le workflow reçoit des données d'entrée dans la structure suivante :

```js
{
  "from": "johndoe@example.com",
  "name": "John Doe",
  "data": "Hi, I've been using ToolJet and it's the best tool in the market!"
}
```

Cette charge utile provient de la source qui déclenche le workflow. Dans ce cas, le workflow est déclenché via un webhook, donc le corps de la requête entrante fournit ces données. Cependant, le même workflow pourrait également être déclenché par d'autres sources, comme un autre workflow ou une application ToolJet, tant qu'elles envoient les paramètres dans ce format.

**Étape 1** : depuis le nœud Trigger, faites glisser une connexion et ajoutez un nœud de source de données OpenAI. Nommez ce nœud `generateResponse`.

**Étape 2** : sélectionnez l'*opération* et le *modèle*, puis configurez le prompt.  
Exemple de prompt :

```
You are a customer support representative at ToolJet. Write a response to the following ticket that the customer raised.

Ticket Data - {{startTrigger.params.data}}

Strictly provide only a JSON with the following structure without any fillers or markdown.

{
  "data": <response>
}
```

<img className="screenshot-full img-full" src="/img/workflows/nodes/data-source/customer-support-automation/openAIConfiguration.png" style={{ marginBottom:'15px' }} alt="OpenAI Configuration" />

**Étape 3** : créez un nœud JavaScript pour assainir (sanitize) la réponse.
Collez le code suivant dans le nœud JavaScript. Ce code assainit la réponse en supprimant les accents graves (backticks) et ne transmet que les données nécessaires.

````js
let openAIResponse = generateResponse.data;
openAIResponse = openAIResponse.replace("```json", "");
openAIResponse = openAIResponse.replace("```", "");

openAIResponse = JSON.parse(openAIResponse.trim());

return openAIResponse.data;
````

**Étape 4** : envoyez la réponse par e-mail à l'utilisateur.  
Configurez un nœud SMTP pour renvoyer la réponse à l'utilisateur.

**Résultat**  
Désormais, chaque fois que nous déclenchons le workflow avec un ticket de support, le client recevra une réponse automatique générée par IA.
<img className="screenshot-full img-full" src="/img/workflows/nodes/data-source/customer-support-automation/successMail.png" alt="Success Email" />

## Exemple 2 - Alertes de vérification de l'état du système avec Prometheus

Prenons un workflow qui interroge un serveur Prometheus toutes les 30 minutes pour une vérification de l'état de santé et envoie un e-mail à l'équipe DevOps si le système est défaillant.

Pour faire fonctionner notre workflow, nous avons défini les métriques d'un système défaillant comme suit :

```
CPU Usage > 0.0005%
Up Time < 95%
Memory Usage > 5MB
```

Ces seuils sont volontairement bas afin que la démonstration puisse facilement déclencher une alerte.  
Voici un aperçu du workflow :

<img className="screenshot-full img-full" src="/img/workflows/nodes/data-source/prometheus-monitoring-system/sneakPeek.png" style={{ marginBottom:'15px' }} alt="Sneak Peek" />

**Étape 1** : créez un nouveau workflow avec un déclencheur planifié qui s'exécute toutes les 30 minutes.

**Étape 2** : ajoutez trois nœuds de source de données Prometheus sortants.  
Nous nommerons ces nœuds `checkCPUUsage`, `checkUptime`, `checkMemoryUsage` et effectuerons une opération **Instant Query with PromQL**.
Pour interroger les statistiques, nous ajouterons respectivement les requêtes suivantes :

1. Nœud `checkCPUUsage` :

   ```js
   rate(process_cpu_seconds_total{job="prometheus"}[5m])
   ```

2. Nœud `checkUptime` :

   ```js
   avg_over_time(up{job="prometheus"}[1h]) * 100
   ```

3. Nœud `checkMemoryUsage` :
   ```js
   go_memstats_alloc_bytes{job="prometheus"} / 1024 / 1024
   ```

<img className="screenshot-full img-full" src="/img/workflows/nodes/data-source/prometheus-monitoring-system/prometheusNode.png" style={{ marginBottom:'15px' }} alt="Sample Prometheus Node" />

**Étape 3** : ajoutez un nœud `If condition` pour vérifier l'état de santé, nommé `checkOverallHealth`.

Prometheus renvoie les résultats dans un format imbriqué. Pour obtenir la valeur réelle de la métrique, nous accédons à :
`<node>.data.data.result[0].value[1]`. C'est la valeur numérique que nous comparons dans le nœud If condition.  
Nous ajouterons la condition suivante pour vérifier si le système est en bonne santé :

```js
checkCPUUsage.data.data.result[0].value[1] > 0.0005 ||
  checkUptime.data.data.result[0].value[1] < 95 ||
  checkMemoryUsage.data.data.result[0].value[1] > 5;
```

Si cela s'évalue à true, cela signifie que le système est défaillant, sinon le système est en bonne santé.

**Étape 4** : configurez le nœud SMTP

Créez un nœud SMTP sortant à partir du port vert de `checkOverallHealth` et configurez le nœud.  
Au minimum, remplissez les champs suivants :

- **From address** : l'adresse e-mail depuis laquelle vous souhaitez que les alertes soient envoyées
- **From Name** : un libellé convivial (par exemple, Monitoring System)
- **To/CC/BCC** : les destinataires de l'alerte
- **Subject** : le sujet de l'e-mail (par exemple, Health Check Alert!)
- **HTML/Text** : le contenu de l'e-mail que vous souhaitez envoyer

Pour en savoir plus sur la configuration d'une source de données SMTP, consultez [cette documentation](/docs/data-sources/smtp).

**Résultat** :  
Après l'exécution du workflow, nous obtenons l'e-mail suivant :

<img className="screenshot-full img-full" src="/img/workflows/nodes/data-source/prometheus-monitoring-system/successMail.png" alt="Success Mail" />
