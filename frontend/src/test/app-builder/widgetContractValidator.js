const fs = require('fs');
const path = require('path');

const CONTRACT_STATUSES = new Set(['not-started', 'researching', 'grilling', 'spec-complete', 'approved', 'verified']);
const SPEC_GATED_STATUSES = new Set(['spec-complete', 'approved', 'verified']);
const APPROVED_CONTRACT_STATUSES = new Set(['approved', 'verified']);
const IMPLEMENTED_SCENARIO_STATUSES = new Set(['implemented', 'verified']);
const UNSETTLED_SCENARIO_STATUSES = new Set(['proposed', 'decision-required']);
const SCENARIO_STATUSES = new Set([
  'proposed',
  'decision-required',
  'approved',
  'implemented',
  'verified',
  'harness-blocked',
  'deferred',
  'qa-owned',
]);
const OWNERS = new Set(['Engineering', 'QA']);
const DEVELOPMENT_TYPES = new Set(['existing-widget', 'new-widget']);
const REQUIRED_RESEARCH_FIELDS = ['research_context7', 'research_git_history'];
const DISPOSITION_SECTIONS = [
  '## Research findings',
  '## Registered-surface disposition',
  '## Production-behavior inventory',
  '## Combination matrix',
];
const NONE_REASON_CODES = new Set([
  'computed-css',
  'dead-config',
  'param-handle',
  'seeding-artifact',
  'platform-owned',
]);
const DISPOSITION_PATTERNS = [
  { kind: 'covered', pattern: /^covered:([A-Za-z0-9-]+(?:\s*,\s*[A-Za-z0-9-]+)*)$/ },
  { kind: 'shared', pattern: /^shared:(\S+)#([A-Za-z0-9-]+)$/ },
  { kind: 'qa', pattern: /^qa:([A-Za-z0-9-]+(?:\s*,\s*[A-Za-z0-9-]+)*)$/ },
  { kind: 'decision', pattern: /^decision:(D-\d{2,})$/ },
  { kind: 'none', pattern: /^none:([a-z-]+(?::[A-Za-z0-9-]+)?)$/ },
];
const TITLE_TAG = String.raw`^\s*(?:test|it)(?:\.each\([^)]*\))?(?:\.failing|\.skip|\.only)?\(\s*[\`'"]\[`;

function read(frontendRoot, relative) {
  return fs.readFileSync(path.join(frontendRoot, relative), 'utf8');
}

function exists(frontendRoot, relative) {
  return fs.existsSync(path.join(frontendRoot, relative));
}

function parseRegisteredWidgets(frontendRoot, registryPath) {
  const registry = read(frontendRoot, registryPath);
  const arrayBody = registry.match(/export const widgets\s*=\s*\[([\s\S]*?)\];/)?.[1];
  if (!arrayBody) throw new Error(`Cannot find the exported widgets array in ${registryPath}`);

  const registeredConfigs = arrayBody
    .replace(/\/\/.*$/gm, '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const definitionDirectory = path.join(frontendRoot, 'src/AppBuilder/WidgetManager/widgets');
  const configDefinitions = new Map();

  for (const file of fs.readdirSync(definitionDirectory)) {
    if (!/\.(js|ts)$/.test(file)) continue;
    const source = fs.readFileSync(path.join(definitionDirectory, file), 'utf8');
    const match = source.match(/export const\s+(\w+Config)\s*=\s*\{[\s\S]*?\n\s*component:\s*['"]([^'"]+)['"]/);
    if (match) {
      configDefinitions.set(match[1], {
        componentType: match[2],
        definition: `src/AppBuilder/WidgetManager/widgets/${file}`,
      });
    }
  }

  return registeredConfigs.map((config) => ({ config, ...configDefinitions.get(config) }));
}

function stripScalar(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseDecisions(source) {
  const start = source.indexOf('## Decisions');
  if (start === -1) return [];
  const rest = source.slice(start + '## Decisions'.length);
  const end = rest.search(/\n## /);
  const body = rest.slice(0, end === -1 ? undefined : end);
  const headings = [...body.matchAll(/^### (D-\d{2,})\s*(.*)$/gm)];

  return headings.map((heading, index) => {
    const from = heading.index + heading[0].length;
    const to = headings[index + 1]?.index ?? body.length;
    const fields = {};
    for (const line of body.slice(from, to).split('\n')) {
      const match = line.match(/^- ([A-Za-z][A-Za-z -]+):\s*(.*)$/);
      if (match) fields[match[1].toLowerCase()] = match[2].trim();
    }
    return { id: heading[1], question: heading[2].trim(), fields };
  });
}

function parseContract(source) {
  const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---/);
  const metadata = {};
  for (const line of frontmatterMatch?.[1]?.split('\n') ?? []) {
    const match = line.match(/^([a-z0-9_]+):\s*(.*)$/);
    if (match) metadata[match[1]] = stripScalar(match[2]);
  }

  const headings = [...source.matchAll(/^### \[([A-Za-z0-9-]+)\]\s+(.+)$/gm)];
  const scenarios = headings.map((heading, index) => {
    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? source.length;
    const fields = {};
    for (const line of source.slice(start, end).split('\n')) {
      const match = line.match(/^- ([A-Za-z][A-Za-z -]+):\s*(.+)$/);
      if (match) fields[match[1].toLowerCase()] = match[2].trim();
    }
    return { id: heading[1], name: heading[2].trim(), fields };
  });

  return { metadata, scenarios, decisions: parseDecisions(source) };
}

function normalizeComponentName(value) {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function inferWidgetFromTestPath(relative, widgets) {
  const normalizedPath = relative.replace(/^frontend\//, '');
  const match = normalizedPath.match(/^src\/AppBuilder\/Widgets\/(.+)\.(?:spec|test)\.[jt]sx?$/);
  if (!match) return null;
  const pathParts = match[1].split('/');
  const names = [pathParts.at(-1)];
  if (pathParts[0] !== '__tests__') names.push(pathParts[0]);

  return widgets.find(({ componentType }) =>
    names.some((name) => normalizeComponentName(name) === normalizeComponentName(componentType))
  );
}

function parseDispositionRows(source, sections) {
  const rows = [];
  for (const section of sections) {
    const start = source.indexOf(section);
    if (start === -1) continue;
    const rest = source.slice(start + section.length);
    const end = rest.search(/\n## /);
    for (const line of rest.slice(0, end === -1 ? undefined : end).split('\n')) {
      if (!line.trim().startsWith('|')) continue;
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim());
      if (cells.length < 2) continue;
      if (cells.every((cell) => cell === '')) continue;
      const disposition = cells[cells.length - 1];
      const isSeparator = cells.every((cell) => /^:?-+:?$/.test(cell.replace(/\s/g, '')) || cell === '');
      if (isSeparator || disposition.toLowerCase() === 'disposition') continue;

      const heading = section.replace(/^#+ /, '');
      const subject = cells[0] || '(blank)';
      const matched = DISPOSITION_PATTERNS.map(({ kind, pattern }) => ({
        kind,
        match: disposition.match(pattern),
      })).find(({ match }) => match);
      rows.push({ heading, subject, disposition, kind: matched?.kind ?? null, match: matched?.match ?? null });
    }
  }
  return rows;
}

function titleHasId(source, id) {
  return new RegExp(`${TITLE_TAG}${id}\\]`, 'm').test(source);
}

function titledIds(source, prefix) {
  const ids = new Set();
  for (const match of source.matchAll(new RegExp(`${TITLE_TAG}([A-Za-z0-9-]+)\\]`, 'gm'))) {
    if (match[1].startsWith(prefix)) ids.add(match[1]);
  }
  return ids;
}

function walkSpecs(frontendRoot) {
  const specs = [];
  const visit = (relDir, ok) => {
    if (!exists(frontendRoot, relDir)) return;
    for (const entry of fs.readdirSync(path.join(frontendRoot, relDir), { withFileTypes: true })) {
      const rel = `${relDir}/${entry.name}`;
      if (entry.isDirectory()) visit(rel, ok);
      else if (ok(rel)) specs.push({ path: rel, source: read(frontendRoot, rel) });
    }
  };
  visit('src/AppBuilder/Widgets', (rel) => /\/__tests__\/.+\.spec\.(js|jsx)$/.test(rel));
  visit('src/AppBuilder/AppCanvas/__tests__', (rel) => /\.(js|jsx)$/.test(rel));
  visit('src/AppBuilder/_stores/slices/__tests__', (rel) => /\.(js|jsx)$/.test(rel));
  return specs;
}

function validateWidgetTestingContracts(frontendRoot, { changedFiles = [] } = {}) {
  const manifest = JSON.parse(fs.readFileSync(path.join(frontendRoot, 'widget-testing-manifest.json'), 'utf8'));
  const registered = parseRegisteredWidgets(frontendRoot, manifest.registry);
  const errors = [];
  const warnings = [];
  const ledger = [];
  const manifestByType = new Map(manifest.widgets.map((widget) => [widget.componentType, widget]));
  const registeredByType = new Map(registered.map((widget) => [widget.componentType, widget]));
  const seenManifestTypes = new Set();
  const specs = walkSpecs(frontendRoot);

  for (const widget of manifest.widgets) {
    if (seenManifestTypes.has(widget.componentType)) {
      errors.push(`Duplicate manifest widget ${widget.componentType}`);
    }
    seenManifestTypes.add(widget.componentType);
    if (!registeredByType.has(widget.componentType)) {
      errors.push(`Manifest widget ${widget.componentType} is not registered in App Builder`);
    }
    if (!CONTRACT_STATUSES.has(widget.status)) {
      errors.push(`${widget.componentType}: unknown contract status ${widget.status}`);
    }
    if (SPEC_GATED_STATUSES.has(widget.status) && !widget.contract) {
      errors.push(`${widget.componentType}: ${widget.status} status requires a contract path`);
    }
  }

  for (const { config, componentType } of registered) {
    if (!componentType) errors.push(`Registered config ${config} has no component type definition`);
    else if (!manifestByType.has(componentType)) {
      errors.push(`Registered widget ${componentType} is missing from widget-testing-manifest.json`);
    }
  }

  for (const changedFile of changedFiles) {
    if (changedFile.status === 'removed') continue;
    const normalizedPath = changedFile.path.replace(/^frontend\//, '');
    if (changedFile.status === 'added') {
      const added = registered.find((widget) => widget.definition === normalizedPath);
      const status = added && manifestByType.get(added.componentType)?.status;
      if (added && !APPROVED_CONTRACT_STATUSES.has(status)) {
        errors.push(`New widget ${added.componentType} requires an approved testing contract`);
      }
    }
    if (!normalizedPath.startsWith('src/AppBuilder/Widgets/') || !/\.(spec|test)\.[jt]sx?$/.test(normalizedPath)) {
      continue;
    }
    const widget = inferWidgetFromTestPath(normalizedPath, manifest.widgets);
    if (!widget) {
      warnings.push(`Cannot map modified widget test ${normalizedPath} to a registered component type`);
    } else if (!APPROVED_CONTRACT_STATUSES.has(widget.status)) {
      errors.push(`Modified widget test ${normalizedPath} requires an approved ${widget.componentType} contract`);
    }
  }

  for (const widget of manifest.widgets) {
    if (!widget.contract) continue;
    const contractSource = read(frontendRoot, widget.contract);
    const contract = parseContract(contractSource);
    const scenarioIds = new Set();
    const scenariosById = new Map(contract.scenarios.map((scenario) => [scenario.id, scenario]));
    const decisionsById = new Map(contract.decisions.map((decision) => [decision.id, decision]));
    const specGated =
      SPEC_GATED_STATUSES.has(widget.status) || SPEC_GATED_STATUSES.has(contract.metadata.contract_status);
    const approved =
      APPROVED_CONTRACT_STATUSES.has(widget.status) &&
      APPROVED_CONTRACT_STATUSES.has(contract.metadata.contract_status);
    const taggedSpecs = specs.filter(({ source }) => source.includes(`[${widget.componentType}-`));

    if (contract.metadata.component_type !== widget.componentType) {
      errors.push(`${widget.componentType}: contract component_type does not match the manifest`);
    }
    if (contract.metadata.baseline !== manifest.baseline) {
      errors.push(`${widget.componentType}: contract baseline does not match the manifest`);
    }
    if (!CONTRACT_STATUSES.has(contract.metadata.contract_status)) {
      errors.push(`${widget.componentType}: unknown contract_status ${contract.metadata.contract_status}`);
    }
    const needsResearch =
      APPROVED_CONTRACT_STATUSES.has(widget.status) ||
      APPROVED_CONTRACT_STATUSES.has(contract.metadata.contract_status);
    if (contract.metadata.development_type && !DEVELOPMENT_TYPES.has(contract.metadata.development_type)) {
      errors.push(`${widget.componentType}: unknown development_type ${contract.metadata.development_type}`);
    } else if (needsResearch) {
      if (!DEVELOPMENT_TYPES.has(contract.metadata.development_type)) {
        errors.push(`${widget.componentType}: unknown development_type ${contract.metadata.development_type}`);
      } else if (contract.metadata.development_type === 'new-widget') {
        if (!contract.metadata.prd_source) {
          errors.push(`${widget.componentType}: new-widget contract requires prd_source`);
        }
      } else {
        for (const field of REQUIRED_RESEARCH_FIELDS) {
          if (!contract.metadata[field]) {
            errors.push(`${widget.componentType}: ${widget.status} contract requires ${field}`);
          }
        }
      }
    }

    for (const scenario of contract.scenarios) {
      if (scenarioIds.has(scenario.id)) errors.push(`${widget.componentType}: duplicate scenario ${scenario.id}`);
      scenarioIds.add(scenario.id);
      if (!scenario.fields.status) errors.push(`${scenario.id} is missing Status`);
      else if (!SCENARIO_STATUSES.has(scenario.fields.status)) {
        errors.push(`${scenario.id} has unknown Status ${scenario.fields.status}`);
      }
      if (!scenario.fields.layer) errors.push(`${scenario.id} is missing Layer`);
      if (!scenario.fields.owner) errors.push(`${scenario.id} is missing Owner`);
      else if (!OWNERS.has(scenario.fields.owner)) {
        errors.push(`${scenario.id} has unknown Owner ${scenario.fields.owner}`);
      }
      if (scenario.fields.layer === 'Browser' && scenario.fields.owner !== 'QA') {
        errors.push(`${scenario.id}: Browser scenarios must be owned by QA`);
      }
      if (specGated && UNSETTLED_SCENARIO_STATUSES.has(scenario.fields.status)) {
        errors.push(
          `${widget.componentType}: ${scenario.id} is still ${scenario.fields.status} in a ${widget.status} contract`
        );
      }
      if (
        IMPLEMENTED_SCENARIO_STATUSES.has(scenario.fields.status) &&
        (!APPROVED_CONTRACT_STATUSES.has(widget.status) ||
          !APPROVED_CONTRACT_STATUSES.has(contract.metadata.contract_status))
      ) {
        errors.push(
          `${widget.componentType}: ${scenario.id} is ${scenario.fields.status} before approval (TDD before approval)`
        );
      }
    }

    const rows = parseDispositionRows(contractSource, DISPOSITION_SECTIONS);
    const counts = { covered: 0, shared: 0, qa: 0, decision: 0, none: 0, illegal: 0 };
    for (const row of rows) {
      if (!row.kind) {
        counts.illegal += 1;
        if (specGated) {
          errors.push(
            `${widget.componentType}: "${row.heading}" row ${row.subject} has no legal disposition token ` +
              `(got "${row.disposition}"; expected covered:/shared:/qa:/decision:/none:)`
          );
        }
        continue;
      }
      counts[row.kind] += 1;
      if (!specGated) continue;

      if (row.kind === 'covered') {
        for (const id of row.match[1].split(',').map((value) => value.trim())) {
          if (!scenariosById.has(id)) {
            errors.push(`${widget.componentType}: "${row.heading}" row ${row.subject} cites unknown scenario ${id}`);
          }
        }
      }
      if (row.kind === 'qa') {
        for (const id of row.match[1].split(',').map((value) => value.trim())) {
          const scenario = scenariosById.get(id);
          if (!scenario) {
            errors.push(`${widget.componentType}: "${row.heading}" row ${row.subject} cites unknown scenario ${id}`);
          } else if (scenario.fields.layer !== 'Browser' || scenario.fields.owner !== 'QA') {
            errors.push(`${widget.componentType}: ${id} is cited as qa: but is not Layer Browser / Owner QA`);
          }
        }
      }
      if (row.kind === 'shared') {
        const [, sharedPath, sharedId] = row.match;
        if (!exists(frontendRoot, sharedPath)) {
          errors.push(
            `${widget.componentType}: "${row.heading}" row ${row.subject} points at missing shared test ${sharedPath}`
          );
        } else if (!titleHasId(read(frontendRoot, sharedPath), sharedId)) {
          errors.push(
            `${widget.componentType}: shared test ${sharedPath} does not reference ${sharedId} for row ${row.subject}`
          );
        }
      }
      if (row.kind === 'decision') {
        const decision = decisionsById.get(row.match[1]);
        if (!decision) {
          errors.push(`${widget.componentType}: "${row.heading}" row ${row.subject} cites unknown ${row.match[1]}`);
        } else if (!decision.fields.answer) {
          errors.push(
            `${widget.componentType}: "${row.heading}" row ${row.subject} is blocked on unanswered ${row.match[1]}`
          );
        }
      }
      if (row.kind === 'none') {
        const [reason, target] = row.match[1].split(':');
        if (reason === 'duplicate-of') {
          if (!target || !scenariosById.has(target)) {
            errors.push(
              `${widget.componentType}: "${row.heading}" row ${row.subject} claims duplicate-of unknown scenario ${
                target ?? '(none)'
              }`
            );
          }
        } else if (!NONE_REASON_CODES.has(reason)) {
          errors.push(
            `${widget.componentType}: "${row.heading}" row ${row.subject} uses unknown none: reason "${reason}"`
          );
        }
      }
    }

    if (approved) {
      const foundIds = new Set();
      for (const { source } of taggedSpecs) {
        for (const id of titledIds(source, `${widget.componentType}-`)) foundIds.add(id);
      }
      for (const scenario of contract.scenarios) {
        if (!IMPLEMENTED_SCENARIO_STATUSES.has(scenario.fields.status)) continue;
        if (scenario.fields.owner === 'QA' || scenario.fields.layer === 'Browser') continue;
        if (![...taggedSpecs].some(({ source }) => titleHasId(source, scenario.id))) {
          errors.push(`${widget.componentType}: ${scenario.id} has no test whose title starts with [${scenario.id}]`);
        }
      }
      for (const id of foundIds) {
        if (!scenarioIds.has(id)) {
          errors.push(`${widget.componentType}: test references unknown scenario ${id}`);
        }
      }
    }

    ledger.push({
      componentType: widget.componentType,
      status: widget.status,
      rows: rows.length,
      scenarios: contract.scenarios.length,
      engineeringScenarios: contract.scenarios.filter(({ fields }) => fields.owner !== 'QA').length,
      verifiedScenarios: contract.scenarios.filter(({ fields }) => fields.status === 'verified').length,
      openDecisions: contract.decisions.filter(({ fields }) => !fields.answer).length,
      dispositions: counts,
    });
  }

  return {
    errors,
    warnings,
    ledger,
    registeredWidgetTypes: registered.map(({ componentType }) => componentType),
    trackedWidgets: manifest.widgets.length,
    approvedWidgets: manifest.widgets.filter(({ status }) => APPROVED_CONTRACT_STATUSES.has(status)).length,
    pendingWidgets: manifest.widgets.filter(({ status }) => !APPROVED_CONTRACT_STATUSES.has(status)).length,
    changedFiles,
  };
}

module.exports = {
  inferWidgetFromTestPath,
  parseContract,
  parseDispositionRows,
  parseRegisteredWidgets,
  validateWidgetTestingContracts,
};
