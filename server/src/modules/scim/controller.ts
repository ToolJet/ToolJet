import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ScimService } from './service';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';

@Controller('scim/v2')
@InitModule(MODULES.SCIM)
export class ScimController {
  constructor(private readonly scimService: ScimService) {}

  // ============================================
  // Service Provider Configuration Endpoints
  // ============================================

  @Get('ServiceProviderConfig')
  @InitFeature(FEATURE_KEY.GET_SP_CONFIG)
  async getServiceProviderConfig() {
    return this.scimService.getServiceProviderConfig();
  }

  @Get('ResourceTypes')
  @InitFeature(FEATURE_KEY.GET_RESOURCE_TYPES)
  async getResourceTypes() {
    return this.scimService.getResourceTypes();
  }

  @Get('Schemas')
  @InitFeature(FEATURE_KEY.GET_SCHEMAS)
  async getSchemas() {
    return this.scimService.getSchemas();
  }

  @Get('Schemas/:id')
  @InitFeature(FEATURE_KEY.GET_SCHEMA)
  async getSchema(@Param('id') id: string) {
    const schemas = await this.scimService.getSchemas();
    const schema = Array.isArray(schemas.Resources) ? schemas.Resources.find((s) => s.id === id) : null;

    if (!schema) {
      throw new HttpException(
        {
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
          detail: 'Schema not found',
          status: 404,
        },
        HttpStatus.NOT_FOUND
      );
    }

    return schema;
  }
}
