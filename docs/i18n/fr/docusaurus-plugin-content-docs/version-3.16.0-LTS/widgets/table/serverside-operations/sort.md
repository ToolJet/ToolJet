---
id: sort
title: Opération de tri
---

Ce guide explique comment mettre en œuvre une opération de tri côté serveur sur le composant **Table** dans ToolJet.

<div style={{paddingTop:'24px'}}>

## Ajouter le composant Table

Avant de mettre en œuvre l'opération de tri, ajoutez le composant **Table** et remplissez-le avec des données :

1. Faites glisser un composant **Table** depuis la bibliothèque de composants à droite vers le canevas.
2. Sélectionnez une source de données et créez une nouvelle requête à l'aide du panneau de requêtes en bas. Nous allons utiliser la source de données d'exemple de ToolJet (Postgres) dans ce guide. Ajoutez la requête suivante pour récupérer les données depuis la base de données :

```sql
SELECT * FROM public.sample_data_orders
LIMIT 100
```

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/fetch-data-query.png" alt="Fetch data from the data source" />

3. Définissez la valeur de la propriété **Data** du composant **Table** sur `{{queries.<query_name>.data}}` pour remplir le composant **Table** avec les données récupérées par la requête.

</div>

<div style={{paddingTop:'24px'}}>

## Tri côté serveur

Suivez les étapes mentionnées pour effectuer une opération de tri côté serveur sur le composant **Table** :

1. Activez Server Side Sort dans les propriétés du composant **Table**.

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/sort-property.png" alt="Fetch data from the data source" />

2. Saisissez la requête suivante :

```sql
SELECT * 
FROM public.sample_data_orders 
{{components.table1.sortApplied ? `
    ORDER BY ${components.table1.sortApplied[0].column} 
    ${components.table1.sortApplied[0].direction}
` : ""}} 
LIMIT 100
```

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/sort-query.png" alt="Fetch data from the data source" /> 

*Remarque : veillez à remplacer table1 par le nom de votre **Table**.*

3. Ajoutez un gestionnaire d'événements au composant **Table** :<br/>
    Événement : **Sort applied**<br/>
    Action : **Run Query**<br/>
    Requête : **Select Your Query**

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/sort-eh.png" alt="Fetch data from the data source" />

Cela exécutera la requête et récupérera les données chaque fois qu'un tri est appliqué.

4. Accédez à la section Additional Actions dans les propriétés du composant Table. Cliquez sur l'icône **fx** à côté de Loading State et saisissez `{{queries.getOrders.isLoading}}` dans le champ pour ajouter un état de chargement. *Remarque : veillez à remplacer getOrders par le nom de votre requête.*

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/sort-loading.png" alt="Fetch data from the data source" />


C'est ainsi que l'opération de tri côté serveur est mise en œuvre dans le composant **Table** de ToolJet. Lorsqu'un tri est appliqué à une colonne du composant **Table**, la requête est exécutée sur le serveur, ce qui permet de trier l'ensemble du jeu de données. Cela garantit que le tri ne se limite pas aux données chargées dans le **Table**, mais couvre tous les enregistrements de la base de données.

</div>
