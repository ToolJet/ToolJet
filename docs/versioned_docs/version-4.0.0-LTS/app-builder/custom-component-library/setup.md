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

:::caution BETA
Custom Component Libraries are currently in beta and not recommended for production use.
:::

The ToolJet CLI signs in with a personal access token, not a password. This guide covers creating a token, signing in to the CLI, and creating a first library. To let ToolJet create the token automatically, see [Sign In Through the Browser](#sign-in-through-the-browser).

## Create a Personal Access Token

Personal access tokens are in **Workspace settings** → **Personal access token**. A token belongs to the workspace it is created in.

1. Open the workspace the token should act on, then go to **Workspace settings** → **Personal access token**.
2. Click **Create new token**. Admins and builders can create tokens by default. An admin can change this with the **Personal access token** → **Create** permission on a group. Users without it don't see the button.
3. Fill in the fields:
   - **Token name**: A name you will recognize later, for example "macbook-cli". Required.
   - **Expiration**: The date the token expires. The earliest date you can pick is tomorrow. You can't create a token that never expires from the UI.
4. Click **Create token**.

The confirmation screen shows two values, each with a copy button:

- **Token**: Shown only once. Copy it now, because it is never shown again.
- **Workspace ID**

:::warning
If you lose a token, you can't view it again. Revoke it and create a new one.
:::

### Manage Tokens

The token list shows each token's **Name**, **Last used** time (or "Never used"), **Created at** date, **Expiry date**, and a **Revoke** button. An expired token shows an **Expired** label in place of its expiry date. You can revoke your own tokens. Admins, and users with the **Personal access token** → **Revoke** group permission, can revoke any token in the workspace.

:::warning
Revoking a token takes effect immediately and can't be undone. Any CLI session or CI pipeline using that token stops working right away.
:::

## Sign In to the CLI

Install the CLI from the ToolJet instance, so that it matches the ToolJet version. Replace `https://tooljet.example.com` with the instance's address.

```bash
npm i -g https://tooljet.example.com/api/code-mode/cli/tooljet-cli.tgz
```

If the instance doesn't serve the CLI, run `npm i -g @tooljet/cli@beta` instead. The CLI needs Node.js 18 or later.

Then sign in:

```bash
tooljet login
```

`tooljet login` asks for two values:

- **ToolJet origin URL**: For example, `https://app.tooljet.ai`. Enter only the protocol and host. Any path is removed.
- **API token**: Your personal access token. The input is masked.

You can run `tooljet login` from any directory.

### Sign In Through the Browser

Instead of the token steps above, the CLI can sign in through the browser:

```bash
tooljet auth login --url https://tooljet.example.com
```

The CLI prints a code and opens an approval page in ToolJet. After approval, ToolJet creates a token for the workspace open in that browser, and the CLI stores it. If the instance doesn't support browser sign-in, the CLI prints a note to use `tooljet login`. See [Sign In Through the Browser](../react-builder/cli-reference.md#sign-in-through-the-browser) for the details.

## Create a Library

```bash
tooljet library init my-components
```

The argument is the **directory name**. It must start with a letter and can contain only letters, numbers, hyphens and underscores.

The command then asks for a **display name**. App builders see this name in the App Builder's library picker, under Custom libraries. The display name must start with a letter, can contain letters, numbers, spaces, hyphens and underscores, and can be up to 100 characters long. To skip the prompt, pass the name with `--display-name`.

`init` registers the library in your workspace and creates the project in a new local directory. If either step fails, the CLI removes the directory so no half-created project is left behind.

To create the project before signing in, add `--local`. Nothing is registered in a workspace until `tooljet library dev` or `tooljet library publish` runs, which asks whether to create the library there.

The generated project looks like this:

```
my-components/
├─ .tooljet/config.json   # libraryName + correlationId. Don't change or delete them.
├─ src/
│  ├─ index.ts            # Export barrel. Only React components exported here become components in ToolJet.
│  ├─ global.d.ts
│  └─ components/
│     └─ HelloWorld/index.tsx
├─ .gitignore
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

Next, write the components. See [Build Components with the SDK](./build-components.md).
