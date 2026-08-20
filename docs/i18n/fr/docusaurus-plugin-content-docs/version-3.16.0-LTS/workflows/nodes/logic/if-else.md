---
id: if-else
title: Nœud If Condition
---

Le nœud **If Condition** vous permet de créer une logique conditionnelle dans votre workflow. Il évalue une expression ou une condition JavaScript et oriente l'exécution du workflow selon que la condition est vraie ou fausse. Cela vous permet de contrôler le flux de manière dynamique, en permettant différents chemins selon les données, les événements ou les entrées utilisateur.

Cas d'usage courants :

- Créer des branches dans les workflows en fonction des entrées utilisateur ou des valeurs de réponse d'API
- Exécuter différents ensembles d'actions selon des conditions sur les données
- Gérer séparément les chemins de succès et d'erreur
- Mettre en place une logique de décision complexe

Lorsque la condition s'évalue à true, le nœud sortant connecté à la flèche verte est exécuté. Si elle est false, le nœud sortant connecté à la flèche rouge est exécuté.

<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/if/example.png" alt="If Else Node Example" />

## Exemple : workflow d'approbation de remboursement par montant

Prenons un workflow d'émission de remboursements. Si le montant est inférieur à 500 $, il est approuvé automatiquement, sinon le service financier reçoit un e-mail pour approbation.  

<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/if/reimbursementApproval/sneakPeek.png" alt="Reimburement Approval Sneak Peek" />

#### Entrée  
Pour cet exemple, les données reçues par le workflow sont dans le format suivant :
```js
{
  "employeeID": 1,
  "amount": 2000,
  "reason": "Travel"
}
```

#### Ajouter le nœud If Condition
- Créez un nœud ```If condition``` sortant depuis le nœud trigger.**  
- Ajoutez la condition suivante au nœud : <br /> <br />
  ```js 
  startTrigger.params.amount < 500 
  ```
Cliquez sur *Preview* pour voir ce que le nœud va évaluer.

  <img className="screenshot-full img-m" src="/img/workflows/nodes/logic/if/reimbursementApproval/amountCondition.png" alt="If condition" />


Vous pouvez maintenant créer des actions de succès ou d'échec selon vos besoins. Dans cet exemple, lorsque la condition s'évalue à true, le remboursement est automatiquement approuvé. Lorsqu'elle s'évalue à false, le workflow poursuit en notifiant le service financier.

