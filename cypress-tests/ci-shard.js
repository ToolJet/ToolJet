// ci-shard.js — split a Cypress config's specs across CI machines.
//
// Each machine runs its own fresh ToolJet, so specs that change instance-wide
// state must stay together:
//   SHARD_GROUPS  groups separated by ";", each a comma-separated list of path
//                 substrings; every spec matching a group goes to the same shard
//                 as one unit, e.g. "/licensing/;/sso/,manageSSO.cy.js"
// The first group always lands on the first shard. Everything else is spread by
// spec count. Each shard keeps the config's original spec order.
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

function pickShardSpecs({ configFile, index, total, groups }) {
  const specs = listSpecs(configFile);
  // index of the first group the spec matches, -1 for none
  const groupOf = (spec) => groups.findIndex((group) => group.some((part) => spec.includes(part)));

  const units = [
    ...groups.map((_, i) => specs.filter((spec) => groupOf(spec) === i)).filter((unit) => unit.length),
    ...specs.filter((spec) => groupOf(spec) === -1).map((spec) => [spec]),
  ];

  // Same input on every machine, so every machine computes the same split. Groups
  // go first and all shards start empty, so the first group lands on shard 0.
  const shards = Array.from({ length: total }, () => []);
  for (const unit of units) {
    const smallest = shards.reduce((min, shard, i) => (shard.length < shards[min].length ? i : min), 0);
    shards[smallest].push(...unit);
  }

  const mine = new Set(shards[index]);
  return specs.filter((spec) => mine.has(spec));
}

module.exports = { pickShardSpecs };
