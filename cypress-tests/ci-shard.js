// ci-shard.js — split a Cypress config's specs across CI machines.
//
// Each machine runs its own fresh ToolJet, so some specs must run on every
// machine, and specs that change instance-wide state must stay together:
//   SHARD_SETUP_SPECS  comma-separated path suffixes run on every shard, e.g.
//                      "firstUserOnboarding.cy.js,updateLicense.cy.js"
//   SHARD_GROUP        path substring; every matching spec goes to the same
//                      shard as one unit, e.g. "/licensing/"
// Everything else is spread by spec count. Each shard keeps the config's
// original spec order, so setup specs still run before the specs needing them.
const fs = require("fs");
const path = require("path");

const escapeRegex = (s) => s.replace(/[.+^${}()|[\]\\?]/g, "\\$&");

// Only `**/` and `*` appear in our spec patterns.
function globToRegex(pattern) {
  const body = pattern
    .split("**/")
    .map((part) => part.split("*").map(escapeRegex).join("[^/]*"))
    .join("(?:.*/)?");
  return new RegExp(`^${body}$`);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.posix.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function expandPattern(pattern) {
  const firstGlob = pattern.search(/[*?[{]/);
  if (firstGlob === -1) return fs.existsSync(pattern) ? [pattern] : [];
  const base = pattern.slice(0, firstGlob).replace(/[^/]*$/, "") || ".";
  const regex = globToRegex(pattern);
  return walk(base.replace(/\/$/, "")).filter((file) => regex.test(file)).sort();
}

function listSpecs(configFile) {
  const config = require(path.resolve(configFile));
  const patterns = [].concat(config.e2e.specPattern);
  return [...new Set(patterns.flatMap(expandPattern))];
}

function pickShardSpecs({ configFile, index, total, setupSpecs, group }) {
  const specs = listSpecs(configFile);
  const isSetup = (spec) => setupSpecs.some((suffix) => spec.endsWith(suffix));
  const inGroup = (spec) => Boolean(group) && spec.includes(group);

  const grouped = specs.filter((spec) => inGroup(spec) && !isSetup(spec));
  const units = [
    ...(grouped.length ? [grouped] : []),
    ...specs.filter((spec) => !inGroup(spec) && !isSetup(spec)).map((spec) => [spec]),
  ];

  // Same input on every machine, so every machine computes the same split.
  const shards = Array.from({ length: total }, () => []);
  for (const unit of units) {
    const smallest = shards.reduce((min, shard, i) => (shard.length < shards[min].length ? i : min), 0);
    shards[smallest].push(...unit);
  }

  const mine = new Set(shards[index]);
  return specs.filter((spec) => isSetup(spec) || mine.has(spec));
}

module.exports = { pickShardSpecs };
