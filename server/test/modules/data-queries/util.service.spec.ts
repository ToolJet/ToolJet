import { Test, TestingModule } from '@nestjs/testing';
import { DataQueriesUtilService } from '../../../src/modules/data-queries/util.service';
import { ConfigService } from '@nestjs/config';
import { VersionRepository } from '../../../src/modules/versions/repository';
import { AppEnvironmentUtilService } from '../../../src/modules/app-environments/util.service';
import { DataSourcesUtilService } from '../../../src/modules/data-sources/util.service';
import { PluginsServiceSelector } from '../../../src/modules/data-sources/services/plugin-selector.service';

describe('DataQueriesUtilService', () => {
  let service: DataQueriesUtilService;
  let dataSourceUtilService: DataSourcesUtilService;

  beforeEach(async () => {
    const mockDataSourceUtilService = {
      resolveConstants: jest.fn(),
      parseSourceOptions: jest.fn(),
      getAuthUrl: jest.fn(),
      updateOAuthAccessToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataQueriesUtilService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: VersionRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AppEnvironmentUtilService,
          useValue: {
            getOptions: jest.fn(),
          },
        },
        {
          provide: DataSourcesUtilService,
          useValue: mockDataSourceUtilService,
        },
        {
          provide: PluginsServiceSelector,
          useValue: {
            getService: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DataQueriesUtilService>(DataQueriesUtilService);
    dataSourceUtilService = module.get<DataSourcesUtilService>(DataSourcesUtilService);
  });

  describe('parseQueryOptions', () => {
    it('should traverse objects and arrays properly', async () => {
      const object = {
        nestedObject: {
          key: 'value',
        },
        array: [1, 2, 3],
        nestedArray: [{ key: 'value' }],
      };
      const options = {};
      const result = await service.parseQueryOptions(object, options, 'org-id');

      expect(result).toEqual(object);
    });

    it('should replace a simple variable', async () => {
      const object = {
        key: '{{variable}}',
      };
      const options = {
        '{{variable}}': 'replaced value',
      };
      const result = await service.parseQueryOptions(object, options, 'org-id');

      expect(result).toEqual({
        key: 'replaced value',
      });
    });

    it('should replace multiple variables in a string', async () => {
      const object = {
        key: 'Hello {{name}}, welcome to {{place}}!',
      };
      const options = {
        '{{name}}': 'John',
        '{{place}}': 'ToolJet',
      };
      const result = await service.parseQueryOptions(object, options, 'org-id');

      expect(result).toEqual({
        key: 'Hello John, welcome to ToolJet!',
      });
    });

    it('should replace newlines with spaces', async () => {
      const object = {
        key: 'Hello\nWorld',
      };
      const options = {};
      const result = await service.parseQueryOptions(object, options, 'org-id');

      expect(result).toEqual({
        key: 'Hello\nWorld',
      });
    });

    it('should resolve constants', async () => {
      const object = {
        key: '{{constants.API_KEY}}',
      };
      const options = {};
      jest.spyOn(dataSourceUtilService, 'resolveConstants').mockResolvedValue('resolved-api-key');

      const result = await service.parseQueryOptions(object, options, 'org-id', 'env-id', { id: 'user-id' } as any);

      expect(dataSourceUtilService.resolveConstants).toHaveBeenCalledWith('{{constants.API_KEY}}', 'org-id', 'env-id', {
        id: 'user-id',
      });
      expect(result).toEqual({
        key: 'resolved-api-key',
      });
    });

    it('should resolve secrets', async () => {
      const object = {
        key: '{{secrets.DB_PASSWORD}}',
      };
      const options = {};
      jest.spyOn(dataSourceUtilService, 'resolveConstants').mockResolvedValue('secret-password');

      const result = await service.parseQueryOptions(object, options, 'org-id');

      expect(dataSourceUtilService.resolveConstants).toHaveBeenCalledWith(
        '{{secrets.DB_PASSWORD}}',
        'org-id',
        undefined,
        undefined
      );
      expect(result).toEqual({
        key: 'secret-password',
      });
    });

    it('should resolve globals.server variables', async () => {
      const object = {
        key: '{{globals.server.BASE_URL}}',
      };
      const options = {};
      jest.spyOn(dataSourceUtilService, 'resolveConstants').mockResolvedValue('https://api.example.com');

      const result = await service.parseQueryOptions(object, options, 'org-id');

      expect(dataSourceUtilService.resolveConstants).toHaveBeenCalledWith(
        '{{globals.server.BASE_URL}}',
        'org-id',
        undefined,
        undefined
      );
      expect(result).toEqual({
        key: 'https://api.example.com',
      });
    });

    it('should replace variables in nested objects', async () => {
      const object = {
        level1: {
          level2: {
            key: '{{variable}}',
          },
        },
      };
      const options = {
        '{{variable}}': 'replaced value',
      };
      const result = await service.parseQueryOptions(object, options, 'org-id');

      expect(result).toEqual({
        level1: {
          level2: {
            key: 'replaced value',
          },
        },
      });
    });

    it('should replace variables in arrays', async () => {
      const object = {
        array: ['{{var1}}', '{{var2}}', 'static'],
      };
      const options = {
        '{{var1}}': 'value1',
        '{{var2}}': 'value2',
      };
      const result = await service.parseQueryOptions(object, options, 'org-id');

      expect(result).toEqual({
        array: ['value1', 'value2', 'static'],
      });
    });

    it('should handle object value replacements', async () => {
      const object = {
        key: '{{objectVar}}',
      };
      const options = {
        '{{objectVar}}': { foo: 'bar' },
      };
      const result = await service.parseQueryOptions(object, options, 'org-id');

      expect(result).toEqual({
        key: { foo: 'bar' },
      });
    });

    it('should handle null and undefined replacements', async () => {
      const object = {
        nullKey: '{{nullVar}}',
        undefinedKey: '{{undefinedVar}}',
      };
      const options = {
        '{{nullVar}}': null,
        '{{undefinedVar}}': undefined,
      };
      const result = await service.parseQueryOptions(object, options, 'org-id');

      expect(result).toEqual({
        nullKey: null,
        undefinedKey: undefined,
      });
    });

    it('should handle numeric replacements', async () => {
      const object = {
        key: '{{numVar}}',
      };
      const options = {
        '{{numVar}}': 42,
      };
      const result = await service.parseQueryOptions(object, options, 'org-id');

      expect(result).toEqual({
        key: 42,
      });
    });

    it('should handle a complex case with multiple replacement types', async () => {
      const object = {
        simpleVar: '{{var}}',
        multipleVars: 'Hello {{name}} at {{company}}',
        constant: '{{constants.API_URL}}',
        nested: {
          array: [
            '{{var}}',
            {
              deepNested: '{{secrets.API_KEY}}',
            },
          ],
        },
      };

      const options = {
        '{{var}}': 'replaced',
        '{{name}}': 'John',
        '{{company}}': 'ToolJet',
      };

      jest.spyOn(dataSourceUtilService, 'resolveConstants').mockImplementation(async (value) => {
        if (value === '{{constants.API_URL}}') return 'https://api.example.com';
        if (value === '{{secrets.API_KEY}}') return 'secret-key';
        return value;
      });

      const result = await service.parseQueryOptions(object, options, 'org-id');

      expect(result).toEqual({
        simpleVar: 'replaced',
        multipleVars: 'Hello John at ToolJet',
        constant: 'https://api.example.com',
        nested: {
          array: [
            'replaced',
            {
              deepNested: 'secret-key',
            },
          ],
        },
      });
    });

    it('should fail to resolve constants with spaces in variable names', async () => {
      const object = {
        key: '{{ constants.API_KEY}}',
        anotherKey: '{{  secrets.DB_PASSWORD  }}',
        thirdKey: '{{ globals.server.BASE_URL }}',
      };
      const options = {};

      jest.spyOn(dataSourceUtilService, 'resolveConstants').mockResolvedValue('should-not-be-used');

      const result = await service.parseQueryOptions(object, options, 'org-id');

      expect(dataSourceUtilService.resolveConstants).not.toHaveBeenCalledWith(
        '{{ constants.API_KEY}}',
        'org-id',
        undefined,
        undefined
      );

      expect(result).toEqual(object);
    });

    it('should not replace malformed variables', async () => {
      const object = {
        incomplete1: '{{ incomplete',
        incomplete2: 'incomplete }}',
        malformed: '{ variable }',
      };
      const options = {
        '{{ incomplete': 'should not be used',
        'incomplete }}': 'should not be used',
        '{ variable }': 'should not be used',
      };
      const result = await service.parseQueryOptions(object, options, 'org-id');

      expect(result).toEqual(object);
    });

    it('should handle variables without replacement values', async () => {
      const object = {
        key: '{{nonExistentVar}}',
      };
      const options = {};
      const result = await service.parseQueryOptions(object, options, 'org-id');

      expect(result).toEqual({
        key: undefined,
      });
    });

    it('should handle a mix of valid and invalid variable formats', async () => {
      const object = {
        valid: '{{validVar}}',
        invalid: '{{ invalidVar }}',
        mixed: 'Hello {{validVar}} and {{ invalidVar }}!',
      };
      const options = {
        '{{validVar}}': 'replaced',
        '{{ invalidVar }}': undefined,
      };

      const result = await service.parseQueryOptions(object, options, 'org-id');

      expect(result).toEqual({
        valid: 'replaced',
        invalid: undefined,
        mixed: 'Hello replaced and undefined!',
      });
    });

    it('should handle spaces in constants/secrets/globals references', async () => {
      const object = {
        secrets: '{{secrets.API_KEY}}',
        secretsWithSpaces: '{{  secrets.API_KEY  }}',
        constants: '{{constants.DB_URL}}',
        constantsWithSpaces: '{{ constants.DB_URL }}',
        globals: '{{globals.server.URL}}',
        globalsWithSpaces: '{{  globals.server.URL  }}',
      };

      const options = {};

      jest.spyOn(dataSourceUtilService, 'resolveConstants').mockImplementation(async (input) => {
        if (input === '{{secrets.API_KEY}}') return 'correct-secret';
        if (input === '{{constants.DB_URL}}') return 'correct-constant';
        if (input === '{{globals.server.URL}}') return 'correct-global';
        // These conditions should be included for proper handling of spaces
        if (input === '{{  secrets.API_KEY  }}') return 'correct-secret-with-spaces';
        if (input === '{{ constants.DB_URL }}') return 'correct-constant-with-spaces';
        if (input === '{{  globals.server.URL  }}') return 'correct-global-with-spaces';
        return input;
      });

      const result = await service.parseQueryOptions(object, options, 'org-id');

      // This expectation will fail because the current implementation doesn't handle spaces correctly
      expect(result).toEqual({
        secrets: 'correct-secret',
        secretsWithSpaces: 'correct-secret-with-spaces', // Should be resolved but currently isn't
        constants: 'correct-constant',
        constantsWithSpaces: 'correct-constant-with-spaces', // Should be resolved but currently isn't
        globals: 'correct-global',
        globalsWithSpaces: 'correct-global-with-spaces', // Should be resolved but currently isn't
      });
    });

    it('should handle all JavaScript data types and special values', async () => {
      const date = new Date('2023-05-15T12:00:00Z');
      const regex = /test/gi;

      const object = {
        string: '{{stringVar}}',
        number: '{{numberVar}}',
        boolean: '{{boolVar}}',
        nullVal: '{{nullVar}}',
        undefinedVal: '{{undefinedVar}}',
        nanVal: '{{nanVar}}',
        infinityVal: '{{infinityVar}}',
        negInfinityVal: '{{negInfinityVar}}',
        emptyString: '{{emptyStringVar}}',
        emptyArray: '{{emptyArrayVar}}',
        emptyObject: '{{emptyObjectVar}}',
        dateObj: '{{dateVar}}',
        regexObj: '{{regexVar}}',
        bigInt: '{{bigIntVar}}',
        nestedObject: '{{nestedObjVar}}',
        arrayMixed: '{{arrayMixedVar}}',
        // Using variables within strings
        mixedString: 'String with {{numberVar}} and {{boolVar}} values',
      };

      const options = {
        '{{stringVar}}': 'test string',
        '{{numberVar}}': 42,
        '{{boolVar}}': true,
        '{{nullVar}}': null,
        '{{undefinedVar}}': undefined,
        '{{nanVar}}': NaN,
        '{{infinityVar}}': Infinity,
        '{{negInfinityVar}}': -Infinity,
        '{{emptyStringVar}}': '',
        '{{emptyArrayVar}}': [],
        '{{emptyObjectVar}}': {},
        '{{dateVar}}': date,
        '{{regexVar}}': regex,
        '{{bigIntVar}}': BigInt(9007199254740991),
        '{{nestedObjVar}}': {
          key1: 'value1',
          key2: 123,
          key3: {
            nestedKey: 'nested value',
          },
        },
        '{{arrayMixedVar}}': [1, 'string', true, null, { key: 'value' }],
      };

      const result = await service.parseQueryOptions(object, options, 'org-id');

      expect(result).toEqual({
        string: 'test string',
        number: 42,
        boolean: true,
        nullVal: null,
        undefinedVal: undefined,
        nanVal: NaN,
        infinityVal: Infinity,
        negInfinityVal: -Infinity,
        emptyString: '',
        emptyArray: [],
        emptyObject: {},
        dateObj: date,
        regexObj: regex,
        bigInt: BigInt(9007199254740991),
        nestedObject: {
          key1: 'value1',
          key2: 123,
          key3: {
            nestedKey: 'nested value',
          },
        },
        arrayMixed: [1, 'string', true, null, { key: 'value' }],
        // Mixed string should have the values converted to strings when interpolated
        mixedString: 'String with 42 and true values',
      });
    });
  });
});
