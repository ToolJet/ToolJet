const plugins = [
  [
    'console-source',
    {
      segments: 1, // NOT REQUIRED
      // 0 = full file path (Default)
      // 1 = file name ONLY
      // 2 = file name and last segment
      splitSegment: '/', // How to split the path - NOT REQUIRED
      // Default is / for Linux and OSX
      // Windows users can use "\\" here if needed
    },
  ],
  ['@babel/transform-runtime'],
];

if (process.env.NODE_ENV === 'developement') {
  plugins.push(['istanbul', { include: ['src/**/*.js', 'src/**/*.jsx'] }]);
}

module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-react'],
  plugins,
};
