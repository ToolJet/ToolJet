import { pollUntil } from "Support/utils/platform/gitSync/poll";

/**
 * GitHub REST helpers for the git sync suite.
 *
 * Isolation model: every spec works under its own ref prefix (see `runPrefix`)
 * and its own base branch, so specs never reset a shared branch or delete
 * refs they did not create. Auth is a GitHub App installation token minted by
 * the `gitHubAppToken` task (cypress/config/gitHubAppToken.js); repo comes from
 * GITHUB_REPO_OWNER / GITHUB_REPO_NAME.
 *
 * Every call goes through `ghRequest` with failOnStatusCode:false so a failed
 * request never prints the Authorization header; callers assert on status.
 */

const EMPTY_TREE_SHA = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

const apiBase = () =>
  Cypress.env("GITHUB_API_BASE_URL") || "https://api.github.com";

const repoPath = () =>
  `${apiBase()}/repos/${Cypress.env("GITHUB_REPO_OWNER")}/${Cypress.env("GITHUB_REPO_NAME")}`;

const ghRequest = (method, path, body) =>
  cy.task("gitHubAppToken", null, { log: false }).then((token) =>
    cy.request({
      method,
      url: `${repoPath()}${path}`,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      body,
      failOnStatusCode: false,
      log: false,
    }),
  );

const encodeRef = (ref) => ref.split("/").map(encodeURIComponent).join("/");

/**
 * Unique ref prefix for one spec run. Deliberately not `test-` — the legacy
 * gitHubResetRepo command deletes every `test-*` branch.
 *
 * @tjType gitSync.runPrefix
 * @tjBlock gitSync
 * @tjUsage const prefix = runPrefix("config")
 * @tjDom none - pure function
 */
export const runPrefix = (specKey) =>
  `gs-${specKey}-${Date.now().toString(36)}`;

/**
 * @tjType gitHub.getBranchHead
 * @tjBlock gitSync
 * @tjUsage getBranchHeadViaAPI("gs-config-x/base").then((sha) => ...)
 * @tjDom none - GET /repos/:o/:r/git/ref/heads/:branch
 * @returns {Cypress.Chainable<string|null>} head commit sha, null when the branch is absent
 */
export const getBranchHeadViaAPI = (branch) =>
  ghRequest("GET", `/git/ref/heads/${encodeRef(branch)}`).then((res) =>
    res.status === 200 ? res.body.object.sha : null,
  );

/**
 * Create `branch` holding a single empty-tree commit, parented on the repo's
 * default branch head. Used as a spec's isolated ToolJet default branch.
 *
 * @tjType gitHub.createBaseBranch
 * @tjBlock gitSync
 * @tjUsage createBaseBranchViaAPI(`${prefix}-base`)
 * @tjDom none - POST /repos/:o/:r/git/commits + POST /git/refs
 */
export const createBaseBranchViaAPI = (branch) =>
  ghRequest("GET", "")
    .then((repoRes) => {
      expect(repoRes.status, "GitHub repo readable").to.equal(200);
      return getBranchHeadViaAPI(repoRes.body.default_branch);
    })
    .then((parentSha) =>
      ghRequest("POST", "/git/commits", {
        message: `chore: base branch ${branch} for cypress run`,
        tree: EMPTY_TREE_SHA,
        parents: parentSha ? [parentSha] : [],
      }),
    )
    .then((commitRes) => {
      expect(commitRes.status, `create base commit for ${branch}`).to.equal(201);
      return ghRequest("POST", "/git/refs", {
        ref: `refs/heads/${branch}`,
        sha: commitRes.body.sha,
      });
    })
    .then((refRes) => {
      expect(refRes.status, `create base branch ${branch}`).to.equal(201);
      Cypress.log({ name: "gitHub", message: `base branch ${branch} created` });
      return branch;
    });

/**
 * Create `branch` on the remote pointing at `fromBranch`'s head — a branch that
 * exists in git but not in ToolJet (import cases).
 *
 * @tjType gitHub.createBranch
 * @tjBlock gitSync
 * @tjUsage createRemoteBranchViaAPI(`${prefix}-remote-only`, ctx.baseBranch)
 * @tjDom none - POST /repos/:o/:r/git/refs
 */
export const createRemoteBranchViaAPI = (branch, fromBranch) =>
  getBranchHeadViaAPI(fromBranch)
    .then((sha) => ghRequest("POST", "/git/refs", { ref: `refs/heads/${branch}`, sha }))
    .then((res) => {
      expect(res.status, `create remote branch ${branch}`).to.equal(201);
      return branch;
    });

/**
 * Delete every branch whose name starts with `prefix`. Teardown only.
 *
 * @tjType gitHub.cleanupRefs
 * @tjBlock gitSync
 * @tjUsage deleteBranchesByPrefixViaAPI(prefix) - teardown
 * @tjDom none - GET /git/matching-refs/heads/:prefix + DELETE /git/refs/heads/:b
 */
