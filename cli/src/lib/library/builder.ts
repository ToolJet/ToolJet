import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';

import { generateManifest } from './manifest-generator';
import { recordManifest } from './manifest-recorder';
import { ProjectConfig } from './project-config';
import { collectSource } from './source-tree';
import { isServerMode } from '../server-mode';
import { assertNoCodeInCss, ignoredConfigs, trustedCssProcessor } from './trusted-css';
import { assertTsconfigConfined, Confinement, confinementPlugin, projectConfinement } from './confinement';
import { formatProblem, typeCheck, TypeProblem } from './type-check';
import * as ts from 'typescript';

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
      // useToolJetTheme is the SDK's one named hook beside ToolJet (ToolJet.useTheme under another name).
      contents: `export const ToolJet = window.__tj_ToolJet;\nexport function useToolJetTheme() { return window.__tj_ToolJet.useTheme(); }`,
      loader: 'js',
    }));
  },
};

// esbuild plugin: when the project has a postcss.config.{js,cjs,mjs}, every imported .css file goes through the
// project's own PostCSS (and so Tailwind, autoprefixer, whatever it lists) before esbuild bundles it. The CLI
// loads postcss and the plugins from the project's node_modules, so the project pins their versions.
const POSTCSS_CONFIGS = ['postcss.config.js', 'postcss.config.cjs', 'postcss.config.mjs'];
const TAILWIND_CONFIGS = ['tailwind.config.js', 'tailwind.config.cjs', 'tailwind.config.mjs', 'tailwind.config.ts'];

const findPostcssConfig = (projectRoot: string): string | undefined =>
  POSTCSS_CONFIGS.map((name) => path.join(projectRoot, name)).find((file) => fs.existsSync(file));

const postcssPlugin = (projectRoot: string, configPath: string): esbuild.Plugin => ({
  name: 'tooljet-postcss',
  setup(build) {
    let processorPromise: Promise<{ process: (css: string, opts: unknown) => Promise<{ css: string }> }> | null = null;
    const processor = () => {
      processorPromise ??= (async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const postcss = require(require.resolve('postcss', { paths: [projectRoot] }));
        const loaded = await import(configPath);
        const config = loaded.default ?? loaded;
        const plugins = Array.isArray(config.plugins)
          ? config.plugins
          : Object.entries(config.plugins ?? {}).map(([name, options]) => {
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              const plugin = require(require.resolve(name, { paths: [projectRoot] }));
              let pluginOptions = options === true ? undefined : options;
              // Tailwind finds its config from the working directory, which is not the project when the build runs
              // from an app project's root (tooljet app dev): point it at the project's own config.
              if (name === 'tailwindcss' && (!pluginOptions || !(pluginOptions as { config?: unknown }).config)) {
                const tailwindConfig = TAILWIND_CONFIGS.map((file) => path.join(projectRoot, file)).find((file) =>
                  fs.existsSync(file)
                );
                if (tailwindConfig) pluginOptions = { ...(pluginOptions as object), config: tailwindConfig };
              }
              return (plugin.default ?? plugin)(pluginOptions);
            });
        return postcss(plugins);
      })();
      return processorPromise;
    };
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const source = fs.readFileSync(args.path, 'utf8');
      const result = await (await processor()).process(source, { from: args.path, to: args.path, map: false });
      return { contents: result.css, loader: 'css' };
    });
  },
});

export const APP_STYLE_FILES = { theme: path.join('styles', 'theme.css'), global: path.join('styles', 'global.css') };

/** Server mode's stylesheets: this CLI's own pipeline and nothing from the project (lib/server-mode.ts). */
const trustedCssPlugin = (projectRoot: string): esbuild.Plugin => ({
  name: 'tooljet-trusted-css',
  setup(build) {
    let processor: ReturnType<typeof trustedCssProcessor> | null = null;
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const source = fs.readFileSync(args.path, 'utf8');
      assertNoCodeInCss(source, args.path);
      processor ??= trustedCssProcessor(projectRoot);
      const result = await processor.process(source, { from: args.path, to: args.path, map: false });
      return { contents: result.css, loader: 'css' };
    });
  },
});

const cssPlugins = (projectRoot: string, postcssConfig: string | undefined): esbuild.Plugin[] => {
  if (isServerMode()) return [trustedCssPlugin(projectRoot)];
  return postcssConfig ? [postcssPlugin(projectRoot, postcssConfig)] : [];
};

