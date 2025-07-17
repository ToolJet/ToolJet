---
id: code-editor
title: Code Editor
---

The **Code Editor** component lets users write and edit code directly within the app, with syntax highlighting and formatting for various programming languages. It's ideal for configuring scripts, editing JSON, or working with custom logic in a more developer-friendly interface.

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:----------- |:----------- |:----------------- |
| Placeholder |  Specifies a hint that describes the expected value. | This field requires a `String` value. |
| Mode |  Specifies the language to be used for the code-editor.| See `info` below for the list of all supported languages. |
| Show line number | Show or hides line numbers to the left of the editor.| This field expects a boolean value `{{true}}` or `{{false}}`. |

:::info
<details id="tj-dropdown">
<summary>Supporting all commonly used languages.</summary>
      <ul>
      <li>APL</li>
      <li>ASN.1</li>
      <li>Asterisk dialplan</li>
      <li>Brainfuck</li>
      <li>C, C++, C#</li>
      <li>Ceylon</li>
      <li>Clojure</li>
      <li>Closure Stylesheets (GSS)</li>
      <li>CMake</li>
      <li>COBOL</li>
      <li>CoffeeScript</li>
      <li>Common Lisp</li>
      <li>Crystal</li>
      <li>CSS</li>
      <li>Cypher</li>
      <li>Cython</li>
      <li>D</li>
      <li>Dart</li>
      <li>Django (templating language)</li>
      <li>Dockerfile</li>
      <li>diff</li>
      <li>DTD</li>
      <li>Dylan</li>
      <li>EBNF</li>
      <li>ECL</li>
      <li>Eiffel</li>
      <li>Elixir</li>
      <li>Elm</li>
      <li>Erlang</li>
      <li>Factor</li>
      <li>FCL</li>
      <li>Forth</li>
      <li>Fortran</li>
      <li>F#</li>
      <li>Gas (AT&amp;T-style assembly)</li>
      <li>Gherkin</li>
      <li>Go</li>
      <li>Groovy</li>
      <li>HAML</li>
      <li>Handlebars</li>
      <li>Haskell</li>
      <li>Haxe</li>
      <li>HTML embedded (JSP, ASP.NET)</li>
      <li>HTML mixed-mode</li>
      <li>HTTP</li>
      <li>IDL</li>
      <li>Java</li>
      <li>JavaScript (JSX)</li>
      <li>Jinja2</li>
      <li>Julia</li>
      <li>Kotlin</li>
      <li>LESS</li>
      <li>LiveScript</li>
      <li>Lua</li>
      <li>Markdown (GitHub-flavour)</li>
      <li>Mathematica</li>
      <li>mbox</li>
      <li>mIRC</li>
      <li>Modelica</li>
      <li>MscGen</li>
      <li>MUMPS</li>
      <li>Nginx</li>
      <li>NSIS</li>
      <li>N-Triples/N-Quads</li>
      <li>Objective C</li>
      <li>OCaml</li>
      <li>Octave (MATLAB)</li>
      <li>Oz</li>
      <li>Pascal</li>
      <li>PEG.js</li>
      <li>Perl</li>
      <li>PGP (ASCII armor)</li>
      <li>PHP</li>
      <li>Pig Latin</li>
      <li>PowerShell</li>
      <li>Properties files</li>
      <li>ProtoBuf</li>
      <li>Pug</li>
      <li>Puppet</li>
      <li>Python</li>
      <li>Q</li>
      <li>R</li>
      <li>RPM</li>
      <li>reStructuredText</li>
      <li>Ruby</li>
      <li>Rust</li>
      <li>SAS</li>
      <li>Sass</li>
      <li>Spreadsheet</li>
      <li>Scala</li>
      <li>Scheme</li>
      <li>SCSS</li>
      <li>Shell</li>
      <li>Sieve</li>
      <li>Slim</li>
      <li>Smalltalk</li>
      <li>Smarty</li>
      <li>Solr</li>
      <li>Soy</li>
      <li>Stylus</li>
      <li>SQL (several dialects)</li>
      <li>SPARQL</li>
      <li>Squirrel</li>
      <li>Swift</li>
      <li>sTeX, LaTeX</li>
      <li>Tcl</li>
      <li>Textile</li>
      <li>Tiddlywiki</li>
      <li>Tiki wiki</li>
      <li>TOML</li>
      <li>Tornado (templating language)</li>
      <li>troff (for manpages)</li>
      <li>TTCN</li>
      <li>TTCN Configuration</li>
      <li>Turtle</li>
      <li>Twig</li>
      <li>VB.NET</li>
      <li>VBScript</li>
      <li>Velocity</li>
      <li>Verilog/SystemVerilog</li>
      <li>VHDL</li>
      <li>Vue.js app</li>
      <li>Web IDL</li>
      <li>WebAssembly Text Format</li>
      <li>XML/HTML</li>
      <li>XQuery</li>
      <li>Yacas</li>
      <li>YAML</li>
      <li>YAML frontmatter</li>
      <li>Z80</li>
    </ul>
</details>
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

|  Action  | Description | How To Access |
|:----------- |:----------- |:---------|
| setValue | Sets the value of the code editor.   |`components.codeeditor1.setValue('const getRandomNumber = () => Math.floor(Math.random() * 100) + 1')` |

**Note:** If the setValue component specific action is executed using a JavaScript query, you will have to pass the code inside backticks. 

## Exposed Variables

| Variables | Description | How To Access |
|:----------- |:----------- |:---------- |
| value | Holds the current input value entered by the user in the code editor. | `{{components.codeeditor1.value}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Dynamic height | Automatically adjusts the component's height based on its content. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip  | Provides additional information on hover. Set a display string.  | String |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

| <div style={{ width:"100px"}}> Styles </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Default Value </div> |
|:----------- |:----------- |:----------- |
| Visibility | Toggle on or off to control the visibility of the component. You can programmatically change its value by clicking on the **fx** button next to it. If `{{false}}` the component will not be visible after the app is deployed. | By default, it's set to `{{true}}` |
| Disable | This is `off` by default, toggle `on` the switch to lock the component and make it non-functional. You can also programmatically set the value by clicking on the **fx** button next to it. If set to `{{true}}`, the component will be locked and becomes non-functional. | By default, its value is set to `{{false}}` |
| Border radius | Modifies the border radius of the editor. The field expects only numerical value from `1` to `100`. | Default is `0`. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::
