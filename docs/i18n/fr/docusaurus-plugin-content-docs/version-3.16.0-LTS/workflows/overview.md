---
id: overview
title: Aperçu
---

<PlanBadge type="self-hosted" />

Les Workflows ToolJet permettent aux utilisateurs de créer des automatisations complexes et centrées sur les données grâce à une interface visuelle basée sur des nœuds. Ils sont conçus pour simplifier les tâches répétitives, organiser des opérations multi-étapes et rendre les outils internes plus intelligents et plus efficaces.

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/workflows/overview/v2/workflows-preview.png" alt="Workflows Preview" />

### Cas d'usage
- Envoi automatique d'e-mails ou de notifications en fonction des actions des utilisateurs.
- Mise à jour de plusieurs bases de données ou API après un seul événement.
- Traitement automatique des approbations, des tickets ou des soumissions de formulaires.
- Orchestration de processus internes complexes entre outils et équipes.


### Déclenchement des workflows

Les workflows peuvent être déclenchés des façons suivantes :
1. **Depuis les applications ToolJet** – Déclenchez des workflows via des actions dans l'application, comme des clics de bouton ou des soumissions de formulaire.
2. **Via des webhooks** – Démarrez des workflows en recevant des requêtes HTTP provenant de systèmes externes.
3. **Via le planificateur (Scheduler)** – Automatisez des tâches récurrentes à intervalles définis.

### Ajout de logique

Enrichissez vos workflows avec des nœuds de logique pour gérer différents scénarios :
- **Nœud If-Else** – Créez des branches conditionnelles en fonction de vos données.
- **Nœud Loop** – Itérez sur des listes ou des ensembles de données pour effectuer des actions répétées.

:::note
Vous pouvez configurer le délai d'expiration (timeout) et les limites de mémoire des workflows à l'aide de variables d'environnement. Consultez ce [guide](/docs/setup/env-vars#customizing-workflow-configuration) pour plus de détails.
:::

### Créer votre premier workflow

Ce guide vous accompagne dans la création de votre premier workflow dans ToolJet. Vous apprendrez à utiliser le Workflow builder pour créer un processus automatisé simple qui récupère des données depuis une base de données, les filtre et envoie des notifications selon certaines conditions.

#### Étape 1 : Ajouter un nœud de requête de base de données

Vous allez commencer par récupérer les données des employés depuis une table ToolJetDB nommée *employees*.

- Vous verrez un nœud **Start** déjà présent sur le canevas. C'est le point d'entrée de votre workflow.
- Créez un nœud sortant à partir du nœud **Start**, et sélectionnez le nœud **ToolJetDB**. Renommez le nœud en *getEmployees*.
- Sélectionnez *employees* comme nom de table et List view comme opération.

<img className="screenshot-full img-full" src="/img/workflows/overview/getEmp.png" alt="Add a DB Query Node" />

#### Étape 2 : Transformer les données avec le nœud RunJS

Vous allez maintenant filtrer les données des employés pour ne garder que ceux qui viennent de Californie.

- Créez un nœud sortant à partir du nœud *getEmployees*, et sélectionnez le nœud **RunJS**. Renommez-le en *filterEmployeeList*.
- Saisissez le code ci-dessous pour filtrer les employés qui viennent de Californie.

```js
return getEmployees.data.filter(employee =>
  employee.location === "California")
 ```

<img className="screenshot-full img-full" src="/img/workflows/overview/filterEmp.png" alt="Transform Data Using RunJS" />

#### Étape 3 : Envoyer des notifications

Vous allez maintenant mettre en place une boucle pour envoyer des notifications SMS aux employés filtrés. Le nœud Loop vous permet d'itérer sur un tableau et d'effectuer une opération sur chaque élément.

- Créez un nœud sortant à partir du nœud **filterEmployeeList**, et sélectionnez le nœud **Loop**. Renommez-le en *sendSMS*.
- Dans Looped function, sélectionnez **Twilio** comme source de données. Configurez l'opération sur Send SMS, saisissez `{{value.number}}` dans le champ To Number.
- Dans le champ Body, saisissez le message suivant :

```js
Hey {{value.name}},
Here's the link with all the details for today's ToolJet 
conference in California.
https://tooljet.com/events/{{value.location}}
```

<img className="screenshot-full img-full" src="/img/workflows/overview/sendSMS.png" alt="Send Notifications Through Twilio" />

#### Étape 4 : Configurer le nœud Response

Enfin, vous allez configurer des conditions pour gérer la réussite ou l'échec de l'envoi des SMS.

- Créez un nouveau nœud sortant **If condition** à partir du nœud *sendSMS*.
- Saisissez ceci dans le champ de saisie :
`sendSMS.status === "ok" ? true : false`
- Créez un nœud sortant **Response** à partir de la flèche verte pour configurer la réponse lorsque le nœud **If condition** retourne true.
 Saisissez le code suivant pour afficher un résultat de succès lorsque le SMS a bien été envoyé :
`return ({output: "success"})`
- De même, créez un nœud sortant **Response** à partir de la flèche rouge pour configurer la réponse lorsque le nœud **If condition** retourne false. Saisissez le code suivant :
`return ({output: "failure"})`

<img className="screenshot-full img-full" src="/img/workflows/overview/first-wf.png" alt="Configure The Response Node" />

#### Étape 5 : Exécuter le workflow

Cliquez sur le bouton **Run** en haut à droite pour exécuter le workflow. Le panneau des logs se déploiera et présentera un aperçu de tous les nœuds exécutés dans ce workflow.

Félicitations, vous avez créé votre premier workflow ! Ce workflow récupère des données, les transforme, envoie des notifications SMS et gère les réponses de succès ou d'échec.

Comme vous avez pu le constater dans cet exemple, les Workflows ToolJet offrent un moyen simple d'étendre les capacités de vos applications ToolJet et d'automatiser des processus complexes.

