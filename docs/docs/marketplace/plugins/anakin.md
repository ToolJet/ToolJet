---
id: marketplace-plugin-anakin
title: Anakin
---

[Anakin](https://anakin.io) is a web data API. Connecting Anakin to ToolJet lets your apps scrape pages into markdown or JSON, map and crawl sites, run AI web search, run pre-built Wire actions on supported websites, monitor pages for changes, and run AI browser tasks.

:::note
Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

To connect with Anakin, the following credential is required:

- **API Key**: Create one in the [Anakin dashboard](https://anakin.io/dashboard). Keys start with `ask_`. New accounts include 500 free credits.

Testing the connection lists your Wire build requests, which is authenticated and spends no credits.

## Long-running jobs

Scraping, mapping, crawling, agentic search, Wire actions, AI visibility searches and browser tasks run asynchronously. The start operation returns a job ID (`jobId`, `job_id`, `search_id` or `workflow_id`), and the matching **Get ... Result** operation returns the job's status and, once it has finished, its result. To wait for a result in an app, run the **Get ... Result** query on an interval or from a button until its status is `completed` or `failed`.

## Parameter formats

- Lists (for example **Include Patterns** or **Sources**) accept a JavaScript array such as `{{['/blog/*']}}`, a JSON array, or a comma-separated string.
- Objects (for example **Params** or **Output Schema**) accept a JavaScript object or a JSON string.

## Web scraping

### Extract Website Data

**Required Parameter**

- **URL:** The full URL of the website to extract data from

**Optional Parameters**

- **Generate JSON:** AI-extract structured JSON from the page content
- **Country:** Proxy country code, e.g. us, gb, de
- **Use Browser:** Use a headless browser — best for JS-heavy sites
- **Force Fresh:** Bypass the cache and force a fresh extraction
- **Session ID:** Saved browser session ID for login-protected pages. Pair with Use Browser.
- **Session Name:** Saved browser session name (alternative to Session ID)

### Get Scrape Result

**Required Parameter**

- **Job ID:** The jobId returned by Extract Website Data

## Site mapping and crawling

### Map a Site

**Required Parameter**

- **URL:** The starting URL for discovery (typically a homepage or section root)

**Optional Parameters**

- **Limit:** Maximum number of URLs to return overall (default 100, max 1000)
- **Depth:** How many link-hops from the starting URL to follow (default 2, max 5)
- **Limit Per Level:** Maximum URLs collected per depth level (default 100)
- **Include Subdomains:** Include URLs on subdomains of the starting host
- **Include External Links:** Also collect (but do not follow) external links
- **Use Browser:** Render with a headless browser (for SPAs)
- **Search Filter:** Optional keyword filter — only return URLs whose path/title matches

### Get Map Result

**Required Parameter**

- **Job ID:** The jobId returned by Map a Site

### Crawl a Site

**Required Parameter**

- **URL:** Starting URL

**Optional Parameters**

- **Max Pages:** Hard cap on pages fetched (default 10, max 500)
- **Depth:** Link-hops from the starting URL to follow (default 1, max 5)
- **Country:** Two-letter proxy egress country code
- **Use Browser:** Render each page in a headless browser (for SPAs)
- **Include Patterns:** Glob/regex patterns — only URLs matching at least one pattern are fetched
- **Exclude Patterns:** Glob/regex patterns — URLs matching any pattern are skipped
- **Session ID:** Optional saved-browser-session ID for login-protected sites
- **Session Name:** Optional saved-browser-session name

### Get Crawl Result

**Required Parameter**

- **Job ID:** The jobId returned by Crawl a Site

## Search

### Perform AI Search

**Required Parameter**

- **Search query:** The search query or question

**Optional Parameters**

- **Max results:** Maximum number of results to return (default 5, max 20)

### Start Agentic Search

**Required Parameter**

- **Research prompt:** The research question or topic (max 8KB)

**Optional Parameters**

- **Use Browser:** Use a headless browser for citation scraping — matches the API default
- **Result schema (JSON):** Optional JSON Schema (max 50KB) for the structured output

### Get Agentic Search Result

**Required Parameter**

- **Job ID:** The job_id returned by Start Agentic Search

## Wire actions

### Discover Wire Actions

**Required Parameter**

- **Intent:** The intent in natural language, e.g. "top phones on walmart", "search airbnb listings in Lisbon"

**Optional Parameters**

- **Limit:** Maximum number of candidate actions to return (default 5)

### Browse Wire Catalog

**Optional Parameters**

- **Catalog Slug:** Catalog slug to inspect (e.g. "walmart"). Omit to list all catalogs

### Run Wire Read Action

**Required Parameter**

- **Action ID:** The Wire action to run (from Discover Wire Actions / Browse Wire Catalog), e.g. "walmart.search_products"

**Optional Parameters**

- **Params:** The action's input parameters — shape depends on the action, see its schema from discovery. Omit for actions that take none
- **Credential ID:** Required when the action's auth_mode is "required"; honored when "optional". Get one from List Wire Identities or Sign In To Wire Site
- **Identity ID:** Optional identity selector — the server resolves a credential from it (alternative to Credential ID)

### Run Wire Write Action

**Required Parameter**

- **Action ID:** The Wire action to run (from Discover Wire Actions / Browse Wire Catalog), e.g. "amazon.add_to_cart". Never a payment/checkout action — Anakin's API and this plugin both refuse those

**Optional Parameters**

- **Params:** The action's input parameters — shape depends on the action, see its schema from discovery. Omit for actions that take none
- **Credential ID:** Required when the action's auth_mode is "required"; honored when "optional". Get one from List Wire Identities or Sign In To Wire Site
- **Identity ID:** Optional identity selector — the server resolves a credential from it (alternative to Credential ID)

### Get Wire Job Result

**Required Parameter**

- **Job ID:** The job_id returned by Run Wire Read Action / Run Wire Write Action (only present when the action ran asynchronously)

### List Wire Identities

**Optional Parameters**

- **Catalog ID:** Optional — restrict to identities for a single catalog

### Sign In To Wire Site

**Required Parameter**

- **Catalog Slug:** The catalog to sign in to (e.g. "neb")

**Optional Parameters**

- **Login Params:** Login fields defined by the catalog (e.g. email/password). Use Browse Wire Catalog's login_input_schema to learn the field names
- **Identity Name:** Optional name for the identity. Derived from params in password mode; required when using a 1Password locator
- **Source ID:** Optional 1Password identity-source ID (alternative to Login Params)
- **Source Ref:** Optional 1Password item locator { vault_id, item_id, fields } (use with Source ID instead of Login Params)

### Build A New Wire Action

**Required Parameters**

- **Website URL:** The site to build an action for. The domain is extracted automatically
- **Goal:** Natural-language description of what the action should do or extract. Be specific — the builder synthesizes the scraper from this

**Optional Parameters**

- **Catalog ID:** Optional — attach to an existing catalog instead of creating one
- **Visibility:** Action visibility. Defaults to private
- **Force:** Build even if similar actions already exist for the domain (otherwise rejected with ACTION_EXISTS)
- **Actions:** Optional list of discrete capabilities to build, each as its own action. Omit to let the builder infer them from the goal.
- **Country:** Optional 2-letter country code; the action is built and tested through an exit IP in that country

### Check Wire Build Status

**Optional Parameters**

- **Build Request ID:** Build request id from Build A New Wire Action's response. Leave empty to list your recent builds.
- **Status Filter:** List mode only: filter by status, e.g. pending, processing, success, failed
- **Limit:** List mode only: builds per page (1-100). Defaults to 10
- **Page:** List mode only: 1-based page number. Defaults to 1
- **Include Events:** Detail mode only: include the build's step-by-step event log

## Website monitoring

### Create Website Monitor

**Required Parameters**

- **URL:** The URL to watch (root URL for site scope; the Wire site's URL for wire scope)
- **Interval (minutes):** Check frequency in minutes. Minimum 15

**Optional Parameters**

- **Scope:** What to monitor: one page (default), a whole site, or a Wire action
- **Watch Mode:** Compare the whole page (default, 2 credits/check) or only the fields in Output Schema, extracted with AI (3 credits/check)
- **Watch Format:** Format compared in full_page mode. Defaults to markdown
- **Output Schema:** JSON Schema of the fields to track. Required when Watch Mode is "specific_data"
- **AI Mode:** AI meaningful-change filtering: ignores trivial noise and summarizes real changes. +1 credit per check
- **AI Goal:** Natural-language description of which changes count as meaningful (used with AI Mode), e.g. "only when the price drops or it goes out of stock"
- **Use Browser:** Render checks with a stealth headless browser (needed for JS-heavy pages). Forced true when Session ID is set
- **Country:** Two-letter proxy country code. Defaults to "us"
- **Session ID:** Saved browser-session ID for monitoring login-protected pages (see List Browser Sessions)
- **Active:** Start running immediately. Defaults to true
- **Expires At:** Optional end date (ISO 8601 timestamp or YYYY-MM-DD); the monitor auto-pauses when it passes
- **Alert Webhook URL:** Webhook URL that receives signed change alerts
- **Alert Emails:** Comma-separated email recipients for change alerts
- **Max Pages:** Site scope: max pages crawled per run
- **Max Depth:** Site scope: crawl depth (1–5). Defaults to 2
- **Include Patterns:** Site scope: glob patterns or hand-picked same-site URLs to track
- **Exclude Patterns:** Site scope: glob patterns to skip
- **Wire Action ID:** Wire scope (required there): the Wire action run each check, e.g. "amazon.search_products" (see Discover Wire Actions)
- **Wire Catalog Slug:** Wire scope: catalog slug of the Wire site
- **Wire Credential ID:** Wire scope: credential ID when the action needs auth (see List Wire Identities)
- **Wire Params:** Wire scope: parameters passed to the action each check
- **Wire Watch Paths:** Wire scope: JSON paths to diff instead of the whole response

### List Website Monitors

**Optional Parameters**

- **Monitor ID:** Optional — fetch just this monitor instead of the full list

### Get Monitor Changes

**Required Parameter**

- **Monitor ID:** The monitor ID (from List Website Monitors or Create Website Monitor)

### Control Website Monitor

**Required Parameters**

- **Monitor ID:** The monitor ID (from List Website Monitors or Create Website Monitor)
- **Action:** pause stops scheduled checks; resume restarts them; run_now triggers an immediate billed check; delete permanently removes the monitor and its history

## AI visibility

### Start AI Visibility Search

**Required Parameter**

- **Query:** The question to ask every engine (max 2000 characters)

**Optional Parameters**

- **Sources:** Engine slugs to query (see List AI Visibility Sources). Omit to query all enabled engines
- **Country:** Two-letter ISO country for the search geography (proxy exit). Defaults to "us"

### Get AI Visibility Result

**Required Parameter**

- **Search ID:** The search_id returned by Start AI Visibility Search

### List AI Visibility Sources

This operation takes no parameters.

## Browser sessions and browser tasks

### List Browser Sessions

**Optional Parameters**

- **Domain:** Filter to sessions for one website domain, e.g. "amazon.com"

### Delete Browser Session

**Required Parameter**

- **Session ID:** The session ID to delete (from List Browser Sessions)

### Run Browser Task

**Required Parameter**

- **Task Prompt:** The task in natural language. Never include passwords or secrets — use Session ID for authenticated sites

**Optional Parameters**

- **URL:** Navigate here before starting. Omit to let the agent follow URLs named in the prompt
- **Session ID:** Saved browser-session ID (from List Browser Sessions) so the task runs logged in
- **Max Steps:** Cap on agent steps (navigation/click/type actions)
- **Timeout (ms):** Task timeout in milliseconds (server caps runs at ~330s regardless)
- **Output Schema:** JSON Schema for the result — the agent returns structured data conforming to it

### Get Browser Task Result

**Required Parameter**

- **Job ID:** The workflow_id returned by Run Browser Task

