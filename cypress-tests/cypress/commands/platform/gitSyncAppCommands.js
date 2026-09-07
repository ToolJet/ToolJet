
/**
 * @tjCmd   gitsync · open a git-synced app in the builder on a given branch
 * @tjUsage cy.gitSyncOpenAppInBuilder('MyApp', 'main')
 */
Cypress.Commands.add("gitSyncOpenAppInBuilder", (appName) => {
  cy.contains('[data-cy$="-card"]', appName, { timeout: 30000 }).should("be.visible");
  cy.wait(2000);

  cy.get('[data-cy$="-card"]')
    .contains(appName)
    .closest('[data-cy$="-card"]')
    .should("be.visible")
    .realHover();

  cy.get('[data-cy$="-card"]')
    .contains(appName)
    .closest('[data-cy$="-card"]')
    .contains("a", "Edit")
    .should("be.visible")
    .click();

  cy.url({ timeout: 30000 }).should("include", "/apps/");
  cy.waitForAppLoad();
});

/**
 * @tjCmd   gitsync · reset the test repo: branches, tags and tree - teardown
 * @tjUsage cy.gitHubResetRepo()
 */
Cypress.Commands.add("gitHubResetRepo", (defaultBranch = "master") => {
  const owner = Cypress.env("GITHUB_REPO_OWNER");
  const repo = Cypress.env("GITHUB_REPO_NAME");
  const ghHeaders = {
    Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
    Accept: "application/vnd.github+json",
  };

  cy.request({
    method: "GET",
    url: `https://api.github.com/repos/${owner}/${repo}/tags?per_page=100`,
    headers: ghHeaders,
    failOnStatusCode: false,
  }).then((res) => {
    const tags = Array.isArray(res.body) ? res.body : [];
    if (tags.length === 0) {
      Cypress.log({ message: "[gitHub] No tags to delete during reset" });
      return;
    }
    Cypress.log({ message: `[gitHub] Deleting ${tags.length} tag(s) before reset` });
    tags.forEach((tag) => {
      cy.request({
        method: "DELETE",
        url: `https://api.github.com/repos/${owner}/${repo}/git/refs/tags/${tag.name}`,
        headers: ghHeaders,
        failOnStatusCode: false,
      }).then((delRes) => {
        Cypress.log({
          message: `[gitHub] Deleted tag '${tag.name}' — status ${delRes.status}`,
        });
      });
    });
  });

  cy.request({
    method: "GET",
    url: `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
    headers: ghHeaders,
  }).then((res) => {
    const testBranches = res.body.filter((b) => b.name.startsWith("test-"));
    Cypress.log({
      message: `[gitSync] Deleting ${testBranches.length} test branch(es)`,
    });
    testBranches.forEach((branch) => {
      cy.gitHubDeleteBranch(branch.name);
    });
  });

  const EMPTY_TREE_SHA = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

  cy.request({
    method: "GET",
    url: `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`,
    headers: ghHeaders,
  }).then((refRes) => {
    const parentSha = refRes.body.object.sha;

    cy.request({
      method: "POST",
      url: `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      headers: ghHeaders,
      body: {
        message: "chore: clear repo contents for test isolation",
        tree: EMPTY_TREE_SHA,
        parents: [parentSha],
      },
    }).then((commitRes) => {
      cy.request({
        method: "PATCH",
        url: `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`,
        headers: ghHeaders,
        body: { sha: commitRes.body.sha, force: true },
      }).then((updateRes) => {
        expect(updateRes.status).to.equal(200);
        Cypress.log({
          message: `[gitSync] '${defaultBranch}' cleared (commit: ${commitRes.body.sha.slice(0, 7)})`,
        });
      });
    });
  });
});

/**
 * @tjCmd   app-crud · rename an app via the API
 * @tjUsage cy.apiRenameApp(appId, 'new-name')
 */
Cypress.Commands.add("apiRenameApp", (appId, newName, editingVersionId = null) => {
  return cy.getAuthHeaders().then((headers) => {
    const doRename = (vid) => {
      const body = vid
        ? { app: { name: newName, editingVersionId: vid } }
        : { app: { name: newName } };
      return cy
        .request({
          method: "PUT",
          url: `${Cypress.env("server_host")}/api/apps/${appId}`,
          headers,
          body,
          failOnStatusCode: false,
        })
        .then((res) => {
          // Server blocks rename on the default branch when no branch-scoped version is
          // provided. Retry once using the most recent BRANCH-type version so the guard
          // sees a feature-branch context and allows the rename.
          if (
            res.status === 400 &&
            !vid &&
            (res.body?.message || "").includes("Renaming isn't allowed on master")
          ) {
            Cypress.log({
              message: `[gitSync] Rename blocked on master — retrying with branch-scoped version`,
            });
            return cy
              .request({
                method: "GET",
                url: `${Cypress.env("server_host")}/api/apps/${appId}/versions`,
                headers,
                failOnStatusCode: false,
              })
              .then((versionsRes) => {
                const versions = versionsRes.body?.versions || [];
                const branchVersion = versions.find(
                  (v) =>
                    v.versionType === "branch" ||
                    v.version_type === "branch" ||
                    v.type === "branch",
                );
                const branchVid = branchVersion?.id;
                expect(branchVid, "found branch-type version id for rename").to.be.a("string");
                return doRename(branchVid);
              });
          }
          expect(res.status, `Rename app to '${newName}'`).to.be.oneOf([200, 201, 204]);
          Cypress.log({
            message: `[gitSync] App ${appId} renamed to '${newName}'${vid ? ` (branch-scoped via version ${vid})` : ""}`,
          });
        });
    };
    return doRename(editingVersionId);
  });
});

/**
 * @tjCmd   gitsync · list the apps present on a branch
 * @tjUsage cy.apiListAppsOnBranch('feature-x')
 */
