---
id: redis
title: Redis
---

ToolJet enables you to execute Redis commands on your Redis instances.

## Connecting to Redis

To establish a connection with the Redis global datasource, you have two options. You can either click on the **`+Add new global datasource`** button on the query panel or access the **[Global Datasources](/docs/data-sources/overview)** page from the ToolJet dashboard.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/redis/gdsredis.gif" alt="Redis" />

</div>

**To connect ToolJet with Redis, you need to provide the following connection details:**

- **Host**: The address or hostname of the Redis server
- **Port**: The port number used by the Redis server (default is 6379)
- **Username**: The username used for authentication 
- **Password**: The password used for authentication

:::info
Click on **Test connection** button to verify if the credentials are correct and that the Redis is accessible to ToolJet server. Click on **Save** button to save the data source.
:::

## Redis Queries

Here are some examples of Redis commands and their usage. You can refer to the [Redis Official Documentation](https://redis.io/commands) for a complete list of supported commands.

### PING Command

The `PING` command is used to test the connection to Redis. If the connection is successful, the Redis server will respond with `PONG`.

```shell
PING
```

### SET Command

The `SET` command is used in Redis to assign a value to a specific key.

```shell
SET key value
```

**Example 1/2:**
When the input value contains spaces, you should encode the value before providing it as an input:

```shell
SET products {{encodeURI('John Doe')}}
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/redis/encode.png" alt="Redis" />

</div>

### GET Command

The `GET` command is used in Redis to retrieve the value associated with a specific key.

```shell
GET key
```

**Example 2/2:**
To retrieve a value that was previously encoded while setting, you can use transformations. 

- Enter the GET command in the editor:
  ```shell
  GET products
  ```

- Enable Transformations (JS) and use `decodeURI`:
  ```js
  return JSON.parse(decodeURI(data));
  ```

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/redis/decode.png" alt="Redis" />

  </div>