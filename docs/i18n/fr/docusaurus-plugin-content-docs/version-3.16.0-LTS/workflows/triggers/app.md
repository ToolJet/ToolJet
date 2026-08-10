---
id: app
title: Déclencher depuis une application ToolJet
---

<br/>

Les workflows peuvent être déclenchés depuis l'application ToolJet. Cela fonctionne de manière similaire aux requêtes d'une source de données. Vous pouvez ajouter un déclencheur à une application depuis le panneau de requêtes.

Dans l'application, cliquez simplement sur le bouton **+** dans le panneau de requêtes et sélectionnez **Run Workflow**. Sélectionnez ensuite le workflow souhaité dans la liste déroulante. Renommez la requête si nécessaire et cliquez sur le bouton **Run** pour déclencher le workflow, ou ajoutez cette requête à un gestionnaire d'événement pour déclencher le workflow lors d'un événement spécifique.
  
<img className="screenshot-full img-m" src="/img/workflows/triggers/app/new-query.png" alt="Triggers" />

### Transmission des paramètres

Des paramètres peuvent être transmis au workflow depuis le champ **Params** de la requête. La **clé** et la **valeur** du paramètre peuvent être spécifiées dans le champ **Params**. Par exemple, si vous souhaitez transmettre les paramètres `name` et `age` au workflow depuis l'application, vous pouvez définir le champ **Params** comme suit :

```json
"name": "John Doe",
"age": 30
```

Imaginons un scénario où des équipes gèrent plusieurs applications ToolJet, chacune nécessitant des requêtes vers la même base de données pour des données spécifiques. Plutôt que de dupliquer ces étapes dans chaque application, un workflow peut être créé une seule fois et intégré de manière transparente partout où c'est nécessaire.
<img className="screenshot-full img-full" src="/img/workflows/triggers/app/params.png" alt="Triggers" />

## Configurer un déclencheur de workflow depuis une application ToolJet

### Créer un workflow

Pour créer un workflow, suivez les étapes suivantes :

1. Accédez à la section Workflows depuis la barre de navigation du dashboard.
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/workflows/trigger-from-app/workflow-section.png" alt="Navigate to Workflow Section" />
2. Cliquez sur **Create new workflow**, saisissez un nom unique pour votre workflow, puis cliquez sur **+Create workflow** pour créer le workflow. <br/>
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/workflows/trigger-from-app/new-wf.png" alt="Create a new workflow" />
3. Configurez votre workflow. Vous pouvez consulter la **[documentation de présentation des workflows](/docs/workflows/overview/)** pour savoir comment configurer un workflow.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/workflows/trigger-from-app/configure-wf.png" alt="Configure workflow" />

### Configurer la requête de workflow

1. Dans votre application ToolJet, créez une nouvelle requête et sélectionnez **Run Workflow**.
2. Sélectionnez votre workflow dans la liste déroulante et configurez les paramètres (si nécessaire).
    <img style={{ marginTop: '15px' }} className="screenshot-full img-full" src="/img/workflows/trigger-from-app/wf-query.png" alt="Configure the Query" />
3. Vous pouvez maintenant déclencher ce workflow en cliquant sur le bouton **Run** ou en utilisant des événements.