import * as path from 'path';

/*
  Accessibility lint for `tooljet app check`: eslint-plugin-jsx-a11y's recommended rules (pinned, 6.10.2) over the
  code page's TSX, every rule as a warning for now, so a build is never blocked by it. The plugin and the parser load
  from the CLI's own dependencies; the project needs no ESLint setup.
*/

export interface A11yWarning {
  file: string;
  line: number;
  rule: string;
  message: string;
}

const pluginRules = (): Record<string, unknown> => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const plugin = require('eslint-plugin-jsx-a11y');
  return plugin.configs.recommended.rules as Record<string, unknown>;
};

const isOff = (severity: unknown) => severity === 'off' || severity === 0;

/** The recommended rules that are on, each as a warning with its options kept; the ones it turns off stay off. */
export const a11yRules = (): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(pluginRules())
      .filter(([, setting]) => !isOff(Array.isArray(setting) ? setting[0] : setting))
      .map(([rule, setting]) => [rule, Array.isArray(setting) ? ['warn', ...setting.slice(1)] : 'warn'])
  );

export async function lintAccessibility(srcDir: string): Promise<A11yWarning[]> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ESLint } = require('eslint');
  const eslint = new ESLint({
    cwd: srcDir,
    useEslintrc: false,
    resolvePluginsRelativeTo: __dirname,
    errorOnUnmatchedPattern: false,
    baseConfig: {
      parser: require.resolve('@typescript-eslint/parser'),
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      plugins: ['jsx-a11y'],
      rules: a11yRules(),
      ignorePatterns: ['node_modules/', 'dist/', 'tooljet.gen.ts', '*.d.ts'],
    },
  });
  const results = await eslint.lintFiles(['**/*.tsx', '**/*.jsx']);
  const out: A11yWarning[] = [];
  for (const result of results) {
    for (const m of result.messages) {
      // Parse errors are TypeScript's to report; inline comments naming other plugins' rules are not ours.
      if (!m.ruleId || !m.ruleId.startsWith('jsx-a11y/')) continue;
      out.push({ file: path.relative(srcDir, result.filePath), line: m.line, rule: m.ruleId, message: m.message });
    }
  }
  return out;
}
