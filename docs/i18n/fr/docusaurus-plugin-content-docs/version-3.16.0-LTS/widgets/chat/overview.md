---
id: overview
title: Vue d'ensemble
slug: /widgets/chat/
---

Le **Chat Component** est utilisé pour mettre en œuvre une interface de type chat dans une application. Il peut être intégré à des plugins d'IA pour créer un chatbot doté d'IA, ou utilisé pour des fonctionnalités de chat traditionnelles, ce qui le rend adapté aussi bien aux conversations pilotées par l'IA qu'aux conversations entre humains.

Ce guide explique comment créer un chatbot d'assistance doté d'IA à l'aide du Chat Component. Pour plus de détails, consultez les guides suivants :
- **[Chat Component Properties](/docs/widgets/chat/properties)**
- **[Component Specific Actions (CSA)](/docs/widgets/chat/csa)**
- **[Supported Markdown Syntax](/docs/widgets/chat/markdown)**

## Créer un chatbot doté d'IA

1. Faites glisser un **Chat Component** sur le canevas.

<img className="screenshot-full" src="/img/widgets/chat/component.png" alt="Drag a New Chat Component" />

2. Personnalisez le **Chat Component**.

    a. Saisissez un titre de chat. <br/>
    b. Définissez le chat initial. <br/>
    c. Configurez le nom d'utilisateur et l'avatar. <br/>
    d. Configurez le nom et l'avatar du répondant. <br/>

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/chat/set-component.png" alt="Customize your Chat Component" />

3. Configurez une requête d'IA pour générer des réponses. Consultez le **[marketplace](/docs/marketplace/marketplace-overview)** pour voir tous les plugins disponibles. Vous pouvez également le configurer avec n'importe quelle source de données ou l'utiliser comme un chat entre plusieurs utilisateurs. Pour ce faire, spécifiez le type 'response' dans l'objet message.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/chat/query.png" alt="Setup the AI Query" />

4. Ajoutez un nouveau gestionnaire d'événements pour la requête avec les configurations suivantes :
    - Event : **Query Success**
    - Action : **Control Component**
    - Component : **chat1** *(sélectionnez le nom de votre composant chat dans le menu déroulant.)*
    - Action : **Append History**
    - Message : 
        `{{{message: queries.openai1.data, type:"response"}}}`

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/chat/query-eh.png" alt="Query Event Handler" />

5. Ajoutez maintenant un nouveau gestionnaire d'événements pour le **Chat Component**, avec la configuration suivante :
    - Event : **On Message Sent**
    - Action : **Run Query**
    - Query : **openai1** *(sélectionnez le nom de votre requête d'IA dans le menu déroulant.)*

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/chat/component-eh.png" alt="Component Event Handler" />

6. Pour ajouter l'état de chargement de la réponse, cliquez sur **fx** devant l'option Response loading state et configurez-la avec `{{queries.openai1.isLoading}}`.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/chat/response-loading.png" alt="Add Response Loading State" />

En suivant les étapes ci-dessus, votre chatbot doté d'IA sera prêt.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/chat/final-bot.png" alt="Final Chatbot" />


