---
id: redis
title: Redis
---

ToolJet enables you to execute Redis commands on your Redis instances.

<div style={{paddingTop:'24px'}}>

## Connecting to Redis

To establish a connection with the Redis data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page from the ToolJet dashboard and choose Redis as the data source.

<img className="screenshot-full" src="/img/datasource-reference/redis/connect-v3.png" alt="Redis Connection" style={{marginBottom:'15px'}} />

To connect ToolJet with Redis, you need to provide the following connection details:

- **Host**: The address or hostname of the Redis server.
- **Port**: The port number used by the Redis server (default is 6379).
- **Username**: The username used for authentication.
- **Password**: The password used for authentication.
- **TLS**: Toggle to enable/disable TLS connection.
- **TLS Certificate**: Choose the type of TLS certificate (None, CA certificate, or Client certificate).

</div>

<div style={{paddingTop:'24px'}}>

## Querying Redis

1. Click on **+** button of the query manager at the bottom panel of the editor.
2. Select the **Redis** datasource added in previous step.
3. Enter the query.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

Here are some examples of Redis commands and their usage. You can refer to the [Redis Official Documentation](https://redis.io/commands) for a complete list of supported commands.

## Supported Operations

### PING Command

The `PING` command is used to test the connection to Redis. If the connection is successful, the Redis server will respond with **PONG**.

```shell
PING
```

<img className="screenshot-full" src="/img/datasource-reference/redis/ping-v2.png" alt="Redis Connection" style={{marginBottom:'15px'}} />

<details>
<summary>**Example Value**</summary>
```yaml
      PING
```
</details>

<details>
<summary>**Example Response**</summary>
```json
      PONG
```
</details>

### SET Command

The `SET` command is used in Redis to assign a value to a specific key.

```shell
SET key value
```

<img className="screenshot-full" src="/img/datasource-reference/redis/encode-v3.png" alt="Redis Example Encode" style={{marginBottom:'15px'}} />

<details>
<summary>**Example Value**</summary>
```yaml
      SET example Redis
```
</details>

<details>
<summary>**Example Response**</summary>
```json
      OK
```
</details>

### GET Command

The `GET` command is used in Redis to retrieve the value associated with a specific key.

```shell
GET key
```
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/redis/decode-v3.png" alt="Redis Example Decode" />

  </div>
  
</div>

<details>
<summary>**Example Value**</summary>
```yaml
      GET Redis
```
</details>

<details>
<summary>**Example Response**</summary>
```json
      Completed // Will be presented at "All Logs" section under Debugger.
```
</details>