Cypress.Commands.add("apiListAppsOnBranch", (branchId) => {
  return cy.getAuthHeaders().then((headers) =>
    cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/apps?page=1&type=front-end&branch_id=${branchId}`,
        headers,
      })
      .then((res) => {
        expect(res.status).to.equal(200);
        const apps =
          res.body?.apps || res.body?.meta?.apps || res.body || [];
        return Array.isArray(apps) ? apps : [];
      }),
  );
});


/**
 * @tjCmd   gitsync · read and parse a JSON file from the GitHub repo
 * @tjUsage cy.gitHubGetFileJson(path)
 */
Cypress.Commands.add("gitHubGetFileJson", (branch, filePath) => {
  const owner = Cypress.env("GITHUB_REPO_OWNER");
  const repo = Cypress.env("GITHUB_REPO_NAME");

  return cy
    .request({
      method: "GET",
      url: `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      qs: { ref: branch },
      headers: {
        Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
        Accept: "application/vnd.github+json",
      },
      failOnStatusCode: false,
    })
    .then((res) => {
      if (res.status === 404) {
        Cypress.log({ message: `[gitHub] File not found: ${filePath} on ${branch}` });
        return null;
      }
      expect(res.status, `GET ${filePath}`).to.equal(200);
      // GitHub returns content as base64 with newlines — strip them before decoding.
      const decoded = atob(res.body.content.replace(/\n/g, ""));
      return JSON.parse(decoded);
    });
});

/**
 * @tjCmd   gitsync · list the repo paths belonging to an app
 * @tjUsage cy.gitHubListAppPaths('MyApp')
 */
Cypress.Commands.add("gitHubListAppPaths", (branch) => {
  const owner = Cypress.env("GITHUB_REPO_OWNER");
  const repo = Cypress.env("GITHUB_REPO_NAME");

  // Get the branch's HEAD SHA first, then walk the tree recursively.
  return cy
    .request({
      method: "GET",
      url: `https://api.github.com/repos/${owner}/${repo}/branches/${branch}`,
      headers: {
        Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
        Accept: "application/vnd.github+json",
      },
    })
    .then((res) => {
      expect(res.status, `GET branch ${branch}`).to.equal(200);
      const sha = res.body.commit.sha;

      return cy.request({
        method: "GET",
        url: `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}`,
        qs: { recursive: 1 },
        headers: {
          Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
          Accept: "application/vnd.github+json",
        },
      });
    })
    .then((res) => {
      expect(res.status, "GET git tree").to.equal(200);
      return res.body.tree.map((item) => item.path);
    });
});

function readFilesFromPaths(branch, paths) {
  return paths.reduce(
    (chain, filePath) =>
      chain.then((arr) =>
        cy
          .gitHubGetFileJson(branch, filePath)
          .then((json) => (json ? [...arr, json] : arr)),
      ),
    cy.wrap([]),
  );
}

/**
 * @tjCmd   gitsync · fetch an app's committed definition from GitHub
 * @tjUsage cy.gitHubFetchAppData('MyApp')
 */
Cypress.Commands.add("gitHubFetchAppData", (branch, appName) => {
  const prefix = `apps/${appName}`;

  return cy.gitHubListAppPaths(branch).then((allPaths) => {
    const pick = (sub) =>
      allPaths.filter(
        (p) => p.startsWith(`${prefix}/${sub}/`) && p.endsWith(".json"),
      );

    const componentPaths = pick("components");
    const queryPaths = pick("queries");
    const pagePaths = pick("pages");
    const dsOptionPaths = pick("dataSourceOptions");
    const envPaths = pick("environments");

    return cy
      .gitHubGetFileJson(branch, `${prefix}/app/app.json`)
      .then((appJson) => {
        expect(
          appJson,
          `app.json exists for '${appName}' on '${branch}'`,
        ).to.not.be.null;

        return readFilesFromPaths(branch, componentPaths).then((components) =>
          readFilesFromPaths(branch, queryPaths).then((queries) =>
            readFilesFromPaths(branch, pagePaths).then((pages) =>
              readFilesFromPaths(branch, dsOptionPaths).then(
                (dataSourceOptions) =>
                  readFilesFromPaths(branch, envPaths).then((environments) =>
                    cy
                      .gitHubGetFileJson(
                        branch,
                        `${prefix}/schema/schema.json`,
                      )
                      .then((schema) => {
                        Cypress.log({
                          message: `[gitHub] Fetched git data for '${appName}' on '${branch}': ${components.length} components, ${queries.length} queries, ${pages.length} pages`,
                        });
                        return {
                          appJson,
                          components,
                          queries,
                          pages,
                          dataSourceOptions,
                          environments,
                          schema,
                        };
                      }),
                  ),
              ),
            ),
          ),
        );
      });
  });
});

/**
 * @tjCmd   assertion · assert an app's metadata file in the repo
 * @tjUsage cy.gitHubAssertAppMeta('MyApp', expected)
 */
Cypress.Commands.add("gitHubAssertAppMeta", (branch, appName) => {
  return cy
    .gitHubGetFileJson(branch, ".meta/appMeta.json")
    .then((meta) => {
      expect(meta, ".meta/appMeta.json exists").to.not.be.null;

      const paths = Object.values(meta).map((entry) => entry.appPath);
      expect(paths, `appMeta.json has entry with appPath "apps/${appName}"`).to.include(
        `apps/${appName}`,
      );

      Cypress.log({
        message: `[gitHub] ✓ appMeta.json has appPath "apps/${appName}" on '${branch}'`,
      });
      return meta;
    });
});


/**
 * @tjCmd   assertion · assert the app folder exists in the repo
 * @tjUsage cy.gitHubAssertAppFolderExists('MyApp')
 */
Cypress.Commands.add("gitHubAssertAppFolderExists", (branch, appName) => {
  return cy.gitHubListAppPaths(branch).then((paths) => {
    expect(
      paths,
      `apps/${appName}/ folder exists on branch '${branch}'`,
    ).to.include(`apps/${appName}/app/app.json`);
    Cypress.log({ message: `[gitHub] ✓ apps/${appName}/ exists on '${branch}'` });
  });
});

/**
 * @tjCmd   assertion · assert the app folder is absent from the repo
 * @tjUsage cy.gitHubAssertAppFolderGone('MyApp')
 */
Cypress.Commands.add("gitHubAssertAppFolderGone", (branch, appName) => {
  return cy.gitHubListAppPaths(branch).then((paths) => {
    const appPaths = paths.filter((p) => p.startsWith(`apps/${appName}/`));
    expect(
      appPaths,
      `apps/${appName}/ folder is gone from branch '${branch}'`,
    ).to.have.length(0);
    Cypress.log({ message: `[gitHub] ✓ apps/${appName}/ is gone on '${branch}'` });
  });
});


