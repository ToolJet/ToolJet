#!/usr/bin/env node
// Renders findings.jsonl -> report.html (Table UI test report). Run: node render.js
// One JSON object per line:
// {"area":"Editing","sev":"crit|high|med|docs","title":"...","combination":"...","steps":["...", ...],
//  "data":"<optional JSON pasted in step 1>","expected":"...","actual":"...","evidence":"<assert/error text>",
//  "src":"<optional file:line>","note":"<optional>","spec":"<spec file>"}
const fs = require("fs");
const path = require("path");
const dir = __dirname;
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// allow `code` spans and **bold** in text fields
const fmt = (s = "") => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");

const lines = fs.existsSync(path.join(dir, process.env.TQ_FINDINGS || "findings.jsonl"))
  ? fs.readFileSync(path.join(dir, process.env.TQ_FINDINGS || "findings.jsonl"), "utf8").split("\n").filter((l) => l.trim())
  : [];
const bad = [];
const findings = lines
  .map((l, i) => {
    try { return JSON.parse(l); } catch (e) { bad.push(i + 1); return null; }
  })
  .filter(Boolean);
const order = { crit: 0, high: 1, med: 2, docs: 3 };
findings.sort((a, b) => (order[a.sev] ?? 2) - (order[b.sev] ?? 2));
findings.forEach((f, i) => (f.id = `${process.env.TQ_PREFIX || "TUI"}-${String(i + 1).padStart(2, "0")}`));

const progress = {};
const pdir = path.join(dir, process.env.TQ_PROGRESS || "progress");
if (fs.existsSync(pdir)) fs.readdirSync(pdir).sort().forEach((f) => {
  try { const v = JSON.parse(fs.readFileSync(path.join(pdir, f), "utf8")); progress[v.area || f] = v; } catch (e) {}
});
const count = (s) => findings.filter((f) => f.sev === s).length;
const groups = [
  ["crit", "Critical", "Crashes, blank table and silent data loss"],
  ["high", "Data integrity", "Wrong values reach exposed variables or changeSet"],
  ["med", "Functional", "Features that behave differently from what the inspector promises"],
  ["docs", "Documentation", "Docs and product disagree"],
];

const card = (f) => `
    <article class="issue" data-sev="${f.sev}" id="${f.id}">
      <div class="issue-head"><span class="id">${f.id}</span>
        <h3>${fmt(f.title)}</h3><span class="tag">UI verified</span></div>
      <p class="src">${esc(f.area)}${f.combination ? ` <span>— ${fmt(f.combination)}</span>` : ""}${f.src ? ` · ${fmt(f.src)}` : ""}</p>
      <div class="repro">
        <h4>Steps to reproduce</h4>
        <ol>
${(f.steps || []).map((s, i) => `          <li>${fmt(s)}${i === 0 && f.data ? `<pre class="data">${esc(f.data)}</pre>` : ""}</li>`).join("\n")}
        </ol>
      </div>
      <div class="outcome">
        <div class="exp"><h4>Expected</h4><p>${fmt(f.expected)}</p></div>
        <div class="act"><h4>Actual</h4><p>${fmt(f.actual)}${f.evidence ? `<br><code>${esc(f.evidence)}</code>` : ""}</p></div>
      </div>${f.note ? `\n      <p class="note">${fmt(f.note)}</p>` : ""}
    </article>`;

const areas = Object.entries(progress);
const body = `
<div class="wrap">
  <header class="masthead">
    <p class="eyebrow">UI test run · ToolJet App Builder</p>
    <h1>${process.env.TQ_TITLE || "Table UI Test Report"}</h1>
    <p class="standfirst">
      ${findings.length} defects found by driving the Table widget in the real editor with Cypress. Each Table was built
      through the API with an exact configuration, then exercised through the UI. Every finding lists the configuration,
      steps you can repeat by hand from a blank app, and the expected and actual results the run observed.
    </p>
    <div class="meta">
      <span><b>Branch</b> ${esc(process.env.TQ_BRANCH || "feat/tj-ccl")}</span>
      <span><b>Widget</b> AppBuilder/Widgets/NewTable</span>
      <span><b>Updated</b> ${new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
      <span><b>Areas done</b> ${areas.filter(([, v]) => v.status === "done").length} of ${areas.length}</span>
    </div>
  </header>

  <div class="tally">
    <div class="c-crit"><span class="n">${count("crit")}</span><span class="l">Critical</span></div>
    <div class="c-high"><span class="n">${count("high")}</span><span class="l">Data integrity</span></div>
    <div class="c-med"><span class="n">${count("med")}</span><span class="l">Functional</span></div>
    <div class="c-docs"><span class="n">${count("docs")}</span><span class="l">Documentation</span></div>
  </div>

  <div class="filter">
    <span class="lab">Show</span>
    <button class="chip" data-f="all" aria-pressed="true">All ${findings.length}</button>
    <button class="chip" data-f="crit" aria-pressed="false">Critical</button>
    <button class="chip" data-f="high" aria-pressed="false">Data integrity</button>
    <button class="chip" data-f="med" aria-pressed="false">Functional</button>
    <button class="chip" data-f="docs" aria-pressed="false">Docs</button>
  </div>
  <p class="empty" id="empty" hidden>No issues in this category.</p>
${groups
  .filter(([s]) => count(s))
  .map(
    ([s, label, h]) => `
  <section data-sev="${s}">
    <div class="sec-head">
      <span class="sev sev-${s}">${label}</span>
      <h2>${h}</h2>
      <span class="count">${count(s)} issue${count(s) === 1 ? "" : "s"}</span>
    </div>
${findings.filter((f) => f.sev === s).map(card).join("\n")}
  </section>`
  )
  .join("\n")}

  <div class="scope">
    <h2>Scope and method</h2>
    <p>
      Each area below was covered by a Cypress spec in <code>cypress-tests/cypress/e2e/happyPath/appbuilder/tableQA/</code>.
      A spec builds a Table through the component API with a fixed configuration (data, columns, properties, styles),
      opens it in the editor and drives it the way a user would: typing, clicking, paging, filtering, editing. It reads
      exposed variables through Text components bound to <code>components.table1.*</code>. A failure is logged only after
      it was re-run and triaged as a product defect rather than a test problem.
    </p>
    <ul>
${areas.map(([a, v]) => `      <li>${esc(a)} — ${esc(v.status || "pending")}${v.tests ? ` · ${v.tests} tests, ${v.passed ?? "?"} passed` : ""}${v.notes ? ` · ${esc(v.notes)}` : ""}</li>`).join("\n")}
    </ul>
  </div>
</div>
`;
const head = fs.readFileSync(path.join(dir, process.env.TQ_HEAD || "_report-head.html"), "utf8");
const script = `
<script>
  (function () {
    var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
    var sections = Array.prototype.slice.call(document.querySelectorAll('section[data-sev]'));
    var empty = document.getElementById('empty');
    function apply(f) {
      var shown = 0;
      sections.forEach(function (s) { var m = (f === 'all' || s.getAttribute('data-sev') === f); s.hidden = !m; if (m) shown++; });
      empty.hidden = shown > 0;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-f') === f)); });
    }
    chips.forEach(function (c) { c.addEventListener('click', function () { apply(c.getAttribute('data-f')); }); });
  })();
</script>
</body></html>`;
fs.writeFileSync(path.join(dir, process.env.TQ_OUT || "report-build.html"), head + body + script);
console.log(`report-build.html: ${findings.length} findings${bad.length ? `; BAD JSON on lines ${bad.join(",")}` : ""}`);
