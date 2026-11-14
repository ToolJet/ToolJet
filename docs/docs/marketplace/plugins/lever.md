---
id: marketplace-plugin-lever
title: Lever
---

# Lever

ToolJet allows you to connect to your Lever account to manage your recruiting pipeline: candidates (opportunities), job postings, interviews, feedback, and offers.

## Connection

To connect to a Lever data source in ToolJet, you can either click the **+Add new data source** button on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page in the ToolJet dashboard.

To connect to your Lever account, the following details are required:
- **Environment**: **Production** (`api.lever.co`) or **Sandbox** (`api.sandbox.lever.co`). Sandbox is a separate deployment with its own data and API keys.
- **API Key**: Your Lever API key.

:::tip
You can generate an API key from your Lever account under **Settings > Integrations and API > Lever API credentials**.
:::

## Querying Lever

1. Click the **+** button in the query manager at the bottom of the editor and select the Lever data source added earlier.
2. Choose the operation you want to perform and fill in its parameters.

:::tip
Query results can be transformed using transformations. Refer to our transformations documentation for more details: **[link](/docs/tutorial/transformations)**
:::

## Supported operations

### Opportunities

- **List opportunities**: List candidates, optionally filtered by stage, posting, tag, archive state, archive reason, or contact email.
- **Get opportunity**: Retrieve a single opportunity by ID.
- **Create opportunity**: Add a candidate with name, headline, contact details, tags, sources, origin, stage, owner, and postings.
- **Update opportunity stage**: Move an opportunity to a different stage.
- **Archive opportunity**: Archive an opportunity with an archive reason, optionally deleting its interviews.
- **Unarchive opportunity**: Return an archived opportunity to active.
- **Add opportunity tags**: Add one or more tags to an opportunity.
- **Add opportunity note**: Add a note to an opportunity. Requires the **Perform as** user ID, since notes need an author.

### Postings

- **List postings**: List job postings, optionally filtered by state and confidentiality.
- **Get posting**: Retrieve a single posting by ID.
- **Create posting**: Create a job posting with title, state, categories, workplace type, and description content. Requires the **Perform as** user ID.
- **Update posting**: Update any subset of a posting's fields.

### Activity and reference data

- **List opportunity interviews**: List an opportunity's interviews.
- **List opportunity feedback**: List an opportunity's feedback.
- **List opportunity offers**: List an opportunity's offers.
- **List stages**: List the pipeline stages and their IDs.
- **List archive reasons**: List archive reasons, optionally filtered by `hired` or `non-hired`.
- **List users**: List Lever users and their IDs (useful for the **Owner** and **Perform as** fields).
- **List requisitions**: List requisitions, optionally filtered by status, code, or confidentiality.

## Pagination and rate limits

List operations accept **Limit** (up to 100) and **Offset** parameters. Lever's responses include `hasNext` and `next`; pass the `next` value as the **Offset** of the following query to page through large result sets. Lever allows at most 10 requests per second per API key; the plugin retries a single `429` response automatically.
