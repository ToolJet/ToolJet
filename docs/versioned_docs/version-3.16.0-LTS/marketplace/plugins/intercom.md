---
id: marketplace-plugin-intercom
title: Intercom
---

Using this plugin, you can integrate Intercom with ToolJet to manage customer conversations, support workflows, and user engagement directly from your applications.

## Connection

To make a connection, you first need to create an application in Intercom and obtain an **access token**.

### How to obtain the access token

- Create an app in Intercom.
- Navigate to:
  **Settings > Integrations > Developer Hub**
- Select **Create an app** from the workspace.
- Open the **Authentication** tab.
- Copy the generated **Access Token** and use it to configure the connection in ToolJet.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/intercom/connection.png" alt="Marketplace: Intercom Connection" />

:::info
For more information, refer **[here](https://developers.intercom.com/docs/build-an-integration/learn-more/authentication#how-to-get-your-access-token)** on how to generate access token.
:::

## Supported Operations

ToolJet supports multiple Intercom operations through REST API calls, enabling you to manage conversations, contacts, companies, tickets, articles, and other Intercom resources directly within your application.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/marketplace/plugins/intercom/supported-ops.png" alt="Marketplace: Intercom operations"/>

| Method | API Endpoint            | Description                                                  |
| ------ | ----------------------- | ------------------------------------------------------------ |
| GET    | `/me`                   | Identify an admin                                            |
| GET    | `/admins`               | List all admins                                              |
| GET    | `/articles`             | List all articles                                            |
| POST   | `/articles`             | Create an article                                            |
| GET    | `/away_status_reasons`  | List all away status reasons                                 |
| GET    | `/internal_articles`    | List all internal articles                                   |
| POST   | `/internal_articles`    | Create an internal article                                   |
| GET    | `/ip_allowlist`         | Get IP allowlist settings                                    |
| PUT    | `/ip_allowlist`         | Update IP allowlist settings                                 |
| POST   | `/companies`            | Create or update a company                                   |
| GET    | `/companies`            | Retrieve companies                                           |
| GET    | `/contacts`             | List all contacts                                            |
| POST   | `/contacts`             | Create a contact                                             |
| GET    | `/conversations`        | List all conversations                                       |
| POST   | `/conversations`        | Create a conversation                                        |
| GET    | `/data_attributes`      | List all data attributes                                     |
| POST   | `/data_attributes`      | Create a data attribute                                      |
| POST   | `/events`               | Submit a data event                                          |
| GET    | `/events`               | List all data events                                         |
| POST   | `/messages`             | Create a message                                             |
| GET    | `/segments`             | List all segments                                            |
| GET    | `/subscription_types`   | List subscription types                                      |
| POST   | `/phone_call_redirects` | Create a phone switch                                        |
| GET    | `/calls`                | List all calls                                               |
| GET    | `/tags`                 | List all tags                                                |
| POST   | `/tags`                 | Create or update a tag, tag or untag companies, tag contacts |
| GET    | `/teams`                | List all teams                                               |
| GET    | `/ticket_states`        | List all ticket states                                       |
| GET    | `/ticket_types`         | List all ticket types                                        |
| POST   | `/ticket_types`         | Create a ticket type                                         |
| POST   | `/tickets`              | Create a ticket                                              |
| PUT    | `/visitors`             | Update a visitor                                             |
| GET    | `/visitors`             | Retrieve a visitor with User ID                              |
| GET    | `/brands`               | List all brands                                              |
| GET    | `/emails`               | List all email settings                                      |

#### ADMIN_ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| PUT | `/admins/{admin_id}/away` | Set an admin to away |
| GET | `/admins/{admin_id}` | Retrieve an admin |

#### ACTIVITY_LOGS
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/admins/activity_logs` | List all activity logs |

#### CONTENT_IMPORT_SOURCES
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/ai/content_import_sources` | List content import sources |
| POST | `/ai/content_import_sources` | Create a content import source |
| DELETE | `/ai/content_import_sources/{source_id}` | Delete a content import source |
| GET | `/ai/content_import_sources/{source_id}` | Retrieve a content import source |
| PUT | `/ai/content_import_sources/{source_id}` | Update a content import source |

#### EXTERNAL_PAGES
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/ai/external_pages` | List external pages |
| POST | `/ai/external_pages` | Create an external page (or update an external page by external ID) |
| DELETE | `/ai/external_pages/{page_id}` | Delete an external page |
| GET | `/ai/external_pages/{page_id}` | Retrieve an external page |
| PUT | `/ai/external_pages/{page_id}` | Update an external page |

#### ARTICLE_ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/articles/{article_id}` | Retrieve an article |
| PUT | `/articles/{article_id}` | Update an article |
| DELETE | `/articles/{article_id}` | Delete an article |

#### SEARCH
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/articles/search` | Search for articles |
| GET | `/internal_articles/search` | Search for internal articles |
| POST | `/contacts/search` | Search contacts |
| POST | `/conversations/search` | Search conversations |
| POST | `/calls/search` | List calls with transcripts |
| POST | `/tickets/search` | Search tickets |

#### REPORTING_DATA
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/export/reporting_data/enqueue` | Enqueue a new reporting data export job |
| GET | `/export/reporting_data/{job_identifier}` | Get export job status |
| GET | `/export/reporting_data/get_datasets` | List available datasets and attributes |
| GET | `/download/reporting_data/{job_identifier}` | Download completed export job data |

#### COLLECTIONS
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/help_center/collections` | List all collections |
| POST | `/help_center/collections` | Create a collection |
| GET | `/help_center/collections/{collection_id}` | Retrieve a collection |
| PUT | `/help_center/collections/{collection_id}` | Update a collection |
| DELETE | `/help_center/collections/{collection_id}` | Delete a collection |

#### HELP_CENTERS
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/help_center/help_centers/{help_center_id}` | Retrieve a Help Center |
| GET | `/help_center/help_centers` | List all Help Centers |

#### INTERNAL_ARTICLE_ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/internal_articles/{internal_article_id}` | Retrieve an internal article |
| PUT | `/internal_articles/{internal_article_id}` | Update an internal article |
| DELETE | `/internal_articles/{internal_article_id}` | Delete an internal article |

#### COMPANY_ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/companies/{company_id}` | Retrieve a company by ID |
| PUT | `/companies/{company_id}` | Update a company |
| DELETE | `/companies/{company_id}` | Delete a company |
| GET | `/companies/{company_id}/contacts` | List attached contacts for companies |
| GET | `/companies/{company_id}/segments` | List attached segments for companies |
| GET | `/companies/{company_id}/notes` | List all company notes |

#### LIST
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/companies/list` | List all companies |

#### SCROLL
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/companies/scroll` | Scroll over all companies |

#### CONTACT_ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/contacts/{contact_id}/companies` | Attach a contact to a company |
| GET | `/contacts/{contact_id}/companies` | List attached companies for contact |
| DELETE | `/contacts/{contact_id}/companies/{company_id}` | Detach contact from a company |
| GET | `/contacts/{contact_id}/notes` | List all notes |
| POST | `/contacts/{contact_id}/notes` | Create a note |
| GET | `/contacts/{contact_id}/segments` | List attached segments for contact |
| GET | `/contacts/{contact_id}/subscriptions` | List subscriptions for a contact |
| POST | `/contacts/{contact_id}/subscriptions` | Add subscription to a contact |
| DELETE | `/contacts/{contact_id}/subscriptions/{subscription_id}` | Remove subscription from a contact |
| GET | `/contacts/{contact_id}/tags` | List tags attached to a contact |
| POST | `/contacts/{contact_id}/tags` | Add tag to a contact |
| DELETE | `/contacts/{contact_id}/tags/{tag_id}` | Remove tag from a contact |
| PUT | `/contacts/{contact_id}` | Update a contact |
| GET | `/contacts/{contact_id}` | Get a contact |
| DELETE | `/contacts/{contact_id}` | Delete a contact |
| POST | `/contacts/{contact_id}/archive` | Archive contact |
| POST | `/contacts/{contact_id}/unarchive` | Unarchive contact |
| POST | `/contacts/{contact_id}/block` | Block contact |

#### MERGE
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/contacts/merge` | Merge a lead and a user |

#### FIND_BY_EXTERNAL_ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/contacts/merge` | Merge a lead and a user |

#### CONVERSATION_ID
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/contacts/find_by_external_id/{external_id}` | Get a contact by External ID |
| POST | `/conversations/{conversation_id}/tags` | Add tag to a conversation |
| DELETE | `/conversations/{conversation_id}/tags/{tag_id}` | Remove tag from a conversation |
| GET | `/conversations/{conversation_id}` | Retrieve a conversation |
| PUT | `/conversations/{conversation_id}` | Update a conversation |
| DELETE | `/conversations/{conversation_id}` | Delete a conversation |
| POST | `/conversations/{conversation_id}/reply` | Reply to a conversation |
| POST | `/conversations/{conversation_id}/parts` | Manage a conversation |
| POST | `/conversations/{conversation_id}/customers` | Attach a contact to a conversation |
| DELETE | `/conversations/{conversation_id}/customers/{contact_id}` | Detach contact from a conversation |
| POST | `/conversations/{conversation_id}/convert` | Convert a conversation to a ticket |

#### REDACT
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/conversations/redact` | Redact a conversation part |

#### NOTIFY_NEW_CONVERSATION
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/custom_channel_events/notify_new_conversation` | Notify Intercom of a new conversation created in a custom channel |

#### NOTIFY_NEW_MESSAGE
| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/custom_channel_events/notify_new_message` | Notify Intercom of a new message in a custom channel conversation |

#### NOTIFY_QUICK_REPLY_SELECTED

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/custom_channel_events/notify_quick_reply_selected` | Notify Intercom of a quick reply response in a custom channel conversation |

#### NOTIFY_ATTRIBUTE_COLLECTED

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/custom_channel_events/notify_attribute_collected` | Notify Intercom of an attribute collector response in a custom channel conversation |

#### CUSTOM_OBJECT_TYPE_IDENTIFIER

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/custom_object_instances/{custom_object_type_identifier}` | Create or update a custom object instance |
| GET | `/custom_object_instances/{custom_object_type_identifier}` | Get custom object instance by External ID |
| DELETE | `/custom_object_instances/{custom_object_type_identifier}` | Delete a custom object instance by External ID |
| GET | `/custom_object_instances/{custom_object_type_identifier}/{custom_object_instance_id}` | Get custom object instance by ID |
| DELETE | `/custom_object_instances/{custom_object_type_identifier}/{custom_object_instance_id}` | Delete custom object instance by ID |

#### DATA_ATTRIBUTE_ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| PUT | `/data_attributes/{data_attribute_id}` | Update a data attribute |

#### SUMMARIES

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/events/summaries` | Create event summaries |

#### CONTENT

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/export/content/data` | Create content data export |
| GET | `/export/content/data/{job_identifier}` | Show content data export |
| GET | `/download/content/data/{job_identifier}` | Download content data export |

#### CANCEL

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/export/cancel/{job_identifier}` | Cancel content data export |

#### STATUS

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/jobs/status/{job_id}` | Retrieve job status |

#### NEWS_ITEMS

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/news/news_items` | List all news items |
| POST | `/news/news_items` | Create a news item |
| GET | `/news/news_items/{news_item_id}` | Retrieve news item |
| PUT | `/news/news_items/{news_item_id}` | Update a news item |
| DELETE | `/news/news_items/{news_item_id}` | Delete a news item |

#### NEWSFEEDS

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/news/newsfeeds/{newsfeed_id}/items` | List all live newsfeed items |
| GET | `/news/newsfeeds` | List all newsfeeds |
| GET | `/news/newsfeeds/{newsfeed_id}` | Retrieve a newsfeed |

#### NOTE_ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/notes/{note_id}` | Retrieve a note |

#### SEGMENT_ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/segments/{segment_id}` | Retrieve a segment |

#### CALL_ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/calls/{call_id}` | Get a call |
| GET | `/calls/{call_id}/recording` | Get call recording by call ID |
| GET | `/calls/{call_id}/transcript` | Get call transcript by call ID |

#### TAG_ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/tags/{tag_id}` | Find a specific tag |
| DELETE | `/tags/{tag_id}` | Delete tag |

#### TEAM_ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/teams/{team_id}` | Retrieve a team |

#### TICKET_TYPE_ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/ticket_types/{ticket_type_id}/attributes` | Create an attribute for a ticket type |
| PUT | `/ticket_types/{ticket_type_id}/attributes/{attribute_id}` | Update an existing attribute for a ticket type |
| GET | `/ticket_types/{ticket_type_id}` | Retrieve a ticket type |
| PUT | `/ticket_types/{ticket_type_id}` | Update a ticket type |

#### TICKET_ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/tickets/{ticket_id}/reply` | Reply to a ticket |
| POST | `/tickets/{ticket_id}/tags` | Add tag to a ticket |
| DELETE | `/tickets/{ticket_id}/tags/{tag_id}` | Remove tag from a ticket |
| PUT | `/tickets/{ticket_id}` | Update a ticket |
| GET | `/tickets/{ticket_id}` | Retrieve a ticket |
| DELETE | `/tickets/{ticket_id}` | Delete a ticket |

#### ENQUEUE

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/tickets/enqueue` | Enqueue create ticket |

#### CONVERT

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/visitors/convert` | Convert a visitor |

#### ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/brands/{id}` | Retrieve a brand |
| GET | `/emails/{id}` | Retrieve an email setting |

#### REGISTER

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/fin_voice/register` | Register a Fin Voice call |

#### COLLECT

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/fin_voice/collect/{id}` | Collect Fin Voice call by ID |

#### EXTERNAL_ID

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/fin_voice/external_id/{external_id}` | Collect Fin Voice call by external ID |

#### PHONE_NUMBER

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/fin_voice/phone_number/{phone_number}` | Collect Fin Voice call by phone number |

#### CONVERSATION

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/fin_voice/conversation/{conversation_id}` | Collect Fin Voice calls by conversation ID |

#### WORKFLOWS

| Method | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/export/workflows/{id}` | Export a workflow |

## Example Queries

Operation : GET /`me` 

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/marketplace/plugins/intercom/get-me.png" alt="Marketplace: Intercom example queries" />

Operation : GET /`articles`

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/marketplace/plugins/intercom/get-articles.png" alt="Marketplace: Intercom example queries" />

Operation : GET /`away_status_reasons` 

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/marketplace/plugins/intercom/get-away-status.png" alt="Marketplace: Intercom example queries" />