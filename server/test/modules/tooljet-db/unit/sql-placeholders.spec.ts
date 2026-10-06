/** @group database */
import {
  SELF_PLACEHOLDER,
  SELF_PLACEHOLDER_REGEX,
  containsTablePlaceholder,
} from 'src/modules/tooljet-db/helpers/sql-placeholders';

describe('sql-placeholders helpers', () => {
  describe('SELF_PLACEHOLDER', () => {
    it('should be the literal "{{self}}" token', () => {
      expect(SELF_PLACEHOLDER).toBe('{{self}}');
    });
  });

  describe('SELF_PLACEHOLDER_REGEX', () => {
    it('should replace every {{self}} occurrence', () => {
      const sql = 'UPDATE "{{self}}" SET a = 1; SELECT * FROM "{{self}}";';
      expect(sql.replace(SELF_PLACEHOLDER_REGEX, 'my_table')).toBe(
        'UPDATE "my_table" SET a = 1; SELECT * FROM "my_table";'
      );
    });
  });

  describe('containsTablePlaceholder', () => {
    it('should return true for a {{table.<name>}} reference', () => {
      expect(
        containsTablePlaceholder(
          'ALTER TABLE "{{self}}" ADD CONSTRAINT fk FOREIGN KEY (x) REFERENCES "{{table.sections}}"(id);'
        )
      ).toBe(true);
    });

    it('should return false with no {{table.<name>}} reference', () => {
      expect(containsTablePlaceholder('UPDATE "{{self}}" SET a = 1;')).toBe(false);
    });
  });
});
