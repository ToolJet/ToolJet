// usage: node log.js <<'J' {json} J   -> appends one finding (validates JSON) and re-renders
const fs = require("fs");
const f = JSON.parse(fs.readFileSync(0, "utf8"));
fs.appendFileSync(__dirname + "/" + (process.env.TQ_FINDINGS || "findings.jsonl"), JSON.stringify(f) + "\n");
require("./render.js");
