import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { BEGIN, END, installSkill, skillSource, withBlock } from '../../../src/lib/app/skill';

describe('tooljet skill install', () => {
  let root: string;
  beforeEach(() => (root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-skill-'))));
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

  it('writes the same instructions for Claude Code, Codex and Cursor from one source', () => {
    const writes = installSkill(root);
    expect(writes).to.deep.equal([
      { file: 'CLAUDE.md', status: 'created' },
      { file: 'AGENTS.md', status: 'created' },
      { file: path.join('.cursor', 'rules', 'tooljet.mdc'), status: 'created' },
    ]);
    const body = skillSource().trim();
    expect(read('CLAUDE.md')).to.contain(body);
    expect(read('AGENTS.md')).to.equal(read('CLAUDE.md'));
    const rule = read('.cursor/rules/tooljet.mdc');
    expect(rule.startsWith('---\ndescription: ')).to.equal(true);
    expect(rule).to.contain('alwaysApply: true');
    expect(rule).to.contain(body);
  });

  it('keeps the user’s own notes and replaces only its block', () => {
    fs.writeFileSync(path.join(root, 'CLAUDE.md'), '# My notes\n\nUse pnpm.\n');
    installSkill(root, 'first version');
    expect(read('CLAUDE.md')).to.equal(`# My notes\n\nUse pnpm.\n\n${BEGIN}\nfirst version\n${END}\n`);
    fs.appendFileSync(path.join(root, 'CLAUDE.md'), '\nMore notes after.\n');
    const writes = installSkill(root, 'second version');
    expect(writes[0].status).to.equal('updated');
    expect(read('CLAUDE.md')).to.equal(
      `# My notes\n\nUse pnpm.\n\n${BEGIN}\nsecond version\n${END}\n\nMore notes after.\n`
    );
  });

  it('changes nothing on a second run', () => {
    installSkill(root);
    expect(installSkill(root).map((w) => w.status)).to.deep.equal(['unchanged', 'unchanged', 'unchanged']);
  });

  it('puts no secrets or instance addresses in the files', () => {
    installSkill(root);
    for (const f of ['CLAUDE.md', 'AGENTS.md', '.cursor/rules/tooljet.mdc']) {
      expect(read(f)).to.not.match(/tj_pat_|https?:\/\/|token=/i);
    }
  });

  it('withBlock appends to a file without a block', () => {
    expect(withBlock('a\n\n\n', 'b')).to.equal(`a\n\n${BEGIN}\nb\n${END}\n`);
  });
});
