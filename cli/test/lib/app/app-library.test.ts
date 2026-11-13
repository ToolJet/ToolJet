import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Project } from '../../../src/lib/app/project';
import { appLibrary, appLibraryLine } from '../../../src/lib/app/remote';
import { ApiError, type Session } from '../../../src/lib/app/session';

/*
  The library `tooljet app dev` and `publish` build into. A new project folder for an existing app (the AI's, after
  its folder was lost) names a new correlationId with the app's name; asking only find-or-create for it was refused
  with "a library named ... already exists" when the app's own library had that name. ToolJet now answers for the app.
*/

const OWN = '55555555-5555-4555-8555-555555555551';
const FRESH = '55555555-5555-4555-8555-555555555552';

const project = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-library-'));
  fs.mkdirSync(path.join(root, 'frontend', '.tooljet'), { recursive: true });
  fs.writeFileSync(path.join(root, 'app.json'), JSON.stringify({ name: 'Spend Approvals', appId: 'app-1' }));
  fs.writeFileSync(
    path.join(root, 'frontend', '.tooljet', 'config.json'),
    JSON.stringify({ libraryName: 'Spend Approvals', correlationId: FRESH, includeSource: true })
  );
  return new Project(root);
};

const config = (p: Project) => JSON.parse(fs.readFileSync(path.join(p.frontend, '.tooljet', 'config.json'), 'utf8'));

const session = (answer: (p: string, init: any) => any): Session & { calls: { path: string; body?: any }[] } => {
  const calls: { path: string; body?: any }[] = [];
  return {
    calls,
    api: async (p: string, init: any = {}) => {
      calls.push({ path: p, body: init.body });
      return answer(p, init);
    },
  } as any;
};

describe("the app's component library", () => {
  it("asks ToolJet for the app's library and points the project at it", async () => {
    const p = project();
    const s = session(() => ({ id: 'lib-own', name: 'Spend Approvals', correlationId: OWN, created: false, reused: true, linked: true }));
    const { library, changed } = await p.useAppLibrary((wanted) => appLibrary(s, { appId: 'app-1', versionId: 'ver-9' }, wanted));
    expect(s.calls[0]).to.deep.equal({
      path: '/code-mode-source/app-1/library',
      body: { correlationId: FRESH, name: 'Spend Approvals', versionId: 'ver-9' },
    });
    expect(library.correlationId).to.equal(OWN);
    expect(changed).to.equal(true);
    // The other settings stay; the code stored next names the app's library.
    expect(config(p)).to.deep.equal({ libraryName: 'Spend Approvals', correlationId: OWN, includeSource: true });
    expect(appLibraryLine(library)).to.contain("the app's component library");
  });

  it('takes the name a new library got when the one asked for was taken', async () => {
    const p = project();
    const s = session(() => ({ id: 'lib-2', name: 'Spend Approvals (55555555)', correlationId: FRESH, created: true }));
    await p.useAppLibrary((wanted) => appLibrary(s, { appId: 'app-1', versionId: 'ver-9' }, wanted));
    expect(config(p).libraryName).to.equal('Spend Approvals (55555555)');
  });

  it('leaves the config alone when it already names the library', async () => {
    const p = project();
    const before = fs.readFileSync(path.join(p.frontend, '.tooljet', 'config.json'), 'utf8');
    const s = session(() => ({ id: 'lib-1', name: 'Spend Approvals', correlationId: FRESH, created: false }));
    const { changed } = await p.useAppLibrary((wanted) => appLibrary(s, { appId: 'app-1' }, wanted));
    expect(changed).to.equal(false);
    expect(fs.readFileSync(path.join(p.frontend, '.tooljet', 'config.json'), 'utf8')).to.equal(before);
  });

  it('falls back to find-or-create on a ToolJet without the route, and only then', async () => {
    const missing = session(() => {
      throw new ApiError('Cannot POST /api/code-mode-source/app-1/library', 404, '{"message":"Cannot POST"}');
    });
    // find-or-create goes through node-fetch to the library routes: a refused connection proves it was tried.
    (missing as any).url = 'http://127.0.0.1:9';
    (missing as any).kind = 'pat';
    (missing as any).token = 't';
    let error: Error | undefined;
    await appLibrary(missing, { appId: 'app-1' }, { correlationId: FRESH, name: 'Spend Approvals' }).catch((e) => (error = e));
    expect(error?.message ?? '').to.match(/ECONNREFUSED|connect/i);

    const refused = session(() => {
      throw new ApiError('Another app uses this component library.', 403, '{}');
    });
    let refusal: Error | undefined;
    await appLibrary(refused, { appId: 'app-1' }, { correlationId: FRESH, name: 'Spend Approvals' }).catch((e) => (refusal = e));
    expect(refusal).to.be.instanceOf(ApiError);
    expect((refusal as ApiError).status).to.equal(403);
  });
});
