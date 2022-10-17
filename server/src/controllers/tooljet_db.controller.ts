import { All, Controller, Req, Res, Next, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { User } from 'src/decorators/user.decorator';
import * as proxy from 'express-http-proxy';
import * as jwt from 'jsonwebtoken';

const httpProxy = proxy('http://localhost:3001', {
  proxyReqPathResolver: function (req) {
    const parts = req.url.split('?');
    const queryString = parts[1];
    const updatedPath = parts[0].replace(/\/api\/tooljet_db\/proxy\//, '');
    return updatedPath + (queryString ? '?' + queryString : '');
  },
});

function signJwtPayload(role) {
  const payload = { role };
  const secretKey = process.env.PGRST_JWT_SECRET;
  const token = jwt.sign(payload, secretKey, {
    algorithm: 'HS256',
    expiresIn: '10m',
  });

  return token;
}

@Controller('tooljet_db')
export class TooljetDbController {
  @UseGuards(JwtAuthGuard)
  @All('/proxy/*')
  proxy(@User() user, @Req() req, @Res() res, @Next() next): void {
    const authToken = 'Bearer ' + signJwtPayload(`user_${user.organizationId}`);
    req.headers = {};
    req.headers['Authorization'] = authToken;
    req.headers['Accept-Profile'] = `workspace_${user.organizationId}`;
    httpProxy(req, res, next);
  }
}
