// Lets the UI 2.0 scripts require the widget configs, which are ES modules: files under frontend/src and any extra
// directory given are compiled on require, as Jest does.
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const ROOT = path.resolve(__dirname, '..');
const loadable = [path.join(ROOT, 'src')];

for (const ext of ['.js', '.ts']) {
  const fallback = require.extensions[ext] || require.extensions['.js'];
  require.extensions[ext] = (module, filename) => {
    if (!loadable.some((dir) => filename.startsWith(dir))) return fallback(module, filename);
    const { code } = babel.transformFileSync(filename, {
      babelrc: false,
      configFile: false,
      presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-typescript'],
    });
    return module._compile(code, filename);
  };
}

/** Compiles files under `dir` on require too (configs checked out from an earlier commit). */
exports.allow = (dir) => loadable.push(fs.realpathSync(path.resolve(dir)));
