---
id: use-axios-in-runjs
title: Use Axios in RunJS
---

ToolJet allows you to utilize the three [libraries](/docs/data-sources/run-js#libraries) - **Moment.js**, **Lodash**, and **Axios**. In this guide, we will see a few examples on how to use **Axios** library using RunJS query.

**[Axios](https://axios-http.com/docs/intro)** is a promise-based HTTP library that lets developers make requests to either their own or a third-party server to fetch data. It offers different ways of making requests such as `GET`, `POST`, `PUT/PATCH`, and `DELETE`.

## Making Axios HTTP requests

In this section, you will make `GET` and `PUT` requests. You will be using a free “fake” API: **[JSONPlaceholder](https://jsonplaceholder.typicode.com/)**.

### Making a GET request

Create a RunJS query and copy the code below:

```javascript
var url = "https://jsonplaceholder.typicode.com/users/1";

var data = (await axios.get(url)).data;

return data
```

In the code snippet, a variable url is declared which is assigned the URL of the  JSON API. Then another variable is declared which sends a GET request to the JSON API. Save the query and hit Preview to view the data returned by the API.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/how-to/use-axios/get.png" alt="Use Axios in RunJS"/>

</div>

### Making a POST request

A post request is a little different because you will be passing some data in the request to the server. In the request, you will be creating a user and passing in details for that user. The code snippet for the request will look something like this:

```javascript
var url = "https://jsonplaceholder.typicode.com/users";

var data = axios.post(url,{
  id: 11,
  name: "Shubhendra",
  username: "camelcaseguy",
  email: "shubhendra@tooljet.com",})

return data
```

The Axios POST request uses an object after the request URL to define the properties you want to create for your user. Once the operation has been completed, there will be a response from the server. In the screenshot below, you can see the that it return **Status: 201** which means the request has been fulfilled and resulted in a new resource being created.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/how-to/use-axios/post.png" alt="Use Axios in RunJS"/>

</div>

:::tip
Check out the tutorial on **[Build GitHub star history tracker](https://blog.tooljet.com/build-github-stars-history-app-in-5-minutes-using-low-code/)** that utilizes the axios library.
:::


