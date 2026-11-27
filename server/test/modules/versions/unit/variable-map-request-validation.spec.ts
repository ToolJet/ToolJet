/**
 * @group platform
 *
 * The global ValidationPipe (`whitelist: true, transform: true`) converts request bodies with
 * class-transformer, which silently skips keys that are inherited functions on the target object
 * (`toString`, `valueOf`, `hasOwnProperty`, ...). Declared-variable maps are keyed by
 * name, so a reserved name was dropped before `assertVariableDefinitionMap` could reject it, and a
 * payload holding only reserved names saved as `{}` and cleared the version's variables.
 * The variable-carrying DTO fields must reach the services exactly as sent.
 *
 * `__proto__`, `constructor` and `prototype` are different: Nest's ValidationPipe deletes them from
 * every request body before conversion (its prototype-pollution guard), so they never reach a DTO.
 */
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { CreatePageDto } from '@modules/apps/dto/page';
import { assertVariableDefinitionMap } from 'src/helpers/variable-definition-map.helper';

const pipe = new ValidationPipe({ whitelist: true, transform: true });
const definition = { value: '1', fxActive: false };
// Every inherited Object.prototype method name; the pipe removes the other three itself.
const INHERITED_METHOD_NAMES = Object.getOwnPropertyNames(Object.prototype).filter(
  (name) => !['__proto__', 'constructor'].includes(name)
);
const reservedMap = () => Object.fromEntries(INHERITED_METHOD_NAMES.map((name) => [name, definition]));
const page = { id: '6f1c1a3e-0e8f-4b8e-9a51-2a4f4f7f1c11', name: 'Home', handle: 'home', index: 0 };

const throughPipe = <T>(metatype: new () => T, body: object): Promise<T> =>
  pipe.transform(body, { type: 'body', metatype });

describe('variable maps through request validation', () => {
  it('keeps reserved names in a version update so the save rejects them', async () => {
    const dto = await throughPipe(AppVersionUpdateDto, {
      globalSettings: { theme: { id: 1 }, variables: { ...reservedMap(), ok: definition } },
    });

    expect(Object.keys(dto.globalSettings.variables)).toEqual([...INHERITED_METHOD_NAMES, 'ok']);
    expect(dto.globalSettings.theme).toEqual({ id: 1 });
    expect(() => assertVariableDefinitionMap(dto.globalSettings.variables, 'globalSettings.variables')).toThrow(
      BadRequestException
    );
  });

  it('does not turn a reserved-only version update into an empty map', async () => {
    const dto = await throughPipe(AppVersionUpdateDto, { globalSettings: { variables: { toString: definition } } });

    expect(dto.globalSettings.variables).not.toEqual({});
    expect(() => assertVariableDefinitionMap(dto.globalSettings.variables, 'globalSettings.variables')).toThrow(
      'globalSettings.variables.toString is a reserved name'
    );
  });

  it('keeps reserved names in a new page so page creation rejects them', async () => {
    const dto = await throughPipe(CreatePageDto, { ...page, variables: { ...reservedMap(), ok: definition } });

    expect(Object.keys(dto.variables)).toEqual([...INHERITED_METHOD_NAMES, 'ok']);
    expect(() => assertVariableDefinitionMap(dto.variables, 'variables')).toThrow(BadRequestException);
  });

  it('still passes a valid map through unchanged', async () => {
    const variables = { selectedOrderID: definition, user_name: { value: '{{1}}', fxActive: true } };
    const dto = await throughPipe(CreatePageDto, { ...page, variables });

    expect(dto.variables).toEqual(variables);
  });
});
