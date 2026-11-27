/** @group platform */
import { generateTJDBPasswordForRole } from '@helpers/tooljet_db.helper';

describe('generateTJDBPasswordForRole', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns a password of the requested length with every character class', () => {
    for (let i = 0; i < 200; i += 1) {
      const password = generateTJDBPasswordForRole();
      expect(password).toHaveLength(30);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[^A-Za-z0-9]/);
    }
  });

  it('does not log anything', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    generateTJDBPasswordForRole();
    expect(log).not.toHaveBeenCalled();
  });

  it('does not use Math.random', () => {
    const random = jest.spyOn(Math, 'random');
    generateTJDBPasswordForRole();
    expect(random).not.toHaveBeenCalled();
  });
});
