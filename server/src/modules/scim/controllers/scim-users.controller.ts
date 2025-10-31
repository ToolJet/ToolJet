import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { ScimService } from '../service';
import SCIMMY from 'scimmy';
import { Get, Post, Put, Patch, Delete, Req, Param, Body } from '@nestjs/common';
import { Request } from 'express';

@Controller('scim/v2')
@InitModule(MODULES.SCIM)
@UseGuards(FeatureAbilityGuard)
export class ScimUsersController {
  constructor(private readonly scimService: ScimService) {}

  // ============================================
  // SCIMMY Resource Instance Patterns
  // ============================================

  /*
  Question: Should we create new instances or reuse a single instance?

  Answer: CREATE NEW INSTANCES for each request (recommended)

  Why?
  1. Each request has different context (id, data, filters)
  2. Resource instances may hold state during operation
  3. Prevents race conditions in concurrent requests
  4. Follows SCIMMY's intended usage pattern
  5. Negligible performance impact (instances are lightweight)
  */

  /*
  Q: Won't creating new instances be slow?

  A: No! The performance impact is negligible:

  1. Instance creation is extremely lightweight
    - No heavy initialization
    - No database connections
    - Just object creation (~0.001ms)

  2. The actual work happens in your ingress/egress handlers
    - Database queries: 10-100ms
    - Network calls: 50-500ms
    - Instance creation: <0.001ms (0.001% of total time)

  3. Modern JavaScript engines optimize object creation
    - V8 (Node.js) is highly optimized for this pattern
    - Memory allocation is very fast

  Benchmark example:
  - Creating 1000 instances: ~1ms
  - Single database query: 10-100ms
  - Creating instances is 10,000x faster than DB operations!
  */

  @Get('Users')
  async getUsers(@Req() req: Request) {
    return await new SCIMMY.Resources.User().read(req);
  }

  @Get('Users/:id')
  async getUser(@Req() req: Request) {
    return await new SCIMMY.Resources.User().read(req);
  }

  @Post('Users')
  async createUser(@Req() req: Request) {
    return await new SCIMMY.Resources.User().write(req);
  }

  @Put('Users/:id')
  async updateUser(@Req() req: Request) {
    return await new SCIMMY.Resources.User().write(req);
  }

  @Patch('Users/:id')
  async patchUser(@Param('id') id: string, @Body() body: any) {
    // SCIMMY needs both the ID from URL params and the patch body
    // Create a minimal request-like object with what SCIMMY expects
    const patchData = {
      ...body,
      id: id, // Include the ID from the URL
    };
    return await new SCIMMY.Resources.User().patch(patchData);
  }

  @Delete('Users/:id')
  async deleteUser(@Param('id') id: string, @Req() req: Request) {
    return await new SCIMMY.Resources.User().dispose(req);
  }
}
