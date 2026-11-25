const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");

const PLAN_TERMS_PATH = path.resolve(
  __dirname,
  "../../../server/ee/licensing/constants/PlanTerms.ts"
);

const CLOUD_PLAN_EXPORTS = {
  basic: "BASIC_PLAN_TERMS_CLOUD",
  starter: "STARTER_PLAN_TERMS_CLOUD",
  basicplus: "BASICPLUS_PLAN_TERMS_CLOUD",
  pro: "PRO_PLAN_TERMS_CLOUD",
  team: "TEAM_PLAN_TERMS_CLOUD",
};

// PlanTerms.ts holds plain object literals; strip the TS-only syntax and evaluate it.
const loadPlanTerms = () => {
  const source = fs.readFileSync(PLAN_TERMS_PATH, "utf8");
  const names = [...source.matchAll(/export const (\w+)/g)].map((m) => m[1]);
  const body =
    source
      .replace(/^import .*$/gm, "")
      .replace(/^((?:export )?const \w+)\s*:[^=]+=/gm, "$1 =")
      .replace(/export const /g, "const ") +
    `\nreturn { ${names.join(", ")} };`;
  return new Function(body)();
};

const hexToBuffer = (hex) => Buffer.from(hex, "hex");

const totp = (secretHex, period = 30, digits = 6, at = Date.now()) => {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / period)));
  const hmac = crypto
    .createHmac("sha1", hexToBuffer(secretHex))
    .update(counter)
    .digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits;
  return String(code).padStart(digits, "0");
};

const aiGatewayBalances = new Map();
const aiGatewayWallets = new Map();
const aiGatewayHits = new Map();
const STUB_ID = `cypress-ai-gateway-${process.pid}-${Date.now()}`;
let aiGatewayServer;

const balanceBody = (balance) => ({
  balance,
  remaining: { topup: 0, recurring: balance, total: balance },
  plan: { topup: 0, recurring: balance, total: balance },
});

const totals = (recurring, topup) => ({ recurring, topup, total: recurring + topup });
const sumOf = (values) => values.reduce((total, value) => total + value, 0);

// A wallet describes one workspace's pool and per-user spend; the gateway answers /balance and /usage from it.
const walletBody = (wallet, kind) => {
  const monthlySpent = wallet.monthlySpent || {};
  const addonSpent = wallet.addonSpent || {};
  const userIds = [...new Set([...Object.keys(monthlySpent), ...Object.keys(addonSpent)])];
  const users = userIds.map((userId) => ({
    userId,
    ...totals(monthlySpent[userId] || 0, addonSpent[userId] || 0),
  }));
  const unattributed = totals(wallet.unattributed?.monthly || 0, wallet.unattributed?.addon || 0);
  const spent = totals(
    sumOf(users.map((u) => u.recurring)) + unattributed.recurring,
    sumOf(users.map((u) => u.topup)) + unattributed.topup
  );
  const cycleStart =
    wallet.cycleStart || new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
  if (kind === "balance") {
    const remaining = totals(wallet.pool.monthly - spent.recurring, wallet.pool.addon - spent.topup);
    return {
      balance: remaining.total,
      ...(wallet.plan && { plan: totals(wallet.plan.monthly, wallet.plan.addon) }),
      remaining,
      expiry: {
        recurringExpiryDate: new Date(Date.now() + 20 * 864e5).toISOString(),
        topupExpiryDate: wallet.addonEndsAt || null,
      },
      cycleStart,
    };
  }
  return { cycleStart, trackingSince: null, users, unattributed, pool: spent };
};

// Without a wallet the usage read is empty, so balance-only tests keep working when limits read it.
const emptyUsage = () => ({ cycleStart: null, trackingSince: null, users: [], unattributed: totals(0, 0), pool: totals(0, 0) });

// A taken port must fail the run, or another process would answer the AI credit tests.
const startAiGatewayStub = (port) =>
  new Promise((resolve, reject) => {
    if (aiGatewayServer || !port) return resolve();
    aiGatewayServer = http.createServer((req, res) => {
      const send = (status, body) => {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(body));
      };
      if (req.url === "/__stub/health") return send(200, { id: STUB_ID });
      const match = req.url.match(/\/api\/ai\/organizations\/([^/]+)\/(balance|usage)/);
      if (req.method === "GET" && match) {
        const [, workspaceId, kind] = match;
        const wallet = aiGatewayWallets.get(workspaceId);
        if (wallet?.fail) return send(502, { message: "stub gateway failure" });
        if (kind === "balance") aiGatewayHits.set(workspaceId, (aiGatewayHits.get(workspaceId) || 0) + 1);
        if (wallet) return send(200, walletBody(wallet, kind));
        return send(200, kind === "balance" ? balanceBody(aiGatewayBalances.get(workspaceId) ?? 0) : emptyUsage());
      }
      return send(200, {});
    });
    aiGatewayServer.once("error", (error) =>
      reject(new Error(`AI gateway stub could not listen on :${port} (${error.code})`))
    );
    aiGatewayServer.listen(port, "0.0.0.0", resolve);
  });

module.exports = async (on, config) => {
  await startAiGatewayStub(Number(config.env.aiGatewayStubPort));

  on("task", {
    cloudOtp({ email, secret }) {
      const userSecretHex = crypto
        .createHmac("sha256", secret)
        .update(email)
        .digest("hex");
      return totp(userSecretHex);
    },

    cloudPlanTerms(plan) {
      const exportName = CLOUD_PLAN_EXPORTS[plan];
      if (!exportName) {
        throw new Error(
          `Unknown cloud plan "${plan}". Known: ${Object.keys(CLOUD_PLAN_EXPORTS).join(", ")}`
        );
      }
      return loadPlanTerms()[exportName];
    },

    setAiGatewayBalance({ workspaceId, balance }) {
      aiGatewayBalances.set(workspaceId, balance);
      return null;
    },

    setAiGatewayWallet({ workspaceId, wallet }) {
      if (wallet) aiGatewayWallets.set(workspaceId, wallet);
      else aiGatewayWallets.delete(workspaceId);
      return null;
    },

    aiGatewayStub() {
      return { id: aiGatewayServer ? STUB_ID : null, hits: Object.fromEntries(aiGatewayHits) };
    },
  });
};
