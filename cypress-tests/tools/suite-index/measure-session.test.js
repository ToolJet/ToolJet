const assert = require("assert");
const path = require("path");
const { measureSession } = require("./measure-session");

const r = measureSession(path.join(__dirname, "__fixtures__/session.jsonl"));
assert.strictEqual(r.inputTokens, 15, "usage counted once per message id");
assert.strictEqual(r.outputTokens, 27);
assert.strictEqual(r.cacheReadTokens, 300);
assert.strictEqual(r.cacheCreationTokens, 50);
assert.strictEqual(r.totalTokens, 392);
assert.strictEqual(r.toolCalls.Read, 2);
assert.strictEqual(r.toolCalls.Bash, 1);
assert.strictEqual(r.filesRead, 2);
assert.strictEqual(r.durationMs, 60000);
