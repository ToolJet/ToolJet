# Comment format

The single home for format and tone rules. The author reads each comment once, cold, between other
work. They never saw the report, the intake note, or the other findings, so every comment must make
sense on its own. Line 1 carries the verdict, the body the causal chain in a fixed order, one
thread one finding.

## Inline comments

### Line 1

The triage surface: notifications, email subject and the collapsed Files-changed view show about
this line.

- The consequence: who hits what, and when. Never the code: no file paths, no symbol names.
- Name the actor by role (builder, end user, agent, admin), not by mechanism ("a PAT client").
- Under ~120 characters, blank line after.
- A question ends line 1 with the question: "... Intended?"

If it cannot be written without a path, the finding is not understood yet.

Small and medium tiers: plain consequence sentence, "we" voice, no tag.

```
Two builders saving the same version at once leaves the second save silently dropped.
```

Large tier: severity first (closed set in `references/lenses.md`), since the author triages many
threads without opening them.

```
**Blocker** - Two builders saving the same version at once leaves the second save silently dropped.
```

### Body, in this order, omitting empty parts

No labels except `Impact:` and `Also on these lines:`; the order is the structure.

1. Why. One or two short paragraphs: the cause, in plain words.
2. Example. The concrete case as a few-line ascii flow in a plain fence: input → output,
   request → response, before → after. Use it whenever the bug is about values or a sequence; it
   usually replaces a paragraph. Longer proof (trace, error text) goes in `<details>`.
3. `Impact:` (bold, colon) only when it adds what line 1 does not: who, when, how often, how bad.
   Never a restatement of line 1, no hedging ("If so,"), no cross-reference inside it. Never
   "none"; omit it instead.
4. Ask. One sentence, "Could we ...?". Then the code: a `suggestion` block when the change is on
   the anchored lines, otherwise a short snippet whose first line is a comment naming the file.
   Always visible, never collapsed.
5. Test, when the finding is a missing test or a bug a test would catch: a ready-to-paste case and
   one sentence on when it fails ("fails today, passes with the change").
6. `Related:` one line, last, only for a link to another PR or thread.

### Plain words

- Say what the author can observe: the status code, the error, what saves, what is logged. Avoid
  the PR's own vocabulary (mode, source, confidence); where the fix needs a term, explain it once
  in a clause.
- Domain terms from `UBIQUITOUS_LANGUAGE.md`: Workspace not Organization, Component not Widget,
  End User not Viewer, Data Source never `ds`.
- Self-contained: no finding numbers, severity or section labels in the body (they live in the
  report entry), and no review vocabulary: "prior #4", "D3", "the probe", "the calibration",
  "mutation survived", "this thread", "merged from", "the agent found", "verified with". No
  merged sub-PR references.
- Cite little; the anchor already says where. Name other code by symbol; at most one `path:line`
  per paragraph, never a chain like `ci.yml:262, :267, :62-65`.
- Paragraphs of one or two sentences. Bullets only for scanned lists (routes, files, cases); a
  causal chain stays prose so every "because" survives.
- Diagram when the point is a flow or two paths converging: ascii by default (email and mobile
  show raw mermaid), mermaid only when ascii cannot show it.
- Code fits ~80 columns. Wrap snippets; for a long line show only the part that changes.
  `suggestion` blocks match the replaced lines exactly.
- "We" voice, suggestions not orders. Do not restate what the code does before saying what is
  wrong, or open with "This file", "This helper", "The guard".
- No em dashes, emoji, praise, `###` headings, or bold on a line of its own. A decision worth
  affirming is a finding ("keep X, because Y").

### Asks stay small

The fix is the smallest change that closes the gap: a guard, a filter, a deleted line, one test.
Deletion beats redesign. No new file, helper or abstraction unless it removes more than it adds,
and no refactor the bug does not need. A bigger lasting fix gets one sentence, not code. When two
fixes work, show the smaller and name the other in a clause.

A question asks one thing the diff cannot answer, then says what each answer means for the code.

### Length

- Aim under 15 rendered lines, code included. Over ~35 with the disclosure closed: two findings,
  split.
- At most one `<details>`, never nested, only for a block of evidence or test over ~8 lines. Never
  the ask or a `suggestion` block (batch-apply needs it expanded). `<summary>` says what is inside
  ("Test for service.spec.ts"), not "Details".

