import { LoginConfigsModule } from '@modules/login-configs/module';
import { CustomDomainsModule } from '@modules/custom-domains/module';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserRepository } from '@modules/users/repositories/repository';
import { McpOAuthService } from './service';
import { McpOAuthController, McpOAuthMetadataController } from './controller';

/** OAuth connectivity is shared by CE, EE and Cloud and has no license gate. */
@Global()
@Module({
  imports: [JwtModule.register({}), ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }])],
  providers: [McpOAuthService, UserRepository],
  controllers: [McpOAuthController, McpOAuthMetadataController],
  exports: [McpOAuthService],
})
export class McpOAuthModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    return { module: McpOAuthModule, imports: [await LoginConfigsModule.register(configs), await CustomDomainsModule.register(configs)] };
  }
}
