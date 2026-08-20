---
id: tooljet-mcp
title: ToolJet MCP
---

<PlanBadge type="enterprise" />
<PlanBadge type="self-hosted" />

Le [Model Context Protocol](https://modelcontextprotocol.io/introduction) (MCP) est une norme permettant de connecter des grands modèles de langage (LLM) à des plateformes comme ToolJet. Ce guide explique comment connecter ToolJet à des outils IA en utilisant MCP, permettant à vos assistants IA d'interagir avec votre instance ToolJet et de la gérer.

## Qu'est-ce que ToolJet MCP ?

ToolJet MCP est un pont qui connecte les assistants IA à votre plateforme ToolJet via le Model Context Protocol. Cela permet aux outils IA de :

- Gérer les utilisateurs et les espaces de travail
- Accéder aux informations des applications
- Effectuer des tâches administratives
- Interagir avec votre instance ToolJet de manière programmatique

## Outils IA pris en charge

Vous pouvez connecter ToolJet aux outils IA suivants en utilisant MCP :

- [Cursor](#cursor)
- [Windsurf](#windsurf) (Codium)
- [Visual Studio Code](#visual-studio-code-copilot) (Copilot)
- [Cline](#cline) (extension VS Code)
- [Claude desktop](#claude-desktop)
- [Claude code](#claude-code)

## Prérequis

Avant de commencer, vous aurez besoin de :

1. Une instance ToolJet avec un accès administrateur
2. Un jeton d'accès API de votre instance ToolJet
3. Node.js (v14 ou supérieur)
4. Un assistant IA compatible MCP

## Pour commencer

### Étape 1 : Obtenir un jeton d'accès

Obtenez un jeton d'accès depuis votre instance ToolJet. Vous aurez besoin de ce jeton pour authentifier le serveur MCP. Consultez la documentation de l'[API ToolJet](/api/#enabling-tooljet-api) pour plus de détails sur la génération d'un jeton API.

### Étape 2 : Configurer votre outil IA

Suivez les instructions ci-dessous pour configurer l'outil IA de votre choix afin qu'il se connecte à ToolJet MCP.

#### Cursor

1. Ouvrez [Cursor](https://www.cursor.com/) et créez un répertoire `.cursor` à la racine de votre projet s'il n'existe pas.
2. Créez un fichier `.cursor/mcp.json` s'il n'existe pas et ouvrez-le.
3. Ajoutez la configuration suivante :

```json
{
  "mcpServers": {
    "tooljet": {
      "command": "npx",
      "args": ["-y", "@tooljet/mcp"],
      "env": {
        "TOOLJET_ACCESS_TOKEN": "<your-access-token>",
        "TOOLJET_HOST": "https://your-tooljet-instance.com"
      }
    }
  }
}
```

Remplacez `<your-access-token>` par votre jeton d'accès ToolJet et mettez à jour l'URL de l'hôte pour qu'elle pointe vers votre instance ToolJet.

4. Enregistrez le fichier de configuration.
5. Ouvrez Cursor et accédez à **Settings/MCP**. Vous devriez voir un statut actif vert une fois le serveur connecté avec succès.

#### Windsurf

1. Ouvrez [Windsurf](https://docs.codeium.com/windsurf) et accédez à l'assistant Cascade.
2. Appuyez sur l'icône marteau (MCP), puis sur **Configure** pour ouvrir le fichier de configuration.
3. Ajoutez la configuration suivante :

```json
{
  "mcpServers": {
    "tooljet": {
      "command": "npx",
      "args": ["-y", "@tooljet/mcp"],
      "env": {
        "TOOLJET_ACCESS_TOKEN": "<your-access-token>",
        "TOOLJET_HOST": "https://your-tooljet-instance.com"
      }
    }
  }
}
```

Remplacez `<your-access-token>` par votre jeton d'accès ToolJet et mettez à jour l'URL de l'hôte pour qu'elle pointe vers votre instance ToolJet.

4. Enregistrez le fichier de configuration et rechargez en appuyant sur **Refresh** dans l'assistant Cascade.
5. Vous devriez voir un statut actif vert une fois le serveur connecté avec succès.

#### Visual Studio Code (Copilot)

1. Ouvrez [VS Code](https://code.visualstudio.com/) et créez un répertoire `.vscode` à la racine de votre projet s'il n'existe pas.
2. Créez un fichier `.vscode/mcp.json` s'il n'existe pas et ouvrez-le.
3. Ajoutez la configuration suivante :

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

4. Enregistrez le fichier de configuration.
5. Ouvrez le chat Copilot et passez en mode "Agent". Vous devriez voir une icône d'outil sur laquelle appuyer pour confirmer que les outils MCP sont disponibles. Une fois que vous commencez à utiliser le serveur, vous serez invité à saisir votre jeton d'accès et l'URL de l'hôte.

Pour plus d'informations sur l'utilisation de MCP dans VS Code, consultez la [documentation Copilot](https://code.visualstudio.com/docs/copilot/chat/mcp-servers).

#### Cline

1. Ouvrez l'extension [Cline](https://github.com/cline/cline) dans VS Code et appuyez sur l'icône **MCP Servers**.
2. Appuyez sur **Configure MCP Servers** pour ouvrir le fichier de configuration.
3. Ajoutez la configuration suivante :

```json
{
  "mcpServers": {
    "tooljet": {
      "command": "npx",
      "args": ["-y", "@tooljet/mcp"],
      "env": {
        "TOOLJET_ACCESS_TOKEN": "<your-access-token>",
        "TOOLJET_HOST": "https://your-tooljet-instance.com"
      }
    }
  }
}
```

Remplacez `<your-access-token>` par votre jeton d'accès ToolJet et mettez à jour l'URL de l'hôte pour qu'elle pointe vers votre instance ToolJet.

4. Enregistrez le fichier de configuration. Cline devrait recharger automatiquement la configuration.
5. Vous devriez voir un statut actif vert une fois le serveur connecté avec succès.

#### Claude desktop

1. Ouvrez [Claude desktop](https://claude.ai/download) et accédez à **Settings**.
2. Sous l'onglet **Developer**, appuyez sur **Edit Config** pour ouvrir le fichier de configuration.
3. Ajoutez la configuration suivante :

```json
{
  "mcpServers": {
    "tooljet": {
      "command": "npx",
      "args": ["-y", "@tooljet/mcp"],
      "env": {
        "TOOLJET_ACCESS_TOKEN": "<your-access-token>",
        "TOOLJET_HOST": "https://your-tooljet-instance.com"
      }
    }
  }
}
```

Remplacez `<your-access-token>` par votre jeton d'accès ToolJet et mettez à jour l'URL de l'hôte pour qu'elle pointe vers votre instance ToolJet.

4. Enregistrez le fichier de configuration et redémarrez Claude desktop.
5. Depuis le nouvel écran de chat, vous devriez voir une icône marteau (MCP) apparaître avec le nouveau serveur MCP disponible.

#### Claude code

1. Créez un fichier `.mcp.json` à la racine de votre projet s'il n'existe pas.
2. Ajoutez la configuration suivante :

```json
{
  "mcpServers": {
    "tooljet": {
      "command": "npx",
      "args": ["-y", "@tooljet/mcp"],
      "env": {
        "TOOLJET_ACCESS_TOKEN": "<your-access-token>",
        "TOOLJET_HOST": "https://your-tooljet-instance.com"
      }
    }
  }
}
```

Remplacez `<your-access-token>` par votre jeton d'accès ToolJet et mettez à jour l'URL de l'hôte pour qu'elle pointe vers votre instance ToolJet.

3. Enregistrez le fichier de configuration.
4. Redémarrez [Claude code](https://claude.ai/code) pour appliquer la nouvelle configuration.

## Configuration spécifique à la plateforme

### Utilisateurs Windows

Si vous utilisez Windows, préfixez la commande avec `cmd /c` :

```json
{
  "mcpServers": {
    "tooljet": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@tooljet/mcp"],
      "env": {
        "TOOLJET_ACCESS_TOKEN": "<your-access-token>",
        "TOOLJET_HOST": "https://your-tooljet-instance.com"
      }
    }
  }
}
```

## Outils disponibles

ToolJet MCP fournit plusieurs outils que les assistants IA peuvent utiliser pour interagir avec votre instance ToolJet :

### Gestion des utilisateurs

| Outil               | Description                                           |
| ------------------ | ----------------------------------------------------- |
| `get-all-users`    | Récupérer une liste de tous les utilisateurs de votre instance ToolJet |
| `get-user`         | Obtenir des informations détaillées sur un utilisateur spécifique        |
| `create-user`      | Créer un nouvel utilisateur dans un espace de travail spécifié            |
| `update-user`      | Mettre à jour les informations de profil d'un utilisateur                   |
| `update-user-role` | Modifier le rôle d'un utilisateur au sein d'un espace de travail               |

### Gestion des espaces de travail

| Outil                 | Description                                  |
| -------------------- | -------------------------------------------- |
| `get-all-workspaces` | Lister tous les espaces de travail de votre instance ToolJet |

### Gestion des applications

| Outil           | Description                                       |
| -------------- | ------------------------------------------------- |
| `get-all-apps` | Lister toutes les applications d'un espace de travail spécifique |

## Exemple d'utilisation

Une fois connecté, votre assistant IA peut effectuer des tâches comme :

- "Montre-moi tous les utilisateurs de mon instance ToolJet"
- "Crée un nouvel utilisateur nommé John Doe dans l'espace de travail Marketing"
- "Liste toutes les applications de l'espace de travail Development"
- "Mets à jour le rôle de user@example.com en Admin dans l'espace de travail Sales"

Pour une liste complète des outils disponibles, consultez le [README GitHub](https://github.com/ToolJet/tooljet-mcp). Si vous rencontrez un problème, [soumettez un rapport de bug](https://github.com/ToolJet/tooljet-mcp/issues/new).
