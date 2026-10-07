# Comment format

A comment fails when nothing in it is ranked, ordered, or bounded, not when it is long. The
opening line carries the verdict, the body carries the causal chain in a fixed order, and one
thread carries one finding.

## Inline comments

### Line 1

The opening line is the triage surface. GitHub's notification list, the email subject and the
collapsed Files-changed view all show roughly this line, so it names the consequence, never the
code. No file paths, no symbol names. Under about 120 characters, blank line after it. If it
cannot be written without a path in it, the finding is not understood yet.

Small and medium tiers: a plain consequence sentence, "we" voice, no tag.

```
Two builders saving the same version at once leaves the second save silently dropped.
```

Large tier: severity first, because the author is triaging many threads without opening them.
Severity is the closed set from `references/lenses.md`.

```
**Blocker** - Two builders saving the same version at once leaves the second save silently dropped.
```

### Body, in this order, omitting anything with nothing to say

| Part | Rule |
|---|---|
| Why | Short paragraphs, one idea each, the causal chain only. `file:line` refs belong here. A `mermaid` fence (GitHub renders it) or an ascii flow whenever the point is a flow, an ordering, or two paths converging; prose otherwise. |
| Proof | Repro, trace, error text, the exact mutation that left the suite green. Collapse in `<details>` past about 8 lines. |
| Impact | Only when the finding reaches an end user or an operator. One short paragraph opening with bold `Impact.`, written as the scenario they hit ("the embedded app loads, then Logout returns 403"). Omit for developer-only findings; never write "none". |
| Fix | Always visible, never collapsed. `suggestion` block when the change is on the anchored lines; before/after code when proposing a shorter form. "Could we" or "suggest" tone. |
| `Related:` | One line, last. Cross-PR and cross-thread links. Nothing after it. |

`<summary>` says what is inside, not "Details".

### Plain English

The author reads the comment once, between other work. Every sentence says what breaks for whom,
in words the author would use on a call.

- Simple words. Name the concrete thing: the field, the check, the branch, the route, the
  table. Abstract nouns that describe the reviewer's model rather than the code are a sign the
  finding is not yet understood in the author's terms.
- Domain terms come from `UBIQUITOUS_LANGUAGE.md`: Workspace not Organization, Component not
  Widget, End User not Viewer, Data Source never `ds`. A term the glossary does not have and the
  code does not name is not shared vocabulary; say what it means in plain words the first time
  or avoid it. That includes the PR author's own coinages from the description.
- Paragraphs of one or two sentences, separated by a blank line. Bullets only for a list the
  reader scans rather than reads: routes, files, parallel cases. A causal chain stays prose so
  every "because" survives.
- A diagram whenever the mechanism is a flow, an ordering, or two paths converging. Mermaid for
  the PR (GitHub renders the fence); ascii where a fixed-width grid says it faster. If a sentence
  says it faster, write the sentence.

### Length

- Under 12 rendered lines: line 1, then body. No `<details>`, no labels. Ordering carries it.
- Over 12: labels appear. A `<details>` appears only when a single proof block is over about 8
  lines. Total length never triggers a disclosure on its own. At most one disclosure.
- Over about 35 with the disclosure closed: it is two findings. Split.

### One finding per thread

GitHub resolves per thread. Two findings in one thread means one is lost the moment the author
replies to the first.

- Split when the second finding has a different anchor, a different fix, or a different severity.
- Keep in-thread under a bold `Also on these lines.` when it shares the anchor and the author
  would fix both in one edit. Never more than one such tail.

When editing already-posted comments, a split needs a new comment and a PATCH cannot make one.
Default to the `Also` tail, and open new threads only where the second finding is Blocker or High,
or sits in a different file.

Severity decides the split, so severity comes from the section review, not from the agent doing
the formatting.

A precondition of a fix is not a second finding. Where applying one comment's fix breaks
something else, that belongs in the Fix section of the comment causing it. The person who needs
the warning is the person reading the fix.

### Banned

- Em dashes.
- Bold on its own line as a section header. The ordering is the structure.
- `###` headings. They render at document scale inside a comment.
- More than one `<details>`, or nested.
- `suggestion` inside `<details>`. Batch-apply needs it expanded.
- Restating what the code does before saying what is wrong with it.
- Opening with "This file", "This helper", "The guard", "The comment at".
- Severity emoji or any emoji.
- Meta-commentary about the review: "traced all exits", "verified with", "suite: n passed",
  "carried over from", "the agent found". The comment is the user's own words.
- Praise. A decision worth affirming is a finding ("keep X, because Y").
- Line 1 in the small and medium tiers carrying a severity tag.

## Root comments (large tier only)

Different job. A root comment is the triage index for its section, not a finding.

```
**<Section title> (n of N)** - Request changes: <X> blockers, <Y> others.
```

Then, in order:

1. Blockers. One line each, pointing at its inline thread. No explanation, the thread holds it.
2. Other threads. One line each, or omit for a small section.
3. Not raised as threads. What went to the handoff doc instead, cited by `file:line`.
4. Checked and clean. Inside `<details>`. It is reassurance, not action, and it is the only
   thing telling the author where not to look. Collapse it, never cut it.

No opening appraisal paragraph. Never cite comments by number; "comments 1 and 2" points at
threads that do not exist once only the top severities are posted. Cite `file:line`.

## Review body (when the user asks for one)

Plain human language: what the user of the product would experience, no line numbers, no
jargon. "Details inline, but in short:" then bullets, then out-of-diff asks, then tests.
Technical detail lives in the inline comments only.

## Rejected, with reasons

- `<details>` hurting email. Clients without the widget show summary and body together, so the
  reader loses the compression and no content. The constraint it does impose: collapsed content
  must read in sequence when forced open, which Why / Proof / Fix satisfies.
- A rigid skeleton on every comment. A four line comment with four labelled parts is more markup
  than content. Ordering is mandatory, labels appear only past 12 lines.
- Collapsing the fix. It is what the author opened the thread for.
- Findings tables in root comments. The cells are sentences, and tables do not wrap on mobile.
- Bullets throughout. The causal chains are the value, and bullets drop the "because" that makes
  a finding survive a challenge. Bullets are for lists the reader scans (routes, files, cases);
  a chain of reasoning is short paragraphs.
- "What a user sees" as the impact label. It reads as nonsense when the impact is silent or
  deferred ("nothing today"). `Impact.` covers every case.
- Severity tags on every review. On a ten-thread review the tag is noise; the consequence
  sentence already ranks itself.
