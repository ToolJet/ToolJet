import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';

describe('Authentication', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
    .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    userRepository = app.get('UserRepository');

    await userRepository.save(userRepository.create({ email: 'dev@tooljet.io', password: 'password', createdAt: new Date(), updatedAt: new Date(), }));

  });

  it(`authenticate if valid credentials`, async () => {

    return request(app.getHttpServer())
      .post('/authenticate')
      .send({ email: 'dev@tooljet.io', password: 'password' })
      .expect(201)
  });

  it(`throw 401 if invalid credentials`, async () => {

    return request(app.getHttpServer())
      .post('/authenticate')
      .send({ email: 'dev@tooljet.io', password: 'pwd' })
      .expect(401)
  });

  afterAll(async () => {
    await app.close();
  });
});