/**
 * @tjCmd   wait · wait for a commit with the given message to appear
 * @tjUsage cy.gitHubWaitForCommitMessage('feat: x')
 */
Cypress.Commands.add(
  "gitHubWaitForCommitMessage",
  (branch, fragment, retries = 12) => {
    const owner = Cypress.env("GITHUB_REPO_OWNER");
    const repo = Cypress.env("GITHUB_REPO_NAME");

    const check = (remaining) => {
      return cy
        .request({
          method: "GET",
          url: `https://api.github.com/repos/${owner}/${repo}/branches/${branch}`,
          headers: {
            Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
            Accept: "application/vnd.github+json",
          },
        })
        .then((res) => {
          const message = res.body.commit?.commit?.message || "";
          if (message.includes(fragment)) {
            Cypress.log({
              message: `[gitHub] ✓ Found "${fragment}" in commit message on '${branch}'`,
            });
            return;
          }
          if (remaining <= 0) {
            throw new Error(
              `Expected commit message containing "${fragment}" on '${branch}', got: "${message}"`,
            );
          }
          Cypress.log({
            message: `[gitHub] Waiting for commit "${fragment}"... (${remaining} left)`,
          });
          return cy.wait(4000).then(() => check(remaining - 1));
        });
    };

    return check(retries);
  },
);


function stripDynamic(obj) {
  const SKIP = new Set([
    "createdAt",
    "updatedAt",
    "created_at",
    "updated_at",
    "tooljetVersion",
  ]);
  if (Array.isArray(obj)) return obj.map(stripDynamic);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([k]) => !SKIP.has(k))
        .map(([k, v]) => [k, stripDynamic(v)]),
    );
  }
  return obj;
}


/**
 * @tjCmd   api · fetch an app's full definition
 * @tjUsage cy.apiGetAppDefinition(appId)
 */
Cypress.Commands.add("apiGetAppDefinition", (appId, branchName = null) => {
  return cy.getAuthHeaders().then((headers) => {
    const orgId = Cypress.env("workspaceId");

    const exportWithVersionId = (versionId) => {
      return cy
        .request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/v2/resources/export`,
          headers,
          body: {
            app: [{ id: appId, search_params: { version_id: versionId } }],
            tooljet_database: [],
            organization_id: orgId,
          },
        })
        .then((exportRes) => {
          expect(exportRes.status, "POST /api/v2/resources/export").to.equal(201);
          const appV2 = exportRes.body?.app?.[0]?.definition?.appV2;
          expect(appV2, "appV2 in export response").to.exist;
          Cypress.log({
            message: `[gitSync] Got app definition for ${appId} (${appV2.name})`,
          });
          return appV2;
        });
    };

    const resolveAndFetch = (branchId) => {
      const reqHeaders = branchId
        ? { ...headers, "x-branch-id": branchId }
        : headers;

      return cy
        .request({
          method: "GET",
          url: `${Cypress.env("server_host")}/api/apps/${appId}`,
          headers: reqHeaders,
        })
        .then((appRes) => {
          expect(appRes.status, `GET /api/apps/${appId}`).to.equal(200);
          const versionId = appRes.body.editing_version?.id;

          if (!versionId && !branchId) {
            // Git-sync apps with only BRANCH-type versions won't have editing_version
            // when called without x-branch-id (the subscriber only finds VERSION-type).
            // Fall back to the versions list — test-branch versions are still non-stub
            // and are returned regardless of branch filter.
            Cypress.log({
              message: `[gitSync] editing_version absent without branchId — falling back to versions list for app ${appId}`,
            });
            return cy
              .request({
                method: "GET",
                url: `${Cypress.env("server_host")}/api/apps/${appId}/versions`,
                headers,
              })
              .then((versionsRes) => {
                expect(versionsRes.status, "GET /api/apps/:id/versions fallback").to.equal(200);
                const versions = versionsRes.body?.versions || [];
                expect(versions.length, "app has at least one version (fallback)").to.be.greaterThan(0);
                const fallbackVersionId = versions[0]?.id;
                expect(fallbackVersionId, "fallback version id").to.be.a("string");
                Cypress.log({
                  message: `[gitSync] Using fallback version ${fallbackVersionId} for export`,
                });
                return exportWithVersionId(fallbackVersionId);
              });
          }

          expect(versionId, "editing_version.id present").to.be.a("string");
          return exportWithVersionId(versionId);
        });
    };

    if (branchName) {
      return cy.gitSyncGetBranchId(branchName).then((branchId) => {
        expect(branchId, `Branch ID for '${branchName}'`).to.be.a("string");
        return resolveAndFetch(branchId);
      });
    }

    return resolveAndFetch(null);
  });
});


/**
 * @tjCmd   assertion · validate the contents of the latest commit
 * @tjUsage cy.gitHubValidateCommit(expected)
 */
Cypress.Commands.add("gitHubValidateCommit", (branch, appName, appV2) => {
  return cy.gitHubFetchAppData(branch, appName).then((gitData) => {
    const { appJson, components, pages, queries, schema } = gitData;

    // --- app.json: scalar metadata ---
    expect(appJson.name, "app.json: name").to.equal(appV2.name);
    expect(appJson.type, "app.json: type").to.equal(appV2.type);
    expect(appJson.icon, "app.json: icon").to.equal(appV2.icon);
    expect(appJson.isMaintenanceOn, "app.json: isMaintenanceOn").to.equal(
      appV2.isMaintenanceOn,
    );
    expect(appJson.isPublic, "app.json: isPublic").to.equal(appV2.isPublic);

    // --- components: names present + type + desktop layout dimensions ---
    const gitCompNames = components.map((c) => c.name).sort();
    const expCompNames = (appV2.components || []).map((c) => c.name).sort();
    expect(gitCompNames, "components: all names committed").to.deep.equal(
      expCompNames,
    );

    for (const expComp of appV2.components || []) {
      const gitComp = components.find((c) => c.name === expComp.name);
      if (!gitComp) continue;
      expect(gitComp.type, `component "${expComp.name}": type`).to.equal(
        expComp.type,
      );
      const gitLayout = (gitComp.layouts || []).find(
        (l) => l.type === "desktop",
      );
      const expLayout = (expComp.layouts || []).find(
        (l) => l.type === "desktop",
      );
      if (gitLayout && expLayout) {
        expect(gitLayout.top, `"${expComp.name}" layout.top`).to.equal(
          expLayout.top,
        );
        expect(gitLayout.left, `"${expComp.name}" layout.left`).to.equal(
          expLayout.left,
        );
        expect(gitLayout.width, `"${expComp.name}" layout.width`).to.equal(
          expLayout.width,
        );
        expect(gitLayout.height, `"${expComp.name}" layout.height`).to.equal(
          expLayout.height,
        );
      }
    }

    // --- pages: names present ---
    const gitPageNames = pages.map((p) => p.name).sort();
    const expPageNames = (appV2.pages || []).map((p) => p.name).sort();
    expect(gitPageNames, "pages: all names committed").to.deep.equal(
      expPageNames,
    );

    // --- queries: names present ---
    const gitQueryNames = queries.map((q) => q.name).sort();
    const expQueryNames = (appV2.dataQueries || []).map((q) => q.name).sort();
    expect(gitQueryNames, "queries: all names committed").to.deep.equal(
      expQueryNames,
    );

    // --- schema: exact match ---
    const expSchema = appV2.schemaDetails || {
      multiPages: true,
      multiEnv: true,
      globalDataSources: true,
    };
    expect(schema, "schema matches").to.deep.equal(expSchema);

    Cypress.log({
      message: `[gitHub] ✓ Commit content validated for '${appName}' on '${branch}'`,
    });
    return gitData;
  });
});

/**
 * @tjCmd   assertion · assert a component's layout as committed to the repo
 * @tjUsage cy.gitHubAssertComponentLayout('MyApp', 'button1', layout)
 */
Cypress.Commands.add(
  "gitHubAssertComponentLayout",
  (branch, appName, componentName, expectedLayout) => {
    return cy.gitHubListAppPaths(branch).then((allPaths) => {
      const componentPaths = allPaths.filter(
        (p) =>
          p.startsWith(`apps/${appName}/components/`) && p.endsWith(".json"),
      );

      return readFilesFromPaths(branch, componentPaths).then((components) => {
        const gitComp = components.find((c) => c.name === componentName);
        expect(
          gitComp,
          `component "${componentName}" found in git on '${branch}'`,
        ).to.exist;

        const desktopLayout = (gitComp.layouts || []).find(
          (l) => l.type === "desktop",
        );
        expect(
          desktopLayout,
          `desktop layout for "${componentName}" exists in git`,
        ).to.exist;

        for (const [key, val] of Object.entries(expectedLayout)) {
          expect(
            desktopLayout[key],
            `"${componentName}" layout.${key}`,
          ).to.equal(val);
        }

        Cypress.log({
          message: `[gitHub] ✓ Layout of '${componentName}' validated on '${branch}'`,
        });
      });
    });
  },
);


/**
 * @tjCmd   gitsync · push the current app version to the branch
 * @tjUsage cy.apiGitSyncPush(appId, 'commit message')
 */
Cypress.Commands.add("apiGitSyncPush", (commitMessage, branchId = null) => {
  return cy.getAuthHeaders().then((headers) => {
    const body = { commitMessage };
    if (branchId) body.branchId = branchId;

    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/workspace-branches/push`,
        headers,
        body,
      })
      .then((res) => {
        expect(res.status, "API workspace push").to.be.oneOf([200, 201]);
        Cypress.log({
          message: `[gitSync] API push committed: "${commitMessage}"${branchId ? ` (branch ${branchId})` : ""}`,
        });
      });
  });
});

