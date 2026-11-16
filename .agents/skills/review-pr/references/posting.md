# Posting mechanics

All calls are `gh api` against REST endpoints. GitHub MCP tools also work, but these calls and
their failure modes are the verified ones.

## Before the first POST

1. One scratchpad file per comment body, named `<repo>-<path-slug>-L<line>.md`. The user reads and
   revises them.
2. Wait for the user's explicit go. "Looks good" on the drafts is the go; being asked to review is
   not.
3. Re-fetch the three head SHAs. If any moved since intake, re-verify every anchor in that repo
   against the new diff before posting there.
4. Check `threads.json` from intake. A finding on lines with an open thread is a reply to it, not a
   new comment.

## Choose the repo

Path decides repo, repo decides SHA:

| Path prefix | Repo | PR | SHA |
|---|---|---|---|
| `server/ee/...` | `ToolJet/ee-server` | EE server PR | EE server head |
| `frontend/ee/...` | `ToolJet/ee-frontend` | EE frontend PR | EE frontend head |
| anything else | `ToolJet/ToolJet` | root PR | root head |

Strip the `server/ee/` or `frontend/ee/` prefix when posting to the EE repo (EE PR paths are
relative to the submodule root). Check the EE prefix first; matching against root first sends EE
comments to lines absent from the root PR, and the API answers 422.

Basenames like `service.ts`, `controller.ts`, `index.jsx`, `util.service.ts` repeat across the
tree. Carry the full diff path in every draft file name and body; never resolve a finding to a
basename.

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

`line` is the range's last line and the one the comment attaches to. `side=RIGHT` is the new file;
`LEFT` only for a finding on a deleted line.

Record the response's `html_url` next to the draft; the final message lists these.

## Reply to an existing thread

```bash
gh api -X POST "repos/{owner}/{repo}/pulls/{n}/comments/{comment_id}/replies" \
  -F body=@<draft file>
```

`comment_id` is the thread's root comment (no `in_reply_to_id`).

## Edit a posted comment

```bash
gh api -X PATCH "repos/{owner}/{repo}/pulls/comments/{comment_id}" -F body=@<draft file>
```

No `{n}` in the path; `repos/{o}/{r}/pulls/{n}/comments/{id}` returns 404. `DELETE` uses the same
path as `PATCH`.

A PATCH cannot split a thread. A second finding found after posting gets a new comment on its own
anchor, or an `Also on these lines.` tail if it shares the anchor (`references/comment-format.md`).

## Root comment (large tier only)

One per section, as an issue comment on the PR, after that section's inline threads exist so it can
link them:

```bash
gh api -X POST "repos/{owner}/{repo}/issues/{n}/comments" -F body=@<section root file>
```

"No root comment" means inline comments only, the default for small and medium tiers.

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