export const deleteBranchesByPrefixViaAPI = (prefix) =>
  ghRequest("GET", `/git/matching-refs/heads/${encodeRef(prefix)}`).then(
    (res) => {
      const refs = Array.isArray(res.body) ? res.body : [];
      refs.forEach((r) => ghRequest("DELETE", `/${r.ref.replace(/^refs\//, "git/refs/")}`));
      Cypress.log({ name: "gitHub", message: `cleanup ${refs.length} ref(s) under ${prefix}` });
    },
  );

/**
 * Delete run branches left behind by crashed runs (teardown never ran). Only
 * `gs-<spec>-<base36 timestamp>…` refs older than `maxAgeMs` are touched, so
 * concurrent runs and other people's branches are safe. Every ToolJet workspace
 * seeds a branch row per remote branch, so stale refs slow every later run.
 *
 * @tjType gitHub.cleanupStaleRefs
 * @tjBlock gitSync
 * @tjUsage deleteStaleRunRefsViaAPI() - teardown
 * @tjDom none - GET /git/matching-refs/heads/gs- + DELETE
 */
export const deleteStaleRunRefsViaAPI = (maxAgeMs = 2 * 60 * 60 * 1000) =>
  ghRequest("GET", "/git/matching-refs/heads/gs-").then((res) => {
    const refs = Array.isArray(res.body) ? res.body : [];
    // source: runPrefix() above — `gs-<specKey>-<Date.now().toString(36)>`
    const stale = refs.filter((r) => {
      const m = r.ref.replace("refs/heads/", "").match(/^gs-.+?-([0-9a-z]{8})(?:-|$)/);
      return m && Date.now() - parseInt(m[1], 36) > maxAgeMs;
    });
    stale.forEach((r) => ghRequest("DELETE", `/${r.ref.replace(/^refs\//, "git/refs/")}`));
    Cypress.log({ name: "gitHub", message: `swept ${stale.length} stale run ref(s)` });
  });

/**
 * Delete every tag starting with `prefix` (tags are `<co_relation_id>/<version>`).
 *
 * @tjType gitHub.cleanupTags
 * @tjBlock gitSync
 * @tjUsage deleteTagsByPrefixViaAPI(appCoRelationId) - teardown
 * @tjDom none - GET /git/matching-refs/tags/:prefix + DELETE
 */
export const deleteTagsByPrefixViaAPI = (prefix) =>
  ghRequest("GET", `/git/matching-refs/tags/${encodeRef(prefix)}`).then((res) => {
    const refs = Array.isArray(res.body) ? res.body : [];
    refs.forEach((r) => ghRequest("DELETE", `/${r.ref.replace(/^refs\//, "git/refs/")}`));
  });

/**
 * @tjType gitHub.waitForBranch
 * @tjBlock gitSync
 * @tjUsage waitForRemoteBranchViaAPI("gs-x-feature", { exists: false })
 * @tjDom none - polls GET /git/ref/heads/:branch
 */
export const waitForRemoteBranchViaAPI = (branch, { exists = true } = {}) =>
  pollUntil(
    () => getBranchHeadViaAPI(branch),
    (sha) => (exists ? !!sha : !sha),
    { label: `remote branch ${branch} ${exists ? "present" : "gone"}` },
  );

/**
 * @tjType gitHub.getHeadCommit
 * @tjBlock gitSync
 * @tjUsage getHeadCommitViaAPI(branch).then(({ sha, message }) => ...)
 * @tjDom none - GET /commits/:branch
 */
export const getHeadCommitViaAPI = (branch) =>
  ghRequest("GET", `/commits/${encodeRef(branch)}`).then((res) =>
    res.status === 200
      ? { sha: res.body.sha, message: res.body.commit.message }
      : null,
  );

/**
 * @tjType gitHub.waitForCommit
 * @tjBlock gitSync
 * @tjUsage waitForCommitMessageViaAPI(branch, commitMessage)
 * @tjDom none - polls GET /commits/:branch
 */
export const waitForCommitMessageViaAPI = (branch, fragment) =>
  pollUntil(
    () => getHeadCommitViaAPI(branch),
    (head) => !!head && head.message.includes(fragment),
    { label: `commit "${fragment}" on ${branch}` },
  );

/**
 * Open a PR from `head` into `base` and merge it (squash, then merge, then rebase).
 * Yields the merge commit sha.
 *
 * @tjType gitHub.mergeBranch
 * @tjBlock gitSync
 * @tjUsage mergeBranchViaAPI(featureBranch, baseBranch)
 * @tjDom none - GET /compare + POST /pulls + PUT /pulls/:n/merge
 */
export const mergeBranchViaAPI = (head, base, title = `merge ${head}`) =>
  pollUntil(
    () => ghRequest("GET", `/compare/${encodeRef(base)}...${encodeRef(head)}`),
    (res) => res.status === 200 && res.body.ahead_by > 0,
    { label: `${head} ahead of ${base}` },
  )
    .then(() => ghRequest("POST", "/pulls", { title, head, base }))
    .then((prRes) => {
      expect(prRes.status, `create PR ${head} → ${base}`).to.equal(201);
      const prNumber = prRes.body.number;
      const tryMerge = (methods) =>
        ghRequest("PUT", `/pulls/${prNumber}/merge`, { merge_method: methods[0] }).then(
          (mergeRes) => {
            if (mergeRes.status === 405 && methods.length > 1) return tryMerge(methods.slice(1));
            expect(mergeRes.status, `merge PR #${prNumber}`).to.equal(200);
            return mergeRes.body.sha;
          },
        );
      return tryMerge(["squash", "merge", "rebase"]);
    });

