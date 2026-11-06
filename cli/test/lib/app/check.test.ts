import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as ts from 'typescript';

import { checkSources } from '../../../src/lib/app/check';
import { validateAppJson, AppJson, Snapshot } from '../../../src/lib/app/project';
import { generateTypes, tsType } from '../../../src/lib/app/typegen';

const app: AppJson = {
  name: 'Orders',
  appId: 'app-1',
  codePage: { handle: 'home', name: 'Home' },
  routes: [
    { id: 'orders', path: '/', title: 'Orders' },
    { id: 'order', path: '/orders/:id' },
    { id: 'dashboard', path: '/dashboard' },
  ],
};

const snapshot: Snapshot = {
  appId: 'app-1',
  appName: 'Orders',
  versionId: 'v-1',
  pulledAt: '2026-11-02T00:00:00.000Z',
  pages: [
    { id: 'p1', handle: 'home', name: 'Home', hidden: false },
    { id: 'p2', handle: 'reports', name: 'Reports', hidden: false },
    { id: 'p3', handle: 'home-orders', name: 'Home: Orders', hidden: true },
  ],
  queries: [
    { name: 'orders', kind: 'tooljetdb', operation: 'list_rows', table: 'orders', params: [] },
    { name: 'updateStatus', kind: 'tooljetdb', operation: 'update_rows', table: 'orders', params: ['id', 'status'] },
    { name: 'revenue', kind: 'postgresql', params: ['from'] },
  ],
  tables: {
    orders: [
      { name: 'id', type: 'integer', nullable: false },
      { name: 'status', type: 'character varying', nullable: false },
      { name: 'total', type: 'double precision', nullable: true },
      { name: 'created_at', type: 'timestamp with time zone', nullable: true },
    ],
  },
};

const withSources = (files: Record<string, string>) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-app-check-'));
  const src = path.join(root, 'src');
  for (const [name, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(src, name)), { recursive: true });
    fs.writeFileSync(path.join(src, name), text);
  }
  return src;
};

