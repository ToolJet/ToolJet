---
id: wf
title: Nœud Workflow
---

<br/>

Le nœud **Workflow** vous permet de déclencher un autre workflow depuis votre workflow actuel. Cela permet de décomposer des processus complexes en workflows plus petits et réutilisables, améliorant ainsi la modularité et la maintenabilité.

Avec le nœud **Workflow**, vous pouvez :
- Déclencher des workflows enfants en fonction de conditions ou d'événements
- Transmettre des données du workflow actuel vers le workflow déclenché
- Réutiliser une logique d'automatisation commune dans plusieurs workflows
- Construire des workflows hiérarchiques pour des processus métier complexes

Le nœud **Workflow** est idéal pour l'automatisation en entreprise, lorsque les processus doivent être standardisés, réutilisables et faciles à gérer. Par exemple, vous pourriez déclencher un workflow de traitement de facture depuis un workflow de gestion de commandes, ou appeler un workflow de notification après l'achèvement d'une tâche.
Vous pouvez également envoyer des paramètres à l'autre workflow, ce qui permet un contrôle dynamique de l'exécution du workflow déclenché.

Un workflow peut s'appeler lui-même de manière récursive. Il est recommandé de définir une condition de sortie pour éviter de créer une boucle infinie.

Le délai d'expiration (timeout) de chaque workflow peut être configuré à l'aide de la variable d'environnement `WORKFLOW_TIMEOUT_SECONDS`. Pour plus d'informations, consultez [Personnalisation de la configuration des workflows](/docs/setup/env-vars#customizing-workflow-configuration).

<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/example.png" alt="IF Else Node Example" />

### Exemple 1 - Workflow de journalisation réutilisable
Cet exemple montre comment centraliser des tâches courantes, comme la journalisation, dans un workflow réutilisable que d'autres workflows peuvent appeler.  
Prenons un workflow centralisé qui insère des journaux d'événements dans une base de données. Ainsi, tout workflow qui effectue une tâche critique insère un log.

Pour cet exemple, nous aurons un workflow enfant et un workflow parent.

**Workflow enfant**  
Le workflow enfant sera le workflow de journalisation centralisé qui ajoute des entrées à une base de données.
Voici un aperçu du workflow enfant (logger) :
<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/logger/sneakPeakChild.png" alt="Child Workflow Sneak Peek" />
Pour cet exemple, les données reçues par le workflow enfant sont dans le format suivant :
```js
{
  "logged_by": "Authentication System",
  "message": "New user created"
}
```
Le workflow enfant reçoit les données, effectue une opération d'insertion dans la base de données et renvoie une réponse en fonction du succès de l'opération d'insertion.

**Résultat (workflow enfant) :**
<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/logger/childWFResult.png" alt="Child Workflow Result" />

**Workflow parent**  
Nous allons créer un workflow qui doit journaliser les données de l'événement dans la base de données. Ce workflow :
- Ajoute un employé à la base de données de l'entreprise.
- Envoie un e-mail de bienvenue à l'employé.
- Ajoute un log de succès/échec en utilisant le workflow créé précédemment, via le nœud Workflow.

<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/logger/sneakPeekParent.png" alt="Parent Workflow Sneak Peek" />

Pour cet exemple, les données reçues par le workflow parent sont dans le format suivant :
```js
{
  "email": "employee@org.com",
  "name": "Employee",
  "phone_number": "+1111111111"
}
```
1. **Créez un nœud DB pour insérer les données dans la base, nommé `addEmployee`.**  
2. **Créez une branche sur le nœud `addEmployee`.**  
Cliquez sur l'icône de branchement pour créer une branche sur le nœud `addEmployee`. Depuis le port vert, créez un nœud SMTP pour envoyer un e-mail de succès à l'employé, nommé `mailTheEmployee`.  
Depuis le port rouge, créez un nœud workflow et nommez-le `logFailure`.  
3. **Depuis le nœud `mailTheEmployee`, créez un nœud workflow et nommez-le `logSuccess`.**  
4. **Configurez les nœuds `logSuccess` et `logFailure`.**

<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/logger/logFailure.png" alt="Log Failure" />
<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/logger/logSuccess.png" alt="Log Success" />

**Résultat**  
Les chemins de succès et d'échec créent tous deux une entrée de log, garantissant que les actions du workflow parent sont traçables.

### Exemple 2 - Créer un workflow de notification réutilisable
Souvent, différents workflows doivent alerter la bonne personne lorsqu'un incident se produit. Pour éviter de répéter les mêmes étapes de notification dans chaque workflow, nous pouvons créer un workflow partagé unique pour l'envoi des notifications.

Pour cet exemple :
- Le workflow parent supprime un objet S3, puis appelle le workflow enfant.
- Le workflow enfant envoie les notifications.
- Le workflow parent vérifie si la notification a réussi.

**Workflow enfant**  

<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/notification-system/centralNotifcationSystem.png" alt="Central Notification System" />

Voici la structure des paramètres pour le workflow enfant :
```js
{
    "incident": "Payment Failure",
    "raised_by": "Monitoring System",
    "recipients": ["cto@organistion.com"],
    "severity": "critical"
}
```

Le workflow effectue les opérations suivantes :
- Extrait les détails des destinataires depuis la base de données.
- Extrait le niveau de sévérité depuis les paramètres.
- Déclenche les canaux de notification appropriés.  

À la fin du workflow, les nœuds ```Response``` renvoient un résultat structuré.
Ces valeurs peuvent ensuite être consommées par n'importe quel workflow parent qui déclenche celui-ci.

**Workflow parent**  
Maintenant que le workflow enfant est défini, voyons comment un autre workflow parent peut l'invoquer à l'aide du nœud Workflow.

Nous créons un nouveau workflow qui supprime un objet d'un bucket AWS S3 puis notifie l'équipe AWS de l'organisation.  
Voici un aperçu du workflow parent :

<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/notification-system/sneakPeek.png" alt="Overview" />

Nous ajoutons un nœud qui supprime un objet de S3 et le nommons `removeObjectFromAWSS3`. Puis, depuis ce nœud, nous créons une connexion sortante vers un nœud Run Workflow nommé `notificationSystem`.

Voici la configuration du nœud ```notificationSystem```. Il suit le même format que celui donné dans le workflow enfant :
<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/notification-system/notificationSystemNode.png" alt="Notification System node" />

Une fois le workflow enfant terminé, nous évaluons sa réponse pour déterminer si la notification a réussi. Pour cela, nous utilisons un nœud ```If Condition``` nommé ```checkNotificationSuccess```, qui vérifie :
```notificationSystem.data.success == true```

Après l'exécution du workflow, nous recevrons un e-mail comme celui-ci :

<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/notification-system/successMail.png" alt="Success Mail" />
