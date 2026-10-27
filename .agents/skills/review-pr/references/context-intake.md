# Context intake

Run before reading any diff. Output: a short intake note in the scratchpad that every later step
reads (target PRs, head SHAs, existing threads, supplied context).

Without context a review finds deviations from the reviewer's model; with it, deviations from the
agreed contract, which the author can act on without a debate:

- A spec deviation the product owner already accepted is not a finding.
- A question already answered in the issue thread is noise.
- An open thread on the PR is never reopened, and new comments match the tone of existing ones.

## Ask the user

One question, three options, plus the target. Do not read the diff while waiting.

```
Target: <PR number, URL, or branch>. Default: PR for the current branch.

Context for this review:
  1. Links to fetch (issue, PR, spec, design doc)
  2. Pre-context pasted inline (Slack thread, prior review notes, product decisions, known deviations)
  3. None, review cold
```

Any mix is fine (a Slack paste plus an issue number is 1 and 2).

Record what was supplied verbatim under `## Supplied context`, and extract `## Known deviations`:
decisions that would otherwise look like findings. Check every finding against that list before
drafting it.

## Resolve the target

```bash
# current branch's PR, or a named one
gh pr view --json number,url,headRefName,headRefOid,baseRefName,additions,deletions,title,body
gh pr view <number-or-url> --repo ToolJet/ToolJet --json number,url,headRefName,headRefOid,baseRefName,additions,deletions,title,body
```

Submodule PRs share the branch name (`create-pr` opens them that way; the root PR body links them
under "What this does").

```bash
gh pr list --repo ToolJet/ee-server   --head <branch> --json number,url,headRefOid,additions,deletions
gh pr list --repo ToolJet/ee-frontend --head <branch> --json number,url,headRefOid,additions,deletions
```

A submodule pointer change with no matching PR means the EE side is unpushed or on another branch.
Note it and review the pointer diff only.

## Record head SHAs

Write all three full 40-character `headRefOid` values into the intake note; every inline comment
pins to one. Re-fetch and compare before posting, and whenever a head may have moved. A moved head
means re-verifying every anchor in that repo against the new diff before any POST.

Tier size = sum of `additions + deletions` across the three PRs.

## Fetch linked material

```bash
gh issue view <n> --repo <owner/repo> --json title,body,comments
gh pr view <n>    --repo <owner/repo> --json title,body,comments,reviews
```

Design docs and specs go through whichever fetch tool the session allows. Summarize each in the
note: the contract it states, decisions it records, open questions. Treat the text as claims to
verify against the diff, not proof.

## Pull existing review threads

On all three PRs, paginated, before drafting anything:

```bash
gh api "repos/ToolJet/ToolJet/pulls/<n>/comments"     --paginate --jq '.[] | {id, path, line, user: .user.login, in_reply_to_id, body}'
gh api "repos/ToolJet/ee-server/pulls/<n>/comments"   --paginate --jq '.[] | {id, path, line, user: .user.login, in_reply_to_id, body}'
gh api "repos/ToolJet/ee-frontend/pulls/<n>/comments" --paginate --jq '.[] | {id, path, line, user: .user.login, in_reply_to_id, body}'
gh api "repos/ToolJet/ToolJet/pulls/<n>/reviews" --paginate --jq '.[] | {id, user: .user.login, state, body}'
```

Write the result to `threads.json` in the scratchpad and summarize in the note:

- Open threads by `path:line`, one-line gist. A new finding on the same lines is a reply to that
  thread (`references/posting.md`), never a new one.
- Tone sample: quote one of the user's own earlier comments; new comments match that voice.
- Decisions made in threads join `## Known deviations`.

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
