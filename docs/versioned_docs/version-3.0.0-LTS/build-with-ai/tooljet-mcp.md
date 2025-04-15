---
id: tooljet-mcp
title: ToolJet MCP

---

# Connect your AI tools to ToolJet using MCP

The [Model Context Protocol](https://modelcontextprotocol.io/introduction) (MCP) is a standard for connecting Large Language Models (LLMs) to platforms like ToolJet. This guide covers how to connect ToolJet to AI tools using MCP, enabling your AI assistants to interact with and manage your ToolJet instance.

## What is ToolJet MCP?

ToolJet MCP is a bridge that connects AI assistants to your ToolJet platform through the Model Context Protocol. This allows AI tools to:

- Manage users and workspaces
- Access app information
- Perform administrative tasks
- Interact with your ToolJet instance programmatically

## Supported AI Tools

You can connect ToolJet to the following AI tools using MCP:

- [Cursor](#cursor)
- [Windsurf](#windsurf) (Codium)
- [Visual Studio Code](#visual-studio-code-copilot) (Copilot)
- [Cline](#cline) (VS Code extension)
- [Claude desktop](#claude-desktop)
- [Claude code](#claude-code)

## Prerequisites

Before you begin, you'll need:

1. A ToolJet instance with admin access
2. An API access token from your ToolJet instance
3. Node.js (v14 or higher)
4. An MCP-compatible AI assistant

## Getting Started

### Step 1: Get an Access Token

Get an access token from your ToolJet instance. You'll need this token to authenticate the MCP server. Refer to the [ToolJet API](https://docs.tooljet.ai/docs/tooljet-api#enabling-tooljet-api) documentation for more details on how to generate an API token.

### Step 2: Configure Your AI Tool

Follow the instructions below to configure your preferred AI tool to connect with ToolJet MCP.

## AI Tool Configuration

### Cursor

1. Open [Cursor](https://www.cursor.com/) and create a `.cursor` directory in your project root if it doesn't exist.
2. Create a `.cursor/mcp.json` file if it doesn't exist and open it.
3. Add the following configuration:

```json
{
  "mcpServers": {
    "tooljet": {
      "command": "npx",
      "args": [
        "-y",
        "@tooljet/mcp",
      ],
      "env": {
        "TOOLJET_ACCESS_TOKEN": "<your-access-token>",
        "TOOLJET_HOST": "https://your-tooljet-instance.com"
      }
    }
  }
}
```

Replace `<your-access-token>` with your ToolJet access token and update the host URL to point to your ToolJet instance.

4. Save the configuration file.
5. Open Cursor and navigate to **Settings/MCP**. You should see a green active status after the server is successfully connected.

### Windsurf

1. Open [Windsurf](https://docs.codeium.com/windsurf) and navigate to the Cascade assistant.
2. Tap on the hammer (MCP) icon, then **Configure** to open the configuration file.
3. Add the following configuration:

```json
{
  "mcpServers": {
    "tooljet": {
      "command": "npx",
      "args": [
        "-y",
        "@tooljet/mcp",
      ],
      "env": {
        "TOOLJET_ACCESS_TOKEN": "<your-access-token>",
        "TOOLJET_HOST": "https://your-tooljet-instance.com"
      }
    }
  }
}
```

Replace `<your-access-token>` with your ToolJet access token and update the host URL to point to your ToolJet instance.

4. Save the configuration file and reload by tapping **Refresh** in the Cascade assistant.
5. You should see a green active status after the server is successfully connected.

### Visual Studio Code (Copilot)

1. Open [VS Code](https://code.visualstudio.com/) and create a `.vscode` directory in your project root if it doesn't exist.
2. Create a `.vscode/mcp.json` file if it doesn't exist and open it.
3. Add the following configuration:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "tooljet-access-token",
      "description": "ToolJet access token",
      "password": true
    },
    {
      "type": "promptString",
      "id": "tooljet-host",
      "description": "ToolJet host URL",
      "default": "https://your-tooljet-instance.com"
    }
  ],
  "servers": {
    "tooljet": {
      "command": "npx",
      "args": ["-y", "@tooljet/mcp"],
      "env": {
        "TOOLJET_ACCESS_TOKEN": "${input:tooljet-access-token}",
        "TOOLJET_HOST": "${input:tooljet-host}"
      }
    }
  }
}
```

4. Save the configuration file.
5. Open Copilot chat and switch to "Agent" mode. You should see a tool icon that you can tap to confirm the MCP tools are available. Once you begin using the server, you will be prompted to enter your access token and host URL.

For more info on using MCP in VS Code, see the [Copilot documentation](https://code.visualstudio.com/docs/copilot/chat/mcp-servers).

### Cline

1. Open the [Cline](https://github.com/cline/cline) extension in VS Code and tap the **MCP Servers** icon.
2. Tap **Configure MCP Servers** to open the configuration file.
3. Add the following configuration:

```json
{
  "mcpServers": {
    "tooljet": {
      "command": "npx",
      "args": [
        "-y",
        "@tooljet/mcp",
      ],
      "env": {
        "TOOLJET_ACCESS_TOKEN": "<your-access-token>",
        "TOOLJET_HOST": "https://your-tooljet-instance.com"
      }
    }
  }
}
```

Replace `<your-access-token>` with your ToolJet access token and update the host URL to point to your ToolJet instance.

4. Save the configuration file. Cline should automatically reload the configuration.
5. You should see a green active status after the server is successfully connected.

### Claude desktop

1. Open [Claude desktop](https://claude.ai/download) and navigate to **Settings**.
2. Under the **Developer** tab, tap **Edit Config** to open the configuration file.
3. Add the following configuration:

```json
{
  "mcpServers": {
    "tooljet": {
      "command": "npx",
      "args": [
        "-y",
        "@tooljet/mcp",
      ],
      "env": {
        "TOOLJET_ACCESS_TOKEN": "<your-access-token>",
        "TOOLJET_HOST": "https://your-tooljet-instance.com"
      }
    }
  }
}
```

Replace `<your-access-token>` with your ToolJet access token and update the host URL to point to your ToolJet instance.

4. Save the configuration file and restart Claude desktop.
5. From the new chat screen, you should see a hammer (MCP) icon appear with the new MCP server available.

### Claude code

1. Create a `.mcp.json` file in your project root if it doesn't exist.
2. Add the following configuration:

```json
{
  "mcpServers": {
    "tooljet": {
      "command": "npx",
      "args": [
        "-y",
        "@tooljet/mcp",
      ],
      "env": {
        "TOOLJET_ACCESS_TOKEN": "<your-access-token>",
        "TOOLJET_HOST": "https://your-tooljet-instance.com"
      }
    }
  }
}
```

Replace `<your-access-token>` with your ToolJet access token and update the host URL to point to your ToolJet instance.

3. Save the configuration file.
4. Restart [Claude code](https://claude.ai/code) to apply the new configuration.

## Platform-Specific Setup

### Windows Users

If you're using Windows, prefix the command with `cmd /c`:

```json
{
  "mcpServers": {
    "tooljet": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@tooljet/mcp",
      ],
      "env": {
        "TOOLJET_ACCESS_TOKEN": "<your-access-token>",
        "TOOLJET_HOST": "https://your-tooljet-instance.com"
      }
    }
  }
}
```

## Available Tools

ToolJet MCP provides several tools that AI assistants can use to interact with your ToolJet instance:

### User Management

| Tool | Description |
| --- | --- |
| `get-all-users` | Retrieve a list of all users in your ToolJet instance |
| `get-user` | Get detailed information about a specific user |
| `create-user` | Create a new user in a specified workspace |
| `update-user` | Update a user's profile information |
| `update-user-role` | Change a user's role within a workspace |

### Workspace Management

| Tool | Description |
| --- | --- |
| `get-all-workspaces` | List all workspaces in your ToolJet instance |

### Application Management

| Tool | Description |
| --- | --- |
| `get-all-apps` | List all applications within a specific workspace |

## Example Usage

Once connected, your AI assistant can perform tasks like:

- "Show me all users in my ToolJet instance"
- "Create a new user named John Doe in the Marketing workspace"
- "List all the apps in the Development workspace"
- "Update the role of user@example.com to Admin in the Sales workspace"

## Conclusion

Your AI tool is now connected to ToolJet using MCP. Try asking your AI assistant to manage users, list workspaces, or fetch application information.

For a full list of tools available, see the [GitHub README](https://github.com/ToolJet/tooljet-mcp). If you experience any issues, [submit a bug report](https://github.com/ToolJet/tooljet-mcp/issues/new).



