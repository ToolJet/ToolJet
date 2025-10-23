import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ScimService } from './service';

@Controller('scim/v2')
export class ScimController {
  constructor(private readonly scimService: ScimService) {}

  // ============================================
  // Service Provider Configuration Endpoints
  // ============================================

  @Get('ServiceProviderConfig')
  async getServiceProviderConfig() {
    return this.scimService.getServiceProviderConfig();
  }

  @Get('ResourceTypes')
  async getResourceTypes() {
    return this.scimService.getResourceTypes();
  }

  @Get('Schemas')
  async getSchemas() {
    return this.scimService.getSchemas();
  }

  @Get('Schemas/:id')
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
