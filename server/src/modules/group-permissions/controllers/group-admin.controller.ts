import { Controller } from '@nestjs/common';

// CE stub — group-admin controller is EE-only.
// EE overrides via ee/group-permissions/controllers/group-admin.controller.ts
@Controller()
export class GroupAdminController {}