/**
 * @tjCmd   api · move or resize a component via the API
 * @tjUsage cy.apiUpdateComponentLayout(versionId, componentId, layout)
 */
Cypress.Commands.add(
  "apiUpdateComponentLayout",
  (appId, versionId, pageId, componentId, newLayout) => {
    return cy.getAuthHeaders().then((headers) =>
      cy
        .request({
          method: "PUT",
          url: `${Cypress.env("server_host")}/api/v2/apps/${appId}/versions/${versionId}/components/layout`,
          headers,
          body: {
            is_user_switched_version: false,
            pageId,
            diff: {
              [componentId]: {
                layouts: {
                  desktop: newLayout,
                },
              },
            },
          },
        })
        .then((res) => {
          expect(res.status, "Update component layout").to.be.oneOf([
            200, 204,
          ]);
          Cypress.log({
            message: `[gitSync] Component ${componentId} layout updated → ${JSON.stringify(newLayout)}`,
          });
        }),
    );
  },
);


/**
 * @tjCmd   api · change a datasource URL via the API
 * @tjUsage cy.apiUpdateDataSourceUrl(dsId, url)
 */
Cypress.Commands.add(
  "apiUpdateDataSourceUrl",
  (dataSourceId, environmentId, newUrl, branchId = null) => {
    return cy.getAuthHeaders().then((headers) => {
      return cy
        .request({
          method: "GET",
          url: `${Cypress.env("server_host")}/api/data-sources/${dataSourceId}/environment/${environmentId}`,
          headers,
          failOnStatusCode: false,
        })
        .then((getRes) => {
          const currentOptionsObj =
            getRes.status === 200 ? getRes.body?.options || {} : {};

          const mergedObj = {
            ...currentOptionsObj,
            url: { value: newUrl, encrypted: false },
          };

          const optionsArray = Object.entries(mergedObj).map(([key, opt]) => {
            const isEncrypted = !!opt?.encrypted;
            const hasCredentialId = !!opt?.credential_id;
            const rawValue = opt?.value !== undefined ? opt.value : null;
            return {
              key,
              value: isEncrypted && hasCredentialId ? null : rawValue,
              encrypted: isEncrypted,
            };
          });

          const qs = { environment_id: environmentId };
          if (branchId) qs.branch_id = branchId;

          return cy
            .request({
              method: "PUT",
              url: `${Cypress.env("server_host")}/api/data-sources/${dataSourceId}`,
              qs,
              headers,
              body: { options: optionsArray },
            })
            .then((res) => {
              expect(res.status, "Update datasource URL").to.be.oneOf([
                200, 204,
              ]);
              Cypress.log({
                message: `[gitSync] Datasource ${dataSourceId} URL → '${newUrl}' (env ${environmentId})`,
              });
            });
        });
    });
  },
);

/**
 * @tjCmd   api · resolve the app's current editing version id
 * @tjUsage cy.apiGetEditingVersionId(appId)
 */
