import { All, Controller, Req, Res, Next } from '@nestjs/common';
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
  @All('*')
  proxy(@Req() req, @Res() res, @Next() next): void {
    req.headers['Authorization'] =
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoidXNlcl9iNDU5NDVkMi02ZmFlLTQ0NmQtOGQxNy05Mjg5ODkxZjEyMzEifQ.IDVu_CFgSmRpezNqwv7FSQ1fC-F_lusBdCq-S594K9U';
    req.headers['Accept-Profile'] = 'workspace_b45945d2-6fae-446d-8d17-9289891f1231';
    httpProxy(req, res, next);
  }
}
