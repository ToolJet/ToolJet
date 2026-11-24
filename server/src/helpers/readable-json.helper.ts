/*
  Reading a `json` column in SQL. Postgres stores a `json` value as text and checks only its syntax, so it accepts two
  escapes it cannot decode later: `\u0000` (NUL) and an unpaired surrogate (half of an emoji, e.g. `\ud83d` on its
  own, left behind when a string is cut mid-emoji). `->`, `->>` and `::jsonb` decode the whole value, so one such
  escape anywhere in it, even under a key the query never reads, fails the query with "unsupported Unicode escape
  sequence" or "invalid input syntax for type json". One pasted character in one component then breaks the feature
  for the whole workspace.

  readableJson(column) rewrites both kinds to `�` in the text being read and parses that. The stored value is
  unchanged. Valid surrogate pairs are rewritten too (to two `�`): the keys these reads use are ASCII, and telling
  a pair from a lone half needs lookaround Postgres regexes lack. A literal backslash before `u0000` (JSON `\\u0000`)
  stays valid JSON: the rewrite swaps one six-character escape for another after the same backslash.

  Use it for every SQL read of a `json` column that holds user text (components.properties, data_queries.options,
  app_versions.global_settings, ...). `jsonb` columns need nothing: Postgres rejects these escapes when they are saved.
  The other edge, a database that is not UTF-8 (where any non-ASCII escape fails), is out of scope: ToolJet runs on
  UTF-8.
*/

// chr(92) is a backslash, so the SQL does not depend on standard_conforming_strings. A regex needs two for one.
const ESCAPED_BACKSLASH = 'chr(92) || chr(92)';
const UNDECODABLE_ESCAPE = `${ESCAPED_BACKSLASH} || 'u(0000|[dD][89a-fA-F][0-9a-fA-F]{2})'`;
const REPLACEMENT = `${ESCAPED_BACKSLASH} || 'ufffd'`;

/** A SQL expression reading `column` (a `json` value) as `type`, safe to use with `->`, `->>` and jsonb functions. */
export const readableJson = (column: string, type: 'json' | 'jsonb' = 'json'): string =>
  `regexp_replace(${column}::text, ${UNDECODABLE_ESCAPE}, ${REPLACEMENT}, 'g')::${type}`;