Cypress.Commands.add("apiGetEditingVersionId", (appId, branchId = null) => {
  return cy.getAuthHeaders().then((headers) => {
    const reqHeaders = branchId ? { ...headers, "x-branch-id": branchId } : headers;
    return cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/apps/${appId}`,
        headers: reqHeaders,
      })
      .then((res) => {
        expect(res.status, `GET /api/apps/${appId}`).to.equal(200);
        const versionId = res.body.editing_version?.id;
        expect(versionId, "editing_version.id present").to.be.a("string");
        Cypress.log({
          message: `[gitSync] Editing version ID for app ${appId}: ${versionId}`,
        });
        return versionId;
      });
  });
});

/**
 * @tjCmd   gitsync · push from the app editor context
 * @tjUsage cy.apiEditorPush(appId, 'commit message')
 */
Cypress.Commands.add(
  "apiEditorPush",
  (appId, versionId, commitMessage, branchName, appName) => {
    return cy.getAuthHeaders().then((headers) => {
      const orgId = Cypress.env("workspaceId");

      // Step 1: resolve the AppGitSync record (auto-created if missing)
      return cy
        .request({
          method: "GET",
          url: `${Cypress.env("server_host")}/api/app-git/${orgId}/app/${versionId}`,
          headers,
        })
        .then((configRes) => {
          expect(configRes.status, "GET app-git config").to.equal(200);
          cy.log(`[log] app-git config response: ${JSON.stringify(configRes.body)}`);
          // Service decamelizes the response body → { app_git: { id, ... } }
          const appGitId = configRes.body?.app_git?.id;
          expect(appGitId, "AppGitSync id resolved").to.be.a("string");
          Cypress.log({
            message: `[gitSync] AppGitSync ID: ${appGitId} for '${appName}'`,
          });

          // Step 2: push app content to git
          return cy
            .request({
              method: "POST",
              url: `${Cypress.env("server_host")}/api/app-git/gitpush/${appGitId}/${versionId}`,
              headers,
              body: {
                gitAppName: appName,
                versionId,
                lastCommitMessage: commitMessage,
                // In platform-branching mode, gitVersionName is the git branch
                // name to push to (not the app version label). gitBranchName is
                // kept for compatibility but gitVersionName drives branch routing.
                gitVersionName: branchName,
                gitBranchName: branchName,
              },
            })
            .then((pushRes) => {
              expect(pushRes.status, "Editor push").to.be.oneOf([200, 201, 204]);
              cy.log(`[log] editor push response: ${JSON.stringify(pushRes.body)}`);
              Cypress.log({
                message: `[gitSync] Editor push: "${commitMessage}" → '${appName}' on '${branchName}'`,
              });
            });
        });
    });
  },
);

/**
 * @tjCmd   app-crud · create a new app version via the API
 * @tjUsage cy.apiCreateAppVersion(appId, 'v2')
 */
Cypress.Commands.add("apiCreateAppVersion", (appId, versionName, versionFromId, branchId = null) => {
  return cy.getAuthHeaders().then((headers) => {
    const reqHeaders = branchId ? { ...headers, "x-branch-id": branchId } : headers;
    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/apps/${appId}/versions`,
        headers: reqHeaders,
        body: { versionName, versionFromId },
      })
      .then((res) => {
        expect(res.status, `Create version '${versionName}'`).to.be.oneOf([200, 201]);
        const version = res.body?.version || res.body;
        expect(version?.id, "new version id").to.be.a("string");
        Cypress.log({ message: `[gitSync] Version '${versionName}' created (id: ${version.id})` });
        return version;
      });
  });
});

/**
 * @tjCmd   gitsync · create a git tag for an app version
 * @tjUsage cy.apiCreateGitTag(appId, 'v1.0.0')
 */
Cypress.Commands.add("apiCreateGitTag", (appId, versionId, message = null) => {
  return cy.getAuthHeaders().then((headers) => {
    const body = message ? { message } : {};
    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/app-git/${appId}/versions/${versionId}/tag`,
        headers,
        body,
        failOnStatusCode: false,
      })
      .then((res) => {
        if (res.status === 200 || res.status === 201) {
          Cypress.log({ message: `[gitSync] Git tag created: ${res.body?.tagName}` });
          return res.body;
        }
        // 400 "already exists" = the editor's auto-tag (non-awaited createGitTag inside
        // createVersion()) raced ahead and created the tag before this explicit call.
        // Treat as idempotent success: extract the tag name from the error message.
        if (res.status === 400) {
          const errMsg = res.body?.message || "";
          const match = errMsg.match(/Tag '([^']+)' already exists/);
          if (match) {
            const tagName = match[1];
            Cypress.log({
              message: `[gitSync] Tag '${tagName}' already created by auto-tag flow — returning success`,
            });
            return { success: true, tagName };
          }
        }
        expect(res.status, `Create git tag for version ${versionId}`).to.be.oneOf([200, 201]);
      });
  });
});
/**
 * @tjCmd   gitsync · attempt a git tag expecting a failure - negative cases
 * @tjUsage cy.apiCreateGitTagExpectError(appId, 'bad tag', 400)
 */
Cypress.Commands.add("apiCreateGitTagExpectError", (appId, versionId) => {
  return cy.getAuthHeaders().then((headers) =>
    cy.request({
      method: "POST",
      url: `${Cypress.env("server_host")}/api/app-git/${appId}/versions/${versionId}/tag`,
      headers,
      body: {},
      failOnStatusCode: false,
    }),
  );
});

/**
 * @tjCmd   assertion · assert whether a git tag exists
 * @tjUsage cy.apiCheckTagExists('v1.0.0')
 */
Cypress.Commands.add("apiCheckTagExists", (appId, versionName) => {
  return cy.getAuthHeaders().then((headers) =>
    cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/app-git/${appId}/check-tag/${encodeURIComponent(versionName)}`,
        headers,
      })
      .then((res) => {
        expect(res.status, `checkTagExists '${versionName}'`).to.equal(200);
        Cypress.log({
          message: `[gitSync] checkTagExists '${versionName}': exists=${res.body?.exists} tagName=${res.body?.tagName}`,
        });
        return res.body;
      }),
  );
});

/**
 * @tjCmd   app-crud · rename an app version via the API
 * @tjUsage cy.apiRenameAppVersion(versionId, 'v2')
 */
