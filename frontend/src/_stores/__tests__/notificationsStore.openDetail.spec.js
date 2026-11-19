// A notice opens what it links to: an app path (a review) in place, under the sub path; a web address in a
// new tab; an error in its detail modal.
jest.mock('@/_services/notifications.service', () => ({
  notificationsService: { markRead: jest.fn().mockResolvedValue({ error: null }) },
}));
jest.mock('@/_components/NotificationCenter/NotificationToast', () => ({ showNotificationToast: jest.fn() }));
jest.mock('@/_services/authentication.service', () => ({ authenticationService: {} }));
jest.mock('@/_helpers/routes', () => ({ getSubpath: jest.fn(() => null) }));
jest.mock('config', () => ({ apiUrl: 'http://localhost/api' }), { virtual: true });

const { getSubpath } = require('@/_helpers/routes');
const { useNotificationsStore } = require('../notificationsStore');

const open = (notification) =>
  useNotificationsStore.getState().actions.openDetail({ recipientId: 'n-1', ...notification });

describe('opening a notification', () => {
  const assign = jest.fn();
  beforeAll(() => {
    delete window.location;
    window.location = { assign };
  });
  beforeEach(() => {
    jest.clearAllMocks();
    window.open = jest.fn();
  });

  it('should open a review in place', () => {
    open({ link: '/acme/apps/help-desk?review=r-1' });

    expect(assign).toHaveBeenCalledWith('/acme/apps/help-desk?review=r-1');
    expect(window.open).not.toHaveBeenCalled();
  });

  it('should keep the sub path on a sub path install', () => {
    getSubpath.mockReturnValue('/tooljet');

    open({ link: '/acme/apps/help-desk?review=r-1' });

    expect(assign).toHaveBeenCalledWith('/tooljet/acme/apps/help-desk?review=r-1');
  });

  it('should open a web address in a new tab', () => {
    open({ link: 'https://example.com/run/1' });

    expect(window.open).toHaveBeenCalledWith('https://example.com/run/1', '_blank', 'noopener');
    expect(assign).not.toHaveBeenCalled();
  });
});
