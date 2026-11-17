---
id: generate-applications
title: App Generation
---

Describe the app you need, and ToolJet AI plans it, builds it on the canvas with its data and queries, and checks that it works. You follow the build stage by stage in the AI chat, answer a question when the AI needs a decision, and can review or undo each change afterwards.

<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/app-v2.png" alt="An app built by ToolJet AI on the canvas, with the AI chat beside it" />

<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/app-v3.png" alt="An app that ToolJet AI just built on the canvas, with the AI chat beside it showing the build's summary, what it built and what you could do next" />

:::info
This page covers **Start with a prompt**, the AI built into ToolJet. To build the same apps from Claude Code, Codex, or another coding agent, see [ToolJet MCP](./mcp/app-generation.md) instead.
:::

## Creating an Application {#creating-application}

<SectionSubtitle text="Five steps from a prompt to a working app, for visual apps and React Builder apps alike." />

<CardGrid columns={3}>
  <FlowStep number="1" title="Describe" description="Say what the app should do, and mention your data with @." href="#describing-the-app" />
  <FlowStep number="2" title="Choose" description="Pick Visual or React Builder the first time you build." href="#choosing-how-the-app-is-built" />
  <FlowStep number="3" title="Answer" description="The AI asks when your prompt leaves a decision open." href="#answering-questions-during-a-build" />
  <FlowStep number="4" title="Watch" description="Follow the three stages: Data, Build and Check." href="#watching-the-build" />
  <FlowStep number="5" title="Review" description="Read what was built, then see or undo each edit." href="#reading-the-summary" />
</CardGrid>

### Describing the App

