import { HttpException, HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import SCIMMY from 'scimmy';

@Injectable()
export class ScimService implements OnModuleInit {
  async onModuleInit() {
    // Initialize SCIMMY with your configuration
    this.configureScimmy();
  }

  private configureScimmy() {
    // Define User resource with ingress/egress handlers
    SCIMMY.Resources.declare(SCIMMY.Resources.User)
      .ingress(async (resource, data) => {
        // Handle incoming data (create/update)
        // This is where you'd save to your database
        console.log('Ingress - Creating/Updating user:', data);
        return { ...data };
      })
      .egress(async (resource, data) => {
        // Handle outgoing data (read)
        // This is where you'd fetch from your database
        console.log('Egress - Fetching user:', data);
        return data;
      })
      .degress(async (resource, data) => {
        // Handle deletion - change status to archived
        console.log('Degress - Deleting user:', data);
      });

    // Define Group resource
    SCIMMY.Resources.declare(SCIMMY.Resources.Group)
      .ingress(async (resource, data) => {
        console.log('Ingress - Creating/Updating group:', data);
        return { ...data };
      })
      .egress(async (resource, data) => {
        console.log('Egress - Fetching group:', data);
        return data;
      })
      .degress(async (resource, data) => {
        console.log('Degress - Deleting group:', data);
      });
  }

  // Get SCIM service provider config
  getServiceProviderConfig() {
    return this.wrapWithErrorResponse(() => {
      return SCIMMY.Resources.ServiceProviderConfig;
    });
  }

  // Get resource types
  getResourceTypes() {
    return this.wrapWithErrorResponse(() => {
      return SCIMMY.Resources.ResourceType;
    });
  }

  // Get schemas
  getSchemas() {
    return this.wrapWithErrorResponse(() => {
      return SCIMMY.Resources.Schema;
    });
  }

  private async wrapWithErrorResponse(operation: (...args) => any): Promise<any> {
    try {
      return await operation();
    } catch (error) {
      throw new HttpException(this.handleError(error), error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private handleError(error: any) {
    const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Internal server error';

    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
      detail: message,
      status,
    };
  }
}
