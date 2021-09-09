---
sidebar_position: 9
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

Click on "Test" button to test the connection and click "Save" to save the datasource.

## Redis Queries

List of supported commands: [Redis Official Documentation](https://redis.io/commands)

### Examples

`PING` command to test the Redis connection. If the connection is ready, the Redis server will respond with `PONG`.

```shell
PING
```

`SET` command can be used to set the value for a key 

```shell
SET key value
```

`GET` command can be used to retrieve the value of a key

```shell
GET key
```