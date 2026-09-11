const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { validateWidgetTestingContracts } = require('../widgetContractValidator');

const temporaryRoots = [];
const SPEC = 'src/AppBuilder/Widgets/DropdownV2/__tests__/integration/DropdownV2.spec.jsx';
const DEFINITION = 'src/AppBuilder/WidgetManager/widgets/dropdownV2.js';

function write(root, relative, contents) {
  const absolute = path.join(root, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, contents);
}

function validContract({
  status = 'approved',
  scenarioStatus = 'verified',
  developmentType = 'existing-widget',
  layer = 'RTL integration',
  owner = 'Engineering',
  extraRows = '',
  decisions = '- None.',
} = {}) {
  return `---
component_type: DropdownV2
baseline: lts-3.16
contract_status: ${status}
development_type: ${developmentType}
production_changes: forbidden
product_approval: Nakul, 2026-09-10
test_design_approval: Nakul, 2026-09-10
research_docs: origin/documentation:docs/docs/widgets/dropdown.md
research_git_history: git log --since=2 years
prd_source: ${developmentType === 'new-widget' ? 'https://github.com/ToolJet/tj-ee/issues/6000' : ''}
---

## Research findings
| Finding | Source | Disposition |
| --- | --- | --- |
| stale onSelect | ticket 19 | covered:DropdownV2-EVT-001 |

## Registered-surface disposition
| Registered key | Kind | Disposition |
| --- | --- | --- |
| properties.options | property | covered:DropdownV2-EVT-001 |
| styles.textColor | style | none:computed-css |
${extraRows}
## Production-behavior inventory
| Dimension | Evidence | Disposition |
| --- | --- | --- |
| events | EVT-001 | covered:DropdownV2-EVT-001 |

## Combination matrix
| Combination | Why | Disposition |
| --- | --- | --- |
| options x onSelect | stale handler | covered:DropdownV2-EVT-001 |

## Decisions
${decisions}

## Approved scenarios
### [DropdownV2-EVT-001] onSelect reads the triggering selection
- Guarantee: Selection publishes the selected value once.
- Sources: Approved selection behavior.
- Public seam: Select an option and read the public exposed value.
- Layer: ${layer}
- Owner: ${owner}
- Rank: High
- Status: ${scenarioStatus}
- Evidence: Focused pass, targeted stale-selection fault failed, restored pass.
`;
}

function createFixture(overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'widget-contract-validator-'));
  temporaryRoots.push(root);
  write(root, 'src/AppBuilder/WidgetManager/configs/widgetConfig.js', `export const widgets = [dropdownV2Config];\n`);
  write(
    root,
    DEFINITION,
    `export const dropdownV2Config = {\n  component: 'DropdownV2',\n  properties: {\n    options: {},\n  },\n  styles: {\n    textColor: {},\n  },\n};\n`
  );
  if (overrides.contract !== null) {
    write(root, 'src/test/app-builder/widgets/DropdownV2/TESTING.md', overrides.contract ?? validContract());
  }
  write(
    root,
    SPEC,
    overrides.testSource ?? `test('[DropdownV2-EVT-001] onSelect reads the triggering selection', () => {});\n`
  );
  for (const [rel, contents] of Object.entries(overrides.extraFiles ?? {})) write(root, rel, contents);
  const widget = {
    componentType: 'DropdownV2',
    status: overrides.manifestStatus ?? 'approved',
  };
  if (overrides.contract !== null) widget.contract = 'src/test/app-builder/widgets/DropdownV2/TESTING.md';
  write(
    root,
    'widget-testing-manifest.json',
    `${JSON.stringify(
      overrides.manifest ?? {
        baseline: 'lts-3.16',
        registry: 'src/AppBuilder/WidgetManager/configs/widgetConfig.js',
        widgets: [widget, ...(overrides.extraWidgets ?? [])],
      },
      null,
      2
    )}\n`
  );
  return root;
}

function run(overrides = {}, opts) {
  return validateWidgetTestingContracts(createFixture(overrides), opts);
}

