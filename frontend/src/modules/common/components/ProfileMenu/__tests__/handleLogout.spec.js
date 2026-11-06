import { handleLogout } from '../handleLogout';
import { appService } from '@/_services/app.service';
import { sessionService } from '@/_services/session.service';
import { teardownFrontendMetrics } from '@/_services/frontend-metrics.service';

jest.mock('@/_services/app.service', () => ({ appService: { getConfig: jest.fn() } }));
jest.mock('@/_services/session.service', () => ({ sessionService: { logout: jest.fn() } }));
jest.mock('@/_services/frontend-metrics.service', () => ({ teardownFrontendMetrics: jest.fn() }));

describe('handleLogout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionService.logout.mockResolvedValue(undefined);
  });

  test('stops frontend metrics before logging out', async () => {
    appService.getConfig.mockResolvedValue({});

    await handleLogout();

    expect(teardownFrontendMetrics).toHaveBeenCalledTimes(1);
    expect(sessionService.logout).toHaveBeenCalledTimes(1);
  });

  test('stores the latest config so the custom logout URL is current', async () => {
    appService.getConfig.mockResolvedValue({ TOOLJET_HOST: 'https://latest.example.com' });

    await handleLogout();

    expect(window.public_config).toEqual({ TOOLJET_HOST: 'https://latest.example.com' });
  });

  test('still logs out when the config request fails', async () => {
    appService.getConfig.mockRejectedValue(new Error('network'));

    await handleLogout();

    expect(sessionService.logout).toHaveBeenCalledTimes(1);
  });

  test('ignores a custom logout URL that is not a valid URL', async () => {
    appService.getConfig.mockResolvedValue({ CUSTOM_LOGOUT_URL: 'not a url' });

    await handleLogout();

    expect(sessionService.logout).toHaveBeenCalledTimes(1);
  });
});
