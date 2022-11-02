import { All, Controller, Req, Res, Next, UseGuards, Post, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { User } from 'src/decorators/user.decorator';
import * as proxy from 'express-http-proxy';
import * as jwt from 'jsonwebtoken';
import { TooljetDbService } from '@services/tooljet_db.service';
import { ConfigService } from '@nestjs/config';
import { decamelizeKeys } from 'humps';

@Controller('tooljet_db')
export class TooljetDbController {
  constructor(private readonly tooljetDbService: TooljetDbService, private readonly configService: ConfigService) {}

  @UseGuards(JwtAuthGuard)
  @All('/proxy/*')
  async proxy(@User() user, @Req() req, @Res() res, @Next() next): Promise<void> {
    req.url = await this.tooljetDbService.replaceTableNamesAtPlaceholder(req, user);
    const authToken = 'Bearer ' + this.signJwtPayload(this.configService.get<string>('PG_USER'));
    req.headers = {};
    req.headers['Authorization'] = authToken;
    this.httpProxy(req, res, next);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/perform')
  async tables(@User() user, @Body() body) {
    const { action, ...params } = body;
    const result = await this.tooljetDbService.perform(user, user.defaultOrganizationId, action, params);
    return decamelizeKeys({ result });
  }

  // FIXME: Using config service breaks here as this module
  // is loaded before config service
  private httpProxy = proxy(process.env.PGRST_HOST, {
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
      expiresIn: '1m',
    });

    return token;
  }
}
