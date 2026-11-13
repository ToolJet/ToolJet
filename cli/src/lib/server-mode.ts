/*
  Server mode: the CLI runs for the MCP server, on a ToolJet or agent host, on code anyone with edit access can change.
  It is asked for, never guessed: the MCP server sets TOOLJET_CLI_SERVER_MODE=1 on the CLI it starts, and `tooljet app
  server-mode` lets it check that this CLI honours that before it trusts a build.

  In this mode no project code runs. The build uses this CLI's own PostCSS and Tailwind with the template's config
  (project postcss, tailwind and browserslist config is ignored, and CSS cannot name config or plugins to load), never
  renders components in Node (recordRender), and installs with npm, with the project's .npmrc set aside.
*/
export const SERVER_MODE_ENV = 'TOOLJET_CLI_SERVER_MODE';
export const isServerMode = () => process.env[SERVER_MODE_ENV] === '1';
