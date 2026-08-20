---
id: code-editor
title: Code Editor
---

Le composant **Code Editor** permet aux utilisateurs d'écrire et de modifier du code directement dans l'application, avec coloration syntaxique et formatage pour divers langages de programmation. Il est idéal pour configurer des scripts, modifier du JSON, ou travailler avec une logique personnalisée dans une interface plus adaptée aux développeurs.

## Properties

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
|:----------- |:----------- |:----------------- |
| Placeholder |  Spécifie une indication décrivant la valeur attendue. | Ce champ nécessite une valeur de type `String`. |
| Mode |  Spécifie le langage à utiliser pour l'éditeur de code.| Voir l'encadré `info` ci-dessous pour la liste de tous les langages pris en charge. |
| Show line number | Affiche ou masque les numéros de ligne à gauche de l'éditeur.| Ce champ attend une valeur booléenne `{{true}}` ou `{{false}}`. |

:::info
<details id="tj-dropdown">
<summary>Prise en charge de tous les langages couramment utilisés.</summary>
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

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) ; vous pouvez les déclencher à l'aide d'un événement ou d'une requête RunJS.

|  Action  | Description | Comment y accéder |
|:----------- |:----------- |:---------|
| setValue | Définit la valeur de l'éditeur de code.   |`components.codeeditor1.setValue('const getRandomNumber = () => Math.floor(Math.random() * 100) + 1')` |

**Remarque :** Si l'action spécifique au composant setValue est exécutée à l'aide d'une requête JavaScript, vous devrez passer le code entre des accents graves (backticks).

## Exposed Variables

| Variables | Description | Comment y accéder |
|:----------- |:----------- |:---------- |
| value | Contient la valeur d'entrée actuelle saisie par l'utilisateur dans l'éditeur de code. | `{{components.codeeditor1.value}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:------------------|:------------|:------------------------------|
| Dynamic height | Ajuste automatiquement la hauteur du composant selon son contenu. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip  | Fournit des informations supplémentaires au survol. Définissez une chaîne d'affichage.  | Chaîne |

## Devices

|<div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Container

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Visibility | Contrôle la visibilité du composant. | Activez ou désactivez, ou définissez de manière programmatique avec **fx**. |
| Disable | Verrouille le composant et le rend non fonctionnel. | Activez ou désactivez, ou définissez de manière programmatique avec **fx**. |
| Border radius | Définit le rayon des coins de l'éditeur. | Saisissez une valeur numérique (par défaut : `6`) ou définissez-la de manière programmatique avec **fx**. |
| Border color | Définit la couleur de la bordure de l'éditeur. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |
| Background | Définit la couleur d'arrière-plan de l'éditeur. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)** activée.
:::

:::info
Toute propriété disposant du bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::