1. Open the Home page, or click **Start with a prompt** on the apps dashboard.
2. Describe the business application you want. To build on your own data, type `@` and [mention a data source](./referencing-app-resources.md#mentioning-data-sources). You can also attach up to 5 files.
3. Click the build button.

<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/prompt-v2.png" alt="The prompt box on the Home page, with a description of the app to build" />

ToolJet creates the app, opens it in the App Builder and sends your prompt as the first message in the AI chat.

### Choosing How the App Is Built

The first time you send a prompt, ToolJet asks how it should build the app. Click a card, and the build starts.

- **Visual** builds the app from components on a drag-and-drop canvas, the best fit for most internal tools. See the [App Builder overview](../app-builder/overview.md).
- **React Builder** writes the app as React code that you can edit in ToolJet, VS Code or Cursor, with any layout and styling. See the [React Builder overview](./react-builder/overview.md).

After the first time, ToolJet doesn't ask again: the prompt box shows the build mode it will use, and you can switch it there. An app keeps the mode it was created in.

### Answering Questions During a Build

When your prompt leaves a decision open, the build pauses and a question appears above the message box. Nothing changes on the canvas until you answer.

1. Select one of the numbered options. The option the AI recommends is already selected.
2. Click **Continue**. To let the AI decide instead, click **Skip**.

To answer in your own words, select **Something else** and type your reply in the message box.

<!-- TODO screenshot: /img/build-with-ai/ai-chat/question-card.png | img-s | alt: A question from ToolJet AI above the message box, with numbered options, the recommended one selected, and Skip and Continue | shows: a build paused on a question in the AI chat: the question as the card's title, three or four numbered options with Recommended on the selected one, the Something else row, Skip and Continue, and the message box below; crop the lower part of the chat panel (400 px wide) -->

### Watching the Build

The chat shows the build's stage, a running clock and the step it's working on. A new app is built in three stages: Data, where the AI gets to know your data, then Build, then Check, where it checks that everything works.

<img className="screenshot-full img-s" src="/img/build-with-ai/ai-chat/build-progress.png" alt="The AI chat during a build, with the Data, Build and Check stages, a running clock and the latest steps" />

On the canvas, a visual app fills in as each change lands. A React Builder app's screens appear once their code is built, near the end of the build.

The build keeps going if you reload the page or switch to another chat. To change course, click the stop button that replaces the send button. To be told when the build is done, click **Allow notifications** when the chat offers it.

### Reading the Summary

When the build finishes, the chat shows how long it took, how many steps it ran and, with ToolJet Managed AI, the [credits](./ai-credits.md) it used. Click that line to see every step.

Below it, the AI lists what it built and suggests what you could do next. Click a suggestion, and the AI starts on it. The app is now ready to use, or to change by hand or with another prompt.

## Modifying an Application {#modifying-application}

You can change any app with ToolJet AI, whether the AI built it or you did. Open **AI chat** in the left sidebar and describe the change. To change one specific component or query, [@mention it in the chat](./referencing-app-resources.md).

<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/modify.png" alt="An app in the App Builder that was changed with a prompt" />

An edit shows two stages, Build and Check. While it runs, you can't click on a visual app's canvas. A React Builder app's canvas stays live.

### Reviewing and Undoing an AI Edit

After an edit, click **See what changed** under the AI's reply to compare the app before and after it. It opens the same view as [Compare Versions](../development-lifecycle/release/compare-versions.md).

- In a visual app, **Undo this edit** beside it reverses the newest edit. Both buttons need the Pro plan or above, or a trial. They appear on edits after the first build, which has nothing to compare with.
- In a React Builder app, the comparison has three views: Screens, Code and Access. **Undo this edit** is inside the comparison, and **Redo** brings the edit back.

<img className="screenshot-full img-s" src="/img/build-with-ai/ai-chat/turn-summary-see-what-changed.png" alt="A finished AI edit in the chat: the summary line with its time and steps, then See what changed with a count of what changed, and Undo this edit" />

## Creating Modules

ToolJet AI also generates [modules](../app-builder/modules/overview.md), which you can reuse across multiple applications. Describe the UI you want in the prompt box on the Modules dashboard, or in the AI chat of the Module Builder.

<img className="screenshot-full img-full" src="/img/tooljet-ai/modules/generate.png" alt="A module generated by ToolJet AI in the Module Builder" />

## Chat History

Each app keeps your AI chats for it, and they're private to you. To reopen one, click the **Chats** icon in the AI chat header. See [Chat History](./use-ai-in-tooljet.mdx#chat-history) for more.

<details id="tj-dropdown">
<summary>Other pauses, phases and problems</summary>

#### Other Cards That Pause a Build

Besides a question, the AI can pause a build and wait for you to:

- Pick a data source. The card asks you to **Select data source(s)** for the app's data. If you [@mentioned data sources](./referencing-app-resources.md#mentioning-data-sources) in your prompt, only those are offered.
- Connect a data source. If the app needs a data source that isn't connected yet, click **Connect** followed by the data source name to set up the connection without leaving the chat, then click **I've connected** followed by the name to continue the build. You can also tell the AI to use another data source or sample data. On self-hosted deployments, a marketplace plugin that isn't installed shows **Install** instead, which opens the Marketplace in a new tab.
- Review the specs. See [Reviewing the Specs](#reviewing-the-specs).

#### Reviewing the Specs

When the AI writes a specification for your app, the chat shows a **Specs** card. Click it to open the document next to the chat. Each time the specification changes, ToolJet keeps the earlier version. Use the version dropdown (**Version 1**, **Version 2 - latest**, and so on) to switch between them.

On paid plans, you can edit the latest version: click **Edit**, make your changes, then click **Save & continue**. The AI reads your changes and updates the specification. Click **Cancel** to discard your changes.

#### Implementation Phases

For a larger app, the AI can split the build into phases. A panel above the message box lists the implementation phases and how many steps of each are done, for example 2 of 5. When a phase is done, click **Next phase** to build the next one, or click **Start** on a later phase to build that one.

On the free plan, only the first phase is built. When you try to start another phase, ToolJet shows: "Phase 1 of your app is complete! Free plan covers only one phase."

#### If a Build Stops or Fails

- If you stopped the build, click **Continue the build** to carry on.
- If the build failed or was interrupted, what it saved before then is kept. Click **Retry** to run the same request again, or pick another model first.
- If a data source you mentioned can't connect, the prompt isn't sent. Fix the connection or remove the mention, then send it again.

#### More About Undo

- An edit you undo stays in the app's history, so you can bring it back later.
- A saved, promoted or released version is locked. Undo the edit in a new draft.
- If the version changed after the edit, undoing it would lose that work. Restore an earlier point from [App History](../app-builder/app-history.md) instead.

#### Keyboard Shortcuts

- In a question, press an option's number to select it and **Enter** to send it.
- In the prompt box on the Home page, press **Cmd/Ctrl + Enter** to start the build.

</details>

## Related

<CardGrid min={190}>
  <NextStepCard title="Query Generation" description="Generate queries and code, and organize your query panel." href="/docs/build-with-ai/generate-queries" />
  <NextStepCard title="@mention in AI Chat" description="Target an exact data source, component or query." href="/docs/build-with-ai/referencing-app-resources" />
  <NextStepCard title="Create a React Builder App" description="Start a React app from a prompt or from a blank app." href="/docs/build-with-ai/react-builder/create-app" />
  <NextStepCard title="Understanding AI Credits" description="How much an operation costs." href="/docs/build-with-ai/ai-credits" />
</CardGrid>
