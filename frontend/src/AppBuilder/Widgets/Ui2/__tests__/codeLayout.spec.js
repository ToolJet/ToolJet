// Guardrail: the UI 2.0 widgets stay easy to read and to review. Every source file (outside tests) is TypeScript and at
// most 400 lines; a widget's code lives in its own folder, Ui2/<Widget>/, with what several widgets share in _shared or a
// family folder (_inputs, _pickers, _display, _actions, _sections, _charts). README.md explains the layout.
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import fs from 'fs';
import path from 'path';
import { shadcnConfigs } from '@/AppBuilder/WidgetManager/widgets/shadcn';

const UI2 = path.resolve(__dirname, '..');
const MAX_LINES = 400;

const sources = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    // Tests, and the Tailwind/PostCSS config that Node loads at build time, are not widget source.
    if (e.isDirectory()) return e.name === '__tests__' || e.name === 'styles' ? [] : sources(p);
    return /\.(jsx?|tsx?)$/.test(e.name) ? [path.relative(UI2, p)] : [];
  });
const files = sources(UI2);

describe('UI 2.0 widget code layout', () => {
  it('is TypeScript', () => {
    expect(files.filter((f) => !/\.tsx?$/.test(f))).toEqual([]);
  });

  it(`keeps every file to ${MAX_LINES} lines`, () => {
    const long = files
      .map((f) => [f, fs.readFileSync(path.join(UI2, f), 'utf8').split('\n').length])
      .filter(([, lines]) => lines > MAX_LINES)
      .map(([f, lines]) => `${f}: ${lines}`);
    expect(long).toEqual([]);
  });

  it('has one folder per widget, holding the module the registry loads', () => {
    const registry = fs.readFileSync(path.join(UI2, 'registry.ts'), 'utf8');
    for (const { name } of shadcnConfigs) {
      const folder = name.replace(/^Shad/, '');
      expect([name, fs.existsSync(path.join(UI2, folder))]).toEqual([name, true]);
      expect(registry).toContain(`${name}: lazy(() => import('./${folder}/${folder}'))`);
    }
  });
});
