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
  tsErrorReport: string;
  componentCount: number;
}

// esbuild plugin: replaces @tooljet/custom-component-sdk import
// with a proxy to window.__tj_ToolJet at runtime
const tooljetSdkPlugin: esbuild.Plugin = {
  name: 'tooljet-sdk-proxy',
  setup(build) {
    build.onResolve({ filter: /^@tooljet\/custom-component-sdk$/ }, () => ({
      path: 'tooljet-sdk-proxy',
      namespace: 'tooljet-sdk-proxy',
    }));
    build.onLoad({ filter: /.*/, namespace: 'tooljet-sdk-proxy' }, () => ({
      contents: `export const ToolJet = window.__tj_ToolJet;`,
      loader: 'js',
    }));
  },
};

export type BuildEnv = 'production' | 'development';

// Extra esbuild options applied only for production builds (build & deploy commands),
// keeping dev-watch builds fast and untouched.
const prodBuildOptions: Partial<esbuild.BuildOptions> = {
  minify: true,
  legalComments: 'eof',
  drop: ['debugger'],
};

export async function build(projectRoot: string, options: { env?: BuildEnv } = {}): Promise<BuildResult> {
  const { env = 'development' } = options;
  const isProduction = env === 'production';

  const start = Date.now();
  const distDir = path.join(projectRoot, 'dist');

  fs.rmSync(distDir, { recursive: true, force: true });

  await esbuild.build({
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
    ...(isProduction ? prodBuildOptions : {}),
  });

  // Manifest generation via TS Compiler API
  const { manifest, tsErrorCount, tsErrorReport } = await generateManifest(projectRoot);
  fs.writeFileSync(
    path.join(distDir, 'manifest.json'),
    isProduction ? JSON.stringify(manifest) : JSON.stringify(manifest, null, 2)
  );

  const bundleSize = fs.statSync(path.join(distDir, 'index.js')).size;
  const hasCss = fs.existsSync(path.join(distDir, 'index.css'));

  return {
    distDir,
    buildMs: Date.now() - start,
    bundleSizeKb: Math.round(bundleSize / 1024),
    cssSizeKb: hasCss ? Math.round(fs.statSync(path.join(distDir, 'index.css')).size / 1024) : 0,
    hasCss,
    tsErrors: tsErrorCount,
    tsErrorReport,
    componentCount: Object.keys(manifest.components).length,
  };
}
