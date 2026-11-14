---
id: freshservice
title: Freshservice
---

# Freshservice

ToolJet can connect to your **Freshservice** account to read and write ITSM data — tickets, assets, requesters, agents, changes, problems, and service catalog items.

---

## Connection

| Field   | Description                                        | Example                         |
|---------|----------------------------------------------------|---------------------------------|
| Domain  | Your Freshservice subdomain                        | `yourcompany.freshservice.com`  |
| API Key | Your personal or system API key (stored encrypted) | `abc123xyz…`                    |

> **Where to find your API key:** Log in to Freshservice → Profile Picture → Profile Settings → **API Key** tab.

Authentication is via HTTP Basic auth: the API key is used as the username and `X` as the password (as required by the Freshservice API v2).

---

## Supported Operations

### Tickets

| Operation         | Description                               | Required fields  |
|-------------------|-------------------------------------------|------------------|
| List tickets      | Returns a paginated list of all tickets   | —                |
| Get ticket        | Fetch a single ticket by ID               | `ticket_id`      |
| Create ticket     | Create a new ticket                       | `body` (JSON)    |
| Update ticket     | Update an existing ticket                 | `ticket_id`, `body` (JSON) |
| Delete ticket     | Permanently delete a ticket               | `ticket_id`      |
| Add note to ticket| Add a private or public note to a ticket  | `ticket_id`, `note_body` |
| Reply to ticket   | Send an email reply to the requester      | `ticket_id`, `reply_body` |

**Create ticket body example:**

```json
{
  "subject": "Printer not working",
  "description": "The office printer on floor 3 is not responding.",
  "email": "requester@example.com",
  "priority": 2,
  "status": 2,
  "source": 2
}
```

**Ticket priority values:** `1` = Low, `2` = Medium, `3` = High, `4` = Urgent  
**Ticket status values:** `2` = Open, `3` = Pending, `4` = Resolved, `5` = Closed

---

### Requesters

| Operation      | Description                            |
|----------------|----------------------------------------|
| List requesters | Returns a paginated list of requesters |

---

### Agents

| Operation   | Description                         |
|-------------|-------------------------------------|
| List agents | Returns a paginated list of agents  |

---

### Assets

| Operation    | Description                         | Required fields |
|--------------|-------------------------------------|-----------------|
| List assets  | Returns a paginated list of assets  | —               |
| Create asset | Create a new asset                  | `body` (JSON)   |

**Create asset body example:**

```json
{
  "asset_type_id": 11,
  "name": "Dell Laptop",
  "asset_tag": "ASSET-1001",
  "description": "Laptop assigned to new hire"
}
```

---

### Changes

| Operation    | Description                          |
|--------------|--------------------------------------|
| List changes | Returns a paginated list of changes  |

---

### Problems

| Operation     | Description                           |
|---------------|---------------------------------------|
| List problems | Returns a paginated list of problems  |

---

### Service Catalog

| Operation                   | Description                                      |
|-----------------------------|--------------------------------------------------|
| List service catalog items  | Returns a paginated list of service catalog items |

---

## Pagination

All list operations support `page` (1-indexed, default: `1`) and `per_page` (max `100`, default: `30`) parameters.

---

## Error Handling

| Scenario           | Behavior                                                                    |
|--------------------|-----------------------------------------------------------------------------|
| Invalid credentials | Clear error message: "Freshservice authentication failed"                  |
| Resource not found | Clear error: "Freshservice resource not found"                              |
| Rate limited (429) | Clear error with retry hint: "Please retry after N seconds"                 |
| API errors (4xx/5xx) | The Freshservice error description is surfaced as the ToolJet error message |

---

## Example Usage

### Fetch all open tickets

Set operation to **List tickets** and filter in your app logic, or use the page/per_page controls to paginate through results.

### Create a ticket from a form

Use a **Button** with an event handler that runs a Freshservice query:
- Operation: **Create ticket**
- Body:
```js
{
  "subject": components.subjectInput.value,
  "description": components.descriptionTextarea.value,
  "email": components.emailInput.value,
  "priority": 2
}
```
