/**
 * Git Sync API Utilities
 * Endpoints derived from network captures:
 *   Save:   POST   /api/git-sync/configs
 *   Delete: DELETE /api/git-sync/{orgId}?gitType=github_https
 */

/**
 * Configure (save) GitHub HTTPS git sync for the current workspace via API.
 *
 * @param {object} config
 * @param {string} config.repoUrl        - HTTPS repo URL  (gitUrl in API)
 * @param {string} config.branch         - branch name     (branchName in API)
 * @param {string} config.appId          - GitHub App ID
 * @param {string} config.installationId - GitHub App Installation ID
 * @param {string} config.privateKey     - RSA private key (PEM string)
 */
export const apiConfigureGitSync = (config) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/git-sync/configs`,
        headers,
        body: {
          gitUrl: config.repoUrl,
          branchName: config.branch,
          githubEnterpriseUrl: "",
          githubEnterpriseApiUrl: "",
          githubAppId: config.appId,
          githubAppInstallationId: config.installationId,
          githubAppPrivateKey: config.privateKey,
          useEnvConfig: false,
          gitType: "github_https",
        },
      })
      .then((response) => {
        expect(response.status).to.be.oneOf([200, 201]);
        Cypress.log({
          name: "apiConfigureGitSync",
          displayName: "GIT SYNC CONFIGURED",
          message: `branch: ${config.branch}`,
        });
        return response;
      });
  });
};

/**
 * Delete git sync config for the current workspace via API.
 *
 * @param {string} orgId - workspace / organization ID
 */
export const apiDeleteGitSync = (orgId) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "DELETE",
        url: `${Cypress.env("server_host")}/api/git-sync/${orgId}?gitType=github_https`,
        headers,
        failOnStatusCode: false,
      })
      .then((response) => {
        Cypress.log({
          name: "apiDeleteGitSync",
          displayName: "GIT SYNC DELETED",
          message: `orgId: ${orgId}`,
        });
        return response;
      });
  });
};
