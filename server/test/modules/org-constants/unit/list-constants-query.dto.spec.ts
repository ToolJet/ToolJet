/// <reference types="jest" />
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ListConstantsQueryDto } from '@modules/organization-constants/dto/v2/list-constants.query.dto';
import { ConstantListSort } from '@modules/organization-constants/constants';

const parse = (plain: Record<string, unknown>) => {
  const dto = plainToInstance(ListConstantsQueryDto, plain);
  return { dto, errors: validateSync(dto) };
};

describe('ListConstantsQueryDto', () => {
  const base = { type: 'Global', environment_id: '11111111-1111-4111-8111-111111111111' };

  it('lists the most recently modified first when the client sends no sort', () => {
    const { dto, errors } = parse(base);
    expect(errors).toHaveLength(0);
    expect(dto.sort).toBe(ConstantListSort.MODIFIED_DESC);
  });

  it('keeps a sort the client sends', () => {
    const { dto, errors } = parse({ ...base, sort: 'name_asc' });
    expect(errors).toHaveLength(0);
    expect(dto.sort).toBe(ConstantListSort.NAME_ASC);
  });
});
