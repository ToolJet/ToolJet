const fs = require("fs");

function measureSession(jsonlPath) {
  const out = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0, totalTokens: 0, toolCalls: {}, filesRead: 0, durationMs: 0 };
  const seen = new Set();
  let first = null;
  let last = null;
  for (const line of fs.readFileSync(jsonlPath, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    if (entry.timestamp) {
      const t = Date.parse(entry.timestamp);
      if (first === null) first = t;
      last = t;
    }
    if (entry.type !== "assistant" || !entry.message) continue;
    const msg = entry.message;
    // A split assistant message repeats the same usage on every line.
    if (msg.usage && !seen.has(msg.id)) {
      seen.add(msg.id);
      out.inputTokens += msg.usage.input_tokens || 0;
      out.outputTokens += msg.usage.output_tokens || 0;
      out.cacheReadTokens += msg.usage.cache_read_input_tokens || 0;
      out.cacheCreationTokens += msg.usage.cache_creation_input_tokens || 0;
    }
    for (const block of msg.content || []) {
      if (block.type !== "tool_use") continue;
      out.toolCalls[block.name] = (out.toolCalls[block.name] || 0) + 1;
    }
  }
  out.totalTokens = out.inputTokens + out.outputTokens + out.cacheReadTokens + out.cacheCreationTokens;
  out.filesRead = out.toolCalls.Read || 0;
  out.durationMs = first === null ? 0 : last - first;
  return out;
}

if (require.main === module) {
  if (!process.argv[2]) { console.error("usage: measure-session.js <session.jsonl>"); process.exit(2); }
  console.log(JSON.stringify(measureSession(process.argv[2]), null, 2));
}

module.exports = { measureSession };
