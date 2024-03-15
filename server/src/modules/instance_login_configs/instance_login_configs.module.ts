import { Module } from '@nestjs/common';
import { InstanceLoginConfigsController } from '@controllers/instance_login_configs.controller';
import { InstanceSettingsModule } from '../instance_settings/instance_settings.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { SSOGuard } from '@ee/licensing/guards/sso.guard';
import { LDAPGuard } from '@ee/licensing/guards/ldap.guard';
import { OIDCGuard } from '@ee/licensing/guards/oidc.guard';
import { SAMLGuard } from '@ee/licensing/guards/saml.guard';

@Module({
  controllers: [InstanceLoginConfigsController],
  providers: [SSOGuard, OIDCGuard, LDAPGuard, SAMLGuard],
  imports: [InstanceSettingsModule, OrganizationsModule],
})
export class InstanceLoginConfigsModule {}
