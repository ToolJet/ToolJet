const fs = require('fs');
const path = require('path');
const { parseSync, traverse } = require('@babel/core');
const { readTestDiff, affectedTests } = require('./widgetTestChanges');

const CONTRACT_STATUSES = new Set(['not-started', 'researching', 'grilling', 'spec-complete', 'approved', 'verified']);
const SPEC_GATED_STATUSES = new Set(['spec-complete', 'approved', 'verified']);
const APPROVED_CONTRACT_STATUSES = new Set(['approved', 'verified']);
const READY_SCENARIO_STATUSES = new Set(['ready', 'approved', 'implemented', 'verified']);
const IMPLEMENTED_SCENARIO_STATUSES = new Set(['implemented', 'verified']);
const UNSETTLED_SCENARIO_STATUSES = new Set(['proposed', 'decision-required']);
const SCENARIO_STATUSES = new Set([
  'proposed',
  'decision-required',
  'ready',
  'approved',
  'implemented',
  'verified',
  'harness-blocked',
  'deferred',
  'qa-owned',
]);
const OWNERS = new Set(['Engineering', 'QA']);
const DEVELOPMENT_TYPES = new Set(['existing-widget', 'new-widget']);
// Each entry is a field name, or a list of accepted names whose FIRST is canonical.
// `research_context7` is the retired name for `research_docs`:
//  - widget docs are read from the `documentation` branch now, not Context7
//  - Both are accepted so contracts written under either gate keep validating.
const REQUIRED_RESEARCH_FIELDS = [['research_docs', 'research_context7'], 'research_git_history'];
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
  {
    kind: 'covered',
    pattern: /^covered:([A-Za-z0-9-]+(?:\s*,\s*[A-Za-z0-9-]+)*)$/,
  },
  { kind: 'shared', pattern: /^shared:(\S+)#([A-Za-z0-9-]+)$/ },
  { kind: 'qa', pattern: /^qa:([A-Za-z0-9-]+(?:\s*,\s*[A-Za-z0-9-]+)*)$/ },
  { kind: 'decision', pattern: /^decision:(D-\d{2,})$/ },
  { kind: 'none', pattern: /^none:([a-z-]+(?::[A-Za-z0-9-]+)?)$/ },
];

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

  return registeredConfigs.map((config) => ({
    config,
    ...configDefinitions.get(config),
  }));
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
    const nextSection = source.slice(start).search(/\n## /);
    const end = Math.min(
      headings[index + 1]?.index ?? source.length,
      nextSection === -1 ? source.length : start + nextSection
    );
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
      rows.push({
        heading,
        subject,
        disposition,
        kind: matched?.kind ?? null,
        match: matched?.match ?? null,
      });
    }
  }
  return rows;
}

// Parse declarations instead of source text: comments are not tests, and a
// skipped parent suite disables its children. This is static evidence only;
// the verification record must still demonstrate actual execution.
function parseTestSource(source) {
  const ast = parseSync(source, {
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ['jsx', 'typescript'], tokens: true },
  });
  function callInfo(node) {
    const modifiers = [];
    while (node) {
      if (node.type === 'CallExpression') node = node.callee;
      else if (node.type === 'TaggedTemplateExpression') node = node.tag;
      else if (node.type === 'MemberExpression') {
        modifiers.push(node.computed ? node.property.value : node.property.name);
        node = node.object;
      } else break;
    }
    return { name: node?.name, modifiers };
  }
  const tests = [];
  traverse(ast, {
    CallExpression(call) {
      const { name, modifiers } = callInfo(call.node.callee);
      if (!['test', 'it', 'xtest', 'xit', 'fit'].includes(name)) return;
      // Skip the inner each(data) call; the outer call declares the test.
      if (call.parentPath.isCallExpression() && call.parent.callee === call.node) return;
      const suites = [];
      for (let parent = call.parentPath; parent; parent = parent.parentPath) {
        if (!parent.isCallExpression()) continue;
        const suite = callInfo(parent.node.callee);
        if (['describe', 'xdescribe', 'fdescribe'].includes(suite.name)) {
          const label = parent.node.arguments[0]?.value ?? '<dynamic suite>';
          suites.unshift({
            label,
            start: parent.node.loc.start.line,
            end: parent.node.loc.end.line,
          });
          modifiers.push(...suite.modifiers);
          if (suite.name === 'xdescribe') modifiers.push('skip');
          if (suite.name === 'fdescribe') modifiers.push('only');
        }
      }
      suites.forEach((suite, index) => {
        suite.scope = JSON.stringify(suites.slice(0, index + 1).map(({ label }) => label));
      });
      const titleNode = call.node.arguments[0];
      const title =
        titleNode?.type === 'StringLiteral'
          ? titleNode.value
          : titleNode?.type === 'TemplateLiteral' && titleNode.expressions.length === 0
          ? titleNode.quasis[0].value.cooked
          : null;
      const skipped = name.startsWith('x') || modifiers.some((m) => ['skip', 'todo', 'failing'].includes(m));
      tests.push({
        start: call.node.loc.start.line,
        end: call.node.loc.end.line,
        suites,
        scope: suites.at(-1)?.scope ?? '[]',
        title,
        id: title?.match(/^\[([A-Za-z0-9-]+)\]/)?.[1],
        runnable: !skipped && call.node.arguments.length >= 2,
        focused: name === 'fit' || modifiers.includes('only'),
      });
    },
  });
  const codeLines = new Set();
  for (const token of ast.tokens ?? []) {
    if (typeof token.type !== 'object' || token.type.label === 'eof') continue;
    for (let line = token.loc.start.line; line <= token.loc.end.line; line++) codeLines.add(line);
  }
  return { tests, codeLines };
}

