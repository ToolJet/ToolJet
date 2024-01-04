---
id: access-users-location
title: Access a user's location
---

# Access a user's location using RunJS query (Geolocation API)

In this how-to guide, we will build a ToolJet application that will utilize the **JavaScript Geolocation API** to get the user's location. The Geolocation API provides access to geographical location data associated with a user's device. This can be determined using GPS, WIFI, IP Geolocation and so on.

:::info
To protect the user's privacy, Geolocation API requests permission to locate the device. If the user grants permission, you will gain access to location data such as latitude, longitude, altitude, and speed. 
:::

- Let's start by creating a new application

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/access-location/newapp.png" alt="New App" />

    </div>

- In the app editor, go to the query panel at the bottom and create a **[RunJS query](/docs/2.4.0/data-sources/run-js/#runjs-query-examples)** by selecting **Run JavaScript Code** as the datasource

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/access-location/runjs.png" alt="New App" />

    </div>

- You can use the following javascript code that makes use of geolocation api to get the location

    ```js
    function getCoordinates() {
    return new Promise(function(resolve, reject) {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    }

    async function getAddress() {
    // notice, no then(), cause await would block and 
    // wait for the resolved result
    const position = await getCoordinates(); 
    let latitude = position.coords.latitude;
    let longitude = position.coords.longitude;

    return [latitude, longitude];  
    }

    return await getAddress()
    ```

- Now, go to the **Advanced** tab and enable the `Run query on page load?` option. Enabling this option will run this javascript query every time the app is opened by the user and the query will return the location

- **Save** the query and hit the fire button

- As soon as you hit the fire button, the browser will prompt you to allow the permission to share the location access to ToolJet app. You'll need to **allow** it to return the location data

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/access-location/prompt.png" alt="New App" />

    </div>

- Now, to check the data returned by the query go to the **Inspector** on the left sidebar. Expand the queries -> `runjs1`(query name) -> and then expand the **data**. You'll find the coordinates

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/access-location/data.png" alt="New App" />

    </div>

- Next, we can use these coordinates returned by the query on the **map component** to show the location. Drop a map component on the canvas and edit its properties. In the **Initial location** property, enter

    ```js
    {{ {"lat": queries.runjs1.data[0], "lng": queries.runjs1.data[1]} }}
    ```

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/access-location/map.png" alt="New App" />

    </div>

- Finally, you'll see the location updated on the **map component**

