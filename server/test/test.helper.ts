import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/modules/auth/constants';

export function authHeaderForUser(user: any) {
  const jwtService = new JwtService({secret: jwtConstants.secret});
  const authPayload = { username: user.id, sub: user.email };
  const authToken = jwtService.sign(authPayload);
  return `Bearer ${authToken}`;
}
