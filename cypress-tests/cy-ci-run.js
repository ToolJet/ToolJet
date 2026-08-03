// cy-ci-run.js — run Cypress via the module API and write summary.json.
//
// Replaces the `cypress-io/github-action` run step so each CI cell can emit a
// machine-readable result for the Slack notifier. The action only installs the
// binary now (runTests: false); this script does the actual run and captures
// counts the built-in `--reporter json` can't write to a file.
//
// Driven by env vars (all optional except CELL is recommended):
//   CELL           human label for the cell, e.g. "Platform / ee"
//   CONFIG_FILE    --config-file value, e.g. cypress-ee-platform.config.js
//   CYPRESS_CONFIG comma-separated --config string, e.g.
//                  "baseUrl=http://localhost:4001,server_host=http://localhost:3000"
//   BROWSER        --browser value, e.g. chrome (omit for the Cypress default)
// CYPRESS_* env vars (e.g. CYPRESS_proxy) are picked up by Cypress automatically.
const fs = require("fs");
const cypress = require("cypress");

const cell = process.env.CELL || "cypress";
const write = (s) => fs.writeFileSync("summary.json", JSON.stringify(s));

// Parse "k1=v1,k2=v2" into a config object, mirroring the action's `config:`
// input. Equivalent to `cypress run --config k1=v1,k2=v2` — same validation.
function parseConfig(str) {
  const config = {};
  if (!str) return config;
  for (const pair of str.split(",")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    config[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  }
  return config;
}

const runOptions = { config: parseConfig(process.env.CYPRESS_CONFIG) };
if (process.env.CONFIG_FILE) runOptions.configFile = process.env.CONFIG_FILE;
if (process.env.BROWSER) runOptions.browser = process.env.BROWSER;

cypress
  .run(runOptions)
  .then((results) => {
    // status:"failed" means Cypress itself could not run (e.g. config/build
    // error) — there are no test counts to report.
    if (results.status === "failed") {
      console.error(results.message);
      write({ cell, result: "failure", stats: null });
      process.exit(1);
    }
    write({
      cell,
      result: results.totalFailed > 0 ? "failure" : "success",
      stats: {
        tests: results.totalTests,
        passes: results.totalPassed,
        failures: results.totalFailed,
        pending: results.totalPending,
        skipped: results.totalSkipped,
        duration: results.totalDuration,
      },
    });
    process.exit(results.totalFailed > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error(err);
    write({ cell, result: "failure", stats: null });
    process.exit(1);
  });
