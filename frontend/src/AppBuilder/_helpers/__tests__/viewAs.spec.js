import { VIEW_AS_HEADER, clearViewAs, readViewAs, saveViewAs, simulatedCurrentUser, viewAsHeaders } from '../viewAs';

const APP_A = 'app-a';
const APP_B = 'app-b';
const SALES = { kind: 'group', id: '11111111-1111-4111-8111-111111111111', label: 'Sales' };
const ALICE = { kind: 'user', id: '22222222-2222-4222-8222-222222222222', label: 'Alice' };

describe('View as', () => {
  afterEach(() => {
    window.sessionStorage.clear();
    jest.restoreAllMocks();
  });

  describe('session storage', () => {
    it('keeps the choice per app for this tab', () => {
      saveViewAs(APP_A, SALES);

      expect(readViewAs(APP_A)).toEqual(SALES);
      expect(readViewAs(APP_B)).toBeNull();
    });

    it('forgets the choice when cleared', () => {
      saveViewAs(APP_A, ALICE);
      clearViewAs(APP_A);

      expect(readViewAs(APP_A)).toBeNull();
    });

    it.each([
      ['malformed JSON', '{'],
      ['an unknown kind', JSON.stringify({ kind: 'admin', id: 'x', label: 'x' })],
      ['a missing id', JSON.stringify({ kind: 'user', label: 'x' })],
    ])('ignores %s', (_label, raw) => {
      window.sessionStorage.setItem(`tj-view-as:${APP_A}`, raw);

      expect(readViewAs(APP_A)).toBeNull();
    });

    it('falls back to no simulation when storage is unavailable', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });

      expect(readViewAs(APP_A)).toBeNull();
    });
  });

  describe('request header', () => {
    it('names one user or one group', () => {
      expect(viewAsHeaders(ALICE)).toEqual({ [VIEW_AS_HEADER]: `user:${ALICE.id}` });
      expect(viewAsHeaders(SALES)).toEqual({ [VIEW_AS_HEADER]: `group:${SALES.id}` });
    });

    it('adds nothing when not simulating', () => {
      expect(viewAsHeaders(null)).toEqual({});
    });
  });

  describe('globals.currentUser', () => {
    const builder = { id: 'me', email: 'me@example.com', groups: ['all_users', 'admin'], role: 'admin' };

    it('takes groups and role from the simulated identity, keeping the rest of the requester', () => {
      const identity = { kind: 'group', id: SALES.id, label: 'Sales', groups: ['Sales'], role: 'end-user' };

      expect(simulatedCurrentUser(builder, identity)).toEqual({
        id: 'me',
        email: 'me@example.com',
        groups: ['all_users', 'Sales', 'end-user'],
        role: 'end-user',
      });
    });

    it('is unchanged when not simulating', () => {
      expect(simulatedCurrentUser(builder, undefined)).toBe(builder);
    });
  });
});
