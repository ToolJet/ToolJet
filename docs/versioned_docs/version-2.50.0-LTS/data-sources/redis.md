---
id: redis
title: Redis
---

ToolJet enables you to execute Redis commands on your Redis instances.

<div style={{paddingTop:'24px'}}>

## Connecting to Redis

To establish a connection with the Redis data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page from the ToolJet dashboard and choose Redis as the data source.

<img className="screenshot-full" src="/img/datasource-reference/redis/connect-v2.png" alt="Redis Connection" style={{marginBottom:'15px'}} />

To connect ToolJet with Redis, you need to provide the following connection details:

- **Host**: The address or hostname of the Redis server.
- **Port**: The port number used by the Redis server (default is 6379).
- **Username**: The username used for authentication.
- **Password**: The password used for authentication.
- **TLS**: Toggle to enable/disable TLS connection.
- **TLS Certificate**: Choose the type of TLS certificate (None, CA certificate, or Client certificate).

Depending on the TLS certificate option selected, you may need to provide additional information:
- For **CA certificate**:
  - **CA Cert**: The CA certificate for TLS connection.
- For **Client certificate**:
  - **CA Cert**: The CA certificate for TLS connection.
  - **Client Key**: The client key for TLS connection.
  - **Client Cert**: The client certificate for TLS connection.

</div>

<div style={{paddingTop:'24px'}}>

## Querying Redis

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Redis** datasource added in previous step.
3. Enter the query.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

Here are some examples of Redis commands and their usage. You can refer to the [Redis Official Documentation](https://redis.io/commands) for a complete list of supported commands.

### PING Command

The `PING` command is used to test the connection to Redis. If the connection is successful, the Redis server will respond with **PONG**.

```shell
PING
```

<img className="screenshot-full" src="/img/datasource-reference/redis/ping.png" alt="Redis Connection" style={{marginBottom:'15px'}} />

### SET Command

The `SET` command is used in Redis to assign a value to a specific key.

```shell
SET key value
```

#### Example
When the input value contains spaces, you should encode the value before providing it as an input:

```shell
SET products {{encodeURI('John Doe')}}
```

<img className="screenshot-full" src="/img/datasource-reference/redis/encode-v2.png" alt="Redis Example Encode" style={{marginBottom:'15px'}} />

### GET Command

The `GET` command is used in Redis to retrieve the value associated with a specific key.

```shell
GET key
```

#### Example
To retrieve a value that was previously encoded while setting, you can use transformations.

1. Enter the GET command in the editor:
  ```shell
  GET products
  ```

2. Enable Transformations (JS) and use `decodeURI`:

  ```js
  return JSON.parse(decodeURI(data));
  ```

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/redis/decode-v2.png" alt="Redis Example Decode" />

  </div>
  
</div>
