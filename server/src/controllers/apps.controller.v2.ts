import { Controller } from '@nestjs/common';
// import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';

@Controller({
  path: 'apps',
  version: '2', // Set the version to '2'
})
export class AppsControllerV2 {
  constructor(/* Add your services and dependencies here */) {}

  // Add your new version 2 methods here
}
