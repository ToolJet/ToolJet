---
id: setup
title: Set Up the CLI and Create a Library
sidebar_label: Set Up and Create a Library
---

<div className="badge badge--primary heading-badge">
  <img
    src="/img/badge-icons/premium.svg"
    alt="Icon"
    width="16"
    height="16"
  />
 <span>Paid feature</span>
</div>

The ToolJet CLI signs in with a personal access token, not your password. This guide covers creating a token, signing in to the CLI, and creating your first library.

## Create a Personal Access Token

Personal access tokens are in **Profile settings** → **Personal access tokens**.

1. Open your profile settings and find the **Personal access tokens** card.
2. Click **Create new token**. Only admins and builders can create tokens. The button is disabled for other roles.
3. Fill in the fields:
   - **Token name**: A name you will recognize later, for example "macbook-cli". Required.
   - **Workspace**: The workspace this token can act on. It defaults to your current workspace. The dropdown lists every workspace where you are an active member.
   - **Expiration**: The date the token expires. The earliest date you can pick is tomorrow. You can't create a token that never expires from the UI.
4. Click **Create token**.

The confirmation screen shows two values, each with a copy button:

- **Token**: Shown only once. Copy it now, because it is never shown again.
- **Workspace ID**

:::warning
If you lose a token, you can't view it again. Revoke it and create a new one.
:::

### Manage Tokens

The token list shows each token's **Name**, **Workspace**, **Last used** time (or "Never used"), and a **Revoke** button. An expired token shows an **Expired** label in place of the last-used time.

:::warning
Revoking a token takes effect immediately and can't be undone. Any CLI session or CI pipeline using that token stops working right away.
:::

## Sign In to the CLI

Install the CLI and sign in:

```bash
npm i @tooljet/cli@0.0.15-beta.1
tooljet login
```

`tooljet login` asks for two values:

- **ToolJet origin URL**: For example, `https://app.tooljet.ai`. Enter only the protocol and host. Any path is removed.
- **API token**: Your personal access token. The input is masked.

You can run `tooljet login` from any directory.

## Create a Library

```bash
tooljet library init my-components
```

The argument is the **directory name**. It must start with a letter and can contain only letters, numbers, hyphens and underscores.

The command then asks for a **display name**. App builders see this name in the **Custom** tab. The display name must start with a letter, can contain letters, numbers, spaces, hyphens and underscores, and can be up to 100 characters long.

`init` registers the library in your workspace and creates the project on your machine. If either step fails, the CLI removes the directory so no half-created project is left behind.

The generated project looks like this:

```
my-components/
├─ .tooljet/config.json   # libraryName + correlationId. Do not edit or delete.
├─ src/
│  ├─ index.ts            # Export barrel. Only React components exported here become components in ToolJet.
│  └─ components/
│     └─ HelloWorld/index.tsx
├─ package.json
└─ tsconfig.json
```

Install the dependencies:

```bash
cd my-components && npm install
```

Two files matter most:

- **`src/index.ts` defines what gets published.** Every React component exported from this file becomes a component app builders can drag onto the canvas. Types, constants and helper functions exported from it are ignored.
- **`.tooljet/config.json` identifies the library.** It holds a `correlationId` that links the project to the library in ToolJet. Because of this, you can publish the same project to more than one workspace without renaming anything.

The project also includes npm scripts as shortcuts: `npm run lib:dev`, `npm run lib:build` and `npm run lib:publish`.

:::info
`lib` is an alias for `library` in every command. `tooljet lib publish` and `tooljet library publish` are the same command.
:::

## Next Steps

Start writing your components. See [Build Components with the SDK](/docs/app-builder/custom-component-library/build-components).
