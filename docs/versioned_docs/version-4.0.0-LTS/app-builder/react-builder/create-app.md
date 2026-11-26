---
id: create-app
title: Create a React Builder App
sidebar_label: Create an App
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

A React Builder application can be created from a prompt or as a blank application. From a prompt, ToolJet AI builds the application's screens, data and queries. A blank application is built in the browser or in a local code editor.

<img className="screenshot-full img-full" src="/img/build-with-ai/react-builder/create-app/ai-build-result.png" alt="A React Builder app on the canvas beside the AI chat, which shows the build's summary and See what changed" />

## Create the App

The build mode is chosen when an app is created, and the app keeps it. A visual app can't become a React Builder app later, or the other way round.

<Tabs>
<TabItem value="prompt" label="From a prompt" default>

1. Open the Home page, or click **Start with a prompt** on the dashboard. Describe the app in the prompt box and send it.
2. ToolJet asks how it should build the app. Click **React Builder**, and the build starts. ToolJet asks for each new app until **Don't ask again** is selected. After the first choice, the prompt box also shows the build mode it will use, and the mode can be switched there.
3. The editor opens with the AI chat, and the app is named from the prompt. If the AI asks a question, pick an option and click **Continue**.
4. Watch the build move through its three stages: Data, Build and Check. The screens appear on the canvas near the end. Click **Stop** to change course.

<img className="screenshot-full img-full" src="/img/build-with-ai/react-builder/create-app/build-mode-dialog.png" alt="The How should we build this app? dialog with the Visual builder and React builder cards and a Don't ask again checkbox" />

When the build finishes, the chat lists what it built and suggests next steps.

</TabItem>
<TabItem value="blank" label="Blank app">

1. On the dashboard, click **Create an app**.
2. Enter the **App name**.
3. Under **Build mode**, select **React Builder**.
4. Click **+ Create app**.

<img className="screenshot-full img-s" src="/img/build-with-ai/react-builder/create-app/create-app-dialog.png" alt="The Create app dialog with React builder selected under Build mode and the name Northwind Dispatch entered" />

The editor opens with the AI chat and an empty canvas. Describe the app in the chat, or build it from a local code editor or coding agent. See [Build Locally](./local-development.md).

</TabItem>
</Tabs>

## What ToolJet AI Builds

A build from a prompt produces the following parts of the application.

<CardGrid columns={3}>
  <FeatureCard
    icon="monitor"
    title="Screens"
    description="Each screen is a React component. Screens appear on the canvas once their code is built, and every file opens from Code in the top bar."
  />
  <FeatureCard
    icon="database"
    title="Data"
    description="Sample data is stored in ToolJet Database, and the code reads it through queries. To use an existing datasource, type @ in the prompt and select the datasource."
  />
  <FeatureCard
    icon="palette"
    title="Styling"
    description="Layout and styling are defined in the code. The style inspector changes the styling of a selected element without manual code edits."
  />
</CardGrid>

Further changes are requested in the same chat, and ToolJet AI edits the application. Under each edit, click **See what changed** to compare the screens and the code before and after the edit, or to undo it.

## Next Steps

<CardGrid columns={3}>
  <NextStepCard title="Edit in the Browser" description="Change the code in the Code panel, or restyle elements with the style inspector." href="/docs/app-builder/react-builder/editor" />
  <NextStepCard title="Build Locally" description="Clone the app and work in a local code editor, or hand it to a coding agent." href="/docs/app-builder/react-builder/local-development" />
  <NextStepCard title="Control Access" description="Choose who can open each screen and who can run each query." href="/docs/app-builder/react-builder/access-control" />
</CardGrid>

<details id="tj-dropdown">
<summary>**Troubleshooting**</summary>

| <div style={{ width:"300px"}}> Symptom </div> | <div style={{ width:"350px"}}> What to Do </div> |
|:---------- | :---------- |
| The Create app dialog has no **Build mode** choice. | The choice appears only for apps, not for modules or workflows. |
| A message says the server created the app in Visual mode, or that the build was not started. | The ToolJet server doesn't support React Builder yet. Ask an admin to update ToolJet, then try again. |
| ToolJet doesn't ask how to build the app. | **Don't ask again** was selected earlier. Change the build mode in the prompt box. |
| An existing app's build mode needs to change. | An app keeps the mode it was created in. Create a new app in the other mode. |

</details>
