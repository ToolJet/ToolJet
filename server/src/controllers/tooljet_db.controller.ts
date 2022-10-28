import { All, Controller, Req, Res, Next, UseGuards, Param, Post, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { User } from 'src/decorators/user.decorator';
import * as proxy from 'express-http-proxy';
import * as jwt from 'jsonwebtoken';
import { TooljetDbService } from '@services/tooljet_db.service';

@Controller('tooljet_db')
export class TooljetDbController {
  constructor(private readonly tooljetDbService: TooljetDbService) {}

  @UseGuards(JwtAuthGuard)
  @All('/proxy/*')
  proxy(@User() user, @Req() req, @Res() res, @Next() next): void {
    const authToken = 'Bearer ' + this.signJwtPayload(`user_${user.organizationId}`);
    req.headers = {};
    req.headers['Authorization'] = authToken;
    req.headers['Accept-Profile'] = `workspace_${user.organizationId}`;
    this.httpProxy(req, res, next);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/perform')
  async tables(@User() user, @Body() body) {
    const { action, ...params } = body;
    const result = await this.tooljetDbService.perform(user, user.organizationId, action, params);
    return { result };
  }

  private httpProxy = proxy('http://localhost:3001', {
    proxyReqPathResolver: function (req) {
      const parts = req.url.split('?');
      const queryString = parts[1];
      const updatedPath = parts[0].replace(/\/api\/tooljet_db\/proxy\//, '');
      return updatedPath + (queryString ? '?' + queryString : '');
    },
  });

  private signJwtPayload(role) {
    const payload = { role };
    const secretKey = process.env.PGRST_JWT_SECRET;
    const token = jwt.sign(payload, secretKey, {
      algorithm: 'HS256',
      expiresIn: '10m',
    });

    return token;
  }
}
