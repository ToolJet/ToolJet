import { Module } from '@nestjs/common';
import { InstanceLoginConfigsController } from '@controllers/instance_login-configs.controller';
import { InstanceSettingsModule } from '@instance-settings/module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { SSOGuard } from '@modules/licensing/guards/sso/sso.guard';
import { LDAPGuard } from '@modules/licensing/guards/sso/ldap.guard';
import { OIDCGuard } from '@modules/licensing/guards/sso/oidc.guard';
import { SAMLGuard } from '@modules/licensing/guards/sso/saml.guard';
import { InstanceLoginConfigsService } from '@services/instance_login-configs.service';
@Module({
  controllers: [InstanceLoginConfigsController],
  providers: [InstanceLoginConfigsService, SSOGuard, OIDCGuard, LDAPGuard, SAMLGuard],
  imports: [InstanceSettingsModule, OrganizationsModule],
})
export class InstanceLoginConfigsModule {}
