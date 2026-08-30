---
id: filter
title: Filter Operation
---

Ce guide explique comment implémenter une opération de filtrage côté serveur sur le composant **Table** dans ToolJet.

<div style={{paddingTop:'24px'}}>

## Ajouter un composant Table

Avant d'implémenter l'opération de filtrage, ajoutez le composant **Table** et peuplez-le avec des données :

1. Faites glisser un composant **Table** depuis la bibliothèque de composants à droite vers le canevas.
2. Sélectionnez une source de données et créez une nouvelle requête à l'aide du panneau de requêtes en bas. Nous allons utiliser la source de données d'exemple de ToolJet (Postgres) dans ce guide. Ajoutez la requête suivante pour récupérer les données depuis la base de données :

```sql
SELECT * FROM public.sample_data_orders
LIMIT 100
```

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/fetch-data-query.png" alt="Fetch data from the data source" />

3. Définissez la valeur de la propriété **Data** du composant **Table** sur `{{queries.<query_name>.data}}` pour peupler le composant **Table** avec les données récupérées par la requête.

</div>

<div style={{paddingTop:'24px'}}>

## Filtre côté serveur

Suivez les étapes mentionnées pour effectuer une opération de filtrage côté serveur sur le composant **Table** :

1. Activez Server Side Filter dans les propriétés du composant **Table**.

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-property.png" alt="Fetch data from the data source" />

2. Créez une nouvelle requête **RunJS** pour créer dynamiquement des requêtes SQL pour les filtres.

```js
const filterData = components.table1.filters;
    
const createSQLQueries = (filters) => {
    
  let conditions = '';
    
  filters.forEach(({ condition, value, column }, index) => {
    
   const prefix = index === 0 ? 'WHERE' : 'AND';
    
    switch (condition) {
      case "contains":
        conditions += ` ${prefix} ${column} ILIKE '%${value}%'`;
        break;
      case "doesNotContains":
        conditions += ` ${prefix} ${column} NOT ILIKE '%${value}%'`;
        break;
      case "matches":
      case "equals":
        conditions += ` ${prefix} ${column} = '${value}'`;
        break;
      case "ne":
        conditions += ` ${prefix} ${column} != '${value}'`;
        break;
      case "nl":
        conditions += ` ${prefix} ${column} IS NULL`;
        break;
      case "isEmpty":
        conditions += ` ${prefix} ${column} = ''`;
        break;
      default:
        throw new Error(`Unsupported condition: ${condition}`);
    }
  });
    
const mainQuery = `SELECT * FROM public.sample_data_orders ${conditions}`;
    
return { mainQuery };
    
}
    
return createSQLQueries(filterData);
```

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-js-query.png" alt="Fetch data from the data source" />

3. Ajoutez un gestionnaire d'événement à la requête **RunJS**<br/>
    Event : **Query Success**<br/>
    Action : **Run Query**<br/>
    Query : **Select Your Query**

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-query-eh.png" alt="Fetch data from the data source" />

4. Saisissez la requête suivante :
```sql
  {{queries.runjs1.data.mainQuery}}
```

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-query.png" alt="Fetch data from the data source" />

5. Ajoutez un gestionnaire d'événement au composant **Table** :<br/>
    Event : **Filter Changed**<br/>
    Action : **Run Query**<br/>
    Query : **Select Your RunJS Query**

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-eh.png" alt="Fetch data from the data source" />

Cela exécutera la requête et récupérera les données chaque fois qu'un filtre change.

6. Allez dans la section Additional Actions des propriétés du composant Table. Cliquez sur l'icône **fx** à côté de Loading State et saisissez `{{queries.getOrders.isLoading}}` dans le champ pour ajouter un état de chargement. *Remarque : assurez-vous de remplacer getOrders par le nom de votre requête.*

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-loading.png" alt="Fetch data from the data source" />

Voici comment le filtrage côté serveur est implémenté dans le composant **Table** de ToolJet. Lorsqu'un ou plusieurs filtres sont appliqués au composant **Table**, la requête est exécutée sur le serveur, ce qui garantit que le filtrage affecte tous les enregistrements de l'ensemble de données, et non seulement les données actuellement chargées dans le composant **Table**.

</div>
