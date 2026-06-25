#!/usr/bin/env node
/**
 * Generates MDX endpoint pages from OpenAPI specs.
 *
 * Usage:
 *   node scripts/generate-api-docs.js
 *
 * For each path+method in each spec, writes one MDX file using the
 * shared ApiDoc React components registered in MDXComponents.js.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ── Config ──────────────────────────────────────────────────────────────────

const SPECS = [
  {
    specFile: 'api-docs/openapi/tooljet-api.yaml',
    outputDir: 'api-docs/tooljet-api',
    // operationId → output path (relative to outputDir), omit extension
    routeMap: {
      getAllUsers:           'users/get-all-users',
      createUser:           'users/create-user',
      getUser:              'users/get-user',
      updateUser:           'users/update-user',
      updateUserRole:       'users/update-user-role',
      replaceUserWorkspaces:'users/replace-user-workspaces',
      replaceUserWorkspace: 'users/replace-user-workspace',
      getUserMetadata:      'users/get-user-metadata',
      updateUserMetadata:   'users/update-user-metadata',
      getAllWorkspaces:      'workspaces/get-all-workspaces',
      getAllAppDetails:      'workspaces/get-all-app-details',
      exportApplication:    'apps/export-application',
      importApplication:    'apps/import-application',
      listModules:          'modules/list-modules',
      exportModule:         'modules/export-module',
      importModule:         'modules/import-module',
      createGroup:          'groups/create-group',
      getAllGroups:          'groups/get-all-groups',
      getGroup:             'groups/get-group',
      updateGroup:          'groups/update-group',
      deleteGroup:          'groups/delete-group',
    },
  },
  {
    specFile: 'api-docs/openapi/gitsync-api.yaml',
    outputDir: 'api-docs/gitsync-api',
    routeMap: {
      addGitConfig:      'add-git-config',
      pushAppVersion:    'push-app-version',
      createAppFromGit:  'create-app-from-git',
      syncPullApp:       'sync-pull-app',
      autoPromoteApp:    'auto-promote-app',
    },
  },
  {
    specFile: 'api-docs/openapi/scim.yaml',
    outputDir: 'api-docs/scim',
    routeMap: {
      // SCIM ops are identified by path+method since it has no operationId
      'GET /Users':         'users/list-users',
      'POST /Users':        'users/create-user',
      'GET /Users/{id}':    'users/get-user',
      'PUT /Users/{id}':    'users/replace-user',
      'PATCH /Users/{id}':  'users/patch-user',
      'DELETE /Users/{id}': 'users/delete-user',
      'GET /Groups':        'groups/list-groups',
      'POST /Groups':       'groups/create-group',
      'GET /Groups/{id}':   'groups/get-group',
      'PUT /Groups/{id}':   'groups/replace-group',
      'PATCH /Groups/{id}': 'groups/patch-group',
      'DELETE /Groups/{id}':'groups/delete-group',
    },
  },
];

const DOCS_ROOT = path.resolve(__dirname, '..');

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadSpec(specFile) {
  const fullPath = path.join(DOCS_ROOT, specFile);
  return yaml.load(fs.readFileSync(fullPath, 'utf8'));
}

function escapeForMdx(str) {
  if (!str) return '';
  return String(str).replace(/[{}<>]/g, (c) => `{'${c}'}`);
}

function buildCurl(method, pathStr, operation, serverUrl) {
  const base = serverUrl || 'https://{your-domain}/api/ext';
  let url = `${base}${pathStr}`;

  const pathParams = (operation.parameters || []).filter(p => p.in === 'path');
  for (const p of pathParams) {
    url = url.replace(`{${p.name}}`, `{${p.name}}`);
  }

  const queryParams = (operation.parameters || []).filter(p => p.in === 'query');
  const queryStr = queryParams.length
    ? '?' + queryParams.map(p => `${p.name}=<${p.name}>`).join('&')
    : '';

  const lines = [
    `curl -X ${method.toUpperCase()} "${url}${queryStr}" \\`,
    `  -H "Authorization: Basic <access_token>" \\`,
    `  -H "Content-Type: application/json"`,
  ];

  if (operation.requestBody) {
    lines[lines.length - 1] += ' \\';
    const ex = getRequestExample(operation);
    lines.push(`  -d '${JSON.stringify(ex, null, 2)}'`);
  }

  return lines.join('\n');
}

function getRequestExample(operation) {
  try {
    const content = operation.requestBody?.content;
    if (!content) return {};
    const mediaType = content['application/json'] || content['application/scim+json'];
    if (!mediaType) return {};
    if (mediaType.example) return mediaType.example;
    if (mediaType.schema?.example) return mediaType.schema.example;
    return {};
  } catch {
    return {};
  }
}

function getResponseExample(operation) {
  try {
    const responses = operation.responses || {};
    const code = Object.keys(responses).find(c => c.startsWith('2')) || '200';
    const resp = responses[code];
    if (!resp) return null;
    const content = resp.content;
    if (!content) return { statusCode: code, body: null };
    const mediaType = content['application/json'] || content['application/scim+json'];
    if (!mediaType) return { statusCode: code, body: null };
    const body = mediaType.example || mediaType.schema?.example || null;
    return { statusCode: code, body };
  } catch {
    return null;
  }
}

function buildParamsArray(operation) {
  const params = [];
  for (const p of (operation.parameters || [])) {
    params.push({
      name: p.name,
      type: p.schema?.type || '',
      required: !!p.required,
      description: p.description || '',
      in: p.in,
    });
  }
  return params;
}

function buildBodyParams(operation) {
  const schema = operation.requestBody?.content?.['application/json']?.schema
    || operation.requestBody?.content?.['application/scim+json']?.schema;
  if (!schema || !schema.properties) return [];
  return Object.entries(schema.properties).map(([name, def]) => ({
    name,
    type: def.type || '',
    required: (schema.required || []).includes(name),
    description: def.description || '',
    in: 'body',
  }));
}

function mdxFileId(outputPath) {
  return path.basename(outputPath);
}

// ── MDX Template ─────────────────────────────────────────────────────────────

function renderMdx({ id, title, method, urlPath, description, pathParams, queryParams, bodyParams, curl, response, isBeta }) {
  const allPathParams = pathParams.filter(p => p.in === 'path');
  const allQueryParams = queryParams.filter(p => p.in === 'query');

  const pathParamsJson = JSON.stringify(allPathParams);
  const queryParamsJson = JSON.stringify(allQueryParams);
  const bodyParamsJson = JSON.stringify(bodyParams);

  const curlEscaped = curl.replace(/`/g, '\\`').replace(/\$/g, '\\$');

  let responseBlock = '';
  if (response?.body) {
    const bodyStr = JSON.stringify(response.body, null, 2)
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');
    responseBlock = `<ResponseExample statusCode="${response.statusCode}" body={\`${bodyStr}\`} />`;
  } else if (response?.statusCode) {
    responseBlock = `**Response:** \`${response.statusCode}\``;
  }

  const betaWarning = isBeta ? `
:::warning BETA
This endpoint is in beta and may change in future releases.
:::
` : '';

  return `---
id: ${id}
title: "${escapeForMdx(title)}"
---
${betaWarning}
<EndpointHeader method="${method.toUpperCase()}" path="${urlPath}" />

${description ? escapeForMdx(description) : ''}

${allPathParams.length ? `<ParamsTable title="Path Parameters" params={${pathParamsJson}} />` : ''}

${allQueryParams.length ? `<ParamsTable title="Query Parameters" params={${queryParamsJson}} />` : ''}

${bodyParams.length ? `<ParamsTable title="Request Body" params={${bodyParamsJson}} />` : ''}

<RequestExample code={\`${curlEscaped}\`} />

${responseBlock}
`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const BETA_OPERATIONS = new Set(['getUserMetadata', 'updateUserMetadata', 'createGroup', 'getAllGroups', 'getGroup', 'updateGroup', 'deleteGroup']);

for (const { specFile, outputDir, routeMap } of SPECS) {
  console.log(`\nProcessing: ${specFile}`);
  const spec = loadSpec(specFile);
  const serverUrl = spec.servers?.[0]?.url || '';

  for (const [urlPath, pathItem] of Object.entries(spec.paths || {})) {
    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;

      const operationId = operation.operationId;
      const pathMethodKey = `${method.toUpperCase()} ${urlPath}`;

      // Find output path via operationId or path+method key
      const relPath = operationId
        ? routeMap[operationId]
        : routeMap[pathMethodKey];

      if (!relPath) {
        console.warn(`  No route mapping for: ${method.toUpperCase()} ${urlPath} (operationId: ${operationId})`);
        continue;
      }

      const outputFile = path.join(DOCS_ROOT, outputDir, relPath + '.mdx');
      const id = path.basename(relPath);
      const title = operation.summary || `${method.toUpperCase()} ${urlPath}`;

      const allParams = buildParamsArray(operation);
      const bodyParams = buildBodyParams(operation);
      const curl = buildCurl(method, urlPath, operation, serverUrl);
      const response = getResponseExample(operation);
      const isBeta = BETA_OPERATIONS.has(operationId);

      const mdx = renderMdx({
        id,
        title,
        method,
        urlPath,
        description: operation.description || '',
        pathParams: allParams,
        queryParams: allParams,
        bodyParams,
        curl,
        response,
        isBeta,
      });

      fs.mkdirSync(path.dirname(outputFile), { recursive: true });
      fs.writeFileSync(outputFile, mdx, 'utf8');
      console.log(`  ✓ ${relPath}.mdx`);
    }
  }
}

console.log('\nDone.');
