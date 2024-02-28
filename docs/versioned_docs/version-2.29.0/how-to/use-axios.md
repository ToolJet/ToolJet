---
id: use-axios-in-runjs
title: Use Axios in RunJS
---

ToolJet supports three libraries: **Moment.js**, **Lodash**, and **Axios**. This guide focuses on using the Axios library with RunJS queries. **[Axios](https://axios-http.com/docs/intro)** is a promise-based HTTP client for making requests to your own or external servers. It supports various request types like `GET`, `POST`, `PUT/PATCH`, and `DELETE`.

## GET Requests

We'll use **[JSONPlaceholder](https://jsonplaceholder.typicode.com/)**, a free API, to demonstrate GET and PUT requests.

- Create a RunJS query and paste the code below:

```javascript
var url = "https://jsonplaceholder.typicode.com/users/1";

var data = (await axios.get(url)).data;

return data
```

*This code sets up a URL variable, makes a GET request to the API, and returns the data. Preview the query to see the API's response.*

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/how-to/use-axios/get.png" alt="Use Axios in RunJS"/>

</div>

## POST Requests

- Create a RunJS query and paste the code below:

```javascript
var url = "https://jsonplaceholder.typicode.com/users";

var data = axios.post(url,{
  id: 11,
  name: "Shubhendra",
  username: "camelcaseguy",
  email: "shubhendra@tooljet.com",})

return data
```

This POST request sends user details to the server. The server's response, as shown below, includes **Status: 201** indicating successful resource creation.


<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/how-to/use-axios/post.png" alt="Use Axios in RunJS"/>

</div>

To see Axios in action in a project, check out this tutorial:
**[Build GitHub star history tracker](https://blog.tooljet.com/build-github-stars-history-app-in-5-minutes-using-low-code/)**.


