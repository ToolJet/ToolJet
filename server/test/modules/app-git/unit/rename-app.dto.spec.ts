/// <reference types="jest" />
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RenameAppOrVersionDto } from '@modules/app-git/dto';

// '/' is a filesystem path separator once the app/module is serialized to git
// (server/ee/app-git, server/ee/git-sync): a name containing it splits into nested git
// folders and silently vanishes on the next pull.
/** @group gitsync */
describe('RenameAppOrVersionDto — updatedName "/" restriction', () => {
  const updatedNameError = async (dto: object) => {
    const errors = await validate(dto);
    return errors.find((error) => error.property === 'updatedName');
  };

  it('should reject an updatedName containing "/"', async () => {
    const dto = plainToInstance(RenameAppOrVersionDto, { prevName: 'old', updatedName: 'abc/appname' });
    expect((await updatedNameError(dto))?.constraints).toHaveProperty('matches');
  });

  it('should accept a slash-free updatedName', async () => {
    const dto = plainToInstance(RenameAppOrVersionDto, { prevName: 'old', updatedName: 'abc-appname' });
    expect(await updatedNameError(dto)).toBeUndefined();
  });
});
