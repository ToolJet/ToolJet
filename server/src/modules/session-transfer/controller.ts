import { Controller, Post, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { NotFoundException } from '@nestjs/common';
import { SessionTransferService } from './service';
import { User } from '@modules/app/decorators/user.decorator';
import { User as UserEntity } from '@entities/user.entity';

@Controller('session')
export class SessionTransferController {
  constructor(protected readonly sessionTransferService: SessionTransferService) {}

  @Post('transfer-token')
  async createTransferToken(@User() user: UserEntity): Promise<any> {
    throw new NotFoundException();
  }

  @Get('transfer')
  async exchangeTransferToken(
    @Query('token') token: string,
    @Query('redirect') redirect: string,
    @Res() response: Response
  ): Promise<any> {
    throw new NotFoundException();
  }
}
