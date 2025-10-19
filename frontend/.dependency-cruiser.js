/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    /* rules from the 'recommended' preset: */
    {
      name: 'no-circular',
      severity: 'warn',
      comment:
        'This dependency is part of a circular relationship. You might want to revise ' +
        'your solution (i.e. use dependency inversion, make sure the modules have a single responsibility) ',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'no-orphans',
      comment:
        "This is an orphan module - it's likely not used (anymore?). Either use it or " +
        "remove it. If it's logical this module is an orphan (i.e. it's a config file), " +
        'add an exception for it in your dependency-cruiser configuration. By default ' +
        'this rule does not scrutinize dot-files (e.g. .eslintrc.js), TypeScript declaration ' +
        'files (.d.ts), tsconfig.json and some of the babel and webpack configs.',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$', // dot files
          '\\.d\\.ts$', // TypeScript declaration files
          '(^|/)tsconfig\\.json$', // TypeScript config
          '(^|/)(babel|webpack)\\.config\\.(js|cjs|mjs|ts|json)$', // babel and webpack configs
        ],
      },
      to: {},
    },
    {
      name: 'no-deprecated-core',
      comment:
        'A module depends on a node core module that has been deprecated. Find an alternative - these are ' +
        "bound to exist - node doesn't deprecate lightly.",
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: [
          '^(v8/tools/codemap)$',
          '^(v8/tools/consarray)$',
          '^(v8/tools/csvparser)$',
          '^(v8/tools/logreader)$',
          '^(v8/tools/profile_view)$',
          '^(v8/tools/profile)$',
          '^(v8/tools/SourceMap)$',
          '^(v8/tools/splaytree)$',
          '^(v8/tools/tickprocessor-driver)$',
          '^(v8/tools/tickprocessor)$',
          '^(node-inspect/lib/_inspect)$',
          '^(node-inspect/lib/internal/inspect_client)$',
          '^(node-inspect/lib/internal/inspect_repl)$',
          '^(async_hooks)$',
          '^(punycode)$',
          '^(domain)$',
          '^(constants)$',
          '^(sys)$',
          '^(_linklist)$',
          '^(_stream_wrap)$',
        ],
      },
    },
    {
      name: 'not-to-deprecated',
      comment:
        'This module uses a (version of an) npm module that has been deprecated. Either upgrade to a later ' +
        'version of that module, or find an alternative. Deprecated modules are a security risk.',
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['deprecated'],
      },
    },
    {
      name: 'no-non-package-json',
      severity: 'error',
      comment:
        "This module depends on an npm package that isn't in the 'dependencies' section of your package.json. " +
        "That's problematic as the package either (1) won't be available on live (2 - worse) will be " +
        'available on live with an non-guaranteed version. Fix it by adding the package to the dependencies ' +
        'in your package.json.',
      from: {},
      to: {
        dependencyTypes: ['npm-no-pkg', 'npm-unknown'],
      },
    },
    {
      name: 'not-to-unresolvable',
      comment:
        "This module depends on a module that cannot be found ('resolved to disk'). If it's an npm " +
        'module: add it to your package.json. In all other cases: adjust your path to resolve to a module. ',
      severity: 'error',
      from: {},
      to: {
        couldNotResolve: true,
      },
    },
    {
      name: 'no-duplicate-dep-types',
      comment:
        "Likely this module depends on an external ('npm') package that occurs more than once " +
        'in your package.json i.e. both as a devDependencies and in dependencies. This will cause ' +
        'maintenance problems later on.',
      severity: 'warn',
      from: {},
      to: {
        moreThanOneDependencyType: true,
        // As this rule will also flag modules that have more than one dependency type,
        // you might want to add an exception for some of them
        pathNot: ['^node_modules/(@types|@testing-library)/'],
      },
    },

    /* Custom rules for ToolJet */
    {
      name: 'no-circular-in-components',
      severity: 'error',
      comment: 'Circular dependencies between components are not allowed',
      from: {
        path: '^src/_components',
      },
      to: {
        path: '^src/_components',
        circular: true,
      },
    },
    {
      name: 'no-circular-in-helpers',
      severity: 'error',
      comment: 'Circular dependencies in helpers are not allowed',
      from: {
        path: '^src/_helpers',
      },
      to: {
        path: '^src/_helpers',
        circular: true,
      },
    },
    {
      name: 'no-circular-stores',
      severity: 'warn',
      comment: 'Circular dependencies involving stores should be avoided',
      from: {
        path: '^src/_stores',
      },
      to: {
        circular: true,
      },
    },
  ],
  options: {
    /* conditions to select which files to include */
    doNotFollow: {
      /* path patterns to exclude */
      path: [
        'node_modules',
        'build',
        'dist',
        'coverage',
        '\\.d\\.ts$',
        '^ee/',
        '^cloud/',
      ],
    },

    /* pattern specifying which files to include (regular expression) */
    includeOnly: '^src',

    /* list of module systems to use */
    moduleSystems: ['cjs', 'es6', 'amd'],

    /* prefix for links in the output */
    prefix: '',

    /* false (default): ignore dependencies that only exist before typescript-to-javascript compilation
       true: also detect dependencies that only exist before typescript-to-javascript compilation
       "specify": for each dependency identify whether it only exists before compilation or also after
     */
    tsPreCompilationDeps: true,

    /*
       list of extensions to scan.
     */
    tsConfig: {
      fileName: 'jsconfig.json',
    },

    /* if true combines the package.jsons found from the module up to the base
       folder the cruise is initiated from. Useful for how (some) mono-repos
       manage dependencies & dependency definitions.
     */
    combinedDependencies: false,

    /* TypeScript project file ('tsconfig.json') to use for
       (1) compilation and
       (2) resolution (e.g. with the paths property)

       The (optional) fileName attribute specifies which file to take (relative to
       dependency-cruiser's current working directory). When not provided
       defaults to './tsconfig.json'.
     */

    /* Webpack configuration to use to get resolve options from.

       The (optional) fileName attribute specifies which file to take (relative
       to dependency-cruiser's current working directory. When not provided defaults
       to './webpack.conf.js'.

       The (optional) `env` and `arguments` attributes contain the parameters to be passed if
       your webpack config is a function and takes them (see webpack documentation
       for details)
     */
    webpackConfig: {
      fileName: 'webpack.config.js',
    },

    /* How to resolve
     */
    enhancedResolveOptions: {
      /* What to consider as an 'exports' field in package.jsons */
      exportsFields: ['exports'],
      /* What to consider as a 'main' field in package.json */
      mainFields: ['module', 'main', 'browser'],
      /* List of strings to consider as a 'main' field in package.json */
      mainFiles: ['index'],
      /* extensions to scan that aren't javascript nor typescript */
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts', '.json'],
    },
    reporterOptions: {
      dot: {
        /* pattern of modules that can be consolidated in the detailed
           graphical dependency graph. The default pattern in this configuration
           collapses everything in node_modules to one folder deep so you see
           the external modules, but not the innards your app depends upon.
         */
        collapsePattern: 'node_modules/(@[^/]+/[^/]+|[^/]+)',

        /* Options to tweak the appearance of your graph.See
           https://github.com/sverweij/dependency-cruiser/blob/main/doc/options-reference.md#reporteroptions
           for details and some examples. If you don't specify a theme
           dependency-cruiser falls back to a built-in one.
        */
        // theme: {
        //   graph: {
        //     /* use splines: "ortho" for straight lines. Be aware though
        //        graphviz might take a long time calculating ortho(gonal)
        //        routings.
        //      */
        //     splines: 'true'
        //   },
        // },
      },
      archi: {
        /* pattern of modules that can be consolidated in the high level
          graphical dependency graph. If you use the high level graphical
          dependency graph reporter (`archi`) you probably want to tweak
          this collapsePattern to your situation.
        */
        collapsePattern:
          '^(node_modules/(@[^/]+/[^/]+|[^/]+))|^src/[^/]+',

        /* Options to tweak the appearance of your graph. If you don't specify a
           theme for 'archi' dependency-cruiser will use the one specified in the
           dot section (see above), if any, and otherwise use the default one.
         */
        // theme: {
        // },
      },
    },
  },
};