Cypress.Commands.add("apiRenameAppVersion", (appId, versionId, newName) => {
  return cy.getAuthHeaders().then((headers) =>
    cy
      .request({
        method: "PUT",
        url: `${Cypress.env("server_host")}/api/v2/apps/${appId}/versions/${versionId}`,
        headers,
        body: { name: newName },
      })
      .then((res) => {
        expect(res.status, `Rename version to '${newName}'`).to.be.oneOf([200, 201, 204]);
        Cypress.log({ message: `[gitSync] Version ${versionId} renamed to '${newName}'` });
      }),
  );
});

/**
 * @tjCmd   gitsync · read tag metadata from GitHub
 * @tjUsage cy.gitHubGetTagInfo('v1.0.0')
 */
Cypress.Commands.add("gitHubGetTagInfo", (tagName) => {
  const owner = Cypress.env("GITHUB_REPO_OWNER");
  const repo = Cypress.env("GITHUB_REPO_NAME");
  const ghHeaders = {
    Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
    Accept: "application/vnd.github+json",
  };

  return cy
    .request({
      method: "GET",
      url: `https://api.github.com/repos/${owner}/${repo}/git/ref/tags/${tagName}`,
      headers: ghHeaders,
      failOnStatusCode: false,
    })
    .then((refRes) => {
      if (refRes.status === 404) {
        Cypress.log({ message: `[gitHub] Tag not found: ${tagName}` });
        return null;
      }
      expect(refRes.status, `GET tag ref '${tagName}'`).to.equal(200);
      const refObj = refRes.body.object;

      if (refObj.type === "commit") {
        // Lightweight tag — no message
        return { sha: refObj.sha, message: null, tagger: null, type: "lightweight" };
      }

      // Annotated tag — dereference to get message + tagger
      return cy
        .request({
          method: "GET",
          url: `https://api.github.com/repos/${owner}/${repo}/git/tags/${refObj.sha}`,
          headers: ghHeaders,
        })
        .then((tagRes) => {
          expect(tagRes.status, `GET annotated tag object`).to.equal(200);
          Cypress.log({ message: `[gitHub] Tag '${tagName}': "${tagRes.body.message}"` });
          return {
            sha: tagRes.body.object.sha,
            message: tagRes.body.message,
            tagger: tagRes.body.tagger,
            type: "annotated",
          };
        });
    });
});

/**
 * @tjCmd   wait · wait until a tag disappears from GitHub
 * @tjUsage cy.gitHubWaitForTagGone('v1.0.0')
 */
Cypress.Commands.add("gitHubWaitForTagGone", (tagName, retries = 10) => {
  const owner = Cypress.env("GITHUB_REPO_OWNER");
  const repo = Cypress.env("GITHUB_REPO_NAME");

  const check = (remaining) =>
    cy
      .request({
        method: "GET",
        url: `https://api.github.com/repos/${owner}/${repo}/git/ref/tags/${tagName}`,
        headers: {
          Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
          Accept: "application/vnd.github+json",
        },
        failOnStatusCode: false,
      })
      .then((res) => {
        if (res.status === 404) {
          Cypress.log({ message: `[gitHub] ✓ Tag '${tagName}' is gone` });
          return;
        }
        if (remaining <= 0) {
          throw new Error(`Tag '${tagName}' still present after waiting`);
        }
        Cypress.log({
          message: `[gitHub] Waiting for tag '${tagName}' to be removed... (${remaining} left)`,
        });
        return cy.wait(3000).then(() => check(remaining - 1));
      });

  return check(retries);
});

/**
 * @tjCmd   gitsync · pull the branch state into the workspace
 * @tjUsage cy.apiGitSyncPull('main')
 */
Cypress.Commands.add("apiGitSyncPull", (branchId = null) => {
  return cy.getAuthHeaders().then((headers) => {
    const body = branchId ? { branchId } : {};
    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/workspace-branches/pull`,
        headers,
        body,
      })
      .then((res) => {
        expect(res.status, "API workspace pull").to.be.oneOf([200, 201]);
        cy.log(`[log] pull response: ${JSON.stringify(res.body)}`);
        Cypress.log({
          message: `[gitSync] Workspace pulled${branchId ? ` (branch ${branchId})` : ""}`,
        });
      });
  });
});

/**
 * @tjCmd   gitsync · switch the active branch via the API
 * @tjUsage cy.apiSwitchBranch('feature-x')
 */
Cypress.Commands.add("apiSwitchBranch", (branchId) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "PUT",
        url: `${Cypress.env("server_host")}/api/workspace-branches/${branchId}/activate`,
        headers,
        body: {},
      })
      .then((res) => {
        expect(res.status, `Switch branch ${branchId}`).to.be.oneOf([200, 201, 204]);
        Cypress.log({ message: `[gitSync] Switched to branch ${branchId}` });
      });
  });
});

/**
 * @tjCmd   api · create a query folder in an app version
 * @tjUsage cy.apiCreateQueryFolder(versionId, 'folder')
 */
Cypress.Commands.add("apiCreateQueryFolder", (versionId, name) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/data-query-folders`,
        headers,
        body: { name, appVersionId: versionId },
      })
      .then((res) => {
        expect(res.status, `POST /api/data-query-folders (${name})`).to.be.oneOf([200, 201]);
        Cypress.log({ message: `[lifecycle] Created folder '${name}': ${JSON.stringify(res.body?.folder?.id)}` });
        return res.body;
      });
  });
});

/**
 * @tjCmd   api · reorder an item inside a folder
 * @tjUsage cy.apiReorderFolderItem(folderId, itemId, 1)
 */
Cypress.Commands.add("apiReorderFolderItem", (childId, childType, newIndex, parentId = null) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "PATCH",
        url: `${Cypress.env("server_host")}/api/data-query-folders/reorder`,
        headers,
        body: { childId, childType, newIndex, parentId },
      })
      .then((res) => {
        expect(res.status, `PATCH reorder ${childType} ${childId}`).to.be.oneOf([200, 201, 204]);
        Cypress.log({ message: `[lifecycle] Reordered ${childType} ${childId} into parent ${parentId}` });
      });
  });
});

/**
 * @tjCmd   api · delete a query folder
 * @tjUsage cy.apiDeleteQueryFolder(folderId)
 */
