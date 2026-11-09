import { expect } from 'chai';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { gitBranchOf, workingApp } from '../../../src/lib/app/branch';
import type { AppJson } from '../../../src/lib/app/project';
import { ApiError, Session } from '../../../src/lib/app/session';

/*
  Git sync's one draft per branch, from the project's side: the branch the folder is on (or app.json "branch") picks
  that branch's draft; a checked-out version wins; a workspace without git sync keeps the editing version.
*/

const app: AppJson = {
  name: 'Orders Desk',
  appId: 'app-1',
  codePage: { handle: 'home', name: 'Home' },
  routes: [{ id: 'home', path: '/' }],
};

const repo = (branch: string) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-branch-'));
  execFileSync('git', ['init', '-q', '-b', branch, dir]);
  return dir;
};

/** Answers branch-draft from a table of branch name to response; records every path asked for. */
const fakeSession = (answers: Record<string, any | (() => any)>): Session & { calls: string[] } => {
  const calls: string[] = [];
  return {
    calls,
    api: async (p: string) => {
      calls.push(p);
      const match = /branch-draft\?branch=(.+)$/.exec(p);
      if (!match) return {};
      const answer = answers[decodeURIComponent(match[1])];
      if (answer === undefined) throw new ApiError('Not found', 404, '{}');
      return typeof answer === 'function' ? answer() : answer;
    },
  } as any;
};

const feature = { id: 'b-2', name: 'feature-x', isDefault: false };

describe('git branch to draft', () => {
  it('reads the branch a folder is on, and nothing outside git', () => {
    expect(gitBranchOf(repo('feature-x'))).to.equal('feature-x');
    expect(gitBranchOf(fs.mkdtempSync(path.join(os.tmpdir(), 'tj-nogit-')))).to.equal(null);
  });

  it('works on the draft of the branch the folder is on', async () => {
    const session = fakeSession({
      'feature-x': { branch: feature, version: { id: 'ver-9', name: 'feature-x', status: 'DRAFT' } },
    });
    const result = await workingApp(session, repo('feature-x'), app);
    expect(result.app.version).to.deep.equal({ id: 'ver-9', name: 'feature-x' });
    expect(result.branch).to.deep.equal({ name: 'feature-x', isDefault: false });
    expect(session.calls).to.deep.equal(['/code-mode-source/app-1/branch-draft?branch=feature-x']);
  });

  it('app.json "branch" names the branch instead of git', async () => {
    const session = fakeSession({
      'feature-x': { branch: feature, version: { id: 'ver-9', name: 'feature-x', status: 'DRAFT' } },
    });
    const result = await workingApp(session, repo('main'), { ...app, branch: 'feature-x' });
    expect(result.app.version?.id).to.equal('ver-9');
  });

  it('a checked-out version wins, and asks nothing', async () => {
    const session = fakeSession({});
    const checkedOut = { ...app, version: { id: 'ver-1', name: 'v1' } };
    expect((await workingApp(session, repo('feature-x'), checkedOut)).app).to.equal(checkedOut);
    expect(session.calls).to.deep.equal([]);
  });

  it('keeps the editing version without git, or when the workspace has no git sync', async () => {
    expect((await workingApp(fakeSession({}), fs.mkdtempSync(path.join(os.tmpdir(), 'tj-nogit-')), app)).app).to.equal(
      app
    );
    const noSync = fakeSession({ main: { branch: null, version: null } });
    expect((await workingApp(noSync, repo('main'), app)).app).to.equal(app);
  });

  it('loads the app on a branch that has not opened it yet, then works on its draft', async () => {
    let opened = false;
    const session = fakeSession({
      'feature-x': () => ({
        branch: feature,
        version: opened ? { id: 'ver-9', name: 'feature-x', status: 'DRAFT' } : null,
      }),
    });
    const api = session.api;
    session.api = (async (p: string, init?: any) => {
      if (p.startsWith('/apps/')) opened = true;
      return api(p, init);
    }) as any;
    const result = await workingApp(session, repo('feature-x'), app);
    expect(result.app.version?.id).to.equal('ver-9');
    expect(session.calls).to.include('/apps/app-1?branch_id=b-2');
  });

  describe('outside a git checkout (the AI builds in a folder that is not one)', () => {
    const noGit = () => fs.mkdtempSync(path.join(os.tmpdir(), 'tj-nogit-'));
    const active = (answer: () => any): Session & { calls: string[] } => {
      const calls: string[] = [];
      return {
        calls,
        api: async (p: string) => {
          calls.push(p);
          if (p === '/code-mode-source/app-1/branch-draft') return answer();
          return {};
        },
      } as any;
    };

    it('works on the draft of the feature branch open in ToolJet, not the default one', async () => {
      const session = active(() => ({ branch: feature, version: { id: 'ver-9', name: 'feature-x', status: 'DRAFT' } }));
      const result = await workingApp(session, noGit(), app);
      expect(result.app.version).to.deep.equal({ id: 'ver-9', name: 'feature-x' });
      expect(result.branch).to.deep.equal({ name: 'feature-x', isDefault: false, active: true });
    });

    it('keeps the editing version on the default branch, without branches, and on a ToolJet that predates this', async () => {
      const main = active(() => ({
        branch: { id: 'b-1', name: 'main', isDefault: true },
        version: { id: 'ver-1', name: 'v1', status: 'DRAFT' },
      }));
      expect((await workingApp(main, noGit(), app)).app).to.equal(app);
      expect(
        (
          await workingApp(
            active(() => ({ branch: null, version: null })),
            noGit(),
            app
          )
        ).app
      ).to.equal(app);
      const old = active(() => {
        throw new ApiError('branch is required', 400, '{}');
      });
      expect((await workingApp(old, noGit(), app)).app).to.equal(app);
    });
  });

  it('says so when the workspace has no such branch', async () => {
    let error: Error | undefined;
    await workingApp(
      fakeSession({ main: { branch: { id: 'b-1', name: 'main', isDefault: true }, version: null } }),
      repo('feature-y'),
      app
    ).catch((e) => (error = e));
    expect(error?.message).to.contain('no git branch "feature-y"');
  });
});
