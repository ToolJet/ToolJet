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
      .replace(/:\s*Partial<Terms>/g, "")
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
const aiGatewayHits = new Map();
const STUB_ID = `cypress-ai-gateway-${process.pid}-${Date.now()}`;
let aiGatewayServer;

const balanceBody = (balance) => ({
  balance,
  remaining: { topup: 0, recurring: balance, total: balance },
  plan: { topup: 0, recurring: balance, total: balance },
});

// Port 0 / unset disables the stub. A taken port fails the run: a foreign process
// answering on it would silently decide the AI credit tests.
const startAiGatewayStub = (port) =>
  new Promise((resolve, reject) => {
    if (aiGatewayServer || !port) return resolve();
    aiGatewayServer = http.createServer((req, res) => {
      const send = (status, body) => {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(body));
      };
      if (req.url === "/__stub/health") return send(200, { id: STUB_ID });
      const match = req.url.match(/\/api\/ai\/organizations\/([^/]+)\/balance/);
      if (req.method === "GET" && match) {
        const workspaceId = match[1];
        aiGatewayHits.set(workspaceId, (aiGatewayHits.get(workspaceId) || 0) + 1);
        return send(200, balanceBody(aiGatewayBalances.get(workspaceId) ?? 0));
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

    aiGatewayStub() {
      return { id: aiGatewayServer ? STUB_ID : null, hits: Object.fromEntries(aiGatewayHits) };
    },
  });
};
