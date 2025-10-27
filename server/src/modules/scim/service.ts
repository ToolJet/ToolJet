import { HttpException, HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import SCIMMY from 'scimmy';

@Injectable()
export class ScimService implements OnModuleInit {
  async onModuleInit() {
    // Initialize SCIMMY with your configuration
    this.configureScimmy();
    this.defineCustomSchemas();
  }

  private defineCustomSchemas() {
    // 1️⃣ Define a custom schema for organization extension
    class OrgExtensionSchema extends SCIMMY.Types.Schema {
      constructor() {
        super({
          id: 'urn:tooljet:params:scim:schemas:extension:organization:2.0:Group',
          name: 'Organization Extension',
          description: 'Extended attributes for organization-specific group data',
          attributes: [
            {
              name: 'organization',
              type: 'string',
              description: 'Organization ID',
              required: false,
              caseExact: true,
              mutability: 'immutable',
              returned: 'always',
              uniqueness: 'none',
            },
          ],
        });
      }
    }

    // 2️⃣ Extend the core Group resource
    class CustomGroup extends SCIMMY.Resources.Group {
      static schemaExtensions = [
        {
          schema: new OrgExtensionSchema(),
          required: false,
        },
      ];
    }

    // 3️⃣ Declare the custom Group resource with SCIMMY
    SCIMMY.Resources.declare(CustomGroup);

    // 1️⃣ Define a custom schema for meta extension
    class MetaExtensionSchema extends SCIMMY.Types.Schema {
      constructor() {
        super({
          id: 'urn:tooljet:params:scim:schemas:extension:meta:2.0:User',
          name: 'Meta Extension',
          description: 'Extended attributes for user metadata',
          attributes: [
            {
              name: 'meta',
              type: 'complex',
              description: 'User metadata key-value pairs',
              required: false,
              caseExact: false,
              mutability: 'readWrite',
              returned: 'always',
              uniqueness: 'none',
              multiValued: false,
            },
          ],
        });
      }
    }

    // 2️⃣ Extend the core User resource
    class CustomUser extends SCIMMY.Resources.User {
      static schemaExtensions = [
        {
          schema: new MetaExtensionSchema(),
          required: false,
        },
      ];
    }

    // 3️⃣ Declare the custom User resource with SCIMMY
    SCIMMY.Resources.declare(CustomUser);
  }

  private configureScimmy() {
    // Define User resource with ingress/egress handlers
    SCIMMY.Resources.declare(SCIMMY.Resources.User)
      .ingress(async (resource: SCIMMY.Resources.User, data) => {
        // Handle incoming data (create/update)
        // This is where you'd save to your database
        console.log('Ingress - Creating/Updating user:', data);
        return { ...data };
      })
      .egress(async (resource: SCIMMY.Resources.User, data) => {
        // Handle outgoing data (read)
        // This is where you'd fetch from your database
        console.log('Egress - Fetching user:', data);
        return data;
      })
      .degress(async (resource: SCIMMY.Resources.User, data) => {
        // Handle deletion - change status to archived
        console.log('Degress - Deleting user:', data);
      });

    // Define Group resource
    SCIMMY.Resources.declare(SCIMMY.Resources.Group)
      .ingress(async (resource: SCIMMY.Resources.Group, data) => {
        console.log('Ingress - Creating/Updating group:', data);
        return { ...data };
      })
      .egress(async (resource: SCIMMY.Resources.Group, data) => {
        console.log('Egress - Fetching group:', data);
        return data;
      })
      .degress(async (resource: SCIMMY.Resources.Group, data) => {
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
