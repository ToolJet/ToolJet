/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./versioned_docs/version-2.50.0-LTS/doc-home-page.mdx",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false, // This prevents Tailwind from resetting global styles
  },
}