Cypress.Commands.add("apiDeleteQueryFolder", (folderId, mode = "folder_only") => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "DELETE",
        url: `${Cypress.env("server_host")}/api/data-query-folders/${folderId}`,
        headers,
        body: { mode },
      })
      .then((res) => {
        expect(res.status, `DELETE /api/data-query-folders/${folderId}`).to.be.oneOf([200, 201, 204]);
        Cypress.log({ message: `[lifecycle] Deleted folder ${folderId} (mode: ${mode})` });
      });
  });
});

/**
 * @tjCmd   api · add a page to an app version
 * @tjUsage cy.apiCreatePage(versionId, 'Reports')
 */
Cypress.Commands.add("apiCreatePage", (appId, versionId, pageName, pageId, index = 1) => {
  return cy.getAuthHeaders().then((headers) => {
    const handle = pageName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/v2/apps/${appId}/versions/${versionId}/pages`,
        headers,
        body: { id: pageId, name: pageName, handle, index },
      })
      .then((res) => {
        expect(res.status, `POST pages (${pageName})`).to.be.oneOf([200, 201, 204]);
        Cypress.log({ message: `[lifecycle] Created page '${pageName}' (id: ${pageId})` });
      });
  });
});

/**
 * @tjCmd   api · delete a page from an app version
 * @tjUsage cy.apiDeletePage(pageId)
 */
Cypress.Commands.add("apiDeletePage", (appId, versionId, pageId) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "DELETE",
        url: `${Cypress.env("server_host")}/api/v2/apps/${appId}/versions/${versionId}/pages`,
        headers,
        body: { pageId, deleteAssociatedPages: true },
      })
      .then((res) => {
        expect(res.status, `DELETE page ${pageId}`).to.be.oneOf([200, 201, 204]);
        Cypress.log({ message: `[lifecycle] Deleted page ${pageId}` });
      });
  });
});

/**
 * @tjCmd   api · add a data query to an app version
 * @tjUsage cy.apiCreateQuery(versionId, payload)
 */
Cypress.Commands.add("apiCreateQuery", (dataSourceId, versionId, queryName, kind = "restapi", options = {}) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/data-queries/data-sources/${dataSourceId}/versions/${versionId}`,
        headers,
        body: { name: queryName, kind, options, app_version_id: versionId },
      })
      .then((res) => {
        expect(res.status, `POST data-query (${queryName})`).to.be.oneOf([200, 201]);
        Cypress.log({ message: `[lifecycle] Created query '${queryName}': ${res.body?.id}` });
        return res.body;
      });
  });
});

/**
 * @tjCmd   api · delete a data query
 * @tjUsage cy.apiDeleteQuery(queryId)
 */
Cypress.Commands.add("apiDeleteQuery", (queryId, versionId) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "DELETE",
        url: `${Cypress.env("server_host")}/api/data-queries/${queryId}/versions/${versionId}`,
        headers,
      })
      .then((res) => {
        expect(res.status, `DELETE data-query ${queryId}`).to.be.oneOf([200, 201, 204]);
        Cypress.log({ message: `[lifecycle] Deleted query ${queryId}` });
      });
  });
});

/**
 * @tjCmd   api · delete a component from the canvas via the API
 * @tjUsage cy.apiDeleteComponent(versionId, componentId)
 */
Cypress.Commands.add("apiDeleteComponent", (appId, versionId, componentId, pageId) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "DELETE",
        url: `${Cypress.env("server_host")}/api/v2/apps/${appId}/versions/${versionId}/components`,
        headers,
        body: {
          diff: [componentId],
          pageId,
          is_user_switched_version: false,
        },
      })
      .then((res) => {
        expect(res.status, `DELETE component ${componentId}`).to.be.oneOf([200, 201, 204]);
        Cypress.log({ message: `[lifecycle] Deleted component ${componentId} from page ${pageId}` });
      });
  });
});

/**
 * @tjCmd   gitsync · merge an open pull request on GitHub
 * @tjUsage cy.gitHubMergePR(prNumber)
 */
Cypress.Commands.overwrite("gitHubMergePR", (originalFn, prNumber = Cypress.env("prNumber")) => {
  const owner = Cypress.env("GITHUB_REPO_OWNER");
  const repo = Cypress.env("GITHUB_REPO_NAME");
  const ghHeaders = {
    Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
    Accept: "application/vnd.github+json",
  };

  const METHODS = ["squash", "merge", "rebase"];

  const tryMerge = (methods) => {
    if (methods.length === 0) {
      throw new Error(`[gitSync] PR #${prNumber}: all merge methods (squash, merge, rebase) returned 405`);
    }
    const [method, ...rest] = methods;
    return cy
      .request({
        method: "PUT",
        url: `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/merge`,
        headers: ghHeaders,
        body: { merge_method: method },
        failOnStatusCode: false,
      })
      .then((res) => {
        if (res.status === 200) {
          Cypress.log({ message: `[gitSync] PR #${prNumber} merged (${method})` });
          return;
        }
        if (res.status === 405) {
          Cypress.log({ message: `[gitSync] ${method} not allowed for PR #${prNumber}, trying next method` });
          return tryMerge(rest);
        }
        expect(res.status, `GitHub merge PR #${prNumber} (${method})`).to.equal(200);
      });
  };

  return tryMerge(METHODS);
});


/**
 * @tjCmd   app-crud · move an app into a dashboard folder
 * @tjUsage cy.apiAddAppToFolder(appId, folderId)
 */
