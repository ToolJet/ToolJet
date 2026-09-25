const r = require("./logs/v3-results.json");
for (const x of r) {
  const e = x.expect, o = x.obs;
  const bad = e.invalid !== o.invalid || (e.msg && o.msg !== e.msg);
  console.log(`${bad ? "MISMATCH" : "ok      "} ${x.id} | expect ${e.invalid ? "invalid" : "valid"}${e.msg ? ` "${e.msg}"` : ""} | got ${o.invalid ? "invalid" : "valid"}${o.msg ? ` "${o.msg}"` : ""}${o.truncated ? " [TRUNCATED]" : ""} | cell "${o.text}"`);
}
