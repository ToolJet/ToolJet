import React from 'react';
import { render, act, cleanup } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './packTestEnv';

installBrowserStubs();

// Every component of every first-party pack renders from its manifest defaults alone, as it does when dropped from
// the palette: a component that throws on its own defaults is broken in every new app.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const PACKS_DIR = path.resolve(__dirname, '../../../../../../../packs');
const SOURCES = {
  shadcn: () => require('../../../../../../../packs/shadcn/src/index.ts'),
  antd: () => require('../../../../../../../packs/antd/src/index.ts'),
  mui: () => require('../../../../../../../packs/mui/src/index.ts'),
};

class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    this.props.onError(error);
  }
  render() {
    return this.state.error ? null : this.props.children;
  }
}

// The packs in this checkout (each first-party pack lands in its own change).
const PRESENT = Object.keys(SOURCES).filter((pack) => fs.existsSync(path.join(PACKS_DIR, pack, 'dist/manifest.json')));

// dist/ is built, not committed: node packages/pack-tools/build.mjs packs/<pack> (CI builds them before the tests).
if (!PRESENT.length) test.skip('no built pack in this checkout: run packages/pack-tools/build.mjs first', () => {});

// jest's .each throws on an empty table, so with nothing to run only the skipped test above is declared.
(PRESENT.length ? describe.each(PRESENT) : () => () => {})('a fresh drop from the %s pack', (pack) => {
  const manifest = JSON.parse(fs.readFileSync(path.join(PACKS_DIR, pack, 'dist/manifest.json'), 'utf8'));
  const source = SOURCES[pack]();

  test.each(Object.keys(manifest.components))('%s renders from its defaults', async (name) => {
    const entry = manifest.components[name];
    expect(source[name]).toBeDefined();
    loadLibraryModule.mockResolvedValue({ [name]: source[name] });
    const defaults = Object.fromEntries(
      (entry.props ?? []).filter((p) => p.default !== undefined).map((p) => [p.name, p.default])
    );
    const errors = [];
    await act(async () => {
      render(
        <Boundary onError={(error) => errors.push(String(error?.message ?? error))}>
          <InlineLibraryComponent
            bundleUrl={`${pack}-${name}.js`}
            cssUrl={`${pack}-${name}.css`}
            cacheKey={`drop-${pack}-${name}`}
            componentName={name}
            componentProps={defaults}
            componentStyles={{}}
            renderSlot={() => null}
            setExposedVariable={() => {}}
            fireEvent={() => {}}
            actions={new Map()}
            host={makeHost(name, entry)}
            dataCy="drop"
          />
        </Boundary>
      );
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    // Rendered: the component drew something inside the host's root, and the host shows no load error (a missing
    // export leaves only the root and its error box).
    const root = document.querySelector('[data-cy="drop"]').shadowRoot;
    const loadError = root.querySelector('.tj-cc-error')?.textContent;
    const drawn = root.querySelector('.tj-cc-root')?.querySelectorAll('*').length ?? 0;
    cleanup();
    expect(errors).toEqual([]);
    expect(loadError).toBeUndefined();
    expect(drawn).toBeGreaterThan(0);
  });
});
