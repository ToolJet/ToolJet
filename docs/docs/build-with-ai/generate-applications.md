---
id: generate-applications
title: App Generation
---

ToolJet AI generates an application from a description: it plans the application, builds it on the canvas with its data and queries, and checks that it works. The build is shown stage by stage in the AI chat. The AI asks a question when it needs a decision, and each change can be reviewed or undone afterwards.

<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/app-v2.png" alt="An app built by ToolJet AI on the canvas, with the AI chat beside it" />

<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/app-v3.png" alt="An app that ToolJet AI just built on the canvas, with the AI chat beside it showing the build's summary, what it built and suggested next steps" />

:::info
This page covers **Start with a prompt**, the AI built into ToolJet. To build the same apps from Claude Code, Codex, or another coding agent, see [ToolJet MCP](./mcp/app-generation.md) instead.
:::

## Creating an Application {#creating-application}

Creating an application from a prompt has five steps. The steps are the same for visual applications and React Builder applications.

<CardGrid columns={3}>
  <FlowStep number="1" title="Describe" description="Describe what the application should do, and mention datasources with @." href="#describing-the-app" />
  <FlowStep number="2" title="Choose" description="Select Visual or React Builder as the build mode." href="#choosing-how-the-app-is-built" />
  <FlowStep number="3" title="Answer" description="The AI asks a question when the prompt leaves a decision open." href="#answering-questions-during-a-build" />
  <FlowStep number="4" title="Watch" description="The build runs in three stages: Data, Build and Check." href="#watching-the-build" />
  <FlowStep number="5" title="Review" description="The summary lists what was built. Each edit can be compared or undone." href="#reading-the-summary" />
</CardGrid>

### Describing the App