function parseTests(source) {
  return parseTestSource(source).tests;
}

function walkSpecs(frontendRoot) {
  const specs = [];
  const visit = (relDir, ok) => {
    if (!exists(frontendRoot, relDir)) return;
    for (const entry of fs.readdirSync(path.join(frontendRoot, relDir), {
      withFileTypes: true,
    })) {
      const rel = `${relDir}/${entry.name}`;
      if (entry.isDirectory()) visit(rel, ok);
      else if (ok(rel)) {
        const source = read(frontendRoot, rel);
        specs.push({ path: rel, source, ...parseTestSource(source) });
      }
    }
  };
  visit('src/AppBuilder/Widgets', (rel) => /\/__tests__\/.+\.spec\.[jt]sx?$/.test(rel));
  visit('src/AppBuilder/AppCanvas/__tests__', (rel) => /\.spec\.[jt]sx?$/.test(rel));
  visit('src/AppBuilder/_stores/slices/__tests__', (rel) => /\.spec\.[jt]sx?$/.test(rel));
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
  const changedTests = new Map();

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
      if (added && !SPEC_GATED_STATUSES.has(manifestByType.get(added.componentType)?.status)) {
        errors.push(`New widget ${added.componentType} requires a spec-complete testing contract`);
      }
    }
    if (!normalizedPath.startsWith('src/AppBuilder/Widgets/') || !/\.(spec|test)\.[jt]sx?$/.test(normalizedPath)) {
      continue;
    }
    const widget = inferWidgetFromTestPath(normalizedPath, manifest.widgets);
    if (!widget) {
      errors.push(`Cannot map modified widget test ${normalizedPath} to a registered component type`);
      continue;
    }
    if (!widget.contract) {
      errors.push(`Modified widget test ${normalizedPath} requires a ${widget.componentType} scenario contract`);
      continue;
    }
    const spec = specs.find(({ path: specPath }) => specPath === normalizedPath);
    if (!spec) {
      errors.push(`${normalizedPath}: changed test is outside the supported test layout`);
      continue;
    }
    try {
      if (changedFile.status === 'added') changedTests.set(normalizedPath, new Set(spec.tests));
      else {
        const diff = readTestDiff(spec.source, changedFile);
        const previous = parseTestSource(diff.before);
        const affected = affectedTests(spec.tests, previous.tests, {
          oldLines: diff.oldLines.filter((line) => previous.codeLines.has(line)),
          newLines: diff.newLines.filter((line) => spec.codeLines.has(line)),
        });
        changedTests.set(normalizedPath, new Set(affected.tests));
        if (affected.sharedSetup)
          warnings.push(`${normalizedPath}: shared setup changed; review and rerun the affected suite`);
      }
    } catch (error) {
      errors.push(`${normalizedPath}: ${error.message}`);
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
    const taggedSpecs = specs.filter(
      ({ path: specPath, tests }) =>
        inferWidgetFromTestPath(specPath, manifest.widgets)?.componentType === widget.componentType ||
        tests.some(({ id }) => id?.startsWith(`${widget.componentType}-`))
    );
    const newDefinition = changedFiles.some(
      ({ path: file, status }) =>
        status === 'added' && file.replace(/^frontend\//, '') === registeredByType.get(widget.componentType)?.definition
    );
    if (newDefinition && (contract.metadata.development_type !== 'new-widget' || !contract.metadata.prd_source)) {
      errors.push(`New widget ${widget.componentType} requires development_type: new-widget and a requirements source`);
    }
    const verified = widget.status === 'verified' || contract.metadata.contract_status === 'verified';
    if (contract.metadata.contract_status !== widget.status) {
      errors.push(`${widget.componentType}: contract_status must match manifest status ${widget.status}`);
    }
    if (specGated) {
      for (const decision of contract.decisions) {
        if (!decision.fields.answer)
          errors.push(`${widget.componentType}: unanswered decision ${decision.id} blocks spec completion`);
      }
    }

    if (contract.metadata.component_type !== widget.componentType) {
      errors.push(`${widget.componentType}: contract component_type does not match the manifest`);
    }
    if (contract.metadata.baseline !== manifest.baseline) {
      errors.push(`${widget.componentType}: contract baseline does not match the manifest`);
    }
    if (!CONTRACT_STATUSES.has(contract.metadata.contract_status)) {
      errors.push(`${widget.componentType}: unknown contract_status ${contract.metadata.contract_status}`);
    }
    const needsResearch = specGated;
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
          const accepted = Array.isArray(field) ? field : [field];
          if (!accepted.some((name) => contract.metadata[name])) {
            errors.push(`${widget.componentType}: ${widget.status} contract requires ${accepted[0]}`);
          }
        }
      }
    }

    const editedIds = new Set(
      taggedSpecs.flatMap(({ path: specPath }) => [...(changedTests.get(specPath) ?? [])].map(({ id }) => id))
    );
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
      if (scenario.fields.status === 'deferred' && !scenario.fields['deferred-by']) {
        errors.push(`${scenario.id}: deferred scenario requires Deferred-by`);
      }
      if (verified) {
        if (scenario.fields.owner === 'Engineering' && scenario.fields.status !== 'verified') {
          errors.push(`${scenario.id}: verified contract requires verified engineering scenarios`);
        }
        if (scenario.fields.owner === 'QA' && scenario.fields.status !== 'qa-owned') {
          errors.push(`${scenario.id}: verified contract requires qa-owned QA scenarios`);
        }
      }
      if (READY_SCENARIO_STATUSES.has(scenario.fields.status)) {
        if (
          scenario.fields.owner === 'Engineering' &&
          (['ready', 'verified'].includes(scenario.fields.status) || editedIds.has(scenario.id))
        ) {
          const required = ['Guarantee', 'Sources', 'Public seam', 'Setup', 'Action', 'Fault'];
          if (scenario.fields.status === 'verified') required.push('Evidence');
          for (const field of required) {
            if (!scenario.fields[field.toLowerCase()])
              errors.push(`${scenario.id}: ${scenario.fields.status} scenario requires ${field}`);
          }
        }
        const dependencies = new Set((scenario.fields.decisions ?? '').match(/D-\d{2,}/g) ?? []);
        for (const decision of contract.decisions) {
          const affected = (decision.fields.unblocks ?? '').match(/[A-Za-z0-9-]+/g) ?? [];
          if (affected.includes(scenario.id)) dependencies.add(decision.id);
        }
        for (const id of dependencies) {
          const decision = decisionsById.get(id);
          if (!decision) errors.push(`${scenario.id}: unknown decision ${id}`);
          else if (!decision.fields.answer) errors.push(`${scenario.id}: blocked on unanswered ${id}`);
        }
      }
      if (specGated && UNSETTLED_SCENARIO_STATUSES.has(scenario.fields.status)) {
        errors.push(
          `${widget.componentType}: ${scenario.id} is still ${scenario.fields.status} in a ${widget.status} contract`
        );
      }
    }

    const rows = parseDispositionRows(contractSource, DISPOSITION_SECTIONS);
    if (specGated) {
      for (const section of DISPOSITION_SECTIONS) {
        const heading = section.replace(/^#+ /, '');
        if (!rows.some((row) => row.heading === heading))
          errors.push(`${widget.componentType}: missing or empty ${heading}`);
      }
    }
    const counts = {
      covered: 0,
      shared: 0,
      qa: 0,
      decision: 0,
      none: 0,
      illegal: 0,
    };
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
        } else if (
          !parseTests(read(frontendRoot, sharedPath)).some(
            (test) => test.id === sharedId && test.runnable && !test.focused
          )
        ) {
          errors.push(
            `${widget.componentType}: shared test ${sharedPath} does not reference ${sharedId} for row ${row.subject}`
          );
        }
      }
      if (row.kind === 'decision') {
        const decision = decisionsById.get(row.match[1]);
        if (!decision) {
          errors.push(`${widget.componentType}: "${row.heading}" row ${row.subject} cites unknown ${row.match[1]}`);
        } else if (specGated && !decision.fields.answer) {
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

    for (const { path: specPath, tests } of taggedSpecs) {
      const widgetSpecific =
        inferWidgetFromTestPath(specPath, manifest.widgets)?.componentType === widget.componentType;
      for (const test of tests) {
        if (test.focused) errors.push(`${specPath}: focused test or suite cannot establish coverage`);
        const changed = changedTests.get(specPath)?.has(test);
        if (widgetSpecific && (changed || verified) && !test.id?.startsWith(`${widget.componentType}-`)) {
          errors.push(
            `${specPath}: ${changed ? 'changed test requires a ready' : 'verified widget requires a'} ${
              widget.componentType
            } scenario ID (${test.title ?? 'dynamic title'})`
          );
        }
        const scenario = scenariosById.get(test.id);
        if (
          changed &&
          scenario &&
          !test.runnable &&
          !(scenario.fields.status === 'deferred' && scenario.fields['deferred-by'])
        ) {
          errors.push(`${specPath}: disabled test ${test.id} requires a human deferred scenario`);
        }
        if (changed && scenario && !READY_SCENARIO_STATUSES.has(scenario.fields.status)) {
          const deferred = scenario.fields.status === 'deferred' && scenario.fields['deferred-by'] && !test.runnable;
          if (!deferred)
            errors.push(
              `${specPath}: changed test ${test.id} requires a ready scenario (got ${scenario.fields.status})`
            );
        }
        if (test.id?.startsWith(`${widget.componentType}-`) && !scenarioIds.has(test.id)) {
          errors.push(`${widget.componentType}: test references unknown scenario ${test.id}`);
        }
      }
    }
    for (const scenario of contract.scenarios) {
      if (!IMPLEMENTED_SCENARIO_STATUSES.has(scenario.fields.status)) continue;
      if (scenario.fields.owner === 'QA' || scenario.fields.layer === 'Browser') continue;
      const matching = taggedSpecs.flatMap(({ tests }) => tests).filter(({ id }) => id === scenario.id);
      if (!matching.some((test) => test.runnable)) {
        errors.push(
          `${widget.componentType}: ${scenario.id} has no runnable test whose title starts with [${scenario.id}]`
        );
      } else if (matching.some((test) => !test.runnable)) {
        errors.push(
          `${widget.componentType}: ${scenario.id} includes a disabled test; record a separate human deferral`
        );
      }
    }

    ledger.push({
      componentType: widget.componentType,
      status: widget.status,
      rows: rows.length,
      scenarios: contract.scenarios.length,
      engineeringScenarios: contract.scenarios.filter(({ fields }) => fields.owner !== 'QA').length,
      verifiedScenarios: contract.scenarios.filter(
        ({ fields }) => fields.status === 'verified' && fields.owner === 'Engineering'
      ).length,
      qaScenarios: contract.scenarios.filter(({ fields }) => fields.owner === 'QA').length,
      deferredScenarios: contract.scenarios.filter(({ fields }) => fields.status === 'deferred').length,
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
    verifiedWidgets: manifest.widgets.filter(({ status }) => status === 'verified').length,
    pendingWidgets: manifest.widgets.filter(({ status }) => status !== 'verified').length,
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
