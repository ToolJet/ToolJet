import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';

import { generateManifest } from './manifest-generator';

export interface BuildResult {
  distDir: string;
  buildMs: number;
  bundleSizeKb: number;
  cssSizeKb: number;
  hasCss: boolean;
  tsErrors: number;
  componentCount: number;
}

// esbuild plugin: replaces @tooljet/custom-component-sdk import
// with a proxy to window.__tj_ToolJet at runtime
const tooljetSdkPlugin: esbuild.Plugin = {
  name: 'tooljet-sdk-proxy',
  setup(build) {
    build.onResolve(
      { filter: /^@tooljet\/custom-component-sdk$/ },
      () => ({ path: 'tooljet-sdk-proxy', namespace: 'tooljet-sdk-proxy' })
    );
    build.onLoad({ filter: /.*/, namespace: 'tooljet-sdk-proxy' }, () => ({
      contents: `export const ToolJet = window.__tj_ToolJet;`,
      loader: 'js',
    }));
  },
};

export async function build(projectRoot: string): Promise<BuildResult> {
  const start = Date.now();
  const distDir = path.join(projectRoot, 'dist');

  // TODO: distDir is never cleared before building. esbuild only writes the
  // files it currently produces — it won't delete stale output from a
  // previous build (e.g. a leftover dist/index.css after a CSS import is
  // removed from src/), so hasCss/cssSizeKb below can report incorrect
  // values. Needs fs.rmSync(distDir, { recursive: true, force: true })
  // before the build.

  const result = await esbuild.build({
    entryPoints: [path.join(projectRoot, 'src/index.ts')],
    bundle: true,
    format: 'esm',
    outfile: path.join(distDir, 'index.js'),
    metafile: true,
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    plugins: [tooljetSdkPlugin],
    jsx: 'automatic',
    tsconfig: path.join(projectRoot, 'tsconfig.json'),
    logLevel: 'silent',
  });

  // Manifest generation via TS Compiler API
  const manifest = await generateManifest(projectRoot);
  fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const bundleSize = fs.statSync(path.join(distDir, 'index.js')).size;
  const hasCss = fs.existsSync(path.join(distDir, 'index.css'));

  return {
    distDir,
    buildMs: Date.now() - start,
    bundleSizeKb: Math.round(bundleSize / 1024),
    cssSizeKb: hasCss ? Math.round(fs.statSync(path.join(distDir, 'index.css')).size / 1024) : 0,
    hasCss,
    tsErrors: result.errors.length,
    componentCount: Object.keys(manifest.components).length,
  };
}