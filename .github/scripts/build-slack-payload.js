// Builds the Slack chat.postMessage payload for the notify-slack job.
//
// Reads every summaries/<artifact>/summary.json produced by the matrix cells,
// renders a per-cell pass/fail/duration breakdown plus totals, and writes the
// complete Block Kit payload to payload.json (consumed via the action's
// payload-file-path input). Driven entirely by env vars set in the workflow.

const fs = require("fs");
const path = require("path");

const env = process.env;
const SUMMARY_DIR = "summaries";

// Collect each cell's summary.json (one per artifact subdirectory). Missing or
// malformed files are skipped — the overall headline still reflects reality
// via the OVERALL job result.
function loadCells() {
  const cells = [];
  let entries = [];
  try {
    entries = fs.readdirSync(SUMMARY_DIR);
  } catch {
    return cells;
  }
  for (const entry of entries) {
    const file = path.join(SUMMARY_DIR, entry, "summary.json");
    try {
      cells.push(JSON.parse(fs.readFileSync(file, "utf8")));
    } catch {
      // no readable summary for this cell — ignore
    }
  }
  // Stable, readable order regardless of artifact download order.
  return cells.sort((a, b) => String(a.cell).localeCompare(String(b.cell)));
}

function fmtDuration(ms) {
  if (!ms && ms !== 0) return "—";
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s - m * 60)}s`;
}

const cells = loadCells();

const totals = { tests: 0, passes: 0, failures: 0, pending: 0, duration: 0 };
for (const c of cells) {
  const s = c.stats;
  if (!s) continue;
  totals.tests += s.tests || 0;
  totals.passes += s.passes || 0;
  totals.failures += s.failures || 0;
  totals.pending += s.pending || 0;
  totals.duration += s.duration || 0;
}

// Render the per-browser results as an aligned, monospaced code block. Unicode
// emoji (✅/❌/⚠️) render inside code blocks; failures (and pendings) are shown
// inline next to the passed count.
const nameWidth = cells.length
  ? Math.max(...cells.map((c) => String(c.cell).length))
  : 0;
const rows = cells.map((c) => {
  const s = c.stats;
  const name = String(c.cell).padEnd(nameWidth);
  if (!s) return `⚠️  ${name}  no results (run crashed)`;
  const status = (s.failures || 0) > 0 ? "❌" : "✅";
  let detail = `${s.passes || 0} passed`;
  if (s.failures) detail += `, ${s.failures} failed`;
  if (s.pending) detail += `, ${s.pending} pending`;
  detail += `  (${fmtDuration(s.duration)})`;
  return `${status}  ${name}  ${detail}`;
});

const passed = env.OVERALL === "success";
// Coloured bar down the left of the attachment — instant green/red signal.
const color = passed ? "#2eb67d" : "#e01e5a";
const statusIcon = passed ? "✅" : "❌";
const statusWord = passed ? "Passed" : "Failed";
// Which suite ran (Platform / App Builder / Marketplace). Set per-workflow via
// the SUITE env var; falls back to a bare "Cypress …" headline when unset.
const suite = env.SUITE ? ` ${env.SUITE}` : "";
const breakdown = rows.length
  ? "```\n" + rows.join("\n") + "\n```"
  : "_No cell summaries found._";

const totalsLine =
  `*${totals.passes}/${totals.tests}* tests passed` +
  (totals.failures ? ` · *${totals.failures} failed*` : "") +
  (totals.pending ? ` · ${totals.pending} pending` : "") +
  ` · ⏱ ${fmtDuration(totals.duration)}`;

const commitUrl = `${env.SERVER_URL}/${env.REPO}/commit/${env.SHA}`;
const runUrl = `${env.SERVER_URL}/${env.REPO}/actions/runs/${env.RUN_ID}`;
const shortSha = String(env.SHA || "").slice(0, 7);

const isPR = env.EVENT === "pull_request" && env.PR_NUMBER;
const branch = (isPR && env.PR_BRANCH) || env.BRANCH;

// The headline block answers "did this PR pass?" — bold, linked PR title up
// top so the result is scannable in the channel without opening anything.
const subjectBlock = isPR
  ? {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*<${env.PR_URL}|${env.PR_TITLE}>*  ·  <${env.PR_URL}|#${env.PR_NUMBER}>`,
      },
    }
  : {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Push to \`${branch}\`*  ·  <${commitUrl}|${shortSha}>`,
      },
    };

// Action buttons: jump straight to the PR (when relevant) and the run logs.
const buttons = [];
if (isPR) {
  buttons.push({
    type: "button",
    text: { type: "plain_text", emoji: true, text: "📋 View PR" },
    url: env.PR_URL,
    style: passed ? "primary" : "danger",
  });
}
buttons.push({
  type: "button",
  text: { type: "plain_text", emoji: true, text: "🔍 View run" },
  url: runUrl,
  ...(isPR ? {} : { style: passed ? "primary" : "danger" }),
});

const subjectText = isPR
  ? `PR #${env.PR_NUMBER}: ${env.PR_TITLE}`
  : `Push to ${branch}`;

// Everything lives inside one coloured attachment so the bar spans the
// whole message. The header block gives a big, scannable status line.
const payload = {
  channel: env.CHANNEL,
  text: `${statusIcon} Cypress${suite} ${statusWord} — ${subjectText} (${totals.passes}/${totals.tests} passed)`,
  attachments: [
    {
      color,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            emoji: true,
            text: `${statusIcon} Cypress${suite} ${statusWord}`,
          },
        },
        subjectBlock,
        {
          type: "context",
          elements: [
            { type: "mrkdwn", text: `📦 \`${env.REPO}\`` },
            { type: "mrkdwn", text: `🌿 \`${branch}\`` },
            { type: "mrkdwn", text: `👤 ${env.ACTOR}` },
          ],
        },
        { type: "divider" },
        {
          type: "section",
          text: { type: "mrkdwn", text: totalsLine },
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: `*Results by browser*\n${breakdown}` },
        },
        { type: "actions", elements: buttons },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Commit <${commitUrl}|${shortSha}> • run <${runUrl}|#${env.RUN_ID}>`,
            },
          ],
        },
      ],
    },
  ],
};

fs.writeFileSync("payload.json", JSON.stringify(payload, null, 2));
console.log(fs.readFileSync("payload.json", "utf8"));
