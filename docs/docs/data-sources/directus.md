---
id: directus
title: Directus
---

ToolJet can connect to a Directus instance to read and manage items, collections, files, and users using a static access token.

## Connection

1. Open the ToolJet app editor.
2. In the query panel, add a new data source and select **Directus**.
3. Enter the following connection details:

   - **Instance URL**: The base URL of your Directus instance, for example `https://your-instance.directus.app`.
   - **Access token**: A static access token generated in your Directus instance.

4. Click **Test connection** to verify the configuration.
5. Save the data source.

Keep your access token secret. ToolJet stores the token as an encrypted connection field. Use a token with only the permissions needed for your queries.

## Querying Directus

1. Add a query in the query manager.
2. Select your Directus data source.
3. Choose an operation and provide its required parameters.
4. Use **Preview** to inspect the result or **Run** to execute the query.

## Supported operations

### Items

- **List items**: Retrieve items from a collection. You can specify fields, filters, sorting, a result limit, and a search term.
- **Get item by ID**: Retrieve one item by its ID.
- **Create item**: Create an item in a collection by providing its fields and values.
- **Update item**: Update an existing item by ID.
- **Delete item**: Delete an item by ID.

For example, to list published articles, select the collection `articles` and configure a filter equivalent to:

```json
{
  "status": {
    "_eq": "published"
  }
}
```

You can also use query parameters such as `limit`, `sort`, `search`, and `fields`, where supported by the selected operation.

### Collections and fields

- **List collections**: Retrieve the collections available to the connected account.
- **List fields**: Retrieve field metadata for a specified collection.

### Files

- **List files**: Retrieve files, optionally using supported search, sorting, and limit parameters.
- **Upload file**: Upload a file and provide supported metadata such as its title or description.

### Users

- **List users**: Retrieve users permitted by the configured Directus role.
- **Get current user**: Retrieve the user associated with the access token.

## Permissions and troubleshooting

The Directus role associated with the access token must have permission to perform the requested operation. For example, listing items requires read permission for the collection, while creating, updating, or deleting items requires the corresponding permission.

If a query fails:

- Verify that the instance URL is correct and includes `https://` or `http://`.
- Check that the access token is valid and has not expired or been revoked.
- Confirm that the role has the necessary collection, field, file, or user permissions.
- Check the collection name, item ID, and query parameters.
- Review the error returned by Directus for details about the failed request.