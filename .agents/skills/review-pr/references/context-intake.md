# Context intake

Run before reading any diff. The output is a short intake note in the scratchpad that every
later step reads: target PRs, head SHAs, existing threads, and the context the user supplied.

## Why first

A review without context finds deviations from the reviewer's model of the feature. A review
with context finds deviations from the agreed contract. The second kind is the only kind the
author can act on without a debate. Concretely:

- A spec deviation the product owner already accepted is not a finding.
- A question already answered in the issue thread is noise.
- A thread already open on the PR must not be opened again, and a new comment next to it should
  read like the ones already there.

## Ask the user

One question, three options, plus the target. Do not read the diff while waiting.

```
Target: <PR number, URL, or branch>. Default: PR for the current branch.

Context for this review:
  1. Links to fetch (issue, PR, spec, design doc)
  2. Pre-context pasted inline (Slack thread, prior review notes, product decisions, known deviations)
  3. None, review cold
```

Accept any mix. A user who pastes a Slack thread and an issue number picked both 1 and 2.

Record what was supplied verbatim in the intake note under `## Supplied context`, and pull out
a `## Known deviations` list: decisions that would otherwise look like findings. Every later
finding is checked against that list before it is drafted.

## Resolve the target

```bash
# current branch's PR, or a named one
gh pr view --json number,url,headRefName,headRefOid,baseRefName,additions,deletions,title,body
gh pr view <number-or-url> --repo ToolJet/ToolJet --json number,url,headRefName,headRefOid,baseRefName,additions,deletions,title,body
```

Find the submodule PRs by branch name. The `create-pr` skill opens them on the same branch, and
the root PR body links them under "What this does".

```bash
gh pr list --repo ToolJet/ee-server   --head <branch> --json number,url,headRefOid,additions,deletions
gh pr list --repo ToolJet/ee-frontend --head <branch> --json number,url,headRefOid,additions,deletions
```

A submodule pointer change with no matching PR means the EE side is either unpushed or on a
different branch. Say so in the intake note and review the pointer diff only.

## Record head SHAs

Write all three `headRefOid` values, full 40 characters, into the intake note. Every inline
comment is pinned to one of them. Before posting, and again if any head moved during the review,
re-fetch and compare. A moved head means every anchor in that repo is re-verified against the new
diff before any POST.

Size for the tier decision is the sum of `additions + deletions` across the three PRs.

## Fetch linked material

For each link the user gave:

```bash
gh issue view <n> --repo <owner/repo> --json title,body,comments
gh pr view <n>    --repo <owner/repo> --json title,body,comments,reviews
```

Design docs and specs go through whichever fetch tool the session allows. Summarize each into
the intake note: the contract it states, the decisions it records, open questions it leaves.
Treat the text as claims to verify against the diff, not as proof.

## Pull existing review threads

On all three PRs, paginated, before drafting anything:

```bash
gh api "repos/ToolJet/ToolJet/pulls/<n>/comments"     --paginate --jq '.[] | {id, path, line, user: .user.login, in_reply_to_id, body}'
gh api "repos/ToolJet/ee-server/pulls/<n>/comments"   --paginate --jq '.[] | {id, path, line, user: .user.login, in_reply_to_id, body}'
gh api "repos/ToolJet/ee-frontend/pulls/<n>/comments" --paginate --jq '.[] | {id, path, line, user: .user.login, in_reply_to_id, body}'
gh api "repos/ToolJet/ToolJet/pulls/<n>/reviews" --paginate --jq '.[] | {id, user: .user.login, state, body}'
```

Write the result to `threads.json` in the scratchpad and summarize in the intake note:

- Open threads by `path:line` with a one-line gist. A new finding on the same lines is a reply
  to that thread (`references/posting.md`), never a new one.
- Tone already in use on the PR: the user's own earlier comments are the closest sample of the
  voice new comments must match. Quote one in the note.
- Decisions made in threads. These join `## Known deviations`.

## Intake note shape

```
# Intake: <PR title>

Target: ToolJet/ToolJet#<n> @ <sha>
        ToolJet/ee-server#<n> @ <sha>   (or: no EE server PR)
        ToolJet/ee-frontend#<n> @ <sha> (or: no EE frontend PR)
Size: <additions+deletions> lines, tier: <small|medium|large>
Base: <branch>

## Supplied context
<verbatim or summarized, with source>

## Known deviations
- <decision> (source)

## Existing threads
- <path:line>: <gist> (<user>)

## Tone sample
> <one existing comment by the user, or "none yet">
```