const buildStylesheet = async (
  file: string,
  projectRoot: string,
  postcssConfig: string | undefined,
  minify: boolean,
  confinement: Confinement = projectConfinement(projectRoot)
) => {
  const result = await esbuild.build({
    entryPoints: [file],
    bundle: true,
    write: false,
    outfile: path.join(projectRoot, '.tooljet-style.css'),
    plugins: [confinementPlugin(confinement), ...cssPlugins(projectRoot, postcssConfig)],
    loader: ASSET_LOADERS,
    logLevel: 'silent',
    minify,
    ...(minify ? {} : { sourcemap: 'inline' as const, absWorkingDir: projectRoot }),
  });
  return result.outputFiles.find((f) => f.path.endsWith('.css'))?.text ?? '';
};

/**
 * Fonts and images imported from code or CSS (an @fontsource package, a logo) are inlined as data URLs: the bundle
 * stays one file, and a code page's Content Security Policy allows data: for fonts and images but not other hosts.
 */
export const ASSET_LOADERS = {
  '.woff': 'dataurl',
  '.woff2': 'dataurl',
  '.ttf': 'dataurl',
  '.otf': 'dataurl',
  '.eot': 'dataurl',
  '.png': 'dataurl',
  '.jpg': 'dataurl',
  '.jpeg': 'dataurl',
  '.gif': 'dataurl',
  '.webp': 'dataurl',
  '.svg': 'dataurl',
} as const;

const INLINE_MAP = /\/\*# sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+/=]+) \*\/\s*$/;

/** Splits a stylesheet into its CSS and its inline source map (if any). */
export const splitInlineMap = (css: string): { css: string; map: Record<string, unknown> | null } => {
  const match = INLINE_MAP.exec(css);
  if (!match) return { css, map: null };
  return { css: css.slice(0, match.index), map: JSON.parse(Buffer.from(match[1], 'base64').toString('utf8')) };
};

/**
 * Joins stylesheets and their source maps into one stylesheet with a sectioned source map (version 3 index map), so a
 * rule in the joined file still maps back to its own file and line.
 */
export const joinStylesheets = (parts: { label: string; css: string }[]): string => {
  let line = 0;
  const sections: { offset: { line: number; column: number }; map: Record<string, unknown> }[] = [];
  const chunks: string[] = [];
  for (const part of parts) {
    const { css, map } = splitInlineMap(part.css);
    const header = `/* ${part.label} */\n`;
    line += 1;
    if (map) sections.push({ offset: { line, column: 0 }, map });
    const body = css.endsWith('\n') ? css : `${css}\n`;
    chunks.push(header + body);
    line += body.split('\n').length - 1;
  }
  const joined = chunks.join('');
  if (!sections.length) return joined;
  const index = Buffer.from(JSON.stringify({ version: 3, sections })).toString('base64');
  return `${joined}/*# sourceMappingURL=data:application/json;base64,${index} */\n`;
};

/** dist/index.css as theme.css + the bundle's CSS + global.css, when the project has those files. */
export async function orderAppStyles(
  projectRoot: string,
  distDir: string,
  postcssConfig: string | undefined,
  minify: boolean,
  confinement: Confinement = projectConfinement(projectRoot)
) {
  const themeFile = path.join(projectRoot, APP_STYLE_FILES.theme);
  const globalFile = path.join(projectRoot, APP_STYLE_FILES.global);
  if (!fs.existsSync(themeFile) && !fs.existsSync(globalFile)) return;
  const bundleCss = path.join(distDir, 'index.css');
  const parts: { label: string; css: string }[] = [];
  if (fs.existsSync(themeFile))
    parts.push({
      label: 'styles/theme.css',
      css: await buildStylesheet(themeFile, projectRoot, postcssConfig, minify, confinement),
    });
  if (fs.existsSync(bundleCss)) parts.push({ label: "the code's own CSS", css: fs.readFileSync(bundleCss, 'utf8') });
  if (fs.existsSync(globalFile))
    parts.push({
      label: 'styles/global.css (last)',
      css: await buildStylesheet(globalFile, projectRoot, postcssConfig, minify, confinement),
    });
  fs.writeFileSync(bundleCss, joinStylesheets(parts));
}

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

