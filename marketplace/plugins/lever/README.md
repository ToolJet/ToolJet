# Lever

ToolJet marketplace connector for the [Lever](https://www.lever.co) recruiting API (v1). It covers the
day-to-day recruiting workflow: candidates (opportunities), job postings, interview activity and the
reference data (stages, archive reasons, users, requisitions) those records point at.

## Connection

- **Environment** - Production (`api.lever.co`) or Sandbox (`api.sandbox.lever.co`). Sandbox is a fully
  separate deployment with its own data and its own API keys. Defaults to Production.
- **API Key** - generate one in Lever under Settings > Integrations and API > Lever API credentials. The
  key is sent as the username of an HTTP Basic credential with an empty password, which is the scheme the
  Lever API expects.

## Supported operations

### Opportunities (candidates)

- **List opportunities** - filter by stage, posting, tag, archive state, archive reason or contact email,
  with limit/offset pagination (max 100 per page).
- **Get opportunity** - one opportunity by id.
- **Create opportunity** - name plus optional headline, contact details, tags, sources, origin, stage,
  owner, location and postings. Comma-separated editor fields become the arrays Lever expects.
- **Update opportunity stage** - move an opportunity to a new stage.
- **Archive / Unarchive opportunity** - archiving takes an archive reason id (see List archive reasons)
  and can optionally delete associated interviews; unarchiving clears the reason.
- **Add opportunity tags**.
- **Add opportunity note** - notes require an author, so `perform_as` (a Lever user id) is required.

### Postings (jobs)

- **List postings** - filter by state and confidentiality, with pagination.
- **Get posting** - one posting by id, optionally filtered by distribution.
- **Create posting** - title plus optional state, categories (team, location, department, commitment),
  workplace type, requisition codes, tags and the description content. `perform_as` is required by Lever.
- **Update posting** - any subset of the create fields.

### Activity and reference data

- **List opportunity interviews / feedback / offers**.
- **List stages** - stage ids for the stage fields and filters.
- **List archive reasons** - optionally filtered by `hired` / `non-hired`.
- **List users** - user ids for `owner` and `perform_as`.
- **List requisitions** - filter by status, code or confidentiality.

## Notes

- Writes that attribute an action to a person accept an optional `perform_as` user id; Lever requires it
  for creating postings and notes.
- The API allows at most 10 requests per second per key; the connector retries a single 429 response.
- `lib/icon.svg` is an original minimal monogram for the datasource tile.

API reference: https://hire.lever.co/developer/documentation
