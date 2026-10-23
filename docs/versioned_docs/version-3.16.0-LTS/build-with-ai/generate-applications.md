---
id: generate-applications
title: App Generation
---

This guide explains how to generate and modify applications and modules with ToolJet AI, using nothing but a prompt.

:::info
This page covers **Start with a prompt**, the AI built into ToolJet. To build the same apps from Claude Code, Codex, or another coding agent, see [ToolJet MCP](/docs/build-with-ai/mcp/app-generation) instead.
:::

## Creating Application

Enter a prompt on the home page describing the business application you want to build, and ToolJet generates it for you. There are no intermediate steps to confirm; the app is built directly from your prompt.

<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/prompt-v2.png" alt="tooljet generate apps" />

Once generation finishes, you are taken to the App Builder with a fully functional app: UI components, queries, and data bindings are already configured, and you can customize anything from there.

<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/app-v2.png" alt="tooljet generate apps" />

## Modifying Application

You can modify any application in ToolJet with AI assistance, whether it's a newly created app or an existing one. You can update components and queries within your application with just a prompt.

<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/modify.png" alt="tooljet generate apps" />

To change one specific component or query rather than letting the AI infer the target, [@mention it in the chat](/docs/build-with-ai/referencing-app-resources).

## Attaching Files

You can attach files to a prompt so ToolJet AI can use them while it builds or modifies your app. For example, you can attach a CSV of sample data, a PDF spec, or a screenshot of a layout you want.

Files can be attached in:
- The prompt on the home page, when creating an app.
- The AI chat in the App Builder.
- The prompt in the Module Builder, when creating a module.

The [docs assistant](/docs/build-with-ai/ai-docs-assistant) doesn't accept files.

To attach files, use any of these methods:
- Click the **Attach files** (paperclip) button next to the model picker and choose one or more files.
- Drag files onto the chat. A **Drop to attach** overlay appears while you drag.
- Paste files from your clipboard into the prompt.

Each attached file appears above the prompt with a thumbnail and the status **Ready to send**. Click the **x** on a file to remove it before sending. The files are uploaded when you send the message, and the sent message lists the files it carried.

<!-- TODO screenshot: AI chat composer in the App Builder with one attached file chip showing "Ready to send" -->

If you send files without typing a prompt, ToolJet sends a default prompt: **Use the attached files to help build this app.** from the home page, or **Review the attached files for this app.** from the App Builder chat.

### Limits

- Up to **5 files per message**.
- Up to **10 MB per file**.
- File names must be 1–255 characters long.

<!-- TODO verify: whether the AI agent or LLM provider rejects specific file types. ToolJet itself doesn't restrict file types. -->

Self-hosted administrators can also limit total attachment storage and upload attempts. See [ToolJet AI Attachments](/docs/setup/configuration/env-vars#tooljet-ai-attachments).

### Supported Models

Files can only be sent when the chat uses the OpenAI, Claude (Anthropic), Grok, Gemini, DeepSeek, or OpenRouter provider. With any other provider, sending is blocked with this message:

> Files are supported in the OpenAI, Claude, Grok, Gemini, DeepSeek and OpenRouter builder chats. Select one of these models there to send files.

To change the provider, see [Selecting an AI Model](/docs/build-with-ai/model-selection).

### Reusing and Expiring Files

Files you send stay attached to the conversation, so later messages in the same chat can use them without uploading them again. Attached files expire after a while. When an earlier file is no longer available, the chat shows: **Some earlier attachments expired or are unavailable. Attach them again if needed; you can continue this conversation.**

<!-- TODO verify: how long attached files are retained before they expire (the expiry is set by the AI server, not by ToolJet). -->

A file belongs to the conversation it was sent in. To use the same file in another conversation, attach it again.

### Errors

| Message | What it means |
|---------|---------------|
| `“<file name>” exceeds the 10 MB limit.` | The file is larger than 10 MB. |
| `You can attach up to 5 files per message. Remove one to add more.` | You already have 5 files attached to this message. |
| `This workspace has reached its attachment storage limit. Contact your administrator.` | The workspace has used up its attachment storage. |
| `Attachment upload limit reached. Try again later.` | Too many files have been uploaded recently. Wait and try again. |
| `This attachment has expired or is unavailable. Please attach it again.` | A previously sent file has expired. Attach it again. |
| `This file belongs to another conversation. Upload it again.` | The file was sent in a different chat. Attach it again in this one. |
| `File uploads are unavailable because attachment setup is incomplete. Ask your administrator to apply the latest database updates.` | The ToolJet database migrations for attachments haven't been applied. |

## Creating Modules

ToolJet AI can be used to quickly generate Modules, which can then be reused across multiple applications. To generate a module using ToolJet AI, open the Module Builder and enter your prompt describing the UI you want to create.

<img className="screenshot-full img-full" src="/img/tooljet-ai/modules/generate.png" alt="tooljet generate modules" />

## Related

- [Query Generation](/docs/build-with-ai/generate-queries) — generate queries, code, and organize your query panel
- [@mention in AI Chat](/docs/build-with-ai/referencing-app-resources) — target an exact component or query
- [Understanding AI Credits](/docs/build-with-ai/ai-credits) — how much an operation costs
