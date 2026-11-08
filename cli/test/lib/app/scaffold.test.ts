import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as ts from 'typescript';

import { Project } from '../../../src/lib/app/project';
import { scaffoldApp } from '../../../src/lib/app/scaffold';

/* The app's display name comes from the user, and lands in app.json, the README and the starter page. */

const NAMES = [
  'Orders Desk',
  'ToolJet app called "Talent Pipeline"',
  'C:\\apps\\new',
  "$& costs $1 $' $` $$",
  'Sales <EU> {2026} & co',
  '__DISPLAY_NAME__ <%= name %>',
];

describe('scaffoldApp with any app name', () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'tooljet-scaffold-'));
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  for (const name of NAMES) {
    describe(JSON.stringify(name), () => {
      let dir: string;
      beforeEach(() => {
        dir = path.join(root, 'talent-pipeline');
        scaffoldApp(dir, name);
      });

      it('app.json and the library config carry the name as it is', () => {
        const project = new Project(dir);
        expect(project.readApp().name).to.equal(name);
        expect(project.readLibraryConfig().libraryName).to.equal(name);
      });

      it('every .json file it writes parses', () => {
        for (const file of ['app.json', 'frontend/package.json', 'frontend/tsconfig.json']) {
          expect(() => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')), file).not.to.throw();
        }
        expect(JSON.parse(fs.readFileSync(path.join(dir, 'frontend/package.json'), 'utf8')).name).to.equal(
          'talent-pipeline'
        );
      });

      it('the README shows it as written', () => {
        expect(fs.readFileSync(path.join(dir, 'README.md'), 'utf8').split('\n')[0]).to.equal(`# ${name}`);
      });

      it('the starter page compiles and renders it as written', () => {
        const source = fs.readFileSync(path.join(dir, 'frontend/src/App/index.tsx'), 'utf8');
        const { diagnostics, outputText } = ts.transpileModule(source, {
          reportDiagnostics: true,
          compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 },
        });
        expect(diagnostics?.map((d) => d.messageText)).to.deep.equal([]);
        const rendered = /className: "mb-3 px-3 py-2 font-semibold" }, (.*)\)/.exec(outputText)?.[1] as string;
        expect(JSON.parse(rendered)).to.equal(name);
      });
    });
  }

  it('keeps a plain name readable in the starter page', () => {
    const dir = path.join(root, 'quoted');
    scaffoldApp(dir, 'The "Orders" Desk');
    expect(fs.readFileSync(path.join(dir, 'frontend/src/App/index.tsx'), 'utf8')).to.include(
      '>The "Orders" Desk</div>'
    );
    expect(fs.readFileSync(path.join(dir, 'app.json'), 'utf8')).to.include('"name": "The \\"Orders\\" Desk"');
  });
});

/* External QA report v4 (2026-11-08): a 16 px close button with an English label on every side panel (CAFE_R1-01/02,
   LOC_R1-02), and typed work lost to a link, Back or reload (PROC-02, HOTEL-05, GRADE-06, LOC-03, CAFE-01). */
describe('scaffoldApp starter kit', () => {
  let dir: string;
  before(() => {
    dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tooljet-scaffold-')), 'desk');
    scaffoldApp(dir, 'Desk');
  });
  after(() => fs.rmSync(path.dirname(dir), { recursive: true, force: true }));

  it('gives the side panel a 40 px close button whose label the screen passes in its language', () => {
    const sheet = fs.readFileSync(path.join(dir, 'frontend/src/components/ui/sheet.tsx'), 'utf8');
    expect(sheet).to.include('h-10 w-10');
    expect(sheet).to.include('aria-label={closeLabel}');
    expect(sheet).not.to.include('<span className="sr-only">Close</span>');
    // Closing puts focus back on what opened it, also without a SheetTrigger.
    expect(sheet).to.include('target.focus()');
  });

  it('ships the unsaved-work guard in the router, and it compiles', () => {
    const source = fs.readFileSync(path.join(dir, 'frontend/src/lib/router.tsx'), 'utf8');
    expect(source).to.match(/export function useUnsavedChanges\(dirty: boolean, message: string\)/);
    expect(source).to.match(/export function confirmLeave\(/);
    expect(source).not.to.include('<MemoryRouter');
    const { diagnostics } = ts.transpileModule(source, {
      reportDiagnostics: true,
      compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 },
    });
    expect(diagnostics ?? []).to.have.length(0);
  });
});
