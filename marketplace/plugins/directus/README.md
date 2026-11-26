# Directus

The Directus marketplace plugin connects ToolJet to a Directus instance using a static access token.

## Configuration

- **Instance URL**: The base URL of your Directus instance, such as `https://your-instance.directus.app`.
- **Access token**: A Directus static access token. This field is configured as encrypted.

Use a token with only the permissions required for your application.

## Supported operations

- List, retrieve, create, update, and delete items.
- List collections and fields.
- List and upload files.
- List users and retrieve the current user.

The available operations depend on the permissions assigned to the Directus role associated with the token.

## Documentation

See the [Directus data source guide](https://docs.tooljet.com/docs/data-sources/directus) for setup instructions, examples, and troubleshooting.