/**
 * A bundle that fails (an import that does not resolve, a syntax error) stops before the type check, so its TypeScript
 * errors only showed on the next build: in the Code mode builds of 2026-11-04, 10 failed bundles were followed by a
 * build that failed on TypeScript. The bundle's error now carries the type errors too, so one round fixes both.
 * Errors on lines the bundle already names (the same unresolved import) are left out.
 */
function withTypeErrors(err: Error, projectRoot: string, confinement: Confinement): Error {
  if (!/^Build failed with/.test(err.message)) return err;
  let problems: TypeProblem[];
  try {
    problems = typeCheck(projectRoot, confinement).problems;
  } catch {
    return err;
  }
  const fresh = problems.filter((p) => !err.message.includes(`${p.file}:${p.line}:`));
  if (!fresh.length) return err;
  return new Error(
    `${err.message}\n\nTypeScript compiled (${fresh.length} errors), in the same check:\n\n` +
      fresh.map(formatProblem).join('\n')
  );
}

export async function build(projectRoot: string, options: { env?: BuildEnv } = {}): Promise<BuildResult> {
  const { env = 'development' } = options;
  const isProduction = env === 'production';

  const start = Date.now();
  const distDir = path.join(projectRoot, 'dist');

  fs.rmSync(distDir, { recursive: true, force: true });
  const postcssConfig = findPostcssConfig(projectRoot);
  // Every file the build reads stays inside the project and its installed packages (confinement.ts).
  const confinement = projectConfinement(projectRoot);
  assertTsconfigConfined(ts, confinement, path.join(projectRoot, 'tsconfig.json'));

  await esbuild
    .build({
      entryPoints: [path.join(projectRoot, 'src/index.ts')],
      bundle: true,
      format: 'esm',
      outfile: path.join(distDir, 'index.js'),
      metafile: true,
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      plugins: [confinementPlugin(confinement), tooljetSdkPlugin, ...cssPlugins(projectRoot, postcssConfig)],
      loader: ASSET_LOADERS,
      jsx: 'automatic',
      // Dev builds (the dev track, not publish): every JSX call site in the project's own code passes its file:line:col to
      // the host's jsx-dev-runtime (source tags for mapping a clicked node to its JSX), paths relative to the project, and
      // the JS and CSS carry inline source maps. Published builds have neither.
      ...(isProduction ? {} : { jsxDev: true, sourcemap: 'inline' as const, absWorkingDir: projectRoot }),
      tsconfig: path.join(projectRoot, 'tsconfig.json'),
      logLevel: 'silent',
      ...(isProduction ? prodBuildOptions : {}),
    })
    .catch((err: Error) => {
      throw withTypeErrors(err, projectRoot, confinement);
    });

  // App-wide styles (an app project's convention, tooljet app init): styles/theme.css first (tokens as CSS variables),
  // then the CSS the bundle imports (Tailwind, components), then styles/global.css last, so app-wide overrides of a
  // library's defaults win over the rules they override, whatever order the code imports things in.
  await orderAppStyles(projectRoot, distDir, postcssConfig, isProduction, confinement);

  // Manifest generation via TS Compiler API
  const generated = await generateManifest(projectRoot, confinement);
  const { tsErrorCount, tsErrorReport, warnings } = generated;
  // Fields declared through the components' own helper functions: found by rendering each component once when the
  // project asks for it (recordRender), else named in a warning, since reading alone can't see them.
  // Rendering executes the project's code, so server mode never does it, whatever the project's config asks.
  const recorded =
    ProjectConfig.readRecordRender(projectRoot) && !isServerMode()
      ? await recordManifest(projectRoot, generated.manifest, warnings)
      : (warnHelperDeclared(generated.helperDeclared, warnings), generated.manifest);
  if (isServerMode()) {
    const ignored = ignoredConfigs(projectRoot);
    if (ignored.length)
      warnings.push(`Ignored here, the build uses ToolJet's own Tailwind setup: ${ignored.join(', ')}.`);
  }
  // A code app ships its source tree in the manifest, so the builder can show the files beside the component.
  const source = ProjectConfig.readIncludeSource(projectRoot) ? collectSource(projectRoot, warnings) : undefined;
  const manifest = { ...ProjectConfig.readLibrarySettings(projectRoot), ...recorded, ...(source ? { source } : {}) };
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
