/// <reference types="jest" />
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ImportAppDto } from '@dto/import-resources.dto';
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
});
