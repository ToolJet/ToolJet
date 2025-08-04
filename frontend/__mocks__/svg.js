// Mock for SVG imports in tests - compatible with Jest 28+
const React = require('react');

module.exports = {
  process() {
    return {
      code: 'const React = require("react"); module.exports = function SvgMock(props) { return React.createElement("svg", props); }; module.exports.ReactComponent = module.exports; module.exports.default = "test-svg-stub";'
    };
  },
  getCacheKey() {
    // The output is always the same.
    return 'svgTransform';
  },
};

// Alternative export for direct SVG component mocking
module.exports.ReactComponent = function SvgMock(props) {
  return React.createElement('svg', props);
};

// Default export for SVG path/url mocking  
module.exports.default = 'test-svg-stub';