1. Open the Home page, or click **Start with a prompt** on the apps dashboard.
2. Describe the business application. To build on an existing datasource, type `@` and [mention a datasource](./referencing-app-resources.md#mentioning-data-sources). Up to 5 files can also be attached.
3. Click the build button.

<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/prompt-v2.png" alt="The prompt box on the Home page, with a description of the app to build" />

ToolJet creates the app, opens it in the App Builder and sends the prompt as the first message in the AI chat.

### Choosing How the App Is Built

When a prompt for a new app is sent, ToolJet asks how it should build the app. Click a card, and the build starts.

- **Visual** builds the app from components on a drag-and-drop canvas, suited to most internal tools. See the [Visual Builder overview](../app-builder/visual-builder/overview.md).
- **React Builder** writes the app as React code that can be edited in ToolJet or in a local code editor. See the [React Builder overview](../app-builder/react-builder/overview.md).

ToolJet keeps asking for each new app until **Don't ask again** is selected. After the first choice, the prompt box also shows the build mode it will use, and the mode can be switched there. An app keeps the mode it was created in.

### Answering Questions During a Build

When the prompt leaves a decision open, the build pauses and a question appears above the message box. Nothing changes on the canvas until the question is answered.

1. Select one of the numbered options. The option the AI recommends is already selected.
2. Click **Continue**. To let the AI decide instead, click **Skip**.

To answer in free text, select **Something else** and type the reply in the message box.

<!-- TODO screenshot: /img/build-with-ai/ai-chat/question-card.png | img-s | alt: A question from ToolJet AI above the message box, with numbered options, the recommended one selected, and Skip and Continue | shows: a build paused on a question in the AI chat: the question as the card's title, three or four numbered options with Recommended on the selected one, the Something else row, Skip and Continue, and the message box below; crop the lower part of the chat panel (400 px wide) -->

### Watching the Build

The chat shows the build's stage, a running clock and the step it's working on. A new app is built in three stages: Data, where the AI reads the app's data, then Build, then Check, where it checks that everything works.

<img className="screenshot-full img-s" src="/img/build-with-ai/ai-chat/build-progress.png" alt="The AI chat during a build, with the Data, Build and Check stages, a running clock and the latest steps" />

On the canvas, a visual app fills in as each change lands. A React Builder app's screens appear once their code is built, near the end of the build.

The build keeps going if the page is reloaded or another chat is opened. To change course, click the stop button that replaces the send button. To get a notification when the build is done, click **Allow notifications** when the chat offers it.

### Reading the Summary

When the build finishes, the chat shows how long it took, how many steps it ran and, with ToolJet Managed AI, the [credits](./ai-credits.md) it used. Click that line to see every step.

Below it, the AI lists what it built and suggests next steps. Click a suggestion, and the AI starts on it. The app is now ready to use, or to change by hand or with another prompt.

## Modifying an Application {#modifying-application}

ToolJet AI can change any app, whether the AI built it or not. Open **AI chat** in the left sidebar and describe the change. To change one specific component or query, [@mention it in the chat](./referencing-app-resources.md).

<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/modify.png" alt="An app in the App Builder that was changed with a prompt" />

An edit shows two stages, Build and Check. While it runs, a visual app's canvas can't be clicked. A React Builder app's canvas stays live.

### Reviewing and Undoing an AI Edit

<PlanBadge type="pro" />

After an edit, click **See what changed** under the AI's reply to compare the app before and after it. It opens the same view as [Compare Versions](../development-lifecycle/release/compare-versions.md).

- In a visual app, **Undo this edit** beside it reverses the newest edit. Both buttons appear on edits after the first build, which has nothing to compare with.
- In a React Builder app, the comparison has three views: Screens, Code and Access. **Undo this edit** is inside the comparison, and **Redo** brings the edit back.

<img className="screenshot-full img-s" src="/img/build-with-ai/ai-chat/turn-summary-see-what-changed.png" alt="A finished AI edit in the chat: the summary line with its time and steps, then See what changed with a count of what changed, and Undo this edit" />

## Creating Modules

ToolJet AI also generates [modules](../app-builder/modules/overview.md), which can be reused across multiple applications. Describe the UI in the prompt box on the Modules dashboard, or in the AI chat of the Module Builder.

<img className="screenshot-full img-full" src="/img/tooljet-ai/modules/generate.png" alt="A module generated by ToolJet AI in the Module Builder" />

## Chat History

Each app keeps its AI chats, and each chat is private to the user who started it. To reopen one, click the **Chats** icon in the AI chat header. See [Chat History](./use-ai-in-tooljet.mdx#chat-history) for more.

<details id="tj-dropdown">
<summary>Other pauses, phases and problems</summary>

#### Other Cards That Pause a Build

Besides a question, the AI can pause a build and wait for one of these actions:

- Pick a datasource. The card asks to **Select data source(s)** for the app's data. If the prompt [@mentioned datasources](./referencing-app-resources.md#mentioning-data-sources), only those are offered.
- Connect a data source. If the app needs a data source that isn't connected yet, click **Connect** followed by the data source name to set up the connection without leaving the chat, then click **I've connected** followed by the name to continue the build. The AI can also be told to use another datasource or sample data. On self-hosted deployments, a marketplace plugin that isn't installed shows **Install** instead, which opens the Marketplace in a new tab.
- Review the specs. See [Reviewing the Specs](#reviewing-the-specs).

#### Reviewing the Specs

<PlanBadge type="pro" />

When the AI writes a specification for the app, the chat shows a **Specs** card. Click it to open the document next to the chat. Each time the specification changes, ToolJet keeps the earlier version. Use the version dropdown (**Version 1**, **Version 2 - latest**, and so on) to switch between them.

To edit the latest version, click **Edit**, make the changes, then click **Save & continue**. The AI reads the changes and updates the specification. Click **Cancel** to discard the changes.

#### Implementation Phases

<PlanBadge type="pro" />

For a larger app, the AI can split the build into phases. A panel above the message box lists the implementation phases and how many steps of each are done, for example 2 of 5. When a phase is done, click **Next phase** to build the next one, or click **Start** on a later phase to build that one.

#### If a Build Stops or Fails

- If the build was stopped, click **Continue the build** to carry on.
- If the build failed or was interrupted, what it saved before then is kept. Click **Retry** to run the same request again, or pick another model first.
- If a mentioned datasource can't connect, the prompt isn't sent. Fix the connection or remove the mention, then send it again.

#### More About Undo

- An undone edit stays in the app's history, so it can be brought back later.
- A saved, promoted or released version is locked. Undo the edit in a new draft.
- If the version changed after the edit, undoing it would lose that work. Restore an earlier point from [App History](../app-builder/app-history.md) instead.

#### Keyboard Shortcuts

- In a question, press an option's number to select it and **Enter** to send it.
- In the prompt box on the Home page, press **Cmd/Ctrl + Enter** to start the build.

</details>

## Related

<CardGrid min={190}>
  <NextStepCard title="Query Generation" description="Generate queries and code, and organize the query panel." href="/docs/build-with-ai/generate-queries" />
  <NextStepCard title="@mention in AI Chat" description="Target an exact data source, component or query." href="/docs/build-with-ai/referencing-app-resources" />
  <NextStepCard title="Create a React Builder App" description="Start a React app from a prompt or from a blank app." href="/docs/app-builder/react-builder/create-app" />
  <NextStepCard title="Understanding AI Credits" description="How much an operation costs." href="/docs/build-with-ai/ai-credits" />
</CardGrid>
