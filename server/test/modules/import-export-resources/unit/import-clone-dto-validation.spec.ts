/// <reference types="jest" />
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { ImportAppDto, ImportResourcesDto } from '@dto/import-resources.dto';
import { CloneAppDto } from '@dto/clone-resources.dto';

// Import and clone create an app from a user-supplied name that becomes the app name
// directly (app-import-export.service.ts: schemaUnifiedAppParams.name = appName). Like the
// create/edit DTOs, that name must stay free of the '/' and '\' git path separators —
// otherwise it splits into nested git folders and silently vanishes on the next pull.
/** @group platform */
describe('Import/Clone app name path-separator restriction (DTO)', () => {
  describe('ImportAppDto', () => {
    const appNameError = async (dto: object) => {
      const errors = await validate(dto);
      return errors.find((error) => error.property === 'appName');
    };

    it('should reject an appName containing "/"', async () => {
      const dto = plainToInstance(ImportAppDto, { definition: {}, appName: 'local/snowflake' });
      expect((await appNameError(dto))?.constraints).toHaveProperty('matches');
    });

    it('should reject an appName containing "\\"', async () => {
      const dto = plainToInstance(ImportAppDto, { definition: {}, appName: 'local\\snowflake' });
      expect((await appNameError(dto))?.constraints).toHaveProperty('matches');
    });

    it('should accept a separator-free appName', async () => {
      const dto = plainToInstance(ImportAppDto, { definition: {}, appName: 'local-snowflake' });
      expect(await appNameError(dto)).toBeUndefined();
    });

    // appName is intentionally allowed to be empty: it falls back to the definition's name
    // for git-enabled/device imports (app-import-export.service.ts allows !appName).
    it('should accept an empty appName', async () => {
      const dto = plainToInstance(ImportAppDto, { definition: {}, appName: '' });
      expect(await appNameError(dto)).toBeUndefined();
    });
  });

  describe('CloneAppDto', () => {
    const nameError = async (dto: object) => {
      const errors = await validate(dto);
      return errors.find((error) => error.property === 'name');
    };

    const validId = '11111111-1111-1111-1111-111111111111';

    it('should reject a clone name containing "/"', async () => {
      const dto = plainToInstance(CloneAppDto, { id: validId, name: 'local/snowflake' });
      expect((await nameError(dto))?.constraints).toHaveProperty('matches');
    });

    it('should reject a clone name containing "\\"', async () => {
      const dto = plainToInstance(CloneAppDto, { id: validId, name: 'local\\snowflake' });
      expect((await nameError(dto))?.constraints).toHaveProperty('matches');
    });

    it('should accept a separator-free clone name', async () => {
      const dto = plainToInstance(CloneAppDto, { id: validId, name: 'local-snowflake' });
      expect(await nameError(dto)).toBeUndefined();
    });
  });

  // ImportResourcesDto.tooljet_database runs every item through the same ajv-compiled
  // 3.0.3/tooljet_database.json schema the unsupported-column-type gate's DTO enum lives in - so
  // an import payload naming an unsupported data_type never reaches the import service at all.
  describe('ImportResourcesDto.tooljet_database (unsupported column type schema gate)', () => {
    function buildDto(dataType: string) {
      return plainToInstance(ImportResourcesDto, {
        organization_id: uuidv4(),
        tooljet_version: '3.0.0',
        app: [],
        tooljet_database: [
          {
            id: uuidv4(),
            table_name: 'gate_import_tbl',
            schema: {
              columns: [
                {
                  column_name: 'tags',
                  data_type: dataType,
                  constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
                },
              ],
              foreign_keys: [],
            },
          },
        ],
      });
    }

    const tjdbError = async (dto: object) => {
      const errors = await validate(dto);
      return errors.find((error) => error.property === 'tooljet_database');
    };

    it('rejects a column with an unsupported data_type (text[])', async () => {
      const error = await tjdbError(buildDto('text[]'));
      expect(error?.constraints).toHaveProperty('validateTooljetDatabase');
    });

    // The generic "does not match the expected format" fallback would leave the reason for the
    // likeliest import failure visible only in the server log.
    it('names the offending column path and the allowed types in the message', async () => {
      const error = await tjdbError(buildDto('text[]'));
      expect(error?.constraints?.validateTooljetDatabase).toContain('/schema/columns/0/data_type');
      expect(error?.constraints?.validateTooljetDatabase).toContain('character varying');
    });

    it('accepts a column with a supported data_type', async () => {
      expect(await tjdbError(buildDto('character varying'))).toBeUndefined();
    });
  });
});
