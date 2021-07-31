import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
const fs = require('fs');

declare var TOOLJET_VERSION;
globalThis.TOOLJET_VERSION = fs.readFileSync('./.version', 'utf8')

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  await app.setGlobalPrefix('api');
  await app.enableCors();
  
  const port = parseInt(process.env.PORT) || 3000;
  
  await app.listen(port, '0.0.0.0', function() {
    console.log('Listening on port %d', port);
  });
}

bootstrap();
