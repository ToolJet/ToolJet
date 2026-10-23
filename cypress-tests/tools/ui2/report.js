#!/usr/bin/env node
// Summarises a UI 2.0 browser QA run (cypress/e2e/happyPath/appbuilder/ui2) from the measurements the specs leave in
// cypress/reports/ui2/*.jsonl: pass/fail counts per check, then every failure with widget, mode, width, theme and the
// measured numbers. Usage: node tools/ui2/report.js [--md] > report.md
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "../../cypress/reports/ui2");
const md = process.argv.includes("--md");
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".jsonl")) : [];
if (!files.length) {
  console.error(`no results in ${dir}: run the specs first`);
  process.exit(1);
}
const rows = files.flatMap((f) =>
  fs
    .readFileSync(path.join(dir, f), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => ({ spec: f.replace(/\.jsonl$/, ""), ...JSON.parse(l) }))
);

const byCheck = {};
rows.forEach((r) => {
  const k = `${r.spec} / ${r.check}`;
  byCheck[k] = byCheck[k] || { pass: 0, fail: 0, known: 0, oos: 0 };
  if ((r.outOfScope || []).length) byCheck[k].oos += 1;
  if (r.pass) byCheck[k].pass += 1;
  else if (r.known) byCheck[k].known += 1;
  else byCheck[k].fail += 1;
});

const where = (r) => [r.widget, r.size, r.mode, r.width && `${r.width}px`, r.theme].filter(Boolean).join(" | ");
const out = [];
// "Out of scope": tests with lines known.js marks out of scope (E19); those lines alone never fail a test.
out.push(md ? "| Spec / check | Pass | Fail | Known fail | With out-of-scope lines |\n|---|---|---|---|---|" : "Spec / check: pass, fail, known fail, with out-of-scope lines");
Object.entries(byCheck).forEach(([k, v]) => out.push(md ? `| ${k} | ${v.pass} | ${v.fail} | ${v.known} | ${v.oos} |` : `${k}: ${v.pass}, ${v.fail}, ${v.known}, ${v.oos}`));
out.push("");
const failing = rows.filter((r) => !r.pass);
const group = {};
failing.forEach((r) => {
  const k = `${r.spec} / ${r.check}`;
  (group[k] = group[k] || []).push(r);
});
Object.entries(group).forEach(([k, list]) => {
  out.push(md ? `### ${k} (${list.length})` : `== ${k} (${list.length})`);
  list.forEach((r) => {
    out.push(`- ${where(r)}${r.known ? ` [known: ${r.known}]` : ""}`);
    r.failures.forEach((f) => out.push(`    - ${f}`));
    (r.outOfScope || []).forEach((o) => out.push(`    - (out of scope, ${o.reason.split(":")[0]}) ${o.line}`));
  });
  out.push("");
});
console.log(out.join("\n"));
