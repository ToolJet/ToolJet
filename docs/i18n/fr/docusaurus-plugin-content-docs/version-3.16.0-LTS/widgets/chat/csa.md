---
id: csa
title: Actions spécifiques au composant et variables exposées
---

Ce guide couvre les actions spécifiques au composant pour le **Chat Component** ainsi que ses variables exposées. Pour apprendre à créer un chatbot, consultez le guide [Chat Component Overview](/docs/widgets/chat/). Pour plus d'informations sur les propriétés du Chat Component, consultez le guide [Properties](/docs/widgets/chat/properties).

## Component Specific Actions (CSA)

| <div style={{ width:'170px' }}> Action </div> | <div style={{ width:'200px' }}> Description </div> | Comment y accéder |
|--------|-------------|---------------|
| sendMessage( ) | Envoie un message dans le chat. | Utilisez une requête RunJS (par ex. `components.chat1.sendMessage({message: "Hey! How can I help you?", type: "response"})`) ou déclenchez-la via un événement. |
| clearHistory( ) | Efface l'historique du chat. | Utilisez une requête RunJS (par ex. `components.chat1.clearHistory()`) ou déclenchez-la via un événement. |
| deleteMessage( ) | Supprime un message à l'aide du MessageID | Utilisez une requête RunJS (par ex. `components.chat1.deleteMessage(MessageID)`) ou déclenchez-la via un événement. |
| downloadChat( ) | Télécharge le chat au format JSON. | Utilisez une requête RunJS (par ex. `components.chat1.downloadChat()`) ou déclenchez-la via un événement. |
| setHistory( ) | Définit l'historique du chat. | Utilisez une requête RunJS (par ex. `components.chat1.setHistory(History Object)`) ou déclenchez-la via un événement. |
| appendHistory( ) | Ajoute à l'historique du chat. | Utilisez une requête RunJS (par ex. `components.chat1.appendHistory(Message Object)`) ou déclenchez-la via un événement. |
| setResponderAvatar( ) | Définit l'avatar du répondant. | Utilisez une requête RunJS (par ex. `components.chat1.setResponderAvatar(Image URL)`) ou déclenchez-la via un événement. |
| setUserAvatar( ) | Définit l'avatar de l'utilisateur. | Utilisez une requête RunJS (par ex. `components.chat1.setUserAvatar(Image URL)`) ou déclenchez-la via un événement. |

## Variables exposées

| Variable | <div style={{ width:'200px' }}> Description </div> | Comment y accéder |
|----------|-------------|---------------|
| history | Accède à l'historique du chat. | Accessible dynamiquement via JS (par ex., `{{components.chat1.history}}`). |
| isHistoryLoading | Indique si l'historique est en cours de chargement. | Accessible dynamiquement via JS (par ex., `{{components.chat1.isHistoryLoading}}`). |
| isResponseLoading | Indique si la réponse est en cours de chargement. | Accessible dynamiquement via JS (par ex., `{{components.chat1.isResponseLoading}}`). |
| isInputDisabled | Indique si le champ de saisie est désactivé. | Accessible dynamiquement via JS (par ex., `{{components.chat1.isInputDisabled}}`). |
| isVisible | Indique si le composant est visible. | Accessible dynamiquement via JS (par ex., `{{components.chat1.isVisible}}`). |
| lastMessage | Contient le dernier objet message de type message dans le tableau. | Accessible dynamiquement via JS (par ex., `{{components.chat1.lastMessage}}`). |
| lastResponse | Contient le dernier objet message de type response dans le tableau. | Accessible dynamiquement via JS (par ex., `{{components.chat1.lastResponse}}`). |
