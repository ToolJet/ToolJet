import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';

import { generateManifest } from './manifest-generator';
import { recordManifest } from './manifest-recorder';
import { ProjectConfig } from './project-config';

export interface BuildResult {
  distDir: string;
  buildMs: number;
  bundleSizeKb: number;
  cssSizeKb: number;
  hasCss: boolean;
  tsErrors: number;
  tsErrorReport: string;
  componentCount: number;
  warnings: string[];
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

const warnHelperDeclared = (helperDeclared: Record<string, string[]>, warnings: string[]) => {
  for (const [component, helpers] of Object.entries(helperDeclared)) {
    warnings.push(
      `Component "${component}" declares fields through ${helpers.join(', ')}: they won't show in the Inspector. ` +
        'Call the ToolJet hooks in the component itself, or set "recordRender": true in .tooljet/config.json.'
    );
  }
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
  const generated = await generateManifest(projectRoot);
  const { tsErrorCount, tsErrorReport, warnings } = generated;
  // Fields declared through the components' own helper functions: found by rendering each component once when the
  // project asks for it (recordRender), else named in a warning, since reading alone can't see them.
  const recorded = ProjectConfig.readRecordRender(projectRoot)
    ? await recordManifest(projectRoot, generated.manifest, warnings)
    : (warnHelperDeclared(generated.helperDeclared, warnings), generated.manifest);
  const manifest = { ...ProjectConfig.readLibrarySettings(projectRoot), ...recorded };
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
    warnings,
  };
}
