---
id: redis
title: Redis
---

# Redis
ToolJet can run Redis commands on your Redis instances.

## Connection

ToolJet requires the following to connect to your Redis instances. 

<img class="screenshot-full" src="/img/redis/connect.png" alt="ToolJet - Redis connection" height="250"/>

- **Host**
- **Port** - The default port for Redis server is 6379
- **Username**
- **Password**

Click on "Test" button to test the connection and click "Save" to save the data source.

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
