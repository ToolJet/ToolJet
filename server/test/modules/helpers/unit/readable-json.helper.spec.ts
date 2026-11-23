/**
 * @group platform
 *
 * readableJson (src/helpers/readable-json.helper.ts) against real Postgres: a `json` column stores escapes that its
 * operators cannot decode, so a plain `->` (or `::jsonb`) on such a value fails. Each case below is first shown to
 * fail the plain way, so the cases stay real if Postgres changes.
 */
import { INestApplication } from '@nestjs/common';
import { initTestApp, closeTestApp, getDefaultDataSource } from 'test-helper';
import { readableJson } from 'src/helpers/readable-json.helper';

const BS = '\\';
const props = (text: string) => `{"text":{"value":"${text}"},"codePage":{"value":"true"}}`;

const UNREADABLE: [string, string][] = [
  ['an escaped NUL', props(`a${BS}u0000b`)],
  ['a lone high surrogate (half an emoji)', props(`hi ${BS}ud83d there`)],
  ['a lone low surrogate', props(`${BS}udc00`)],
  ['a high surrogate followed by a NUL', props(`${BS}ud83d${BS}u0000`)],
  ['uppercase hex', props(`${BS}uD83D`)],
  ['a lone surrogate in a key', `{"${BS}ud83d":1,"codePage":{"value":"true"}}`],
];

describe('readableJson', () => {
  let nestApp: INestApplication;
  const read = async (sql: string, raw: string) => {
    const [row] = await getDefaultDataSource().query(`SELECT ${sql} AS v`, [raw]);
    return row.v;
  };
  // A failed statement aborts the suite transaction: run the expected failure under its own savepoint.
  const readError = async (sql: string, raw: string): Promise<string> => {
    const db = getDefaultDataSource();
    await db.query('SAVEPOINT plain_read');
    try {
      await read(sql, raw);
      return 'no error';
    } catch (error) {
      return (error as Error).message;
    } finally {
      await db.query('ROLLBACK TO SAVEPOINT plain_read');
    }
  };

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60000);

  describe.each(UNREADABLE)('with %s', (_, raw) => {
    it('should fail through a plain -> read, and read through readableJson', async () => {
      expect(await readError(`$1::json -> 'codePage' ->> 'value'`, raw)).toMatch(
        /unsupported Unicode escape sequence|invalid input syntax for type json/
      );
      expect(await read(`${readableJson('$1::json')} -> 'codePage' ->> 'value'`, raw)).toBe('true');
    });

    it('should cast to jsonb', async () => {
      expect(await readError(`$1::json::jsonb -> 'codePage' ->> 'value'`, raw)).not.toBe('no error');
      expect(await read(`${readableJson('$1::json', 'jsonb')} -> 'codePage' ->> 'value'`, raw)).toBe('true');
    });
  });

  it('should keep a literal backslash before u0000 or ud83d valid JSON', async () => {
    for (const text of [`${BS}${BS}u0000`, `${BS}${BS}ud83d`]) {
      expect(await read(`${readableJson('$1::json')} -> 'codePage' ->> 'value'`, props(text))).toBe('true');
    }
  });

  it('should leave a value with no surrogate or NUL escape unchanged', async () => {
    const raw = props(`plain ${BS}u00e9 ${BS}n ${BS}"quoted${BS}" emoji 😀`);
    expect(await read(`${readableJson('$1::json')}::text`, raw)).toBe(raw);
  });
});