Cypress.Commands.add("apiAddAppToFolder", (folderId, appId) => {
  return cy.getAuthHeaders().then((headers) =>
    cy
      .request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/folder-apps`,
        headers,
        body: { folder_id: folderId, app_id: appId },
      })
      .then((res) => {
        expect(res.status, `Add app ${appId} to folder ${folderId}`).to.be.oneOf([200, 201]);
        Cypress.log({ message: `[gitSync] App ${appId} added to folder ${folderId}` });
      }),
  );
});

/**
 * @tjCmd   assertion · assert the repo reflects an app's folder placement
 * @tjUsage cy.gitHubAssertAppInFolder('MyApp', 'QA folder')
 */
Cypress.Commands.add("gitHubAssertAppInFolder", (branch, folderName, appName) => {
  return cy.gitHubListAppPaths(branch).then((paths) => {
    expect(
      paths,
      `apps/${folderName}/${appName}/ exists on branch '${branch}'`,
    ).to.include(`apps/${folderName}/${appName}/app/app.json`);
    Cypress.log({ message: `[gitHub] ✓ apps/${folderName}/${appName}/ exists on '${branch}'` });
  });
});

/**
 * @tjCmd   assertion · assert the metadata path for an app in the repo
 * @tjUsage cy.gitHubAssertAppMetaPath('MyApp', path)
 */
Cypress.Commands.add("gitHubAssertAppMetaPath", (branch, expectedPath) => {
  return cy
    .gitHubGetFileJson(branch, ".meta/appMeta.json")
    .then((meta) => {
      expect(meta, ".meta/appMeta.json exists").to.not.be.null;
      const paths = Object.values(meta).map((entry) => entry.appPath);
      expect(paths, `appMeta.json has entry with appPath "${expectedPath}"`).to.include(expectedPath);
      Cypress.log({ message: `[gitHub] ✓ appMeta.json has appPath "${expectedPath}" on '${branch}'` });
      return meta;
    });
});

/**
 * apiSaveAppVersion — saves (converts) an existing draft version to a named PUBLISHED version.
 *
 * When platform branching is enabled, you cannot create a second non-BRANCH draft.
 * The UI "Save version" button does NOT call POST /api/apps/{id}/versions to create a new version;
 * it calls PUT /api/v2/apps/{appId}/versions/{versionId} with { name, status: 'PUBLISHED' }
 * to rename the existing draft and publish it.
 *
 * Returns a minimal version-like object { id: versionId, name: versionName } so callers can
 * chain .then((v1) => { v1VersionId = v1.id; ... }).
 */
/**
 * @tjCmd   app-crud · persist changes to an app version
 * @tjUsage cy.apiSaveAppVersion(versionId, definition)
 */
Cypress.Commands.add("apiSaveAppVersion", (appId, versionId, versionName, branchId = null) => {
  return cy.getAuthHeaders().then((headers) => {
    const reqHeaders = branchId ? { ...headers, "x-branch-id": branchId } : headers;
    return cy
      .request({
        method: "PUT",
        url: `${Cypress.env("server_host")}/api/v2/apps/${appId}/versions/${versionId}`,
        headers: reqHeaders,
        body: { name: versionName, status: "PUBLISHED" },
      })
      .then((res) => {
        expect(res.status, `Save version '${versionName}'`).to.be.oneOf([200, 201, 204]);
        Cypress.log({
          message: `[gitSync] Version ${versionId} saved as '${versionName}' (PUBLISHED)`,
        });
        // The PUT endpoint returns an empty body on 204; return a minimal version object.
        return { id: versionId, name: versionName };
      });
  });
});

/**
 * gitHubWaitForTag — polls GitHub until the annotated tag with the given name exists,
 * then returns the tag object { sha, message, tagger, type }.
 *
 * Mirrors gitHubWaitForTagGone but waits for presence instead of absence.
 */
/**
 * @tjCmd   wait · wait until a tag appears on GitHub
 * @tjUsage cy.gitHubWaitForTag('v1.0.0')
 */
Cypress.Commands.add("gitHubWaitForTag", (tagName, retries = 15) => {
  const owner = Cypress.env("GITHUB_REPO_OWNER");
  const repo = Cypress.env("GITHUB_REPO_NAME");

  const check = (remaining) =>
    cy
      .request({
        method: "GET",
        url: `https://api.github.com/repos/${owner}/${repo}/git/ref/tags/${tagName}`,
        headers: {
          Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
          Accept: "application/vnd.github+json",
        },
        failOnStatusCode: false,
      })
      .then((refRes) => {
        if (refRes.status === 200) {
          const refObj = refRes.body.object;

          if (refObj.type === "commit") {
            // Lightweight tag — no message
            Cypress.log({ message: `[gitHub] ✓ Tag '${tagName}' found (lightweight)` });
            return { sha: refObj.sha, message: null, tagger: null, type: "lightweight" };
          }

          // Annotated tag — dereference to get message + tagger
          return cy
            .request({
              method: "GET",
              url: `https://api.github.com/repos/${owner}/${repo}/git/tags/${refObj.sha}`,
              headers: {
                Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
                Accept: "application/vnd.github+json",
              },
            })
            .then((tagRes) => {
              Cypress.log({
                message: `[gitHub] ✓ Tag '${tagName}' found: "${tagRes.body.message}"`,
              });
              return {
                sha: tagRes.body.object.sha,
                message: tagRes.body.message,
                tagger: tagRes.body.tagger,
                type: "annotated",
              };
            });
        }

        if (remaining <= 0) {
          throw new Error(`Tag '${tagName}' not found on GitHub after waiting`);
        }
        Cypress.log({
          message: `[gitHub] Waiting for tag '${tagName}'... (${remaining} left)`,
        });
        return cy.wait(4000).then(() => check(remaining - 1));
      });

  return check(retries);
});

/**
 * apiEnsureAppDraft — triggers the server-side hydration of a stub app version.
 *
 * After a workspace pull (apiGitSyncPull), apps only have stub versions (isStub=true).
 * The server's GET /api/apps/:id handler triggers hydration lazily when the editor opens.
 * For API-only test flows that need a real draft (isStub=false) before the UI opens,
 * call this command first — it hits POST /api/workspace-branches/ensure-draft which
 * clones the app content from git and creates a proper DRAFT version.
 *
 * Returns { draftVersionId } — the hydrated draft's version ID.
 */
/**
 * @tjCmd   app-crud · ensure the app has an editable draft version
 * @tjUsage cy.apiEnsureAppDraft(appId)
 */
Cypress.Commands.add("apiEnsureAppDraft", (appId, branchId = null) => {
  return cy.getAuthHeaders().then((headers) => {
    const body = { appId };
    if (branchId) body.branchId = branchId;

    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/workspace-branches/ensure-draft`,
        headers,
        body,
        failOnStatusCode: false,
      })
      .then((res) => {
        if (res.status === 404 || res.status === 405) {
          // Endpoint not available (CE build or older server) — skip silently.
          Cypress.log({ message: `[gitSync] ensure-draft not available (${res.status}) — skipping` });
          return { draftVersionId: null };
        }
        expect(res.status, `ensure-draft for app ${appId}`).to.be.oneOf([200, 201]);
        Cypress.log({
          message: `[gitSync] App ${appId} draft ensured on branch ${branchId}: ${res.body?.draftVersionId}`,
        });
        return res.body;
      });
  });
});