/**
 * Commit raw files straight to `branch` (no ToolJet involved). Used to seed the
 * "remote" side of conflict cases. `files` maps repo path → string or object (JSON).
 *
 * @tjType gitHub.commitFiles
 * @tjBlock gitSync
 * @tjUsage commitFilesViaAPI(base, { "apps/x/app/app.json": appJson }, "seed remote")
 * @tjDom none - git data API: trees + commits + PATCH ref
 */
export const commitFilesViaAPI = (branch, files, message) =>
  getBranchHeadViaAPI(branch).then((parentSha) =>
    ghRequest("GET", `/git/commits/${parentSha}`).then((parent) =>
      ghRequest("POST", "/git/trees", {
        base_tree: parent.body.tree.sha,
        tree: Object.entries(files).map(([path, content]) => ({
          path,
          mode: "100644",
          type: "blob",
          content: typeof content === "string" ? content : JSON.stringify(content, null, 2),
        })),
      })
        .then((treeRes) =>
          ghRequest("POST", "/git/commits", {
            message,
            tree: treeRes.body.sha,
            parents: [parentSha],
          }),
        )
        .then((commitRes) =>
          ghRequest("PATCH", `/git/refs/heads/${encodeRef(branch)}`, {
            sha: commitRes.body.sha,
          }).then((refRes) => {
            expect(refRes.status, `commit files to ${branch}`).to.equal(200);
            return commitRes.body.sha;
          }),
        ),
    ),
  );

/**
 * @tjType gitHub.listTree
 * @tjBlock gitSync
 * @tjUsage listRepoPathsViaAPI(branch).then((paths) => ...)
 * @tjDom none - GET /git/trees/:sha?recursive=1
 * @returns {Cypress.Chainable<string[]>} every blob path on the branch
 */
export const listRepoPathsViaAPI = (branch) =>
  getBranchHeadViaAPI(branch).then((sha) =>
    ghRequest("GET", `/git/trees/${sha}?recursive=1`).then((res) =>
      (res.body.tree || []).filter((e) => e.type === "blob").map((e) => e.path),
    ),
  );

/**
 * @tjType gitHub.readJson
 * @tjBlock gitSync
 * @tjUsage readRepoJsonViaAPI(branch, "apps/x/app/app.json")
 * @tjDom none - GET /contents/:path?ref=:branch
 * @returns {Cypress.Chainable<object|null>} parsed JSON, null when the file is absent
 */
export const readRepoJsonViaAPI = (branch, filePath) =>
  ghRequest(
    "GET",
    `/contents/${filePath.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(branch)}`,
  ).then((res) => {
    if (res.status !== 200) return null;
    const decoded = decodeURIComponent(escape(atob(res.body.content.replace(/\n/g, ""))));
    return JSON.parse(decoded);
  });

/**
 * @tjType gitHub.getTag
 * @tjBlock gitSync
 * @tjUsage getTagViaAPI(`${coRelId}/v1`).then((tag) => ...)
 * @tjDom none - GET /git/ref/tags/:tag (+ /git/tags/:sha when annotated)
 * @returns {Cypress.Chainable<{sha:string,message:string|null}|null>}
 */
export const getTagViaAPI = (tagName) =>
  ghRequest("GET", `/git/ref/tags/${encodeRef(tagName)}`).then((res) => {
    if (res.status !== 200) return null;
    if (res.body.object.type !== "tag") return { sha: res.body.object.sha, message: null };
    return ghRequest("GET", `/git/tags/${res.body.object.sha}`).then((tagRes) => ({
      sha: tagRes.body.object.sha,
      message: tagRes.body.message,
    }));
  });

/**
 * @tjType gitHub.waitForTag
 * @tjBlock gitSync
 * @tjUsage waitForTagViaAPI(tagName, { exists: false })
 * @tjDom none - polls GET /git/ref/tags/:tag
 */
export const waitForTagViaAPI = (tagName, { exists = true } = {}) =>
  pollUntil(
    () => getTagViaAPI(tagName),
    (tag) => (exists ? !!tag : !tag),
    { label: `tag ${tagName} ${exists ? "present" : "gone"}` },
  );

/**
 * Per-spec isolation: a base branch of its own in the shared repo.
 *
 * @tjType gitHub.prepareRepo
 * @tjBlock gitSync
 * @tjUsage prepareRepoViaAPI(prefix).then(({ baseBranch }) => ...)
 * @tjDom none - POST /git/commits + POST /git/refs
 */
export const prepareRepoViaAPI = (prefix) =>
  createBaseBranchViaAPI(`${prefix}-base`).then((baseBranch) => ({ baseBranch }));
