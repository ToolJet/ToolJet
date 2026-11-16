---
id: overview
title: Custom Component Libraries
sidebar_label: Overview
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

**Custom Component Libraries** let you write your own React components, publish them to a ToolJet workspace with the [ToolJet CLI](https://www.npmjs.com/package/@tooljet/cli), and use them in the App Builder like any built-in component. Every app builder in the workspace can drag them onto the canvas. Each app pins a version of the library, and builders configure the components from the component properties panel.

A **library** is what you publish and version. The **components** inside it are what app builders drag onto the canvas. One publish ships every component in the library as a single version.

## What's New in v4

<SectionSubtitle text="What changes for the libraries you publish and the apps that use them." />

<CardGrid columns={3}>
  <FeatureCard
    icon="⚡"
    title="Rendered inline"
    description="Components draw directly in the app page instead of in a separate frame. They inherit the app's font, can use its theme colors, and a library's code loads once however many of its components are on the page."
    href="/docs/app-builder/custom-component-library/build-components#styling-and-dependencies"
  />
  <FeatureCard
    icon="🧩"
    title="In the library picker"
    description="Published libraries are listed in the App Builder's library picker under Custom libraries, below the libraries that ship with ToolJet. The Custom tab is gone."
    href="/docs/app-builder/custom-component-library/use-in-app-builder"
  />
  <FeatureCard
    icon="⌨️"
    title="A quicker CLI loop"
    description="Check types without building, create a project before you sign in, and sign in through your browser instead of pasting a token."
    href="/docs/app-builder/custom-component-library/cli-reference"
  />
</CardGrid>

:::info Components run in the app page
A custom component is no longer isolated in its own frame. Its code runs in the app page, so it can read what's on the page and act as the person using the app. Only admins and builders can publish a library. Publish only code you trust.
:::

## How It Works

Four parts of ToolJet are involved, and you use them in this order:

| <div style={{ width:"200px"}}> Part </div> | <div style={{ width:"250px"}}> What It Is </div> | <div style={{ width:"150px"}}> Who Uses It </div> |
|:---------- | :---------- | :------------ |
| `@tooljet/cli` | An npm CLI that scaffolds, builds, previews and publishes a library. | Developer |
| `@tooljet/custom-component-sdk` | A TypeScript package with the `ToolJet` hooks a component uses to declare its properties, events and actions. | Developer, in component code |
| **Workspace settings** → **Custom component libraries** | Lists every library published to the workspace and lets an admin delete one. | Workspace admin |
| The library picker in the **App Builder** | Where you pick a published library under Custom libraries, drop its components on the canvas and configure them. | App builder |

The end-to-end flow is shown below. Steps with a `$` are CLI commands you run in a terminal. The other steps happen in ToolJet or in your code editor.

```mermaid
flowchart TD
  A["Create a personal access token<br/>(Profile settings in ToolJet)"] --> B["Sign in to the CLI<br/>$ tooljet login"]
  B --> C["Create a library<br/>$ tooljet library init my-components"]
  C --> D["Write React components<br/>using the SDK hooks"]
  D --> E{"Ready to<br/>release?"}
  E -->|No| F["Preview live in the App Builder<br/>$ tooljet library dev"]
  F --> D
  E -->|Yes| G["Publish a version<br/>$ tooljet library publish --version 1.0.0"]
  G --> H["Pick the library in the<br/>App Builder's library picker"]
  H --> I["Drag a component onto the canvas,<br/>configure it and pin a version"]
```

## Before You Start

Custom Component Libraries are a paid feature, and the Community Edition doesn't include them. On a plan without them, the Custom libraries group in the App Builder's library picker and the **Custom component libraries** page in workspace settings are hidden.

### Roles and Permissions

| <div style={{ width:"300px"}}> Action </div> | <div style={{ width:"250px"}}> Required Role </div> |
|:---------- | :---------- |
| Create a personal access token | Admin or Builder |
| Create, publish and dev-preview a library (with the CLI) | Admin or Builder, with a token |
| Browse and use components in the App Builder | Any member who can edit apps |
| Delete a library | Admin only |

### Prerequisites

To build a library, you need:

- **Node.js** 18 or later and **npm**.
- **The ToolJet CLI**. See [Sign In to the CLI](./setup.md#sign-in-to-the-cli) for the install command.
- **React 18**. The scaffold pins `^18.2.0`. ToolJet provides React to the component at runtime, so your components must not bundle their own copy.

:::info
A personal access token belongs to one workspace. To publish the same library to a second workspace, create a token in that workspace and run the CLI again with it.
:::

## Next Steps

1. [Set up the CLI and create a library](./setup.md)
2. [Build components with the SDK](./build-components.md)
3. [Preview and publish your library](./preview-and-publish.md)
4. [Use custom components in the App Builder](./use-in-app-builder.md)
5. [Manage libraries in your workspace](./manage-libraries.md)

For every command, flag and limit in one place, see the [CLI Reference](./cli-reference.md).
