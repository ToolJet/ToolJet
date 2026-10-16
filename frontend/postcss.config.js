// postcss.config.js
module.exports = {
  plugins: [
    require('tailwindcss'),
    // shadcn/ui pack (experiment): its scoped utilities must beat Bootstrap's !important ones.
    require('./src/AppBuilder/Widgets/Ui2/_shared/styles/postcssShadcnImportant'),
    require('autoprefixer'),
    // Other PostCSS plugins if needed
  ],
};
