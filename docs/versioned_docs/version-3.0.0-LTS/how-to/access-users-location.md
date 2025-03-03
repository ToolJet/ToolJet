---
id: access-users-location
title: Accessing User Location with RunJS Query
---
<div style={{paddingBottom:'24px'}}>

In this step-by-step guide we will build a ToolJet application that harnesses the power of the **JavaScript Geolocation API** to retrieve the user's location. The Geolocation API offers access to various geographical data associated with a user's device, utilizing methods such as GPS, WIFI, IP Geolocation, and more.

:::info
To uphold user privacy, the Geolocation API requests permission before locating the device. Upon permission, you gain access to data like latitude, longitude, altitude, and speed.
:::

</div>

1. Begin by creating a new application:
  <div style={{textAlign: 'center'}}>
   <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/access-location/newapp.png" alt="How to: Access User's Location" />
  </div>

2. In the app editor, navigate to the query panel at the bottom and create a **[RunJS query](/docs/data-sources/run-js/#runjs-query-examples)** by selecting **Run JavaScript Code** as the datasource:
  <div style={{textAlign: 'center'}}>
   <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/access-location/runjsq.png" alt="How to: Access User's Location" />
  </div>

3. Utilize the following JavaScript code to employ the Geolocation API and retrieve the location:
  ```js
  function getCoordinates() {  // Function to get coordinates
    return new Promise(function (resolve, reject) { // Promise to get coordinates
        navigator.geolocation.getCurrentPosition(resolve, reject);  // Get current position
    });
  }
  
  async function getAddress() {  // Function to get address
    const position = await getCoordinates(); // Await the coordinates
    let latitude = position.coords.latitude;  // Get latitude
    let longitude = position.coords.longitude;  // Get longitude
    
    return [latitude, longitude]; // Return the coordinates
  }
  
  return await getAddress();  // Return the address
  ```

4. Scroll down the query editor and from **Settings** enable the `Run this query on application load?` option. This ensures that the JavaScript query runs each time the app is opened, providing the user's location.

5. Upon clicking **Run**, your browser prompts you to grant permission for the ToolJet app to access your location. Allow this permission to receive location data.
  <div style={{textAlign: 'center'}}>
   <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/access-location/newprompt.png" alt="How to: Access User's Location" />
  </div>

7. Once the query is succesfully run, the coordinates will be returned and displayed in the **Preview** section of query editor. To inspect the data returned by the query, go to the **Inspector** on the left sidebar, expand queries -> `runjs1` (query name), and then examine the **data**. You'll find the coordinates.
  <div style={{textAlign: 'center'}}>
   <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/access-location/newdata.png" alt="How to: Access User's Location" />
  </div>

8. Utilize these coordinates in the **map component** to display the location. Add a map component to the canvas and edit its properties. In the **Initial location** property, enter:
  ```js
  {{ {"lat": queries.runjs1.data[0], "lng": queries.runjs1.data[1]} }}
  ```
  
  <div style={{textAlign: 'center'}}>
   <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/access-location/newmap.png" alt="How to: Access User's Location" />
  </div>

9. Once the Map component properties are updated, you'll see the location displayed on the **map component**. 