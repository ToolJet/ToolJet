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
  const widget = { componentType: 'DropdownV2', status: overrides.manifestStatus ?? 'approved' };
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
    expect(run({ extraWidgets: [{ componentType: 'InventedWidget', status: 'not-started' }] }).errors).toContain(
      'Manifest widget InventedWidget is not registered in App Builder'
    );
  });

  test('blocks unapproved widget specs and new definitions', () => {
    const unapproved = { manifestStatus: 'not-started', contract: null };
    expect(run(unapproved, { changedFiles: [{ status: 'modified', path: `frontend/${SPEC}` }] }).errors).toContain(
      `Modified widget test ${SPEC} requires an approved DropdownV2 contract`
    );
    expect(run(unapproved, { changedFiles: [{ status: 'added', path: `frontend/${DEFINITION}` }] }).errors).toContain(
      'New widget DropdownV2 requires an approved testing contract'
    );
    expect(run({}, { changedFiles: [{ status: 'modified', path: `frontend/${SPEC}` }] }).errors).toEqual([]);
  });

  test('warns when a widget spec cannot be mapped', () => {
    const unmapped = 'src/AppBuilder/Widgets/NewTable/__tests__/integration/tableSelectedRow.spec.js';
    const result = run({}, { changedFiles: [{ status: 'modified', path: `frontend/${unmapped}` }] });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([`Cannot map modified widget test ${unmapped} to a registered component type`]);
  });

  test('rejects mismatched or empty approved frontmatter', () => {
    const bad = validContract()
      .replace('component_type: DropdownV2', 'component_type: Nope')
      .replace('baseline: lts-3.16', 'baseline: main')
      .replace('contract_status: approved', 'contract_status: shipped')
      .replace(/research_context7: .*/, 'research_context7:')
      .replace(/research_git_history: .*/, 'research_git_history:');
    expect(run({ contract: bad }).errors).toEqual(
      expect.arrayContaining([
        'DropdownV2: contract component_type does not match the manifest',
        'DropdownV2: contract baseline does not match the manifest',
        'DropdownV2: unknown contract_status shipped',
        'DropdownV2: approved contract requires research_context7',
        'DropdownV2: approved contract requires research_git_history',
      ])
    );
    expect(
      run({ contract: validContract().replace('development_type: existing-widget', 'development_type: plugin') }).errors
    ).toContain('DropdownV2: unknown development_type plugin');
    expect(
      run({ contract: validContract({ developmentType: 'new-widget' }).replace(/prd_source: .*/, 'prd_source:') })
        .errors
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
        contract: validContract({ status: 'spec-complete', scenarioStatus: 'proposed' }),
      }).errors
    ).toContain('DropdownV2: DropdownV2-EVT-001 is still proposed in a spec-complete contract');
    expect(
      run({ contract: validContract({ layer: 'Browser', owner: 'Engineering', scenarioStatus: 'qa-owned' }) }).errors
    ).toContain('DropdownV2-EVT-001: Browser scenarios must be owned by QA');
  });

  test('reports missing title tags and titles whose id has no scenario', () => {
    expect(
      run({
        testSource: `test('untagged behavior', () => {});\ntest('[DropdownV2-ZZZ-001] ghost', () => {});\n`,
      }).errors
    ).toEqual(
      expect.arrayContaining([
        'DropdownV2: DropdownV2-EVT-001 has no test whose title starts with [DropdownV2-EVT-001]',
        'DropdownV2: test references unknown scenario DropdownV2-ZZZ-001',
      ])
    );
  });

  test('rejects implemented scenarios before the contract is approved', () => {
    expect(run({ manifestStatus: 'grilling', contract: validContract({ status: 'grilling' }) }).errors).toContain(
      'DropdownV2: DropdownV2-EVT-001 is verified before approval (TDD before approval)'
    );
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
        dispositions: expect.objectContaining({ covered: 4, none: 1, illegal: 0 }),
      }),
    ]);
  });
});
