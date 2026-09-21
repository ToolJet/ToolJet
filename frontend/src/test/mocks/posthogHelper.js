// Replaces src/modules/common/helpers/posthogHelper.js in tests (see
// moduleNameMapper). The real module uses top-level await (fine in the
// bundlers, invalid in jest's CJS output) and analytics must never fire
// from unit tests anyway.
module.exports = {
  __esModule: true,
  default: {
    initPosthog: jest.fn(),
    captureEvent: jest.fn(),
  },
};
