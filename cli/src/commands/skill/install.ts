import { Command } from '@oclif/core';

import { Project } from '../../lib/app/project';
import { installSkill } from '../../lib/app/skill';
import { formatError, formatSuccess } from '../../lib/log';

export default class SkillInstall extends Command {
  static description =
    'Write the instructions for building this app in Code mode for coding agents: CLAUDE.md (Claude Code), AGENTS.md (Codex, Windsurf) and .cursor/rules/tooljet.mdc (Cursor), from one source';

  static examples = ['$ tooljet skill install'];

  async run(): Promise<void> {
    try {
      const project = Project.find();
      for (const write of installSkill(project.root)) this.log(formatSuccess(`${write.file}: ${write.status}`));
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }
}
