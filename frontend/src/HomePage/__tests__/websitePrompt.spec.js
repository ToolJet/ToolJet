const access = { value: {} };
jest.mock('@/_services', () => ({
  ...jest.requireActual('@/_services'),
  licenseService: { getFeatureAccess: () => Promise.resolve(access.value) },
  authenticationService: { currentSessionValue: { current_user: { id: 'user-1' } } },
}));

// Fresh modules per test: the workspace's React builder check is read once per page load.
const loadWebsitePromptApp = () => {
  let mod;
  jest.isolateModules(() => {
    mod = require('../websitePrompt');
  });
  return mod.websitePromptApp;
};

const hasEnterprise = Boolean(
  require('@ee/modules/CodeMode/modules/AiBuilder/components/BuildModeChooser').buildModeWithoutAsking
);

beforeEach(() => {
  localStorage.clear();
  access.value = {};
});

describe('the app the Apps dashboard creates from a prompt brought from the ToolJet website', () => {
  it('carries the prompt the website sent', async () => {
    const websitePromptApp = loadWebsitePromptApp();
    await expect(websitePromptApp(encodeURIComponent('Build a todo app'))).resolves.toMatchObject({
      name: expect.stringMatching(/^Untitled App: /),
      prompt: 'Build a todo app',
    });
  });

  (hasEnterprise ? describe : describe.skip)('where the enterprise app builder is present', () => {
    it('is built in React builder where the workspace has it and the user never picked', async () => {
      access.value = { codeModeApps: true };
      const websitePromptApp = loadWebsitePromptApp();
      await expect(websitePromptApp('Build a todo app')).resolves.toMatchObject({ buildMode: 'code' });
    });

    it("is built in the user's own pick where they made one", async () => {
      access.value = { codeModeApps: true };
      localStorage.setItem('tj:ai:build-mode:user-1', 'visual');
      const websitePromptApp = loadWebsitePromptApp();
      await expect(websitePromptApp('Build a todo app')).resolves.toMatchObject({ buildMode: 'visual' });
    });

    it('is built in Visual builder where the workspace has no React builder, whatever was picked', async () => {
      localStorage.setItem('tj:ai:build-mode:user-1', 'code');
      const websitePromptApp = loadWebsitePromptApp();
      await expect(websitePromptApp('Build a todo app')).resolves.toMatchObject({ buildMode: 'visual' });
    });
  });

  (hasEnterprise ? describe.skip : describe)('in the community edition', () => {
    it('leaves the build mode to the server, which builds visually', async () => {
      const websitePromptApp = loadWebsitePromptApp();
      const app = await websitePromptApp('Build a todo app');
      expect(app.buildMode).toBeUndefined();
    });
  });
});