### One finding per thread

GitHub resolves per thread; a second finding is lost once the author replies to the first.

- Split when the second finding has a different anchor, fix, or severity. Severity comes from the
  section review, not the formatting agent.
- Keep in-thread under `Also on these lines:` when it shares the anchor and the author would fix
  both in one edit. At most one such tail.
- A fix's precondition is not a second finding. It goes next to the fix it constrains.

Editing posted comments: a PATCH cannot create a split. Default to the `Also` tail; open new
threads only where the second finding is Blocker or High, or in a different file.

### Reader pass

Before the report is written, reread every comment as the author would, cold, with only the diff
open. Rewrite until each answer is yes:

1. Line 1 alone tells a busy author who is hurt and how, with no path or symbol?
2. Could the author follow it without the report, the other comments, or the review session?
3. Is every term in the glossary, in the diff, or explained where it first appears?
4. Is there a concrete example (input → output, request → response, a failing test) where one
   fits?
5. Does every paragraph say something new? Delete any that restates line 1, including `Impact:`.
6. At most one `path:line` per paragraph, every code line under ~80 columns?
7. Is the ask one sentence, and the smallest change that fixes it?
8. No em dashes, finding numbers, or words about the review itself?

### Example: CI path filter

Before: chained citations, CI jargon, a 180-column line.

````
A PR that changes only the server's validation catalogs never runs this spec, so the drift it guards merges green.

`test-frontend` runs only when `detect-changes` reports a frontend change (`.github/workflows/ci.yml:262`, `:267`), and the `frontend` filter matches `frontend/**` only (ci.yml:62-65). ...

```yaml
frontend: ${{ (steps.filter.outputs.frontend == 'true' || steps.filter.outputs.validation_catalog == 'true' || steps.filter.outputs.root == 'true' || steps.sub.outputs.frontend == 'true') && 'true' || 'false' }}
```
````

After:

````
A PR that edits only the server's validation catalogs skips this spec, so drift can merge green.

This spec runs in the frontend test job, and CI starts that job only when a file under `frontend/` changes.

```
PR edits server/.../catalog/pages.json only
  → frontend job skipped → PR green
  → next frontend PR runs this spec → fails there
```

Could we also start the frontend job when the server catalogs change?

```yaml
# ci.yml, detect-changes filters
validation_catalog:
  - 'server/src/modules/app-validation/catalog/**'

# ci.yml, detect-changes outputs: add to the `frontend` condition
|| steps.filter.outputs.validation_catalog == 'true'
```
````

### Example: redundant Impact

Before: undefined PR terms, and `Impact` restating line 1 with a hedge and a cross-reference.

````
If the AI builder's agent saves through a personal access token session, its writes are now enforced, not reported as the description says.

... `pat` is the one write source this PR puts in enforce mode. ...

**Impact.** If so, a builder who asks the AI builder for an app gets a 400 mid-build instead of a warning, on any rule that misfires on valid data. See the comment on `query.rules.ts:82`.
````

After: line 1 already says who and how, so `Impact:` goes; the jargon becomes what the author
observes.

````
AI builder saves now get a 400 instead of a logged warning, unlike the PR description. Intended?

The AI builder saves through a personal access token session, and token saves are the only kind this PR blocks.

```
AI builder → token session → counted as a token save → invalid save → 400
```

If AI builds should only warn for now, could we give the AI builder's session its own tag so it stays on warnings?
````

## Root comments (large tier only)

The triage index for its section, not a finding.

```
**<Section title> (n of N)** - Request changes: <X> blockers, <Y> others.
```

Then, in order:

1. Blockers. One line each, pointing at its inline thread; the thread holds the explanation.
2. Other threads. One line each, or omit for a small section.
3. Not raised as threads: what went to the handoff doc, cited by `file:line`.
4. Checked and clean, inside `<details>`. It tells the author where not to look: collapse it, never
   cut it.

No opening appraisal paragraph. Cite `file:line`, never comment numbers ("comments 1 and 2" point
at threads that may not be posted).

## Review body (only when the user asks for one)

Plain language about what the product's user would experience; no line numbers, no jargon.
"Details inline, but in short:" then bullets, then out-of-diff asks, then tests. Technical detail
lives only in inline comments.
