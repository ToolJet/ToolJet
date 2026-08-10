---
id: js
title: Nœud JavaScript
---

<br/>

Le nœud **JavaScript** vous permet d'exécuter du code JavaScript côté serveur personnalisé au sein de votre workflow. Il peut être utilisé pour :
- Transformer des données
- Effectuer des calculs complexes
- Affiner les réponses
- Mettre en œuvre une logique métier

Ce nœud s'exécute de manière sécurisée sur le serveur, il peut donc gérer la manipulation de données à grande échelle, préparer ou enrichir des données pour les nœuds suivants, ou créer des réponses personnalisées pour des services externes.

**Remarque :** le code doit inclure une instruction return pour transmettre les résultats aux nœuds suivants.

## Exemple 1 : affiner votre réponse avec JavaScript

Affinez votre réponse en manipulant les données à l'aide de fonctions JavaScript. Par exemple, la fonction slice peut être utilisée pour sélectionner un sous-ensemble de données :

```js
return 
    ({sales: getSalesData.data.slice(0,5),
    inventory: getInventory.data.slice(0,5),
    csv: generateCSVData.data})        
```

<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/js/fineTune.png" alt="JS Node Fine Tune" />

## Exemple 2 : attribution automatique de la priorité d'un ticket

Prenons un workflow qui attribue automatiquement une étiquette de priorité à un ticket en fonction de la longueur du message.

<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/js/ticketCategoriser/sneakPeek.png" alt="Ticket Categoriser Sneak Peek" />

Pour cet exemple, les données reçues par le workflow sont dans le format suivant :
```js
{
    "subject": "Login issue",
    "message": "I am unable to access my dashboard since yesterday.",
    "email": "johndoe@gmail.com"
}
```

#### Catégoriser les tâches à l'aide d'un nœud JavaScript
Ajoutez le code suivant au nœud JavaScript. Ce code vérifie la longueur du message et renvoie les paramètres d'origine ainsi qu'une priorité basée sur la longueur du message.

```js
const inputs = startTrigger.params;
const { message } = inputs;
const length = message.length;

let priority;

if (length < 20) {
    priority = "low";
} else if (length < 80) {
    priority = "medium";
} else {
    priority = "high";
}

return {
    inputs, priority
}
```

<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/js/ticketCategoriser/categoriseDataCode.png" alt="categoriseData Code" />

#### Résultat
Le résultat sera un objet contenant le champ d'entrée et la priorité.
<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/js/ticketCategoriser/output.png" alt="Output" />
