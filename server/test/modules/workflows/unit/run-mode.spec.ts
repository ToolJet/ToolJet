import { triggerRunsSync } from '@modules/workflows/admission/run-mode';

/**
 * Sync or queued for an app trigger: the saved query decides, not the request (WF-NEW-01).
 *
 * @group workflows
 */
describe('triggerRunsSync', () => {
  describe('with a saved query', () => {
    it('should follow the saved option whatever the request asks', () => {
      expect(
        triggerRunsSync({
          hasSavedQuery: true,
          savedQueryOptions: { syncExecution: false },
          requestedSync: true,
          signedIn: false,
        })
      ).toBe(false);
      expect(
        triggerRunsSync({
          hasSavedQuery: true,
          savedQueryOptions: { syncExecution: true },
          requestedSync: false,
          signedIn: true,
        })
      ).toBe(true);
    });

    it('should run sync when the query never set the option, as the App Builder toggle defaults to', () => {
      expect(
        triggerRunsSync({ hasSavedQuery: true, savedQueryOptions: {}, requestedSync: false, signedIn: true })
      ).toBe(true);
    });
  });

  describe('without a saved query', () => {
    it('should let a signed-in caller choose, defaulting to queued', () => {
      expect(triggerRunsSync({ hasSavedQuery: false, requestedSync: true, signedIn: true })).toBe(true);
      expect(triggerRunsSync({ hasSavedQuery: false, signedIn: true })).toBe(false);
    });

    it('should always queue an anonymous caller', () => {
      expect(triggerRunsSync({ hasSavedQuery: false, requestedSync: true, signedIn: false })).toBe(false);
    });
  });
});
