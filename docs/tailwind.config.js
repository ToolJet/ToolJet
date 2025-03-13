/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./versioned_docs/version-2.50.0-LTS/doc-home-page.mdx",
    "./versioned_docs/version-3.0.0-LTS/doc-home-page.mdx",
    "./docs/doc-home-page.mdx",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false, // This prevents Tailwind from resetting global styles
  },
}