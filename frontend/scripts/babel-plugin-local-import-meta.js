/**
 * Local replacement for `babel-plugin-transform-import-meta` (dropped because its
 * BSD-3-Clause license fails the new-package license gate — see PR #17893).
 *
 * Jest's ESM->CJS transform (@babel/preset-env) has no equivalent for
 * `import.meta` and throws "Cannot use 'import.meta' outside a module". The only
 * frontend/src usage is PDF.jsx's module-scope
 * `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`, which just
 * needs a syntactically valid base URL under jest — the real worker never loads
 * there (react-pdf is stubbed via moduleNameMapper).
 *
 * Replaces every `import.meta` expression with an object whose `url` is the
 * CJS-safe file URL of the transformed module.
 */
module.exports = function localImportMeta({ template }) {
  const buildReplacement = template.expression(
    "({ url: require('url').pathToFileURL(__filename).toString() })"
  );
  return {
    name: 'local-import-meta',
    visitor: {
      MetaProperty(path) {
        if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
          path.replaceWith(buildReplacement());
        }
      },
    },
  };
};
