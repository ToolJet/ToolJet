import { escapeLike, nextTemplateAppName } from '@modules/templates/default-app-name';

/** @group platform */
describe('templates default app name', () => {
  describe('nextTemplateAppName', () => {
    it.each([
      ['no app has the name', [], 'X'],
      ['only the base name is taken', ['X'], 'X_1'],
      ['copies exist, with a gap', ['X', 'X_1', 'X_3'], 'X_4'],
      ['only a copy is taken', ['X_2'], 'X'],
      ['similar names exist', ['X', 'X pro_5', 'Xy', 'X_abc', 'x_9'], 'X_1'],
    ])('should handle the case where %s', (_, taken, expected) => {
      expect(nextTemplateAppName('X', taken)).toBe(expected);
    });

    it('should treat regex characters in the base name literally', () => {
      const base = 'C++ (beta).*';

      expect(nextTemplateAppName(base, [base, 'C++ (beta)xx_7'])).toBe('C++ (beta).*_1');
    });
  });

  describe('escapeLike', () => {
    it('should escape LIKE wildcards and the escape character', () => {
      expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
    });
  });
});