function git(root, ...args) {
  return execFileSync(
    'git',
    [
      '-c',
      'core.hooksPath=/dev/null',
      '-c',
      'commit.gpgsign=false',
      '-c',
      'user.name=Workflow test',
      '-c',
      'user.email=workflow@example.invalid',
      ...args,
    ],
    { cwd: root, encoding: 'utf8' }
  ).trim();
}

function cliFixture() {
  const root = createFixture();
  write(
    root,
    'scripts/validate-widget-testing-contracts.js',
    fs.readFileSync(path.resolve(__dirname, '../../../../scripts/validate-widget-testing-contracts.js'), 'utf8')
  );
  write(
    root,
    'src/test/app-builder/widgetContractValidator.js',
    `module.exports = require(${JSON.stringify(require.resolve('../widgetContractValidator'))});`
  );
  write(root, 'src/AppBuilder/Widgets/DropdownV2/DropdownV2.jsx', 'export const value = 1;\n');
  git(root, 'init', '-q');
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'fixture');
  return root;
}

function cli(root, args = [], input = '') {
  return spawnSync(process.execPath, [path.join(root, 'scripts/validate-widget-testing-contracts.js'), ...args], {
    cwd: root,
    encoding: 'utf8',
    input,
    timeout: 15000,
  });
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('widget testing contract command', () => {
  const runtime = 'src/AppBuilder/Widgets/DropdownV2/DropdownV2.jsx';

  test('validates a clean checkout and reports QA and partial delivery separately', () => {
    const root = cliFixture();
    const result = cli(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('0 partial');
    expect(result.stdout).toContain('0 QA-owned');
    expect(result.stdout).toContain('1 excluded');
  });

  test.each(['unstaged', 'staged', 'untracked'])('checks %s production changes by default', (state) => {
    const root = cliFixture();
    const target = state === 'untracked' ? 'src/AppBuilder/Widgets/DropdownV2/new helper.jsx' : runtime;
    write(root, target, 'export const value = 2;\n');
    if (state === 'staged') git(root, 'add', target);
    const result = cli(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`production_changes is forbidden but ${target} was`);
  });

  test('checks committed changes against an explicit base and counts deletion in renames', () => {
    const root = cliFixture();
    const base = git(root, 'rev-parse', 'HEAD');
    write(root, runtime, 'export const value = 2;\n');
    git(root, 'add', runtime);
    git(root, 'commit', '-qm', 'change');
    expect(cli(root).status).toBe(0);
    expect(cli(root, ['--base-ref', base]).stderr).toContain(
      `production_changes is forbidden but ${runtime} was modified`
    );
    fs.renameSync(path.join(root, runtime), path.join(root, 'renamed.jsx'));
    expect(cli(root).stderr).toContain(`production_changes is forbidden but ${runtime} was removed`);
  });

  test('uses explicit CI stdin instead of discovering worktree changes', () => {
    const root = cliFixture();
    write(root, runtime, 'export const value = 2;\n');
    expect(cli(root, ['--changed-files-stdin'], '').status).toBe(0);
    const result = cli(root, ['--changed-files-stdin'], `modified\tfrontend/${runtime}\n`);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`production_changes is forbidden but ${runtime} was modified`);
  });

  test('reopens and reapproves a design while preserving previously approved test edits', () => {
    // Break this catches: retained test work makes the required preapproval audit unreachable.
    const root = cliFixture();
    const retainedTest = `test('[DropdownV2-EVT-001] selection publishes once', () => {});\n`;
    write(root, SPEC, retainedTest);
    expect(cli(root).status).toBe(0);

    for (const [status, scenarioStatus] of [
      ['grilling', 'harness-blocked'],
      ['spec-complete', 'ready'],
    ]) {
      const manifest = JSON.parse(fs.readFileSync(path.join(root, 'widget-testing-manifest.json'), 'utf8'));
      manifest.widgets[0].status = status;
      write(root, 'widget-testing-manifest.json', JSON.stringify(manifest));
      const contract = validContract({ status, scenarioStatus }).replace(
        /^(product_approval|test_design_approval):.*$/gm,
        '$1:'
      );
      write(root, 'src/test/app-builder/widgets/DropdownV2/TESTING.md', contract);
      const design = cli(root, ['--design-only']);
      expect(design.status).toBe(0);
      expect(design.stdout).toContain('Widget contract design OK');
      expect(design.stdout).not.toContain('Widget testing contracts OK');
      expect(design.stderr).toContain(`Modified widget test ${SPEC} requires an approved DropdownV2 contract`);
      expect(cli(root).status).toBe(1);
      expect(fs.readFileSync(path.join(root, SPEC), 'utf8')).toBe(retainedTest);
    }

    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'widget-testing-manifest.json'), 'utf8'));
    manifest.widgets[0].status = 'approved';
    write(root, 'widget-testing-manifest.json', JSON.stringify(manifest));
    write(root, 'src/test/app-builder/widgets/DropdownV2/TESTING.md', validContract({ scenarioStatus: 'implemented' }));
    expect(cli(root).status).toBe(0);
  });

  test('design validation reports production scope blockers and still rejects unresolved designs', () => {
    // Break this catches: design mode silently drops scope evidence or bypasses contract gates.
    const root = cliFixture();
    write(root, runtime, 'export const value = 2;\n');
    const design = cli(root, ['--design-only']);
    expect(design.status).toBe(0);
    expect(design.stderr).toContain(`production_changes is forbidden but ${runtime} was modified`);
    expect(design.stderr).toContain('Delivery scope blockers');
    expect(cli(root).status).toBe(1);
    write(
      root,
      'src/test/app-builder/widgets/DropdownV2/TESTING.md',
      validContract({ decisions: '### D-01 Selection?\n- Answer:' })
    );
    const unresolved = cli(root, ['--design-only']);
    expect(unresolved.status).toBe(1);
    expect(unresolved.stderr).toContain('decision D-01 requires an Answer');
  });

  test.each([
    ['delivery', []],
    ['design', ['--design-only']],
  ])('rejects invalid arguments and failed Git discovery in %s mode', (_mode, modeArgs) => {
    const root = cliFixture();
    for (const args of [
      ['--changed-files-stdin', '--base-ref', 'HEAD'],
      ['--base-ref'],
      ['--unknown'],
      ['--base-ref', 'missing-ref'],
      ['--design-only', '--design-only'],
    ]) {
      expect(cli(root, [...modeArgs, ...args]).status).toBe(1);
    }
    fs.rmSync(path.join(root, '.git'), { recursive: true });
    const result = cli(root, modeArgs);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Git change discovery failed');
  });
});

