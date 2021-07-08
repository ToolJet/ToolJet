import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { AppService } from '../src/app.service';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';

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

    // await userRepository.save([
    //   { email: 'dev@tooljet.io', password: 'password', createdAt: Date(), updatedAt: Date() },
    // ]);

  });

  it(`/POST login`, async () => {

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'dev@tooljet.io', password: 'password' })
      .expect(201)
  });

  afterAll(async () => {
    await app.close();
  });
});