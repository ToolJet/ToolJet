---
id: redis
title: Redis
---

ToolJet enables you to execute Redis commands on your Redis instances.

## Connecting to Redis

To connect to a Redis instance, you can either click the **+Add new data source** button on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page in the ToolJet dashboard.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/datasource-reference/redis/connect-v2.png" alt="Redis Connection" />
</div>

**To connect ToolJet with Redis, you need to provide the following connection details:**

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

:::info
Click on the **Test connection** button to verify if the credentials are correct and that the Redis server is accessible to the ToolJet server. Click on the **Save** button to save the data source.
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

<img className="screenshot-full" src="/img/datasource-reference/redis/encode-v2.png" alt="Redis Example Encode" />

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

  <img className="screenshot-full" src="/img/datasource-reference/redis/decode-v2.png" alt="Redis Example Decode" />

  </div>