import { All, Controller, Req, Res, Next, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import * as proxy from 'express-http-proxy';

const httpProxy = proxy('http://localhost:3001', {
  proxyReqPathResolver: function (req) {
    const parts = req.url.split('?');
    const queryString = parts[1];
    const updatedPath = parts[0].replace(/\/api\/tooljet_db\//, '');
    return updatedPath + (queryString ? '?' + queryString : '');
  },
});

@Controller('tooljet_db')
export class TooljetDbController {
  @UseGuards(JwtAuthGuard)
  @All('*')
  proxy(@Req() req, @Res() res, @Next() next): void {
    httpProxy(req, res, next);
  }
}
