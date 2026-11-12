import {
  listRepoPathsViaAPI,
  readRepoJsonViaAPI,
} from "Support/utils/platform/gitSync/gitHubRepo";

/**
 * The only place that knows the git repo layout ToolJet writes.
 * source: server/ee/app-git/shared/app-git-file-operations.util.ts:44-66 (top folders + APP_RESOURCE_DIRS)
 * source: server/ee/git-sync/data-source-fs.util.ts:8-32 (data-sources/[<folder>/]<name>/data-source.json)
 *
 * `.meta/*.json` is no longer written (meta-free enumeration via app/app.json),
 * so nothing here reads it.
 */

export const RESOURCE_ROOT = { app: "apps", module: "modules", workflow: "workflows" };
export const DATA_SOURCE_ROOT = "data-sources";
export const DATA_SOURCE_FILE = "data-source.json";

/**
 * Repo directory of a resource: `<root>/[<folder>/]<name>`.
 *
 * @tjType gitRepo.resourceDir
 * @tjBlock gitSync
 * @tjUsage resourceDir("app", appName, { folder })
 * @tjDom none - pure function
 */
export const resourceDir = (type, name, { folder } = {}) =>
  [RESOURCE_ROOT[type], folder, name].filter(Boolean).join("/");

/**
 * @tjType gitRepo.listResources
 * @tjBlock gitSync
 * @tjUsage listGitResources(branch).then(({ apps, modules, workflows, dataSources }) => ...)
 * @tjDom none - GitHub recursive tree
 * @returns resource dirs (relative to their root) per type
 */
export const listGitResources = (branch) =>
  listRepoPathsViaAPI(branch).then((paths) => {
    const dirsOf = (root) =>
      paths
        .filter((p) => p.startsWith(`${root}/`) && p.endsWith("/app/app.json"))
        .map((p) => p.slice(root.length + 1, -"/app/app.json".length));
    return {
      paths,
      apps: dirsOf(RESOURCE_ROOT.app),
      modules: dirsOf(RESOURCE_ROOT.module),
      workflows: dirsOf(RESOURCE_ROOT.workflow),
      dataSources: paths
        .filter((p) => p.startsWith(`${DATA_SOURCE_ROOT}/`) && p.endsWith(`/${DATA_SOURCE_FILE}`))
        .map((p) => p.slice(DATA_SOURCE_ROOT.length + 1, -(DATA_SOURCE_FILE.length + 1))),
    };
  });

/**
 * Read every JSON file of one app/module/workflow, grouped by resource subdir
 * (components, pages, queries, events, versions, schema, definitions, …).
 * Yields null when `<dir>/app/app.json` is absent.
 *
 * @tjType gitRepo.readResource
 * @tjBlock gitSync
 * @tjUsage readResourceFromGit(branch, "app", appName).then(({ app, files }) => files.components)
 * @tjDom none - GitHub tree + contents
 * @returns {Cypress.Chainable<{app: object, files: Record<string, object[]>, paths: string[]}|null>}
 */
export const readResourceFromGit = (branch, type, name, opts = {}) => {
  const dir = resourceDir(type, name, opts);
  return listRepoPathsViaAPI(branch).then((all) => {
    const paths = all.filter((p) => p.startsWith(`${dir}/`) && p.endsWith(".json"));
    if (!paths.includes(`${dir}/app/app.json`)) return null;

    const files = {};
    let app = null;
    const reads = paths.map((p) => () =>
      readRepoJsonViaAPI(branch, p).then((json) => {
        const sub = p.slice(dir.length + 1).split("/")[0];
        if (p === `${dir}/app/app.json`) app = json;
        (files[sub] = files[sub] || []).push(json);
      }),
    );
    return reads
      .reduce((chain, read) => chain.then(read), cy.wrap(null, { log: false }))
      .then(() => ({ app, files, paths }));
  });
};

/**
 * @tjType gitRepo.readDataSource
 * @tjBlock gitSync
 * @tjUsage readDataSourceFromGit(branch, "restapi").then((ds) => ds.options.development)
 * @tjDom none - GitHub contents
 * @returns {Cypress.Chainable<object|null>}
 */
export const readDataSourceFromGit = (branch, name, { folder } = {}) =>
  readRepoJsonViaAPI(
    branch,
    [DATA_SOURCE_ROOT, folder, name, DATA_SOURCE_FILE].filter(Boolean).join("/"),
  );
