const path = require('path');

// SVGR-shaped transform mock. Both bundler configs (webpack and rspack) run
// plain `import Icon from './x.svg'` through @svgr/webpack, so the default
// export must be a renderable React component — not an empty object.
// (`./x.svg?url` imports never reach this transform; they're handled by the
// fileMock entry in jest.config.js moduleNameMapper.)
module.exports = {
  process(sourceText, sourcePath) {
    const name = JSON.stringify(path.basename(sourcePath));
    return {
      code: `
const React = require('react');
const SvgMock = React.forwardRef(function SvgMock(props, ref) {
  return React.createElement('svg', Object.assign({ ref, 'data-file-name': ${name} }, props));
});
module.exports = { __esModule: true, default: SvgMock, ReactComponent: SvgMock };
`,
    };
  },
  getCacheKey(sourceText, sourcePath) {
    // Output embeds the file name, so the cache key must vary per file.
    return sourcePath;
  },
};