describe('widget testing contract validator', () => {
  test('requires both recorded approvals and matching manifest/contract states', () => {
    for (const field of ['product_approval', 'test_design_approval']) {
      const contract = validContract().replace(new RegExp(`${field}:.*`), `${field}: "  "`);
      expect(run({ contract }).errors).toContain(`DropdownV2: approved contract requires ${field}`);
    }
    expect(run({ manifestStatus: 'verified' }).errors).toContain(
      'DropdownV2: contract_status approved does not match manifest status verified'
    );
  });

  test('routes an unavailable approved seam back to grilling without turning it into a deferral', () => {
    expect(run({ contract: validContract({ scenarioStatus: 'harness-blocked' }) }).errors).toContain(
      'DropdownV2-EVT-001: harness-blocked requires returning the contract to grilling'
    );
    const contract = validContract({
      status: 'grilling',
      scenarioStatus: 'harness-blocked',
    })
      .replace(/^product_approval:.*$/m, 'product_approval:')
      .replace(/^test_design_approval:.*$/m, 'test_design_approval:');
    const result = run({ manifestStatus: 'grilling', contract });
    expect(result.errors).toEqual([]);
    expect(result.ledger[0].deferredScenarios).toEqual([]);
  });

  test.each(['approved', 'implemented', 'harness-blocked', 'deferred'])(
    'rejects a verified contract with an Engineering scenario still %s',
    (scenarioStatus) => {
      expect(
        run({
          manifestStatus: 'verified',
          contract: validContract({ status: 'verified', scenarioStatus }),
        }).errors
      ).toContain(`DropdownV2: verified requires DropdownV2-EVT-001 to be verified (got ${scenarioStatus})`);
    }
  );

  test('allows ready designs before approval and rejects premature or stale approval states', () => {
    const spec = {
      manifestStatus: 'spec-complete',
      contract: validContract({
        status: 'spec-complete',
        scenarioStatus: 'ready',
      }),
    };
    expect(run(spec).errors).toEqual([]);
    expect(
      run({
        ...spec,
        contract: spec.contract.replace('Status: ready', 'Status: approved'),
      }).errors
    ).toContain('DropdownV2: spec-complete requires DropdownV2-EVT-001 to be ready or deferred');
    expect(run({ contract: validContract({ scenarioStatus: 'ready' }) }).errors).toContain(
      'DropdownV2-EVT-001 is still ready in an approved contract'
    );
    expect(
      run({
        manifestStatus: 'grilling',
        contract: validContract({
          status: 'grilling',
          scenarioStatus: 'ready',
        }),
      }).errors
    ).toEqual([]);
  });

  test('partial delivery requires attributed deferrals and completed remaining work', () => {
    const contract =
      validContract({ status: 'partial', scenarioStatus: 'deferred' }) + '\n- Deferred-by: Nakul, 2026-09-10\n';
    const result = run({ manifestStatus: 'partial', contract, testSource: '' });
    expect(result.errors).toEqual([]);
    expect(result.ledger[0]).toEqual(
      expect.objectContaining({
        deferredScenarios: [{ id: 'DropdownV2-EVT-001', deferredBy: 'Nakul, 2026-09-10' }],
        qaScenarios: 0,
      })
    );
    for (const attribution of ['', '2026-09-10', 'Nakul', 'Nakul, 2026-02-30']) {
      expect(
        run({
          manifestStatus: 'partial',
          contract: contract.replace('Deferred-by: Nakul, 2026-09-10', `Deferred-by: ${attribution}`),
        }).errors
      ).toContain('DropdownV2-EVT-001: deferred requires Deferred-by with a person and valid YYYY-MM-DD date');
    }
    expect(
      run({
        manifestStatus: 'partial',
        contract: validContract({ status: 'partial' }),
      }).errors
    ).toContain('DropdownV2: partial requires at least one deferred Engineering scenario');
    const second =
      '\n### [DropdownV2-EVT-002] Another guarantee\n- Guarantee: Another effect.\n- Sources: Decision.\n- Public seam: Public action.\n- Rank: High\n- Owner: Engineering\n- Layer: Unit\n- Status: approved\n';
    expect(run({ manifestStatus: 'partial', contract: contract + second }).errors).toContain(
      'DropdownV2: partial requires DropdownV2-EVT-002 to be verified or deferred (got approved)'
    );
    // User reactivation returns delivery to approved until fresh evidence completes it.
    expect(run({ contract: validContract({ scenarioStatus: 'approved' }) }).errors).toEqual([]);
    expect(
      run({
        manifestStatus: 'verified',
        contract: validContract({ status: 'verified' }),
      }).errors
    ).toEqual([]);
  });

  test('requires final dispositions, answered unreferenced decisions, and scenario evidence', () => {
    const answered = '### D-01 Selection?\n- Answer: Publish it once.';
    expect(
      run({
        contract: validContract({
          extraRows: '| selection | property | decision:D-01 |',
          decisions: answered,
        }),
      }).errors
    ).toContain('DropdownV2: row selection must replace decision:D-01 with a final disposition');
    expect(
      run({
        contract: validContract({
          decisions: '### D-01 Selection?\n- Answer:',
        }),
      }).errors
    ).toContain('DropdownV2: decision D-01 requires an Answer before approved');
    for (const field of ['Guarantee', 'Sources', 'Public seam', 'Evidence']) {
      const contract = validContract().replace(new RegExp(`^- ${field}:.*$`, 'm'), `- ${field}:`);
      expect(run({ contract }).errors).toContain(`DropdownV2-EVT-001 is missing ${field}`);
    }
  });

  test('keeps QA ownership separate from Engineering completion', () => {
    const contract = validContract({
      status: 'verified',
      layer: 'Browser',
      owner: 'QA',
      scenarioStatus: 'qa-owned',
    });
    expect(run({ manifestStatus: 'verified', contract, testSource: '' }).errors).toEqual([]);
    expect(
      run({
        manifestStatus: 'verified',
        contract: contract.replace('Status: qa-owned', 'Status: verified'),
      }).errors
    ).toContain('DropdownV2-EVT-001: Browser/QA scenarios require Status qa-owned');
    expect(run({ contract: validContract({ owner: 'QA' }) }).errors).toContain(
      'DropdownV2-EVT-001: QA scenarios must use Layer Browser'
    );
    expect(run({ contract: validContract({ scenarioStatus: 'qa-owned' }) }).errors).toContain(
      'DropdownV2-EVT-001: Engineering scenarios cannot be qa-owned'
    );
  });
  test('accepts a registered approved contract with a titled test', () => {
    const result = run();
    expect(result.errors).toEqual([]);
    expect(result.registeredWidgetTypes).toEqual(['DropdownV2']);
  });

  test.each([
    "test.skip('[DropdownV2-EVT-001] selected', () => {});",
    "it.todo('[DropdownV2-EVT-001] selected');",
    "test.failing('[DropdownV2-EVT-001] selected', () => {});",
    "test.only('[DropdownV2-EVT-001] selected', () => {});",
    "describe.skip('group', () => { test('[DropdownV2-EVT-001] selected', () => {}); });",
    "const name = 'group'; describe.skip(name, () => { test('[DropdownV2-EVT-001] selected', () => {}); });",
    "describe.only('group', () => { it('[DropdownV2-EVT-001] selected', () => {}); });",
    "xdescribe('group', () => { it('[DropdownV2-EVT-001] selected', () => {}); });",
    "xtest('[DropdownV2-EVT-001] selected', () => {});",
    "test.skip.each([[1]])('[DropdownV2-EVT-001] selected %s', () => {});",
    "// test('[DropdownV2-EVT-001] selected', () => {});",
    "const text = `test('[DropdownV2-EVT-001] selected', () => {});`;",
  ])('does not count inactive declarations as verified tests: %s', (testSource) => {
    expect(run({ testSource }).errors).toContain(
      'DropdownV2: DropdownV2-EVT-001 has no active test whose title starts with [DropdownV2-EVT-001]'
    );
  });

  test.each([
    "describe('group', () => { test('[DropdownV2-EVT-001] selected', () => {}); });",
    "test.each([[1], [2]])('[DropdownV2-EVT-001] selected %s', () => {});",
    "it.each`value\n${1}\n${2}`('[DropdownV2-EVT-001] selected $value', () => {});",
    "test.concurrent('[DropdownV2-EVT-001] selected', async () => {});",
    'const Fixture = () => <div />; test(`[DropdownV2-EVT-001] selected`, () => {});',
  ])('accepts active nested and parameterized declarations: %s', (testSource) => {
    expect(run({ testSource }).errors).toEqual([]);
  });

  test('requires active shared tests and rejects focus anywhere in a maintained test file', () => {
    const sharedPath = 'src/AppBuilder/AppCanvas/__tests__/shared.spec.jsx';
    expect(
      run({
        contract: validContract({
          extraRows: `| shared | property | shared:${sharedPath}#Shared-001 |`,
        }),
        extraFiles: {
          [sharedPath]: "describe.skip('group', () => { test('[Shared-001] behavior', () => {}); });",
        },
      }).errors
    ).toContain(`DropdownV2: shared test ${sharedPath} does not reference an active Shared-001 test for row shared`);
    expect(
      run({
        testSource: "test('[DropdownV2-EVT-001] selected', () => {}); test.only('unrelated', () => {});",
      }).errors
    ).toContain(`${SPEC}: focused tests or suites prevent complete verification`);
  });

  test('reports invalid test syntax without accepting a textual scenario tag', () => {
    expect(run({ testSource: "test('[DropdownV2-EVT-001] selected', () => {" }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining(`Cannot parse test ${SPEC}:`)])
    );
  });

  test('requires deferral for an inactive tagged case even when another case with its ID is active', () => {
    const testSource =
      "test('[DropdownV2-EVT-001] selected', () => {}); test.skip('[DropdownV2-EVT-001] empty', () => {});";
    expect(run({ testSource }).errors).toContain(
      'DropdownV2-EVT-001: inactive tagged tests require an explicit deferred scenario'
    );
    const contract =
      validContract({ status: 'partial', scenarioStatus: 'deferred' }) + '\n- Deferred-by: Nakul, 2026-09-10';
    expect(run({ manifestStatus: 'partial', contract, testSource }).errors).toEqual([]);
  });

  test('requires every registered type in the manifest and vice versa', () => {
    expect(
      run({
        manifest: {
          baseline: 'lts-3.16',
          registry: 'src/AppBuilder/WidgetManager/configs/widgetConfig.js',
          widgets: [],
        },
      }).errors
    ).toContain('Registered widget DropdownV2 is missing from widget-testing-manifest.json');
    expect(
      run({
        extraWidgets: [{ componentType: 'InventedWidget', status: 'not-started' }],
      }).errors
    ).toContain('Manifest widget InventedWidget is not registered in App Builder');
  });

  test('blocks unapproved widget specs and new definitions', () => {
    const unapproved = { manifestStatus: 'not-started', contract: null };
    expect(
      run(unapproved, {
        changedFiles: [{ status: 'modified', path: `frontend/${SPEC}` }],
      }).errors
    ).toContain(`Modified widget test ${SPEC} requires an approved DropdownV2 contract`);
    expect(
      run(unapproved, {
        changedFiles: [{ status: 'added', path: `frontend/${DEFINITION}` }],
      }).errors
    ).toContain('New widget DropdownV2 requires an approved testing contract');
    expect(run({}, { changedFiles: [{ status: 'modified', path: `frontend/${SPEC}` }] }).errors).toEqual([]);
  });

  test('blocks widget production changes when the contract forbids them', () => {
    const runtime = 'src/AppBuilder/Widgets/DropdownV2/DropdownV2.jsx';
    const changedFiles = [{ status: 'modified', path: `frontend/${runtime}` }];

    expect(run({}, { changedFiles }).errors).toContain(
      `DropdownV2: production_changes is forbidden but ${runtime} was modified`
    );
    expect(run({}, { changedFiles: [{ status: 'removed', path: `frontend/${runtime}` }] }).errors).toContain(
      `DropdownV2: production_changes is forbidden but ${runtime} was removed`
    );
    expect(
      run(
        {
          contract: validContract().replace('production_changes: forbidden', 'production_changes: allowed'),
        },
        {
          changedFiles,
        }
      ).errors
    ).toEqual([]);
  });

  test('requires an explicit production change policy for spec-gated contracts', () => {
    expect(
      run({
        contract: validContract().replace('production_changes: forbidden\n', ''),
      }).errors
    ).toContain('DropdownV2: approved contract requires production_changes to be forbidden or allowed');
    expect(
      run({
        contract: validContract().replace('production_changes: forbidden', 'production_changes: sometimes'),
      }).errors
    ).toContain('DropdownV2: unknown production_changes policy sometimes');
  });

  test('requires research before a candidate design can be presented for approval', () => {
    // Break this catches: a structurally complete design reaches approval without its required sources.
    const contract = validContract({
      status: 'spec-complete',
      scenarioStatus: 'ready',
    })
      .replace(/research_docs:.*\n/, '')
      .replace(/research_git_history:.*\n/, '');
    expect(run({ manifestStatus: 'spec-complete', contract }, { designOnly: true }).errors).toEqual(
      expect.arrayContaining([
        'DropdownV2: spec-complete contract requires research_docs',
        'DropdownV2: spec-complete contract requires research_git_history',
      ])
    );
  });

  test('accepts an inapplicable behavior with a rationale but preserves registered surface obligations', () => {
    // Break this catches: absent capabilities are misreported as platform coverage or used to excuse a registered key.
    const row =
      '| Async lifecycle | No requests, timers, or subscriptions are owned by this widget. | none:not-applicable |';
    const contract = validContract().replace('| events | EVT-001 | covered:DropdownV2-EVT-001 |', row);
    expect(run({ contract }).errors).toEqual([]);
    expect(
      run({
        contract: contract.replace('No requests, timers, or subscriptions are owned by this widget.', ''),
      }).errors
    ).toContain('DropdownV2: row Async lifecycle requires a rationale for none:not-applicable');
    expect(
      run({
        contract: validContract().replace(
          '| property | covered:DropdownV2-EVT-001 |',
          '| property | none:not-applicable |'
        ),
      }).errors
    ).toContain('DropdownV2: registered surface properties.options cannot be none:not-applicable');
  });

  test('requires a disposition row for every registered surface key', () => {
    const missingProperty = validContract().replace(
      '| properties.options | property | covered:DropdownV2-EVT-001 |\n',
      ''
    );
    expect(run({ contract: missingProperty }).errors).toContain(
      'DropdownV2: registered surface properties.options has no disposition row'
    );
    expect(
      run({
        contract: validContract().replace('properties.options', 'options'),
      }).errors
    ).toContain('DropdownV2: registered surface properties.options has no disposition row');
  });

  test('requires a valid risk rank for every spec-gated scenario', () => {
    expect(run({ contract: validContract().replace('- Rank: High\n', '') }).errors).toContain(
      'DropdownV2-EVT-001 is missing Rank'
    );
    expect(
      run({
        contract: validContract().replace('- Rank: High', '- Rank: Urgent'),
      }).errors
    ).toContain('DropdownV2-EVT-001 has unknown Rank Urgent');
  });

  test('warns when a widget spec cannot be mapped', () => {
    const unmapped = 'src/AppBuilder/Widgets/NewTable/__tests__/integration/tableSelectedRow.spec.js';
    const result = run({}, { changedFiles: [{ status: 'modified', path: `frontend/${unmapped}` }] });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([`Cannot map modified widget test ${unmapped} to a registered component type`]);
  });

  test('requires documentation evidence for approved existing widgets', () => {
    expect(run({ contract: validContract() }).errors).toEqual([]);
    expect(run({ contract: validContract().replace(/^research_docs:.*\n/m, '') }).errors).toContain(
      'DropdownV2: approved contract requires research_docs'
    );
  });

  test('rejects mismatched or empty approved frontmatter', () => {
    const bad = validContract()
      .replace('component_type: DropdownV2', 'component_type: Nope')
      .replace('baseline: lts-3.16', 'baseline: main')
      .replace('contract_status: approved', 'contract_status: shipped')
      .replace(/research_docs: .*/, 'research_docs:')
      .replace(/research_git_history: .*/, 'research_git_history:');
    expect(run({ contract: bad }).errors).toEqual(
      expect.arrayContaining([
        'DropdownV2: contract component_type does not match the manifest',
        'DropdownV2: contract baseline does not match the manifest',
        'DropdownV2: unknown contract_status shipped',
        'DropdownV2: approved contract requires research_docs',
        'DropdownV2: approved contract requires research_git_history',
      ])
    );
    expect(
      run({
        contract: validContract().replace('development_type: existing-widget', 'development_type: plugin'),
      }).errors
    ).toContain('DropdownV2: unknown development_type plugin');
    expect(
      run({
        contract: validContract({ developmentType: 'new-widget' }).replace(/prd_source: .*/, 'prd_source:'),
      }).errors
    ).toContain('DropdownV2: new-widget contract requires prd_source');
  });

  test('rejects illegal disposition tokens and unresolved pointers', () => {
    const extraRows = `| sort | property | GAP - untested |
| color | style | none:not-worth-it |
| missing | property | covered:DropdownV2-STY-001 |
| dup | property | none:duplicate-of:DropdownV2-NOPE |
| shared-miss | property | shared:src/missing.spec.js#X-001 |
| shared-comment | property | shared:src/AppBuilder/AppCanvas/__tests__/comment.spec.jsx#Hint-001 |
| blocked | property | decision:D-01 |
| qa-wrong | property | qa:DropdownV2-EVT-001 |
`;
    expect(
      run({
        contract: validContract({
          extraRows,
          decisions: '### D-01 Is sort dead?\n\n- Raised by: sort\n- Recommendation: drop it',
        }),
        extraFiles: {
          'src/AppBuilder/AppCanvas/__tests__/comment.spec.jsx':
            '// [Hint-001] only a comment\ntest("untagged", () => {});\n',
        },
      }).errors
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining('row sort has no legal disposition token (got "GAP - untested"'),
        expect.stringContaining('uses unknown none: reason "not-worth-it"'),
        expect.stringContaining('cites unknown scenario DropdownV2-STY-001'),
        expect.stringContaining('claims duplicate-of unknown scenario DropdownV2-NOPE'),
        expect.stringContaining('points at missing shared test'),
        expect.stringContaining('does not reference an active Hint-001'),
        expect.stringContaining('blocked on unanswered D-01'),
        'DropdownV2: DropdownV2-EVT-001 is cited as qa: but is not Layer Browser / Owner QA',
      ])
    );
  });

  test('requires Status, Layer, and Owner, and rejects unsettled spec-complete scenarios', () => {
    const missing = validContract().replace(
      '- Layer: RTL integration\n- Owner: Engineering\n- Rank: High\n- Status: verified\n',
      ''
    );
    expect(run({ contract: missing }).errors).toEqual(
      expect.arrayContaining([
        'DropdownV2-EVT-001 is missing Status',
        'DropdownV2-EVT-001 is missing Layer',
        'DropdownV2-EVT-001 is missing Owner',
      ])
    );
    expect(
      run({
        manifestStatus: 'spec-complete',
        contract: validContract({
          status: 'spec-complete',
          scenarioStatus: 'proposed',
        }),
      }).errors
    ).toContain('DropdownV2: DropdownV2-EVT-001 is still proposed in a spec-complete contract');
    expect(
      run({
        contract: validContract({
          layer: 'Browser',
          owner: 'Engineering',
          scenarioStatus: 'qa-owned',
        }),
      }).errors
    ).toContain('DropdownV2-EVT-001: Browser scenarios must be owned by QA');
  });

  test('reports missing title tags and titles whose id has no scenario', () => {
    expect(
      run({
        testSource: `test('untagged behavior', () => {});\ntest('[DropdownV2-ZZZ-001] ghost', () => {});\n`,
      }).errors
    ).toEqual(
      expect.arrayContaining([
        'DropdownV2: DropdownV2-EVT-001 has no active test whose title starts with [DropdownV2-EVT-001]',
        'DropdownV2: test references unknown scenario DropdownV2-ZZZ-001',
      ])
    );
  });

  test('rejects implemented scenarios before the contract is approved', () => {
    expect(
      run({
        manifestStatus: 'grilling',
        contract: validContract({ status: 'grilling' }),
      }).errors
    ).toContain('DropdownV2: DropdownV2-EVT-001 is verified before approval (TDD before approval)');
  });

  test('prints coverage arithmetic per widget', () => {
    expect(run().ledger).toEqual([
      expect.objectContaining({
        componentType: 'DropdownV2',
        status: 'approved',
        rows: 5,
        scenarios: 1,
        verifiedScenarios: 1,
        engineeringScenarios: 1,
        dispositions: expect.objectContaining({
          covered: 4,
          none: 1,
          illegal: 0,
        }),
      }),
    ]);
  });
});
