import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateLibraryQueryDto, LIBRARY_OPTIONS_MAX_LENGTH } from '@modules/query-library/dto';
import { UpdateLibraryDraftDto } from '@modules/query-library/dto/lifecycle';

// Every saved version keeps a copy of the draft's options, so their size is capped (the request limit is far higher).
describe('Library options size cap', () => {
  const optionsOfLength = (length: number) => ({ body: 'x'.repeat(length - JSON.stringify({ body: '' }).length) });
  const errorsFor = (type: new () => object, value: object) =>
    validateSync(plainToInstance(type, value), { whitelist: true, forbidNonWhitelisted: true }).flatMap((error) =>
      Object.keys(error.constraints ?? {})
    );
  const create = { name: 'q', kind: 'restapi', dataSourceId: null };

  it.each([
    ['a draft edit', UpdateLibraryDraftDto, {}],
    ['a new library query', CreateLibraryQueryDto, create],
  ])('should accept options at the cap and refuse one character more on %s', (_label, type, rest) => {
    expect(errorsFor(type, { ...rest, options: optionsOfLength(LIBRARY_OPTIONS_MAX_LENGTH) })).toEqual([]);
    expect(errorsFor(type, { ...rest, options: optionsOfLength(LIBRARY_OPTIONS_MAX_LENGTH + 1) })).toEqual([
      'maxJsonLength',
    ]);
  });
});
