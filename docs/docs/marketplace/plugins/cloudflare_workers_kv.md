---
id: marketplace-plugin-cloudflare_workers_kv
title: Cloudflare Workers KV
---

[Cloudflare Workers KV](https://developers.cloudflare.com/kv/) is a global, low-latency key-value data store. The Cloudflare Workers KV plugin lets you manage KV namespaces and read, write, list and delete keys from your ToolJet applications.

## Connection

To connect ToolJet with Cloudflare Workers KV, you need your **Account ID** and an **API token**.

- **Account ID**: In the [Cloudflare dashboard](https://dash.cloudflare.com/), open **Workers & Pages**. The Account ID is shown in the **Account details** section on the right.
- **API token**: Go to **My Profile → API Tokens → Create Token**, choose **Create Custom Token**, and add the following permission:

  | Permission type | Permission          | Access |
  | --------------- | ------------------- | ------ |
  | Account         | Workers KV Storage  | Edit   |

  Use **Read** access instead of **Edit** if the data source only needs the list and read operations.

Enter both values in the data source configuration and click **Test connection**. The API token is stored encrypted.

## Supported Operations

| Operation          | Description                                                              |
| ------------------ | ------------------------------------------------------------------------ |
| List namespaces    | Lists the KV namespaces in the account.                                  |
| Create namespace   | Creates a new namespace.                                                 |
| Get namespace      | Returns the details of a namespace.                                      |
| Rename namespace   | Changes the title of a namespace.                                        |
| Delete namespace   | Deletes a namespace and all the keys in it.                              |
| List keys          | Lists the keys in a namespace, with prefix filtering and cursor paging. |
| Read value         | Returns the value stored for a key.                                      |
| Read key metadata  | Returns the metadata stored with a key.                                  |
| Write value        | Writes a value, with optional expiration and metadata.                   |
| Delete key         | Deletes a key.                                                           |
| Bulk write         | Writes up to 10,000 key-value pairs in one request.                      |
| Bulk read          | Reads up to 100 keys in one request.                                     |
| Bulk delete        | Deletes up to 10,000 keys in one request.                                |

### List Namespaces

**Optional Parameters**

- **Page**: Page number of the results. Defaults to 1.
- **Per page**: Number of namespaces per page, from 1 to 1000. Defaults to 20.
- **Order by**: Sort by `id` or `title`.
- **Direction**: Sort in ascending or descending order.

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```json
{
  "namespaces": [
    {
      "id": "0f2ac74b498b48028cb68387c421e279",
      "title": "My Own Namespace",
      "supports_url_encoding": true
    }
  ],
  "result_info": { "page": 1, "per_page": 20, "count": 1, "total_count": 1 }
}
```

</details>

### Create Namespace

**Required Parameter**

- **Title**: A human-readable name for the namespace.

### Get Namespace

**Required Parameter**

- **Namespace ID**: ID of the namespace.

### Rename Namespace

**Required Parameters**

- **Namespace ID**: ID of the namespace.
- **New title**: The new name for the namespace.

### Delete Namespace

**Required Parameter**

- **Namespace ID**: ID of the namespace to delete.

### List Keys

**Required Parameter**

- **Namespace ID**: ID of the namespace.

**Optional Parameters**

- **Prefix**: Only return keys that start with this prefix.
- **Limit**: Maximum number of keys to return, from 10 to 1000. Defaults to 1000.
- **Cursor**: The `cursor` returned by the previous response. Pass it to fetch the next page of keys. The returned `cursor` is `null` when there are no more pages.

For example, to page through keys, set **Cursor** to `{{queries.listKeys.data.cursor}}` and run the query again.

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```json
{
  "keys": [
    { "name": "user:1", "expiration": 1767225600, "metadata": { "source": "tooljet" } },
    { "name": "user:2" }
  ],
  "cursor": "6Ck1la0VxJ0djhidm1MdX2FyDGxLKVeeHZZmORS_8XeSuhz9SjIJRaSa2lnsF01tQOHrfTGAP3R5X1Kv5iVUuMbNKhWNAXHOl6ePB0TUL8nw",
  "count": 2
}
```

</details>

### Read Value

**Required Parameters**

- **Namespace ID**: ID of the namespace.
- **Key**: Name of the key.

The value is returned as text. If you stored JSON, parse it with `JSON.parse(data.value)` in a transformation.

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```json
{
  "key": "user:1",
  "value": "{\"name\": \"Jane\"}"
}
```

</details>

### Read Key Metadata

**Required Parameters**

- **Namespace ID**: ID of the namespace.
- **Key**: Name of the key.

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```json
{
  "key": "user:1",
  "metadata": { "source": "tooljet" }
}
```

</details>

### Write Value

**Required Parameters**

- **Namespace ID**: ID of the namespace.
- **Key**: Name of the key, up to 512 bytes.
- **Value**: The value to store. Strings are stored as they are; objects and arrays are stored as JSON.

**Optional Parameters**

- **Metadata**: A JSON object, up to 1024 bytes, stored with the key.
- **Expiration**: When the key expires, in seconds since the UNIX epoch.
- **Expiration TTL**: How many seconds from now the key expires. The minimum is 60.

### Delete Key

**Required Parameters**

- **Namespace ID**: ID of the namespace.
- **Key**: Name of the key to delete.

### Bulk Write

**Required Parameters**

- **Namespace ID**: ID of the namespace.
- **Key-value pairs**: A JSON array of up to 10,000 objects. Each object needs a `key` and a `value`, and can include `expiration`, `expiration_ttl`, `metadata` and `base64`.

```json
[
  { "key": "user:1", "value": "Jane" },
  { "key": "user:2", "value": "John", "expiration_ttl": 3600, "metadata": { "role": "admin" } }
]
```

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```json
{
  "successful_key_count": 2,
  "unsuccessful_keys": []
}
```

</details>

### Bulk Read

**Required Parameters**

- **Namespace ID**: ID of the namespace.
- **Keys**: A JSON array of up to 100 key names, for example `["user:1", "user:2"]`.

**Optional Parameters**

- **Value type**: `Text` returns values as strings. `JSON` parses values that were stored as JSON.
- **Include metadata**: Also return each key's metadata.

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```json
{
  "values": {
    "user:1": "Jane",
    "user:2": "John"
  }
}
```

</details>

### Bulk Delete

**Required Parameters**

- **Namespace ID**: ID of the namespace.
- **Keys**: A JSON array of up to 10,000 key names, for example `["user:1", "user:2"]`.

## Errors

If Cloudflare rejects a request, the query fails and shows the error message and code returned by the Cloudflare API, for example `Authentication error (code 10000)` for an invalid API token.
