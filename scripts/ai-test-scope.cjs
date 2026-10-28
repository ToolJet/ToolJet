const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');
const root = path.resolve(__dirname, '..');
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (
      ['node_modules', '.git', 'dist', 'build', 'coverage', 'coverage-ai'].includes(entry.name) ||
      entry.isSymbolicLink()
    )
      return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
function editionFor(pkg) {
  const edition =
    process.env.TOOLJET_EDITION ||
    (fs.existsSync(path.join(root, pkg, 'ee', pkg === 'server' ? 'ai' : 'modules/AiBuilder')) ? 'ee' : 'ce');
  if (!['ce', 'ee', 'cloud'].includes(edition)) throw new Error('Unknown TOOLJET_EDITION');
  return edition;
}
function imports(text, includeMocks = true) {
  return [
    ...text.matchAll(
      /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*|\bjest\.(?:mock|doMock|unmock)\s*\(\s*)['"]([^'"]+)['"]/g
    ),
  ]
    .filter((match) => includeMocks || !match[0].startsWith('jest.'))
    .map((match) => match[1]);
}
function sourceFiles(pkg, edition) {
  const cwd = path.join(root, pkg);
  const micromatch = createRequire(path.join(cwd, 'package.json'))('micromatch');
  const patterns = require('./ai-coverage-scope.cjs')[pkg === 'server' ? 'backend' : 'frontend'](edition);
  const files = ['src', ...(edition === 'ce' ? [] : ['ee'])]
    .flatMap((dir) => walk(path.join(cwd, dir)))
    .map((file) => path.relative(cwd, file).split(path.sep).join('/'));
  for (const pattern of patterns.filter((pattern) => !pattern.startsWith('!'))) {
    if (!micromatch(files, pattern).length) throw new Error(`AI source scope matches no files: ${pkg}/${pattern}`);
  }
  return micromatch(files, patterns);
}
function findAiTests(pkg) {
  const cwd = path.join(root, pkg);
  const edition = fs.existsSync(path.join(cwd, 'ee', pkg === 'server' ? 'ai' : 'modules/AiBuilder')) ? 'ee' : 'ce';
  const sources = new Set(sourceFiles(pkg, edition).map((file) => path.join(cwd, file)));
  const resolvesToSource = (file, specifier) => {
    let target;
    if (specifier.startsWith('@ee/')) target = path.join(cwd, 'ee', specifier.slice(4));
    else if (specifier.startsWith('@/')) target = path.join(cwd, 'src', specifier.slice(2));
    else if (specifier.startsWith('.')) target = path.resolve(path.dirname(file), specifier);
    else target = path.join(cwd, 'src', specifier);
    return ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx', '/index.ts', '/index.tsx'].some((suffix) =>
      sources.has(target + suffix)
    );
  };
  return ['src', 'test', 'ee']
    .flatMap((dir) => walk(path.join(cwd, dir)))
    .filter((file) => {
      if (!/\.(spec|test)\.[jt]sx?$/.test(file)) return false;
      const relative = path.relative(cwd, file).split(path.sep).join('/');
      return (
        /\/(ai|AiBuilder|ManageLLMKeyPage|ApiKeyContainer)\//.test('/' + relative) ||
        /^ai(?=[A-Z_.-])/.test(path.basename(file)) ||
        imports(fs.readFileSync(file, 'utf8'), false).some(
          (specifier) =>
            resolvesToSource(file, specifier) || (pkg === 'server' && /(?:\/ai\/|^@ee\/ai\/)/.test(specifier))
        )
      );
    });
}
module.exports = { root, walk, imports, editionFor, sourceFiles, findAiTests };
