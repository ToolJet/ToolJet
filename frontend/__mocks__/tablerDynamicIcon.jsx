// Stub for AudioRecorder's deep dynamic icon import:
//   import(`@tabler/icons-react/dist/esm/icons/${recorderIcon}.js`)   (AudioRecorder.jsx)
//
// @tabler/icons-react's `dist/esm` tree is ESM-only and is NOT in jest's
// transformIgnorePatterns allowlist, so the real dynamic import throws
// "Cannot use import statement outside a module" — an unhandled rejection that
// fails every AudioRecorder render. The recorder icon is cosmetic (the engineering
// layer never asserts on the tabler glyph), so a renderable pass-through default
// export is the cheap equivalent. See ee/test/app-builder/widgets/AudioRecorder/TESTING.md.
const React = require('react');

const TablerDynamicIcon = React.forwardRef((props, ref) =>
  React.createElement('span', { ...props, ref, 'data-tabler-icon-stub': 'true' })
);

module.exports = { __esModule: true, default: TablerDynamicIcon };
