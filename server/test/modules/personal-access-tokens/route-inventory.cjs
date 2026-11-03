const ts = require('typescript');
const path = require('path');
const fs = require('fs');

// Parse decorator metadata without starting the app, running migrations or mocking permissions.
// Include every controller candidate in the edition: this is deliberately a superset of the
// dynamic module registry, so an unregistered controller cannot acquire access unnoticed later.
function routeInventory(root, directory, canAccess, bundleOf) {
  const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const files = ts.sys.readDirectory(path.join(root, directory), ['.ts'], ['**/node_modules/**', '**/test/**'], ['**/*controller*.ts']);
  const program = ts.createProgram(files, { ...parsed.options, noEmit: true });
  const checker = program.getTypeChecker();
  const decorators = node => (ts.canHaveDecorators(node) ? ts.getDecorators(node) || [] : [])
    .map(d => d.expression).filter(ts.isCallExpression);
  const named = (node, name) => decorators(node).find(d => d.expression.getText() === name);
  const value = expression => {
    if (!expression) return undefined;
    if (ts.isObjectLiteralExpression(expression)) return Object.fromEntries(expression.properties.map(p => {
      if (!ts.isPropertyAssignment(p)) throw new Error('Route metadata must be explicit');
      return [p.name.getText().replace(/^['\"]|['\"]$/g, ''), value(p.initializer)];
    }));
    if (ts.isArrayLiteralExpression(expression)) return expression.elements.map(value);
    const type = checker.getTypeAtLocation(expression);
    if ('value' in type) return type.value;
    throw new Error(`Unresolved route metadata: ${expression.getText()} in ${path.relative(root, expression.getSourceFile().fileName)}`);
  };
  const base = node => {
    const expression = node.heritageClauses?.find(c => c.token === ts.SyntaxKind.ExtendsKeyword)?.types[0]?.expression;
    if (!expression) return undefined;
    let symbol = checker.getSymbolAtLocation(expression);
    if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
    return symbol?.declarations?.find(ts.isClassDeclaration);
  };
  const moduleFor = node => {
    const module = named(node, 'InitModule');
    return module ? value(module.arguments[0]) : base(node) ? moduleFor(base(node)) : undefined;
  };
  const methodsFor = node => {
    const parent = base(node);
    const methods = parent ? methodsFor(parent) : new Map();
    for (const method of node.members) if (ts.isMethodDeclaration(method)) methods.set(method.name.getText(), method);
    return methods;
  };
  const rows = new Set();
  for (const file of files) {
    const source = program.getSourceFile(file);
    for (const node of source.statements) {
      if (!ts.isClassDeclaration(node) || !named(node, 'Controller')) continue;
      const module = moduleFor(node);
      if (!module) continue;
      for (const [methodName, method] of methodsFor(node)) {
        const route = decorators(method).find(d => /^(Get|Post|Put|Patch|Delete|Options|Head|All|Sse)$/.test(d.expression.getText()));
        if (!route) continue;
        const featureDecorator = named(method, 'InitFeature');
        const features = [value(featureDecorator?.arguments[0])].flat();
        const verb = route.expression.getText() === 'Sse' ? 'GET' : route.expression.getText().toUpperCase();
        if (!features.every(feature => canAccess(module, feature, verb))) continue;
        const bundle = module === 'Plugins' && features.includes('get_spec') ? 'data' : bundleOf(module);
        const controller = value(named(node, 'Controller').arguments[0]);
        const prefixes = [typeof controller === 'object' && !Array.isArray(controller) ? controller.path || '' : controller || ''].flat();
        const version = value(named(method, 'Version')?.arguments[0]) ?? controller?.version ?? '(default)';
        const paths = [value(route.arguments[0]) || ''].flat();
        for (const prefix of prefixes) for (const routePath of paths) for (const feature of features) {
          const url = '/' + [prefix, routePath].map(part => String(part).replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/');
          rows.add([bundle || 'special', module, feature || '(none)', verb, url, `version=${[version].flat().join(',')}`,
            path.relative(root, file).replace(/\\/g, '/'), `${node.name.text}.${methodName}`].join(' | '));
        }
      }
    }
  }
  return [...rows].sort();
}
module.exports = { routeInventory };