describe('tooljet app check', () => {
  it('passes code that names only queries, routes and pages the app has', () => {
    const src = withSources({
      'App/index.tsx': [
        "const orders = useAppQuery('orders');",
        "const update = ToolJet.useQuery<unknown>('updateStatus');",
        "navigate('/orders/36'); navigate('/dashboard');",
        '<Route path="/orders/:id" element={<X/>} /> <NavLink to="/dashboard" />',
        "routePath('order', { id: 1 }); nav.goToPage('reports');",
      ].join('\n'),
    });
    expect(checkSources(src, app, snapshot)).to.deep.equal([]);
  });

  it('reports a missing query with its file and line', () => {
    const src = withSources({ 'App/Orders.tsx': "\n\nconst x = useAppQuery('ordrs');\n" });
    const findings = checkSources(src, app, snapshot);
    expect(findings).to.have.length(1);
    expect(findings[0]).to.include({ file: 'src/App/Orders.tsx', line: 3 });
    expect(findings[0].message).to.contain('query "ordrs" does not exist');
  });

  it('reports routes, links and pages the app does not declare', () => {
    const src = withSources({
      'App/index.tsx': [
        "navigate('/settings');",
        '<Route path="/settings" element={<S/>} />',
        '<Link to="/nowhere">x</Link>',
        "routePath('missing');",
        "goToPage('billing');",
      ].join('\n'),
    });
    const messages = checkSources(src, app, snapshot).map((f) => f.message);
    expect(messages).to.have.length(5);
    expect(messages.join('\n'))
      .to.contain('path "/settings" matches no route')
      .and.to.contain('<Route path="/settings"> is not declared')
      .and.to.contain('link to "/nowhere"')
      .and.to.contain('route id "missing"')
      .and.to.contain('page "billing" does not exist');
  });

  it('reports a cast of a query hook run() that hides an undeclared parameter (the 2026-11-05 build)', () => {
    // The exact code that built with `category` reaching a query that does not declare it.
    const src = withSources({
      'App/Approvals.tsx': [
        "import { useAppQuery, QaExpensesRow } from '../tooljet.gen';",
        'export const Approvals: React.FC = () => {',
        "  const pending = useAppQuery('updateStatus');",
        "  const count = useAppQuery('revenue');",
        "  const categoryParameter = categoryFilter === 'all' ? '' : categoryFilter;",
        '  const runPage = pending.run as unknown as (params: { offset: number; category: string } & ReturnType<typeof monthBounds>) => Promise<QaExpensesRow[]>;',
        '  const runCount = count.run as unknown as (params: { category: string } & ReturnType<typeof monthBounds>) => Promise<QaExpensesRow[]>;',
        '  useEffect(() => {',
        '    const bounds = monthBounds(month);',
        '    void Promise.all([',
        '      runPage({ offset: (page - 1) * PAGE_SIZE, ...bounds, category: categoryParameter }),',
        '      runCount({ ...bounds, category: categoryParameter }),',
        '    ]);',
        '  }, [page, month, categoryParameter]);',
        '  return null;',
        '};',
      ].join('\n'),
    });
    const findings = checkSources(src, app, snapshot);
    expect(findings.map((f) => f.line)).to.deep.equal([6, 7]);
    expect(findings[0].file).to.equal('src/App/Approvals.tsx');
    expect(findings[0].message)
      .to.contain('pending.run is cast (as unknown as (params:')
      .and.to.contain('do not cast run() of query "updateStatus"')
      .and.to.contain('Declare a new parameter in the query and read it there');
    expect(findings[1].message).to.contain('count.run is cast').and.to.contain('query "revenue"');
  });

  it('reports every way of casting a query hook, its run or its parameters', () => {
    const src = withSources({
      'lib/queries.ts': [
        "import { useAppQuery } from '../tooljet.gen';",
        "const a = useAppQuery('updateStatus');",
        "void (a.run as any)({ id: 1, month: 'x' });", // 3: run as any
        'const b = <(p: object) => Promise<unknown>><unknown>a.run;', // 4: angle-bracket double cast
        "void (a['run'] as unknown);", // 5: element access
        "const { run: go } = useAppQuery('revenue');",
        'const goLoose = go as (p: Record<string, unknown>) => Promise<unknown>;', // 7: destructured run, single cast
        'const again = go;',
        'void (again! as any);', // 9: alias of a destructured run
        "const q = useAppQuery('orders') as unknown as { run: (p?: Record<string, unknown>) => Promise<unknown> };", // 10
        'export const useWrite = (name: string) => useAppQuery(name as never) as any;', // 11: the hook call itself
        'void (a as any).run({ month: 1 });', // 12: the hook object
        "void a.run({ id: 1, month: 'x' } as { id: number });", // 13: parameters cast in place
        "void a.run({ id: 1, ...({ month: 'x' } as unknown as object) });", // 14: spread of a cast
        "const extra = { month: 'x' } as unknown as Record<string, never>;",
        'void a.run(extra);', // 16: a variable made by a cast
        'const r: any = a.run;', // 17: loosened by annotation
        'void b; void goLoose; void q; void r;',
      ].join('\n'),
    });
    const findings = checkSources(src, app, snapshot);
    expect(findings.map((f) => f.line)).to.deep.equal([3, 4, 5, 7, 9, 10, 11, 12, 13, 14, 16, 17]);
    const at = (line: number) => findings.find((f) => f.line === line)!.message;
    expect(at(3)).to.contain('a.run is cast (as any)');
    expect(at(4)).to.contain('a.run is cast (as unknown as (p: object) => Promise<unknown>)');
    expect(at(7)).to.contain('go is cast').and.to.contain('query "revenue"');
    expect(at(10)).to.contain('do not cast the useAppQuery hook of query "orders"');
    expect(at(13)).to.contain('the parameters passed to a.run() are cast');
    expect(at(17)).to.contain('r is typed any');
  });

  it('leaves other casts alone: results, .data, rows, values inside the parameters, as const', () => {
    const src = withSources({
      'App/index.tsx': [
        "import { useAppQuery } from '../tooljet.gen';",
        'export const X = () => {',
        "  const orders = useAppQuery('orders');",
        "  const update = useAppQuery('updateStatus');",
        '  const runUpdate = update.run;',
        '  const rows = (orders.data ?? []) as unknown as { id: number }[];',
        '  const user = currentUser as unknown as { name?: string };',
        '  const save = async (v: unknown) => {',
        '    const refreshed = (await orders.run()) as unknown as { data?: unknown[] };',
        '    const done = (await update.run({ id: v as number, status: String(v) })) as any;',
        "    await runUpdate({ id: 1, status: 'x' } as const);",
        '    const other = { run: (p: unknown) => p };',
        '    return [refreshed, done, (other.run as any)(1), (job.run as unknown as () => void)()];',
        '  };',
        '  return <div>{rows.length}{user.name}{String(save)}</div>;',
        '};',
      ].join('\n'),
    });
    expect(checkSources(src, app, snapshot)).to.deep.equal([]);
  });

  it('skips the generated file and node_modules', () => {
    const src = withSources({
      'tooljet.gen.ts': "useAppQuery('nope')",
      'node_modules/x/index.ts': "useAppQuery('nope')",
    });
    expect(checkSources(src, app, snapshot)).to.deep.equal([]);
  });
});

