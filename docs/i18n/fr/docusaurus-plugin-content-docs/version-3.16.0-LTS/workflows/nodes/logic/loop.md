---
id: loop
title: Nœud Loop
---

<br/>

Le nœud **Loop** vous permet d'itérer sur un tableau d'éléments et d'effectuer des actions sur chaque élément au sein de votre workflow. Il est utile lorsque vous devez traiter plusieurs enregistrements, envoyer des notifications en masse ou exécuter des tâches répétitives de manière dynamique.

Avec le nœud Loop, vous pouvez :
- Itérer sur des tableaux renvoyés par des API ou des requêtes de base de données
- Effectuer des actions sur chaque élément individuellement (par exemple, envoyer des e-mails, créer des tâches)
- Combiner avec d'autres nœuds pour agréger les résultats ou gérer les erreurs par élément
- Automatiser efficacement des opérations en masse sans intervention manuelle

Le nœud Loop comporte trois composants importants :

1. **Loop Array** : fait référence au tableau sur lequel le nœud Loop va itérer. Pour définir le tableau de boucle, utilisez : 
    ```js 
      return <your-array>;
    ```

2. **Looped Function** : définit l'action ou l'opération qui doit être exécutée pour chaque élément du tableau de boucle.

3. **Value** : représente l'élément en cours de traitement à chaque itération de la boucle.
On peut y accéder en utilisant le mot-clé `{{value}}`.

3. **Index** : représente l'indice de l'élément en cours de traitement à chaque itération de la boucle.
On peut y accéder en utilisant le mot-clé `{{index}}`.
    <img className="screenshot-full img-full" src="/img/workflows/nodes/logic/loop/example.png" alt="Loop Node Example" />

## Exemple 1 - Workflow de rappel de facture en masse
Prenons un workflow qui envoie automatiquement un e-mail aux fournisseurs ayant des paiements en attente.  

<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/loop/invoiceReminder/sneakPeek.png" alt="Invoice Reminders Sneak Peek" />


**Étape 1 - Récupérer la liste des fournisseurs.**  
Tout d'abord, ajoutez un nœud ToolJet DB (ou toute autre source de données de votre choix) pour récupérer une liste de fournisseurs ayant des factures impayées. Nommez ce nœud ```fetchInvoices```.
Voici un exemple de fournisseur issu de la liste :
```js
{
    "id":1,
    "vendor_name":"Example Enterprise",
    "vendor_email":"example.enterprise@example.com",
    "amount":1000,
    "status":"pending"
}
```

**Étape 2 - Ajouter un nœud Loop pour traiter les fournisseurs.**  
Connectez maintenant un nœud Loop après le nœud *fetchInvoices*.
Dans le champ Loop array, définissez la valeur suivante :
```js
return fetchInvoices.data; // We created fetchInvoices in step 1.   
```
Cela indique au nœud Loop de s'exécuter une fois pour chaque fournisseur de la liste.  
Dans Looped function, choisissez l'action que vous souhaitez effectuer pour chaque fournisseur. Dans cet exemple, nous avons configuré SMTP pour envoyer une notification par e-mail.

<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/loop/invoiceReminder/mailLoop.png" alt="Mail Loop" />

## Exemple 2 - Désactivation en masse d'utilisateurs pour inactivité
Prenons un workflow qui récupère les utilisateurs inactifs pendant une certaine période et les marque comme inactifs.

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/workflows/nodes/logic/loop/deactivateUsers/sneakPeek.png" alt="Mail Loop" />

**Étape 1 - Récupérer les utilisateurs inactifs**  
Créez un nœud ToolJet Database pour récupérer les utilisateurs dont la dernière activité (last_activity) date de plus de 5 jours et dont le statut est *active*, et nommez-le `findOldActiveUsers`. Voici un exemple d'utilisateur issu de la liste.

```js
{
  "id": 3,
  "username": "test_3",
  "last_activity": "2025-12-01T12:04:00+00:00",
  "status": "active"
}
```

<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/loop/deactivateUsers/findOldActiveUsers.png" style={{ marginBottom:'15px' }} alt="Find Old and Active Users" />

**Étape 2 - Créer un nœud Loop**  
Créez un nœud Loop nommé `makeInactive`. Ce nœud parcourra les données renvoyées par **findOldActiveUsers** et passera le statut des utilisateurs à *inactive*.

<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/loop/deactivateUsers/makeInactive.png" alt="Find Old and Active Users" />

