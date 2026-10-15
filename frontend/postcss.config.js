// postcss.config.js
module.exports = {
  plugins: [
    require('tailwindcss'),
    // ToolJet UI 2.0 pack: its scoped utilities must beat Bootstrap's !important ones.
    require('./src/AppBuilder/Widgets/Shadcn/postcssShadcnImportant'),
    require('autoprefixer'),
    // Other PostCSS plugins if needed
  ],
};
