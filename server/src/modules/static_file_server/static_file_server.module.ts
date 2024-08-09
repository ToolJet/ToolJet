import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

const hasSubPath = process.env.SUB_PATH !== undefined;
const UrlPrefix = hasSubPath ? process.env.SUB_PATH : '';

const imports = [
  ServeStaticModule.forRoot({
    rootPath: join(__dirname, 'assets'),
    serveRoot: (UrlPrefix ? UrlPrefix : '/../../../') + 'assets',
  })
]

if (process.env.SERVE_CLIENT !== 'false' && process.env.NODE_ENV === 'production') {
  imports.unshift(
    ServeStaticModule.forRoot({
      // Have to remove trailing slash of SUB_PATH.
      serveRoot: process.env.SUB_PATH === undefined ? '' : process.env.SUB_PATH.replace(/\/$/, ''),
      rootPath: join(__dirname, '../../../../../', 'frontend/build'),
    })
  )
}

@Module({
  imports
})

export class StaticFileServerModule {}
