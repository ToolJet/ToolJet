// Default name for an app created from a template: the template name, then "<name>_1", "<name>_2", … when taken.
// Gaps are not filled: with "X" and "X_3" taken, the next name is "X_4". Matching is case-sensitive, like the
// app_versions name-uniqueness trigger.

export const escapeLike = (value: string): string => value.replace(/[\\%_]/g, '\\$&');

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function nextTemplateAppName(base: string, takenNames: string[]): string {
  const copyOfBase = new RegExp(`^${escapeRegExp(base)}(?:_(\\d+))?$`);
  const suffixes = takenNames
    .map((name) => copyOfBase.exec(name))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => (match[1] ? Number(match[1]) : 0));

  if (!suffixes.includes(0)) return base;
  return `${base}_${Math.max(...suffixes) + 1}`;
}
