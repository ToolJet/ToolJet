import * as request from 'supertest';
import { jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createUser, createNestAppInstance, installPlugin } from '../test.helper';
import { PathLike } from 'fs';
const fs = require('fs/promises');

function getFile(path): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, success) => {
      if (err) {
        reject(err);
      } else {
        resolve(success);
      }
    });
  });
}

function getFsSpy(): any {
  return jest.spyOn(fs, 'readFile').mockImplementation(((
    _path: PathLike | number,
    options: { encoding?: null; flag?: string } | undefined | null,
    callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void
  ) => {
    // if (typeof options === 'string' && options === 'utf8') {
    callback(null, Buffer.from('mockdata'));
    // }
  }) as typeof fs.readFile);
}

describe('plugins controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  it('should allow only authenticated users to list plugins', async () => {
    await request(app.getHttpServer()).get('/api/plugins').expect(401);
  });

  it('should read file', async () => {
    const readFileSpy = getFsSpy();
    const actual = await getFile('/fake/path');
    expect(actual).toEqual(Buffer.from('mockdata'));
    expect(readFileSpy).toBeCalledWith('/fake/path', 'utf8', expect.any(Function));
    readFileSpy.mockRestore();
  });

  it('should list all plugins in an application', async () => {
    const userData = await createUser(app, {
      email: 'admin@tooljet.io',
    });

    const { user } = userData;

    const readFileSpy = getFsSpy();

    await installPlugin(app, {
      name: 'plugin',
      description: 'sample description',
      id: 'test-plugin',
      version: '1.0.0',
    });

    const response = await request(app.getHttpServer())
      .get(`/api/plugins`)
      .set('Authorization', authHeaderForUser(user));

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    readFileSpy.mockRestore();
  });

  afterAll(async () => {
    await app.close();
  });
});
