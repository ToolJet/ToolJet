---
id: pagination
title: Pagination
---

Ce guide explique comment effectuer une pagination côté serveur sur un composant **Table** dans ToolJet.

<div style={{paddingTop:'24px'}}>

## Ajouter un composant Table

Avant d'effectuer la pagination côté serveur, ajoutez le composant **Table** et peuplez-le avec des données :

1. Faites glisser un composant **Table** depuis la bibliothèque de composants à droite vers le canevas.
2. Sélectionnez une source de données et créez une nouvelle requête à l'aide du panneau de requêtes en bas. Ce guide utilise la source de données d'exemple de ToolJet (Postgres). Ajoutez la requête suivante pour récupérer les données depuis la base de données :

```sql
SELECT * FROM public.sample_data_orders
LIMIT 100
```

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/fetch-data-query.png" alt="Fetch data from the data source" />

3. Définissez la valeur de la propriété **Data** du composant **Table** sur `{{queries.<query_name>.data}}` pour peupler le composant **Table** avec les données récupérées par la requête.

</div>

<div style={{paddingTop:'24px'}}>

## Pagination côté serveur

Suivez les étapes mentionnées pour effectuer une pagination côté serveur sur le composant **Table** :

1. Activez Server Side Pagination dans les propriétés du composant **Table**.

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-property.png" alt="Fetch data from the data source" />

2. Créez une nouvelle requête pour trouver le nombre total d'enregistrements côté serveur.

```sql
SELECT COUNT(*) FROM public.sample_data_orders
```

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-count.png" alt="Fetch data from the data source" />

3. Accédez à la section Pagination dans les propriétés du composant table, et dans Total record server side, saisissez `{{queries.countOrders.data[0].count}}`. *Remarque : assurez-vous de remplacer countOrders par le nom de la requête que vous avez créée à l'étape précédente.*
    
<img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-total-record.png" alt="Fetch data from the data source" />
    
4. Saisissez la requête suivante :
    
```sql
SELECT * FROM public.sample_data_orders
LIMIT 100 OFFSET {{(components.table1.pageIndex-1)*100}}
```
    
<img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-query.png" alt="Fetch data from the data source" />
    
*Remarque : assurez-vous de remplacer table1 par le nom de votre composant **Table**.*
    
5. Ajoutez un gestionnaire d'événement au composant **Table** :<br/>
    Event : **Page changed**<br/>
    Action : **Run Query**<br/>
    Query : **Select Your Query**
    
<img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-eh.png" alt="Fetch data from the data source" />
    
Cela exécutera la requête et récupérera les données chaque fois que la page change.
    
6. Pour désactiver le bouton de page suivante sur la dernière page, accédez aux propriétés du composant **Table** dans la section Pagination. Cliquez sur l'icône **fx** à côté de Enable next page button et saisissez `{{components.table1.pageIndex<queries.countOrders.data[0].count/100}}` dans le champ.
    
<img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-next-page.png" alt="Fetch data from the data source" />
    
7. Allez dans la section Additional Actions des propriétés du composant Table. Cliquez sur l'icône **fx** à côté de Loading State et saisissez `{{queries.getOrders.isLoading}}` dans le champ pour ajouter un état de chargement. *Remarque : assurez-vous de remplacer getOrders par le nom de votre requête.*

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-loading.png" alt="Fetch data from the data source" />

Voici comment la pagination côté serveur est implémentée dans le composant **Table** de ToolJet. Lorsque la pagination est utilisée, la requête est exécutée sur le serveur, récupérant uniquement l'ensemble d'enregistrements pertinent pour la page actuelle. Cela garantit que les données sont récupérées efficacement depuis le serveur, plutôt que de charger l'ensemble des données en une seule fois, améliorant ainsi les performances et la scalabilité.

</div>
