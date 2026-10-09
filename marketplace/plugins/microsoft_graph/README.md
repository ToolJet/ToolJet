
# Microsoft_graph

Documentation on: https://docs.tooljet.com/docs/data-sources/microsoft_graph

## Entities

The **Entity** dropdown in the query editor is backed by the OpenAPI specs in `openapi-specs/`, which
are registered in `lib/operations.json`:

| Entity     | Spec                        |
| ---------- | --------------------------- |
| Outlook    | `openapi-specs/outlook.json`    |
| Calendar   | `openapi-specs/calendar.json`   |
| Users      | `openapi-specs/users.json`      |
| Teams      | `openapi-specs/teams.yaml`      |
| OneDrive   | `openapi-specs/onedrive.json`   |
| SharePoint | `openapi-specs/sharepoint.json` |
| OneNote    | `openapi-specs/onenote.json`    |

Adding a spec file to `openapi-specs/` and referencing it from `operations.json` is enough — the
server discovers spec files automatically at install time. An **already installed** plugin needs a
reload (`POST /plugins/:id/reload`) before a newly added spec shows up in the Entity dropdown.

## OneNote

Requires the corresponding Microsoft Graph permissions on the app registration: `Notes.Read`,
`Notes.Create`, `Notes.ReadWrite`, `Notes.Read.All`, or `Notes.ReadWrite.All`. The datasource
requests `https://graph.microsoft.com/.default`, so the granted permissions come from the app
registration rather than from the ToolJet datasource configuration.

Three OneNote operations do not use a plain JSON request/response and are handled explicitly in
`lib/index.ts`:

- **Create page** (`POST /me/onenote/sections/{section-id}/pages`) — put the page's OneNote HTML in
  the `htmlContent` field. The plugin sends it as a `text/html` body.
- **Get page content** (`GET /me/onenote/pages/{page-id}/content`) — returns the page HTML as a
  string rather than the `{ base64, mimeType, size }` shape used for binary downloads. Pass
  `includeIDs=true` to get the `data-id` values needed as patch targets.
- **Update page content** (`PATCH /me/onenote/pages/{page-id}/content`) — put a JSON array of
  `{ target, action, position, content }` patch commands in the `commands` field.

`GET /me/onenote/resources/{resource-id}/content` downloads images and files embedded in a page and
does return `{ base64, mimeType, size }`.
