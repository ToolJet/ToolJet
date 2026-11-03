import * as fs from 'fs';
import * as path from 'path';

/*
  `tooljet skill install`: the same instructions for every coding agent, from one source file
  (src/skill/tooljet-code-app.md):

    CLAUDE.md                     Claude Code
    AGENTS.md                     Codex and other agents that read AGENTS.md
    .cursor/rules/tooljet.mdc     Cursor (Windsurf reads AGENTS.md)

  CLAUDE.md and AGENTS.md may hold the user's own notes: the instructions live between two markers and only that
  block is replaced. The Cursor rule file is ours and is rewritten whole.
*/

export const BEGIN = '<!-- tooljet:begin (written by `tooljet skill install`; edits inside are replaced) -->';
export const END = '<!-- tooljet:end -->';

export const skillSource = (): string => fs.readFileSync(path.join(__dirname, '..', '..', 'skill', 'tooljet-code-app.md'), 'utf8');

/** `existing` with the ToolJet block replaced (or appended), leaving everything else as it was. */
export function withBlock(existing: string | null, body: string): string {
  const block = `${BEGIN}\n${body.trim()}\n${END}\n`;
  if (!existing) return block;
  const start = existing.indexOf(BEGIN);
  const end = existing.indexOf(END);
  if (start >= 0 && end > start) return existing.slice(0, start) + block + existing.slice(end + END.length).replace(/^\n/, '');
  return `${existing.replace(/\s*$/, '')}\n\n${block}`;
}

export const cursorRule = (body: string): string =>
  `---\ndescription: How to build this ToolJet app in Code mode (queries, routes, styles, checks)\nalwaysApply: true\n---\n\n${body.trim()}\n`;

export interface SkillWrite {
  file: string;
  status: 'created' | 'updated' | 'unchanged';
}

export function installSkill(root: string, body: string = skillSource()): SkillWrite[] {
  const targets: [string, (old: string | null) => string][] = [
    ['CLAUDE.md', (old) => withBlock(old, body)],
    ['AGENTS.md', (old) => withBlock(old, body)],
    [path.join('.cursor', 'rules', 'tooljet.mdc'), () => cursorRule(body)],
  ];
  return targets.map(([file, render]) => {
    const full = path.join(root, file);
    const old = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
    const next = render(old);
    if (old === next) return { file, status: 'unchanged' as const };
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, next);
    return { file, status: old === null ? ('created' as const) : ('updated' as const) };
  });
}
