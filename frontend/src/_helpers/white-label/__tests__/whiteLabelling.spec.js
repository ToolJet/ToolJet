import { setFaviconAndTitle } from '../whiteLabelling';

jest.mock('@/_stores/whiteLabellingStore', () => ({
  useWhiteLabellingStore: { getState: () => ({ whiteLabelText: 'ToolJet', whiteLabelFavicon: 'favicon.svg' }) },
}));

describe('setFaviconAndTitle', () => {
  beforeEach(() => {
    document.title = 'Previous page | ToolJet';
  });

  it('titles the usage analytics app view, whose path also contains /apps/', async () => {
    await setFaviconAndTitle({ pathname: '/acme/usage-analytics/apps/0c1d2e3f-0000-4000-8000-000000000000' });
    expect(document.title).toBe('Analytics | ToolJet');
  });

  it('leaves the title alone in the app editor', async () => {
    await setFaviconAndTitle({ pathname: '/acme/apps/0c1d2e3f-0000-4000-8000-000000000000' });
    expect(document.title).toBe('Previous page | ToolJet');
  });
});
