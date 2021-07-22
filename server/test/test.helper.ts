import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getConnection, Repository } from 'typeorm';

export function authHeaderForUser(user: any) {
  const configService = new ConfigService();
  const jwtService = new JwtService({secret: configService.get<string>('SECRET_KEY_BASE')});
  const authPayload = { username: user.id, sub: user.email };
  const authToken = jwtService.sign(authPayload);
  return `Bearer ${authToken}`;
}

export async function clearDB() {
  const entities = getConnection().entityMetadatas;
  for (const entity of entities) {
    const repository = await getConnection().getRepository(entity.name);
    await repository.query(`TRUNCATE ${entity.tableName} RESTART IDENTITY CASCADE;`);
  }
}
