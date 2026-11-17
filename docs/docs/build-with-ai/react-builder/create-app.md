---
id: create-app
title: Create a React Builder App
sidebar_label: Create an App
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Describe the app you need, and ToolJet AI builds it as a working React app, with its screens, data and queries. You can also start from a blank app and build it yourself, in the browser or in your own editor.

<img className="screenshot-full img-full" src="/img/build-with-ai/react-builder/create-app/ai-build-result.png" alt="A React Builder app on the canvas beside the AI chat, which shows the build's summary and See what changed" />

## Create the App

You choose a build mode when you create an app, and the app keeps it. A visual app can't become a React Builder app later, or the other way round.

<Tabs>
<TabItem value="prompt" label="From a prompt" default>

1. Open the Home page, or click **Start with a prompt** on the dashboard. Describe the app in the prompt box and send it.
2. The first time, ToolJet asks how it should build the app. Click **Code mode**, and the build starts. After that, the prompt box shows the build mode it will use, and you can switch it there.
3. The editor opens with the AI chat, and the app is named from your prompt. If the AI asks a question, pick an option and click **Continue**.
4. Watch the build move through its three stages: Data, Build and Check. Your screens appear on the canvas near the end. Click **Stop** if you want to change course.

<!-- TODO screenshot: /img/build-with-ai/react-builder/create-app/build-mode-dialog.png | img-l | alt: The dialog that asks how to build the app, with the Visual and React Builder cards | shows: the "How should we build this app?" dialog after sending a first prompt from the Home page; shows the product name, so capture after the UI rename -->

When the build finishes, the chat lists what it built and suggests what you could do next.

</TabItem>
<TabItem value="blank" label="Blank app">

1. On the dashboard, click **Create an app**.
2. Enter the **App name**.
3. Under **Build mode**, select **React Builder**.
4. Click **+ Create app**.

<!-- TODO screenshot: /img/build-with-ai/react-builder/create-app/create-app-dialog.png | img-s | alt: The Create app dialog with an app name entered and React Builder selected under Build mode | shows: the Create app dialog with the name "Northwind Dispatch" and the React Builder card selected; shows the product name, so capture after the UI rename -->

The editor opens with the AI chat and an empty canvas. Describe what you need in the chat, or build the app from your own editor or coding agent. See [Build Locally](./local-development.md).

</TabItem>
</Tabs>

## What ToolJet AI Builds

<SectionSubtitle text="A complete app, in code that is yours to read and change." />

<CardGrid columns={3}>
  <FeatureCard
    icon="🖥️"
    title="Screens"
    description="Each screen is a React component. Screens appear on the canvas once their code is built, and every file opens from Code in the top bar."
  />
  <FeatureCard
    icon="🗄️"
    title="Data"
    description="Sample data goes into ToolJet Database, and the code reads it through queries. To build on your own data, type @ in your prompt and pick a data source."
  />
  <FeatureCard
    icon="🎨"
    title="Styling"
    description="Layout and styling are part of the code, so any design is possible. Restyle an element later with the style inspector, without writing code."
  />
</CardGrid>

Keep going in the same chat: ask for a change, and ToolJet AI edits the app. Under each edit, click **See what changed** to compare the screens and the code before and after, and to undo the edit if it isn't what you wanted.

## Keep Building

<CardGrid columns={3}>
  <NextStepCard title="Edit in the Browser" description="Change the code in the Code panel, or restyle elements with the style inspector." href="/docs/build-with-ai/react-builder/editor" />
  <NextStepCard title="Build Locally" description="Clone the app and work in your own editor, or hand it to a coding agent." href="/docs/build-with-ai/react-builder/local-development" />
  <NextStepCard title="Control Access" description="Choose who can open each screen and who can run each query." href="/docs/build-with-ai/react-builder/access-control" />
</CardGrid>

:::info Availability
React Builder is available on ToolJet Cloud and on self-hosted Enterprise Edition. The Community Edition doesn't include it.
:::

<details id="tj-dropdown">
<summary>**Troubleshooting**</summary>

| <div style={{ width:"300px"}}> What You See </div> | <div style={{ width:"350px"}}> What to Do </div> |
|:---------- | :---------- |
| The Create app dialog has no **Build mode** choice. | The choice appears only for apps, not for modules or workflows, and only on an edition that includes React Builder. |
| A message says the server created the app in Visual mode, or that the build was not started. | The ToolJet server doesn't support React Builder yet. Ask an admin to update ToolJet, then try again. |
| A message says React Builder is not enabled on this workspace. | The server's edition doesn't include React Builder. |
| ToolJet doesn't ask how to build the app. | It asks only the first time you send a prompt in a browser. After that, change the build mode in the prompt box. |
| You want to change an existing app's build mode. | An app keeps the mode it was created in. Create a new app in the other mode. |

</details>
