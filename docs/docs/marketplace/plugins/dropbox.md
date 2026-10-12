---
id: marketplace-plugin-dropbox
title: Dropbox
---

ToolJet allows you to connect to Dropbox and manage files and folders directly from your applications.

:::info
**NOTE:** Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

To connect to Dropbox in ToolJet, click the **+ Add new data source** button in the query panel or navigate to the **Data Sources** page in the ToolJet dashboard.

Dropbox uses **OAuth 2.0** authentication.

### Create a Dropbox app

1. Open the Dropbox App Console.
2. Create a new app using **Scoped access**.
3. Choose the Dropbox access level required for your application.
4. Copy the **App key** and **App secret** from the app settings.
5. Add the redirect URI shown by ToolJet to the **OAuth 2 Redirect URIs** section of your Dropbox app.

For all operations supported by this plugin, enable these Dropbox permissions:

```text
account_info.read
files.metadata.read
files.metadata.write
files.content.read
files.content.write
sharing.write
```

### Connect ToolJet

Enter the following credentials:

- **Client ID**: your Dropbox App key
- **Client Secret**: your Dropbox App secret

Then authorize the connection with Dropbox.

The plugin requests offline access so Dropbox can provide a refresh token. ToolJet can then automatically obtain a new access token when the current access token expires.

## Supported Operations

The Dropbox plugin supports the following operations:

- Get current account
- List folder contents
- Get file/folder metadata
- Upload file
- Download file
- Create folder
- Move file/folder
- Copy file/folder
- Delete file/folder
- Search files
- Create shared link

### Get current account

Returns information about the Dropbox account connected to the data source.

### List folder contents

Returns the files and folders inside a Dropbox path.

Use an empty path to list the Dropbox root.

Example:

```text
/Documents
```

### Get file/folder metadata

Returns metadata for a specific Dropbox file or folder.

Example:

```text
/Documents/report.pdf
```

### Create folder

Creates a new folder at the specified Dropbox path.

Example:

```text
/ToolJet
```

### Move file/folder

Moves a file or folder from one Dropbox path to another.

Required fields:

- **From path**
- **To path**

### Copy file/folder

Copies a file or folder from one Dropbox path to another.

Required fields:

- **From path**
- **To path**

### Delete file/folder

Deletes the file or folder at the specified Dropbox path.

### Search files

Searches Dropbox for files and folders that match the provided query.

You can optionally provide a Dropbox path to limit the search to a specific folder.


### Upload file

Uploads data to the specified Dropbox path.

Required fields:

- **Path**
- **File data**

The plugin supports two encodings:

- `utf8` for normal text
- `base64` for binary files such as images and PDFs

Example text upload:

```text
Path: /hello.txt
Encoding: utf8
File data: Hello from ToolJet
```

For binary files, provide Base64-encoded file data and use:

```text
Encoding: base64
```

### Download file

Downloads a file from Dropbox.

The response includes:

- `metadata` — Dropbox file metadata
- `content` — the file contents encoded as Base64
- `encoding` — `base64`

Returning Base64 allows binary files such as images and PDFs to be downloaded without corrupting their contents.

### Create shared link

Creates a shared Dropbox link for the specified file or folder.

## OAuth Token Refresh

Dropbox access tokens are short-lived.

The plugin requests offline access during OAuth authorization so Dropbox can issue a refresh token. When an access token expires, ToolJet can use the refresh token to obtain a new access token automatically.

If access to the Dropbox app is revoked, reconnect the data source.

## Troubleshooting

### Missing scope

If Dropbox returns a `missing_scope` error:

1. Open your Dropbox app in the Dropbox App Console.
2. Go to **Permissions**.
3. Enable the required permission.
4. Save the changes.
5. Reconnect the Dropbox data source in ToolJet.

### Invalid redirect URI

Make sure the redirect URI configured in the Dropbox App Console exactly matches the redirect URI used by ToolJet.

### Binary upload is corrupted

For images, PDFs, and other binary files:

```text
Encoding: base64
```

Use `utf8` only for normal text data.
