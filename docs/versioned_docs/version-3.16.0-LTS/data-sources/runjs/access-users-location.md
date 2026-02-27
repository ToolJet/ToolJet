---
id: access-users-location
title: Accessing User Location with RunJS Query
---

This guide explains how to retrieve a user's location using the **JavaScript Geolocation API** in a **RunJS query** and display it on a **Map component**.

:::info
For privacy reasons, Geolocation requires user permission before locating the device. Upon permission, you gain access to data like latitude, longitude, altitude, and speed.
:::

1. **Create a RunJS query**  
   Add a _Run JavaScript Code_ query and name it `getLocation`.

2. **Add Geolocation logic**  
   Paste the following JavaScript code to employ the Geolocation API and retrieve the user's location:

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

3. **Run on application load**  
   Navigate to **Settings** enable the _Run this query on application load_ option. This ensures that the JavaScript query runs each time the app is opened, providing the user's location.
   <img className="screenshot-full img-full" src="/img/how-to/access-location/v2/appLoad.png" alt="RunJS Query: Run on App Load" />

4. **Grant Location Permission**  
   Upon clicking _Run_, your browser prompts you to grant permission for the ToolJet app to access your location. Allow this permission to receive location data.
   <img className="screenshot-full img-full" src="/img/how-to/access-location/v2/locationPrompt.png" alt="Location Prompt" />

5. **Inspect the Returned Data**  
   Once the query succesfully runs, the coordinates will be returned and displayed in the **Preview** section of query editor. To inspect the data returned by the query, go to the **Inspector** on the left sidebar, expand Queries and click `getLocation` (query name), and open *Preview*.

6. **Add the Map Component**  

    Add a map component to the canvas and edit its properties. In the **Initial location** property, enter:

    ```js
    {{ {"lat": queries.getLocation.data[0], "lng": queries.getLocation.data[1]} }}
    ```
    Optionally, you can set the same value for the *Default markers* property.

    <img className="screenshot-full img-full" src="/img/how-to/access-location/v2/newMap.png" alt="Map component" />

Once the Map component properties are updated, you'll see the location displayed on the map component.
