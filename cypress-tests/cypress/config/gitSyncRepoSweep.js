/**
 * Once per `cypress run`, before the first spec: delete what earlier runs left on the shared
 * git sync test repo. Only refs older than STALE_AFTER_MS go, so a concurrent run keeps its own.
 * - branches `gs-<specKey>-<base36 time>…` (see runPrefix in support/utils/platform/gitSync/gitHubRepo.js)
 * - tags whose commit is older than the cut-off (tags are `<co_relation_id>/<version>` and carry no time)
 * A failed sweep is logged and never fails the run.
 */

const STALE_AFTER_MS = 2 * 60 * 60 * 1000;
const RUN_BRANCH = /^gs-.+?-([0-9a-z]{8})(?:-|$)/;

module.exports = (on, config, getToken) => {
  const apiBase = config.env.GITHUB_API_BASE_URL || "https://api.github.com";
  const repo = `${apiBase}/repos/${config.env.GITHUB_REPO_OWNER}/${config.env.GITHUB_REPO_NAME}`;

  const gh = async (method, path) => {
    const res = await fetch(`${repo}${path}`, {
      method,
      headers: { Authorization: `Bearer ${await getToken()}`, Accept: "application/vnd.github+json" },
    });
    return { status: res.status, body: res.status === 204 ? null : await res.json().catch(() => null) };
  };

  const deleteRef = (ref) => gh("DELETE", `/${ref.replace(/^refs\//, "git/refs/")}`);

  const commitTime = async (object) => {
    const commitSha =
      object.type === "tag" ? (await gh("GET", `/git/tags/${object.sha}`)).body?.object?.sha : object.sha;
    const commit = commitSha && (await gh("GET", `/git/commits/${commitSha}`)).body;
    return commit?.committer?.date ? Date.parse(commit.committer.date) : null;
  };

  const sweep = async () => {
    const cutoff = Date.now() - STALE_AFTER_MS;

    const branches = (await gh("GET", "/git/matching-refs/heads/gs-")).body || [];
    const staleBranches = branches.filter((r) => {
      const m = r.ref.replace("refs/heads/", "").match(RUN_BRANCH);
      return m && parseInt(m[1], 36) < cutoff;
    });
    for (const r of staleBranches) await deleteRef(r.ref);

    const tags = (await gh("GET", "/git/matching-refs/tags/")).body || [];
    let staleTags = 0;
    for (const t of tags) {
      const time = await commitTime(t.object);
      if (time !== null && time < cutoff) {
        await deleteRef(t.ref);
        staleTags += 1;
      }
    }
    console.log(`[gitSync] repo sweep: ${staleBranches.length} stale branch(es), ${staleTags} stale tag(s) deleted`);
  };

  on("before:run", async () => {
    if (!config.env.GITHUB_REPO_OWNER || !config.env.GITHUB_REPO_NAME) return;
    try {
      await sweep();
    } catch (err) {
      console.log(`[gitSync] repo sweep skipped: ${err.message}`);
    }
  });
};
