# Posting mechanics

Every call below is `gh api` against the REST endpoints. The GitHub MCP tools also work, but
the REST calls are what this document verifies, and their failure modes are known.

## Before the first POST

1. Every comment body is a file under the scratchpad, one file per comment, named
   `<repo>-<path-slug>-L<line>.md`. The user reads and revises the files.
2. Wait for the user's explicit go. "Looks good" on the drafts is the go; being asked to review
   is not.
3. Re-fetch the three head SHAs. If any moved since intake, re-verify every anchor in that repo
   against the new diff before posting anything there.
4. Check `threads.json` from intake. A finding on lines that already carry an open thread is a
   reply to that thread, not a new comment.

## Choose the repo

The path decides the repo, and the repo decides the SHA:

| Path prefix | Repo | PR | SHA |
|---|---|---|---|
| `server/ee/...` | `ToolJet/ee-server` | EE server PR | EE server head |
| `frontend/ee/...` | `ToolJet/ee-frontend` | EE frontend PR | EE frontend head |
| anything else | `ToolJet/ToolJet` | root PR | root head |

Strip the `server/ee/` or `frontend/ee/` prefix when posting to the EE repo; the path in the
EE PR is relative to the submodule root. Check the EE prefix first. Matching against the root
repo first sends EE comments to lines that do not exist on the root PR, and the API answers 422.

Ambiguous basenames (`service.ts`, `controller.ts`, `index.jsx`, `util.service.ts`) exist many
times over. Carry the full path from the diff in every draft file name and body. Never resolve a
finding to a basename.

## New inline comment

```bash
gh api -X POST "repos/{owner}/{repo}/pulls/{n}/comments" \
  -f commit_id=<full 40-char head sha> \
  -f path=<path as it appears in the PR diff> \
  -F line=<N> \
  -f side=RIGHT \
  -F body=@<draft file>
```

Multi-line anchor adds the start:

```bash
  -F start_line=<M> -f start_side=RIGHT
```

`line` is the last line of the range and the line the comment attaches to. `side=RIGHT` is the
new file; use `LEFT` only for a finding on a deleted line.

The response carries `html_url`. Record it next to the draft; the final message lists these.

## Reply to an existing thread

```bash
gh api -X POST "repos/{owner}/{repo}/pulls/{n}/comments/{comment_id}/replies" \
  -F body=@<draft file>
```

`comment_id` is the root comment of the thread (the one with no `in_reply_to_id`).

## Edit a posted comment

```bash
gh api -X PATCH "repos/{owner}/{repo}/pulls/comments/{comment_id}" -F body=@<draft file>
```

The path has no `{n}`. `repos/{o}/{r}/pulls/{n}/comments/{id}` returns 404. `DELETE` uses the
same path as `PATCH`.

A PATCH cannot split one thread into two. A second finding discovered after posting gets a new
comment on its own anchor, or an `Also on these lines.` tail if it shares the anchor
(`references/comment-format.md`).

## Root comment (large tier only)

One per section, as an issue comment on the PR, after that section's inline threads exist so
the root can link them:

```bash
gh api -X POST "repos/{owner}/{repo}/issues/{n}/comments" -F body=@<section root file>
```

When the user says "no root comment", post the inline comments only. That is the default for
small and medium tiers.

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| 422 with no message | Abbreviated `commit_id`, or the anchor line is not in the diff at that SHA | Use the full 40-char SHA; re-verify the line against `gh pr diff` |
| 422 "pull_request_review_thread.line must be part of the diff" | Line outside any hunk | Move the anchor to the nearest changed line and say in the body which line the finding is about |
| 404 on PATCH | Used `/pulls/{n}/comments/{id}` | Use `/pulls/comments/{id}` |
| Comment lands on the wrong PR | EE path matched against root | Check the EE prefix first, strip it, use the EE SHA |
| Comment posted twice | Retried after a slow success | Check `html_url` in the response before retrying; list existing comments if unsure |

## Final message

After posting, one message to the user:

```
Posted:
  ToolJet/ToolJet#<n>
    <path>:<line>  <html_url>
  ToolJet/ee-server#<n>
    <path>:<line>  <html_url>
Held back: <count>, see <handoff path>   (large tier)
Skipped: <path>:<line>, already open as <thread url>
```
