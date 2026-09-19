import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// NOTE: there is deliberately no withTempHome() helper here. Auth's
// CREDENTIALS_PATH (~/.tooljet/credentials.json) is computed once at
// module-load time from os.homedir() — overriding process.env.HOME or
// os.homedir() from inside a test does not change it, since some other test
// file's static `import { Auth }` may already have required the module first.
// Never call Auth.save/resolve for real in a test; stub the whole method
// (see test/commands/login.test.ts), or — if the real file-writing behavior
// itself needs coverage — bust the require cache before re-requiring the
// module, as test/lib/auth.test.ts does.

// Isolates a temp cwd for the duration of a test (e.g. for `library init`,
// which writes into the current directory).
export function withTempCwd(): { get: () => string } {
  const originalCwd = process.cwd();
  let dir = '';

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tooljet-cli-cwd-'));
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  return { get: () => dir };
}

// Ambient stubs for 'react' / 'react/jsx-runtime' / the SDK — real projects get
// these types from installed `react` + `@types/react` (see the hygen template's
// package.json), but fixtures declare their own minimal shapes so tests don't need
// to install React into a throwaway temp directory to satisfy the type checker.
// esbuild never needs to resolve these modules for real either, since builder.ts
// marks all three as `external`.
const GLOBAL_DTS = `declare module 'react' {
  const React: any;
  export default React;
  export const Fragment: any;
}
declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}
declare module '@tooljet/custom-component-sdk' {
  export const ToolJet: any;
}
declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
`;

const INDEX_TS = `export { HelloWorld } from './components/HelloWorld';\n`;

const HELLO_WORLD_TSX = `import { ToolJet } from '@tooljet/custom-component-sdk';

export const HelloWorld = () => {
  const [firstName] = ToolJet.useStateString({ name: 'firstName', initialValue: 'John' });

  return (
    <div>
      <h1>Hello World</h1>
      <p>First Name: {firstName}</p>
    </div>
  );
};
`;

const TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      target: 'esnext',
      lib: ['dom', 'esnext'],
      module: 'esnext',
      moduleResolution: 'node',
      jsx: 'react-jsx',
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      types: [],
    },
    include: ['src/**/*'],
  },
  null,
  2
);

// Writes a minimal, valid component-library project (src/index.ts re-exporting a
// HelloWorld.tsx component) into `dir`, suitable for exercising the real
// esbuild/TS-compiler build() pipeline end to end.
export function writeValidProjectFixture(dir: string): void {
  fs.mkdirSync(path.join(dir, 'src', 'components', 'HelloWorld'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'global.d.ts'), GLOBAL_DTS);
  fs.writeFileSync(path.join(dir, 'src', 'index.ts'), INDEX_TS);
  fs.writeFileSync(path.join(dir, 'src', 'components', 'HelloWorld', 'index.tsx'), HELLO_WORLD_TSX);
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), TSCONFIG);
}

export function writeTsErrorProjectFixture(dir: string): void {
  writeValidProjectFixture(dir);
  fs.writeFileSync(
    path.join(dir, 'src', 'components', 'HelloWorld', 'index.tsx'),
    HELLO_WORLD_TSX + `\nconst broken: number = 'this is not a number';\nexport { broken };\n`
  );
}

export function writeEmptyProjectFixture(dir: string): void {
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'global.d.ts'), GLOBAL_DTS);
  fs.writeFileSync(path.join(dir, 'src', 'index.ts'), `export {};\n`);
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), TSCONFIG);
}

export function writeProjectConfig(dir: string, config: { libraryName: string; correlationId: string }): void {
  fs.mkdirSync(path.join(dir, '.tooljet'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.tooljet', 'config.json'), JSON.stringify(config, null, 2));
}
