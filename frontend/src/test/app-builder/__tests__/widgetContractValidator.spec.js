const fs = require('fs');
const os = require('os');
const path = require('path');
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
product_approval: reviewer 2026-09-07, decision D-01
test_design_approval: reviewer 2026-09-07, decision D-01
research_context7: https://docs.tooljet.com/docs/widgets/dropdown/
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
| options | property | covered:DropdownV2-EVT-001 |
| textColor | style | none:computed-css |
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
- Layer: ${layer}
- Owner: ${owner}
- Status: ${scenarioStatus}
- Guarantee: The handler reads the current selection.
- Sources: Approved fixture decision D-01.
- Public seam: Select a leaf and read the handler result.
- Setup: A different leaf was previously selected.
- Action: Select the next leaf.
- Fault: Capture the initial selection in the handler.
- Evidence: Fixture evidence: stale capture failed the current-selection assertion; restored test passed.
`;
}

function createFixture(overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'widget-contract-validator-'));
  temporaryRoots.push(root);
  write(root, 'src/AppBuilder/WidgetManager/configs/widgetConfig.js', `export const widgets = [dropdownV2Config];\n`);
  write(root, DEFINITION, `export const dropdownV2Config = {\n  component: 'DropdownV2',\n};\n`);
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

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('widget testing contract validator', () => {
  test('accepts a registered approved contract with a titled test', () => {
    const result = run();
    expect(result.errors).toEqual([]);
    expect(result.registeredWidgetTypes).toEqual(['DropdownV2']);
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

  test('requires a scenario contract for changed widgets and complete scope for new widgets', () => {
    const unapproved = { manifestStatus: 'not-started', contract: null };
    expect(
      run(unapproved, {
        changedFiles: [{ status: 'modified', path: `frontend/${SPEC}` }],
      }).errors
    ).toContain(`Modified widget test ${SPEC} requires a DropdownV2 scenario contract`);
    expect(
      run(unapproved, {
        changedFiles: [{ status: 'added', path: `frontend/${DEFINITION}` }],
      }).errors
    ).toContain('New widget DropdownV2 requires a spec-complete testing contract');
    expect(run({}, { changedFiles: [{ status: 'added', path: `frontend/${SPEC}` }] }).errors).toEqual([]);
  });

  test('fails visibly when a changed widget spec cannot be mapped', () => {
    const unmapped = 'src/AppBuilder/Widgets/NewTable/__tests__/integration/tableSelectedRow.spec.js';
    const result = run({}, { changedFiles: [{ status: 'modified', path: `frontend/${unmapped}` }] });
    expect(result.errors).toEqual([`Cannot map modified widget test ${unmapped} to a registered component type`]);
  });

  test('accepts either research_docs or the retired research_context7', () => {
    // The fixture above still uses the retired name, so that path is covered by
    // every other case here. This pins the canonical one, and pins that supplying
    // NEITHER is what fails — see REQUIRED_RESEARCH_FIELDS.
    const renamed = validContract().replace('research_context7:', 'research_docs:');
    expect(run({ contract: renamed }).errors).toEqual([]);
    expect(run({ contract: validContract() }).errors).toEqual([]);
  });

  test('rejects mismatched or empty approved frontmatter', () => {
    const bad = validContract()
      .replace('component_type: DropdownV2', 'component_type: Nope')
      .replace('baseline: lts-3.16', 'baseline: main')
      .replace('contract_status: approved', 'contract_status: shipped')
      .replace(/research_context7: .*/, 'research_context7:')
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
        expect.stringContaining('does not reference Hint-001'),
        expect.stringContaining('blocked on unanswered D-01'),
        'DropdownV2: DropdownV2-EVT-001 is cited as qa: but is not Layer Browser / Owner QA',
      ])
    );
  });

  test('requires Status, Layer, and Owner, and rejects unsettled spec-complete scenarios', () => {
    const missing = validContract().replace('- Layer: RTL integration\n- Owner: Engineering\n- Status: verified\n', '');
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
        'DropdownV2: DropdownV2-EVT-001 has no runnable test whose title starts with [DropdownV2-EVT-001]',
        'DropdownV2: test references unknown scenario DropdownV2-ZZZ-001',
      ])
    );
  });

  test('allows implemented scenarios while whole-widget research is ongoing', () => {
    expect(
      run({
        manifestStatus: 'grilling',
        contract: validContract({ status: 'grilling' }),
      }).errors
    ).toEqual([]);
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

describe('verification gates', () => {
  test.each(['product_approval', 'test_design_approval'])('does not require a separate %s ceremony', (field) => {
    const contract = validContract().replace(new RegExp(`${field}: .*`), `${field}:`);
    expect(run({ contract }).errors).toEqual([]);
  });

  test('does not let a verified contract hide unimplemented work', () => {
    const result = run({
      manifestStatus: 'verified',
      contract: validContract({
        status: 'verified',
        scenarioStatus: 'approved',
      }),
      testSource: '',
    });
    expect(result.errors).toContain('DropdownV2-EVT-001: verified contract requires verified engineering scenarios');
  });

  test.each(['Evidence', 'Setup', 'Action', 'Fault'])('requires %s before a scenario is verified', (field) => {
    const contract = validContract().replace(new RegExp(`- ${field}: .*`), '');
    expect(run({ contract }).errors).toContain(`DropdownV2-EVT-001: verified scenario requires ${field}`);
  });

  test('keeps implemented work distinct from verified work', () => {
    const contract = validContract({ scenarioStatus: 'implemented' }).replace(/- Evidence: .*/, '');
    expect(run({ contract }).errors).toEqual([]);
  });

  test('requires human deferral without claiming whole-widget verification', () => {
    const contract = validContract({
      status: 'approved',
      scenarioStatus: 'deferred',
    });
    const testSource = "test.skip('[DropdownV2-EVT-001] deferred behavior', () => {});";
    expect(run({ contract, testSource }).errors).toContain(
      'DropdownV2-EVT-001: deferred scenario requires Deferred-by'
    );
    expect(
      run({
        contract: contract + '\n- Deferred-by: reviewer 2026-09-07, decision D-02\n',
        testSource,
      }).errors
    ).toEqual([]);
  });

  test.each([
    "test.skip('[DropdownV2-EVT-001] skipped', () => {});",
    "describe.skip('group', () => { test('[DropdownV2-EVT-001] skipped', () => {}); });",
    "xit('[DropdownV2-EVT-001] skipped', () => {});",
    "test.skip.each([0, false])('[DropdownV2-EVT-001] skipped %s', () => {});",
    "test.todo('[DropdownV2-EVT-001] pending');",
    "/* test('[DropdownV2-EVT-001] comment', () => {}); */",
  ])('does not count disabled or commented tests as implementation: %s', (testSource) => {
    expect(run({ testSource }).errors).toContain(
      'DropdownV2: DropdownV2-EVT-001 has no runnable test whose title starts with [DropdownV2-EVT-001]'
    );
  });

  test.each([
    "test.only('[DropdownV2-EVT-001] focused', () => {});",
    "describe.only('group', () => { test('[DropdownV2-EVT-001] focused', () => {}); });",
  ])('rejects focused runs: %s', (testSource) => {
    expect(run({ testSource }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining('focused test or suite')])
    );
  });

  test('supports parameterized TypeScript tests without treating comments as declarations', () => {
    const result = run({
      testSource:
        "// test('not a declaration', () => {});\ntest.each([false, 0])('[DropdownV2-EVT-001] value %s', (value: unknown) => { expect(value).toBeDefined(); });",
    });
    expect(result.errors).toEqual([]);
  });

  test('requires an ID on every test before claiming whole-widget verification', () => {
    const result = run({
      manifestStatus: 'verified',
      contract: validContract({ status: 'verified' }),
      testSource: "test('[DropdownV2-EVT-001] approved', () => {});\ntest('unapproved behavior', () => {});",
    });
    expect(result.errors).toContain(`${SPEC}: verified widget requires a DropdownV2 scenario ID (unapproved behavior)`);
  });

  test('requires all inventory sections even when existing pointers resolve', () => {
    const contract = validContract().replace(/## Research findings[\s\S]*?(?=## Decisions)/, '');
    expect(run({ contract }).errors).toEqual(
      expect.arrayContaining([
        'DropdownV2: missing or empty Research findings',
        'DropdownV2: missing or empty Registered-surface disposition',
        'DropdownV2: missing or empty Production-behavior inventory',
        'DropdownV2: missing or empty Combination matrix',
      ])
    );
  });

  test('blocks an unanswered decision even when no inventory row references it', () => {
    const contract = validContract({
      decisions: '### D-02 Who owns this?\n- Recommendation: shared layer',
    });
    expect(run({ contract }).errors).toContain('DropdownV2: unanswered decision D-02 blocks spec completion');
  });

  test('requires manifest and contract status to agree', () => {
    expect(run({ manifestStatus: 'verified' }).errors).toContain(
      'DropdownV2: contract_status must match manifest status verified'
    );
  });
});

test('does not borrow verification evidence from a later document section', () => {
  const contract =
    validContract().replace(/- Evidence: .*/, '') + '\n## Run notes\n- Evidence: another scenario passed\n';
  expect(run({ contract }).errors).toContain('DropdownV2-EVT-001: verified scenario requires Evidence');
});

test('a passing case does not hide a skipped case for the same scenario', () => {
  const testSource =
    "test('[DropdownV2-EVT-001] first case', () => {}); test.skip('[DropdownV2-EVT-001] second case', () => {});";
  expect(run({ testSource }).errors).toContain(
    'DropdownV2: DropdownV2-EVT-001 includes a disabled test; record a separate human deferral'
  );
});

function focusedContract(scenarioStatus = 'verified') {
  return validContract({ status: 'not-started', scenarioStatus })
    .replace(/^(product_approval|test_design_approval|research_context7|research_git_history):.*\n/gm, '')
    .replace(
      /## Research findings[\s\S]*?(?=## Decisions)/,
      '## Scope\nOnly onSelect timing; other widget behavior is outside this task.\n\n'
    );
}

test('verifies a focused scenario without starting or approving whole-widget backfill', () => {
  // Break this catches: coupling scenario verification to whole-widget approval or inventories.
  const result = run({
    manifestStatus: 'not-started',
    contract: focusedContract(),
  });
  expect(result.errors).toEqual([]);
  expect(result.ledger).toEqual([
    expect.objectContaining({
      status: 'not-started',
      verifiedScenarios: 1,
      rows: 0,
    }),
  ]);
});

describe('scenario readiness independent of whole-widget progress', () => {
  test.each(['ready', 'implemented', 'verified'])('accepts %s without approval fields', (scenarioStatus) => {
    // Break this catches: imposing whole-widget paperwork on focused work.
    expect(
      run({
        manifestStatus: 'not-started',
        contract: focusedContract(scenarioStatus),
      }).errors
    ).toEqual([]);
  });

  test('allows implementation at spec-complete without human approval records', () => {
    const contract = validContract({
      status: 'spec-complete',
      scenarioStatus: 'implemented',
    }).replace(/^(product_approval|test_design_approval):.*\n/gm, '');
    expect(run({ manifestStatus: 'spec-complete', contract }).errors).toEqual([]);
  });

  test('requires design fields before a focused scenario is ready', () => {
    const contract = focusedContract('ready').replace(/- Setup: .*/, '');
    expect(run({ manifestStatus: 'not-started', contract }).errors).toContain(
      'DropdownV2-EVT-001: ready scenario requires Setup'
    );
  });

  test.each(['implemented', 'verified'])('checks execution and evidence for focused %s scenarios', (status) => {
    // Break this catches: skipping structural checks for contracts queued for backfill.
    const result = run({
      manifestStatus: 'not-started',
      contract: focusedContract(status),
      testSource: '',
    });
    expect(result.errors).toContain(
      'DropdownV2: DropdownV2-EVT-001 has no runnable test whose title starts with [DropdownV2-EVT-001]'
    );
  });

  test('blocks only scenarios affected by an unanswered decision', () => {
    const contract = focusedContract().replace('- None.', '### D-02 Other behavior?\n- Unblocks: DropdownV2-OTHER-001');
    expect(run({ manifestStatus: 'not-started', contract }).errors).toEqual([]);
    expect(
      run({
        manifestStatus: 'not-started',
        contract: contract + '\n- Decisions: D-02\n',
      }).errors
    ).toContain('DropdownV2-EVT-001: blocked on unanswered D-02');
    expect(
      run({
        manifestStatus: 'not-started',
        contract: contract.replace('DropdownV2-OTHER-001', 'DropdownV2-EVT-001'),
      }).errors
    ).toContain('DropdownV2-EVT-001: blocked on unanswered D-02');
    expect(
      run({
        manifestStatus: 'not-started',
        contract: contract + '\n- Decisions: D-99\n',
      }).errors
    ).toContain('DropdownV2-EVT-001: unknown decision D-99');
  });

  test.each(['deferred', 'harness-blocked'])('cannot call whole-widget coverage verified with %s work', (status) => {
    const contract =
      validContract({ status: 'verified', scenarioStatus: status }) + '\n- Deferred-by: reviewer 2026-09-07\n';
    expect(run({ manifestStatus: 'verified', contract }).errors).toContain(
      'DropdownV2-EVT-001: verified contract requires verified engineering scenarios'
    );
  });
});

describe('change-scoped widget test enforcement', () => {
  const legacy = "test('legacy behavior', () => {});";
  const tagged = "test('[DropdownV2-EVT-001] selection', () => {});";
  const focused = {
    manifestStatus: 'not-started',
    contract: focusedContract(),
  };
  const change = (patch, additions = 1, deletions = 0) => ({
    changedFiles: [{ path: SPEC, status: 'modified', patch, additions, deletions }],
  });

  test('adds a focused regression beside an untouched legacy test', () => {
    // Break this catches: treating every existing test as new work because its file changed.
    expect(
      run({ ...focused, testSource: `${legacy}\n${tagged}\n` }, change(`@@ -1 +1,2 @@\n ${legacy}\n+${tagged}`)).errors
    ).toEqual([]);
  });

  test('requires a scenario for an added untagged test but not untouched neighbors', () => {
    const result = run(
      { ...focused, testSource: `${tagged}\n${legacy}\n` },
      change(`@@ -1 +1,2 @@\n ${tagged}\n+${legacy}`)
    );
    expect(result.errors).toEqual([`${SPEC}: changed test requires a ready DropdownV2 scenario ID (legacy behavior)`]);
  });

  test('a deletion inside a legacy test counts as changing that test', () => {
    const after = "test('legacy behavior', () => {\n});";
    expect(
      run(
        { ...focused, testSource: `${after}\n${tagged}\n` },
        change("@@ -1,3 +1,2 @@\n test('legacy behavior', () => {\n-  expect(1).toBe(1);\n });", 0, 1)
      ).errors
    ).toContain(`${SPEC}: changed test requires a ready DropdownV2 scenario ID (legacy behavior)`);
  });

  test('a shared setup change reviews its suite without requiring sibling-suite conversion', () => {
    const source = `describe('changed', () => {\n  beforeEach(() => seed('new'));\n  ${tagged}\n});\ndescribe('untouched', () => {\n  ${legacy}\n});\n`;
    const patch = "@@ -2 +2 @@\n-  beforeEach(() => seed('old'));\n+  beforeEach(() => seed('new'));";
    const result = run({ ...focused, testSource: source }, change(patch, 1, 1));
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining('shared setup changed')]));
    const withLegacyInAffectedSuite = source.replace(tagged, `${tagged}\n  ${legacy}`);
    expect(run({ ...focused, testSource: withLegacyInAffectedSuite }, change(patch, 1, 1)).errors).toContain(
      `${SPEC}: changed test requires a ready DropdownV2 scenario ID (legacy behavior)`
    );
  });

  test('a file-level helper change reviews all tests in that file', () => {
    const source = `const seed = 'new';\n${tagged}\n${legacy}\n`;
    expect(
      run({ ...focused, testSource: source }, change("@@ -1 +1 @@\n-const seed = 'old';\n+const seed = 'new';", 1, 1))
        .errors
    ).toContain(`${SPEC}: changed test requires a ready DropdownV2 scenario ID (legacy behavior)`);
  });

  test.each([
    { patch: undefined, additions: 1, deletions: 0 },
    {
      patch: `@@ -1 +1,2 @@\n ${legacy}\n+${tagged}`,
      additions: 2,
      deletions: 0,
    },
    {
      patch: `@@ -1 +1,3 @@\n ${legacy}\n+${tagged}`,
      additions: 1,
      deletions: 0,
    },
    {
      patch: `@@ -1 +1,2 @@\n wrong context\n+${tagged}`,
      additions: 1,
      deletions: 0,
    },
    { patch: `@@ -1 +1,2 @@\n ${legacy}\n+${tagged}` },
  ])('fails closed for missing, truncated or mismatched diff information: %j', (diff) => {
    const result = run(
      { ...focused, testSource: `${legacy}\n${tagged}\n` },
      {
        changedFiles: [{ path: SPEC, status: 'modified', ...diff }],
      }
    );
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('reliable base comparison')]));
  });

  test('an added test file requires no base and still checks readiness', () => {
    expect(run(focused, { changedFiles: [{ path: SPEC, status: 'added' }] }).errors).toEqual([]);
    expect(
      run({ ...focused, contract: focusedContract('proposed') }, { changedFiles: [{ path: SPEC, status: 'added' }] })
        .errors
    ).toContain(`${SPEC}: changed test DropdownV2-EVT-001 requires a ready scenario (got proposed)`);
  });

  test('a new widget needs a complete intended surface, but no approval ceremony', () => {
    const contract = validContract({
      status: 'spec-complete',
      developmentType: 'new-widget',
    }).replace(/^(product_approval|test_design_approval):.*\n/gm, '');
    expect(
      run(
        { manifestStatus: 'spec-complete', contract },
        {
          changedFiles: [{ path: DEFINITION, status: 'added' }],
        }
      ).errors
    ).toEqual([]);
  });
});

test('a missing canonical contract is a failure, never a skipped validation', () => {
  const root = createFixture();
  fs.unlinkSync(path.join(root, 'src/test/app-builder/widgets/DropdownV2/TESTING.md'));
  expect(() => validateWidgetTestingContracts(root)).toThrow(/ENOENT/);
});

describe('validator change input', () => {
  const { changedFilesFromInput } = require('../../../../scripts/validate-widget-testing-contracts');
  test('accepts complete PR JSON records and preserves patches and counts', () => {
    const record = {
      status: 'modified',
      path: `frontend/${SPEC}`,
      patch: '@@ -1 +1 @@\n-old\n+new',
      additions: 1,
      deletions: 1,
    };
    expect(changedFilesFromInput(JSON.stringify(record) + '\n')).toEqual([record]);
  });

  test('keeps legacy TSV input but cannot treat it as complete diff evidence', () => {
    const changedFiles = changedFilesFromInput(`modified\tfrontend/${SPEC}\n`);
    expect(changedFiles).toEqual([{ status: 'modified', path: `frontend/${SPEC}` }]);
    expect(run({}, { changedFiles }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining('reliable base comparison')])
    );
  });
});

test('base comparison includes deleted assertions even when the working file only shrinks', () => {
  const { execFileSync } = require('child_process');
  const { changedFilesFromBase } = require('../../../../scripts/validate-widget-testing-contracts');
  const root = createFixture({
    manifestStatus: 'not-started',
    contract: focusedContract(),
    testSource:
      "test('legacy', () => {\n  expect(1).toBe(1);\n});\ntest('[DropdownV2-EVT-001] selection', () => {});\n",
  });
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
  git('init', '-q');
  git('add', '.');
  git(
    '-c',
    'user.name=Workflow Fixture',
    '-c',
    'user.email=fixture@example.invalid',
    '-c',
    'commit.gpgsign=false',
    'commit',
    '-qm',
    'fixture baseline'
  );
  write(root, SPEC, "test('legacy', () => {\n});\ntest('[DropdownV2-EVT-001] selection', () => {});\n");
  const changedFiles = changedFilesFromBase(root, 'HEAD');
  expect(changedFiles).toEqual([
    expect.objectContaining({
      status: 'modified',
      path: SPEC,
      additions: 0,
      deletions: 1,
    }),
  ]);
  expect(validateWidgetTestingContracts(root, { changedFiles }).errors).toContain(
    `${SPEC}: changed test requires a ready DropdownV2 scenario ID (legacy)`
  );
});

test('comment-only edits do not require legacy test conversion', () => {
  // Break this catches: treating prose edits as shared executable setup changes.
  const testSource =
    "// new explanation\ntest('legacy', () => {});\ntest('[DropdownV2-EVT-001] selection', () => {});\n";
  const result = run(
    { manifestStatus: 'not-started', contract: focusedContract(), testSource },
    {
      changedFiles: [
        {
          path: SPEC,
          status: 'modified',
          additions: 1,
          deletions: 1,
          patch: '@@ -1 +1 @@\n-// old explanation\n+// new explanation',
        },
      ],
    }
  );
  expect(result.errors).toEqual([]);
  expect(result.warnings).toEqual([]);
});

test('changing a historical implemented scenario requires its missing design to be completed', () => {
  const contract = focusedContract('implemented').replace(/- Setup: .*/, '');
  const fixture = { manifestStatus: 'not-started', contract };
  expect(run(fixture).errors).toEqual([]);
  expect(run(fixture, { changedFiles: [{ path: SPEC, status: 'added' }] }).errors).toContain(
    'DropdownV2-EVT-001: implemented scenario requires Setup'
  );
});

test('a newly skipped ready scenario needs an explicit human deferral', () => {
  const testSource = "test.skip('[DropdownV2-EVT-001] pending', () => {});";
  expect(
    run(
      {
        manifestStatus: 'not-started',
        contract: focusedContract('ready'),
        testSource,
      },
      {
        changedFiles: [{ path: SPEC, status: 'added' }],
      }
    ).errors
  ).toContain(`${SPEC}: disabled test DropdownV2-EVT-001 requires a human deferred scenario`);
});

test('new-widget registration requires requirements for the intended surface', () => {
  expect(run({}, { changedFiles: [{ path: DEFINITION, status: 'added' }] }).errors).toContain(
    'New widget DropdownV2 requires development_type: new-widget and a requirements source'
  );
});
