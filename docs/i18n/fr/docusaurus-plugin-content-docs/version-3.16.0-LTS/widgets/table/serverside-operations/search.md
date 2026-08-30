---
id: search
title: Opération de recherche
---

Ce guide explique comment effectuer une opération de recherche côté serveur sur le composant **Table** dans ToolJet.

<div style={{paddingTop:'24px'}}>

## Ajouter le composant Table

Avant d'effectuer l'opération de recherche, ajoutez le composant **Table** et remplissez-le avec des données :

1. Faites glisser un composant **Table** depuis la bibliothèque de composants à droite vers le canevas.
2. Sélectionnez une source de données et créez une nouvelle requête à l'aide du panneau de requêtes en bas. Nous allons utiliser la source de données d'exemple de ToolJet (Postgres) dans ce guide. Ajoutez la requête suivante pour récupérer les données depuis la base de données :
    
```sql
SELECT * FROM public.sample_data_orders
LIMIT 100
```
    
<img className="screenshot-full img-full" src="/img/widgets/table/serverside-operations/fetch-data-query.png" alt="Fetch data from the data source" />
    
3. Définissez la valeur de la propriété **Data** du composant **Table** sur `{{queries.<query_name>.data}}` pour remplir le composant **Table** avec les données récupérées par la requête.

</div>

<div style={{paddingTop:'24px'}}>

## Recherche côté serveur

Suivez les étapes mentionnées pour effectuer une opération de recherche côté serveur sur le composant **Table** :

1. Activez Server side Search dans les propriétés du composant **Table**.
    
<img className="screenshot-full" src="/img/widgets/table/serverside-operations/search-property.png" alt="Enable server side search operation" />
    
2. Saisissez la requête suivante
    
```sql
SELECT * FROM public.sample_data_orders
WHERE city ILIKE '%{{components.table1.searchText}}%' OR
    country ILIKE '%{{components.table1.searchText}}%' OR
    state ILIKE '%{{components.table1.searchText}}%'
LIMIT 100
```
    
<img className="screenshot-full" src="/img/widgets/table/serverside-operations/search-query.png" alt="Enter the query" />
    
La requête ci-dessus recherche le texte recherché dans les colonnes city, state et country côté serveur et renvoie les données. *Remarque : veillez à remplacer table1 par le nom de votre composant **Table**.*
    
3. Ajoutez un gestionnaire d'événements au composant **Table** :<br/>
    Événement : **Search**<br/>
    Action : **Run Query**   
    Requête : **Select Your Query**<br/>
    
<img className="screenshot-full" src="/img/widgets/table/serverside-operations/search-eh.png" alt="Add event handler" />
    
Cela exécutera la requête et récupérera les données chaque fois qu'une recherche est effectuée.
    
4. Accédez à la section Additional Actions dans les propriétés du composant Table. Cliquez sur l'icône **fx** à côté de Loading State et saisissez `{{queries.getOrders.isLoading}}` dans le champ pour ajouter un état de chargement. *Remarque : veillez à remplacer getOrders par le nom de votre requête.*
    
<img className="screenshot-full" src="/img/widgets/table/serverside-operations/search-loading.png" alt="Add loading state" />

C'est ainsi que l'opération de recherche côté serveur est mise en œuvre dans le composant **Table** de ToolJet. Désormais, lorsqu'une recherche est effectuée dans le composant **Table**, la requête est exécutée sur le serveur, ce qui permet d'appliquer la recherche à l'ensemble du jeu de données.

</div>
