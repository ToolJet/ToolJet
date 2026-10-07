# Comment format

A comment fails when nothing in it is ranked, ordered, or bounded, not when it is long. Line 1
carries the verdict, the body carries the causal chain in a fixed order, one thread carries one
finding.

## Inline comments

### Line 1

The triage surface: notifications, email subject and the collapsed Files-changed view show about
this line. Name the consequence, never the code: no file paths, no symbol names. Under ~120
characters, blank line after. If it cannot be written without a path, the finding is not
understood yet.

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

| Part | Rule |
|---|---|
| Why | Short paragraphs, one idea each, the causal chain only. `file:line` refs go here. A `mermaid` fence or ascii flow whenever the point is a flow, an ordering, or two paths converging; prose otherwise. |
| Proof | Repro, trace, error text, the exact mutation that left the suite green. Collapse in `<details>` past ~8 lines. |
| Impact | Only when it reaches an end user or operator. One short paragraph opening with bold `Impact.`, as the scenario they hit ("the embedded app loads, then Logout returns 403"). Omit for developer-only findings; never write "none". |
| Fix | Always visible, never collapsed. `suggestion` block when the change is on the anchored lines; before/after code for a shorter form. "Could we" or "suggest" tone. |
| `Related:` | One line, last. Cross-PR and cross-thread links. Nothing after it. |

`<summary>` says what is inside, not "Details".

### Plain English

The author reads it once, between other work. Every sentence says what breaks for whom, in words
the author would use on a call.

- Simple words; name the concrete thing (field, check, branch, route, table). Abstract nouns
  describing the reviewer's model signal the finding is not yet in the author's terms.
- Domain terms from `UBIQUITOUS_LANGUAGE.md`: Workspace not Organization, Component not Widget,
  End User not Viewer, Data Source never `ds`. A term neither the glossary nor the code names
  (including the author's own coinages from the description) gets plain words on first use, or is
  avoided.
- Paragraphs of one or two sentences, blank line between. Bullets only for scanned lists (routes,
  files, parallel cases). A causal chain stays prose so every "because" survives.
- Diagram whenever the mechanism is a flow, an ordering, or two paths converging: mermaid for the
  PR, ascii where a fixed-width grid is faster. If a sentence is faster, write the sentence.

### Length

- Under 12 rendered lines: line 1, then body. No `<details>`, no labels; ordering carries it.
- Over 12: labels appear. `<details>` only when a single proof block exceeds ~8 lines; total
  length never triggers one. At most one disclosure.
- Over ~35 with the disclosure closed: it is two findings. Split.

### One finding per thread

GitHub resolves per thread; a second finding is lost once the author replies to the first.

- Split when the second finding has a different anchor, fix, or severity.
- Keep in-thread under a bold `Also on these lines.` when it shares the anchor and the author would
  fix both in one edit. At most one such tail.

Editing posted comments: a PATCH cannot create a split. Default to the `Also` tail; open new
threads only where the second finding is Blocker or High, or in a different file.

Severity decides the split, so it comes from the section review, not the formatting agent.

A fix's precondition is not a second finding. If applying one fix breaks something else, say so in
that comment's Fix section, where the person applying it reads it.

### Banned

- Em dashes.
- Bold on its own line as a section header. Ordering is the structure.
- `###` headings (render at document scale in a comment).
- More than one `<details>`, or nested.
- `suggestion` inside `<details>` (batch-apply needs it expanded).
- Restating what the code does before saying what is wrong.
- Opening with "This file", "This helper", "The guard", "The comment at".
- Any emoji, including severity emoji.
- Meta-commentary about the review: "traced all exits", "verified with", "suite: n passed",
  "carried over from", "the agent found". The comment is the user's own words.
- Praise. A decision worth affirming is a finding ("keep X, because Y").
- A severity tag on line 1 in small and medium tiers.

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

## Rejected, with reasons

- Avoiding `<details>` for email. Clients without the widget show summary and body together, so
  nothing is lost. Constraint: collapsed content must read in sequence when forced open, which
  Why / Proof / Fix satisfies.
- A rigid labelled skeleton on every comment. On a four-line comment it is more markup than
  content. Ordering is mandatory; labels only past 12 lines.
- Collapsing the fix. It is what the author opened the thread for.
- Findings tables in root comments. Cells are sentences, and tables do not wrap on mobile.
- Bullets throughout. They drop the "because" that makes a finding survive a challenge.
- "What a user sees" as the impact label. Reads as nonsense for silent or deferred impact;
  `Impact.` covers every case.
- Severity tags on every review. On a ten-thread review the consequence sentence already ranks
  itself.
