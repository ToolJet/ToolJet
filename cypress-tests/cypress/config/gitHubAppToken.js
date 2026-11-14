/**
 * Mints a GitHub App installation token for the git sync suite, using the
 * same GitHub App credentials ToolJet is configured with (GITHUB_APP_ID,
 * GITHUB_APP_INSTALLATION_ID, GITHUB_PRIVATE_KEY). Replaces a long-lived personal
 * token. Installation tokens last 1h; this caches one and refreshes it after 50 minutes.
 */

const crypto = require("crypto");

const REFRESH_AFTER_MS = 50 * 60 * 1000;

module.exports = (on, config) => {
  let cached = null;

  const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");

  const appJwt = () => {
    const now = Math.floor(Date.now() / 1000);
    const unsigned = `${b64url({ alg: "RS256", typ: "JWT" })}.${b64url({
      iat: now - 60,
      exp: now + 540,
      iss: String(config.env.GITHUB_APP_ID),
    })}`;
    const key = String(config.env.GITHUB_PRIVATE_KEY).replace(/\\n/g, "\n");
    const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(key, "base64url");
    return `${unsigned}.${signature}`;
  };

  on("task", {
    async gitHubAppToken() {
      if (cached && Date.now() - cached.mintedAt < REFRESH_AFTER_MS) return cached.token;

      const apiBase = config.env.GITHUB_API_BASE_URL || "https://api.github.com";
      const res = await fetch(
        `${apiBase}/app/installations/${config.env.GITHUB_APP_INSTALLATION_ID}/access_tokens`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${appJwt()}`, Accept: "application/vnd.github+json" },
        },
      );
      if (res.status !== 201) {
        throw new Error(`GitHub App token mint failed with HTTP ${res.status}`);
      }
      const { token } = await res.json();
      cached = { token, mintedAt: Date.now() };
      return token;
    },
  });
};
