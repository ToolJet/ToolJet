---
id: access-users-location
title: Accessing User Location with RunJS Query
---

Ce guide explique comment récupérer la position d'un utilisateur en utilisant l'**API JavaScript Geolocation** dans une **requête RunJS** et l'afficher sur un composant Map.

:::info
Pour des raisons de confidentialité, Geolocation nécessite l'autorisation de l'utilisateur avant de localiser l'appareil. Une fois l'autorisation accordée, vous avez accès à des données telles que la latitude, la longitude, l'altitude et la vitesse.
:::

1. **Créer une requête RunJS**
   Ajoutez une requête _Run JavaScript Code_ et nommez-la `getLocation`.

2. **Ajouter la logique de Geolocation**
   Collez le code JavaScript suivant pour utiliser l'API Geolocation et récupérer la position de l'utilisateur :

   ```js
   function getCoordinates() {
     // Function to get coordinates
     return new Promise(function (resolve, reject) {
       // Promise to get coordinates
       navigator.geolocation.getCurrentPosition(resolve, reject); // Get current position
     });
   }

   async function getAddress() {
     // Function to get address
     const position = await getCoordinates(); // Await the coordinates
     let latitude = position.coords.latitude; // Get latitude
     let longitude = position.coords.longitude; // Get longitude

     return [latitude, longitude]; // Return the coordinates
   }

   return await getAddress(); // Return the address
   ```

   <img className="screenshot-full img-full" src="/img/how-to/access-location/v2/getLocationQuery.png" alt="RunJS Query: getLocation" />

3. **Exécuter au chargement de l'application**
   Accédez à **Settings** et activez l'option _Run this query on application load_. Cela garantit que la requête JavaScript s'exécute chaque fois que l'application est ouverte, fournissant ainsi la position de l'utilisateur.
   <img className="screenshot-full img-full" src="/img/how-to/access-location/v2/appLoad.png" alt="RunJS Query: Run on App Load" />

4. **Accorder l'autorisation de localisation**
   En cliquant sur _Run_, votre navigateur vous demandera d'accorder l'autorisation permettant à l'application ToolJet d'accéder à votre position. Autorisez cette permission pour recevoir les données de localisation.
   <img className="screenshot-full img-full" src="/img/how-to/access-location/v2/locationPrompt.png" alt="Location Prompt" />

5. **Inspecter les données renvoyées**
   Une fois la requête exécutée avec succès, les coordonnées seront renvoyées et affichées dans la section **Preview** de l'éditeur de requêtes. Pour inspecter les données renvoyées par la requête, allez dans l'**Inspector** sur la barre latérale gauche, développez Queries et cliquez sur `getLocation` (nom de la requête), puis ouvrez *Preview*.

6. **Ajouter le composant Map**

    Ajoutez un composant map sur le canevas et modifiez ses propriétés. Dans la propriété **Initial location**, saisissez :

    ```js
    {{ {"lat": queries.getLocation.data[0], "lng": queries.getLocation.data[1]} }}
    ```
    Vous pouvez éventuellement définir la même valeur pour la propriété *Default markers*.

    <img className="screenshot-full img-full" src="/img/how-to/access-location/v2/newMap.png" alt="Map component" />

Une fois les propriétés du composant Map mises à jour, vous verrez la position s'afficher sur le composant map.