describe('app.json validation', () => {
  it('accepts a well-formed app', () => {
    expect(validateAppJson(app)).to.deep.equal([]);
  });

  it('rejects duplicate ids and paths, bad ids and paths, and no routes', () => {
    const errors = validateAppJson({
      name: 'X',
      codePage: { handle: 'Home Page', name: 'Home' },
      routes: [
        { id: 'a', path: '/' },
        { id: 'a', path: '/b' },
        { id: 'Bad Id', path: '/c' },
        { id: 'c', path: 'nope' },
        { id: 'd', path: '/' },
      ],
    });
    expect(errors.join('\n'))
      .to.contain('codePage.handle')
      .and.to.contain('"a" is listed twice')
      .and.to.contain('"Bad Id"')
      .and.to.contain('route "c" needs a path')
      .and.to.contain('path "/" is used by two routes');
    expect(validateAppJson({ name: 'X', codePage: { handle: 'home', name: 'Home' }, routes: [] })).to.include(
      'app.json: "routes" must list at least one route'
    );
  });
});

describe('typed hooks', () => {
  it('maps ToolJet DB column types to TypeScript', () => {
    expect(tsType({ name: 'a', type: 'integer', nullable: false })).to.equal('number');
    expect(tsType({ name: 'a', type: 'double precision', nullable: true })).to.equal('number | null');
    expect(tsType({ name: 'a', type: 'character varying', nullable: false })).to.equal('string');
    expect(tsType({ name: 'a', type: 'boolean', nullable: false })).to.equal('boolean');
    expect(tsType({ name: 'a', type: 'jsonb', nullable: false })).to.equal('unknown');
  });

  it('writes row types, query data and params, routes and pages', () => {
    const out = generateTypes(app, snapshot);
    expect(out).to.contain(
      'export interface OrdersRow {\n  id: number;\n  status: string;\n  total: number | null;\n  created_at: string | null;\n}'
    );
    expect(out).to.contain('  orders: { data: OrdersRow[]; params: Record<string, never> };');
    expect(out).to.contain(
      '  updateStatus: { data: OrdersRow[] | unknown; params: { id?: unknown; status?: unknown } };'
    );
    expect(out).to.contain('  revenue: { data: unknown; params: { from?: unknown } };');
    expect(out).to.contain('  order: "/orders/:id",');
    expect(out).to.contain('export const PAGES = ["reports"] as const;');
  });

  it('refuses a run() value the query does not declare, spread or not', () => {
    // The generated file against the SDK's QueryHandle shape: a filter whose parameter never reached the query built and
    // filtered nothing (2026-11-05), because ToolJet drops an undeclared value and a spread escapes excess-property checks.
    const sdk = [
      'export interface QueryHandle<D = unknown, P extends Record<string, unknown> = Record<string, unknown>> {',
      '  data: D | undefined; loading: boolean; error: Error | null; run: (params?: P) => Promise<D>;',
      '}',
      'export declare const ToolJet: {',
      '  useQuery<D = unknown, P extends Record<string, unknown> = Record<string, unknown>>(name: string): QueryHandle<D, P>;',
      '};',
    ].join('\n');
    const usage = [
      "import { useAppQuery } from './tooljet.gen';",
      "const update = useAppQuery('updateStatus');",
      "const orders = useAppQuery('orders');",
      "const bounds = Math.random() > 0.5 ? { from: 'a', to: 'b' } : { from: 'c', to: 'd' };",
      "void update.run({ id: 1, status: 'done' });",
      'void update.run();',
      'const loose: Record<string, unknown> = { id: 1 };',
      'void update.run(loose);',
      'void orders.run();',
      'const total: number = (orders.data ?? []).length + (orders.loading ? 1 : 0);',
      'void total;',
      'void update.run({ id: 1, ...bounds });',
      "void update.run({ id: 1, month: 'x' });",
    ].join('\n');
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-typegen-'));
    const sdkDir = path.join(root, 'node_modules', '@tooljet', 'custom-component-sdk');
    fs.mkdirSync(sdkDir, { recursive: true });
    const sdkPackage = { name: '@tooljet/custom-component-sdk', types: 'index.d.ts' };
    fs.writeFileSync(path.join(sdkDir, 'package.json'), JSON.stringify(sdkPackage));
    fs.writeFileSync(path.join(sdkDir, 'index.d.ts'), sdk);
    fs.writeFileSync(path.join(root, 'tooljet.gen.ts'), generateTypes(app, snapshot));
    fs.writeFileSync(path.join(root, 'use.ts'), usage);
    const program = ts.createProgram([path.join(root, 'use.ts')], {
      strict: true,
      noEmit: true,
      target: ts.ScriptTarget.ES2020,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      types: [],
    });
    const errors = ts.getPreEmitDiagnostics(program).map((d) => ({
      line: d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : 0,
      text: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
    }));
    fs.rmSync(root, { recursive: true, force: true });
    expect(errors.map((e) => e.line)).to.deep.equal([12, 13]);
    expect(errors[0].text).to.contain('from is not a parameter of this query');
    expect(errors[1].text).to.contain('month is not a parameter of this query');
  });
});
