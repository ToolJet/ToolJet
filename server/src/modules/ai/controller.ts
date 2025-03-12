import { Controller, Get, Post, Body, Param, Res, NotFoundException } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import { Response } from 'express';
import { IAiController } from './interfaces/IController';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';

@Controller('ai')
export class AiController implements IAiController {
  constructor() {}

  @InitFeature(FEATURE_KEY.FETCH_ZERO_STATE)
  @Get('/zero-state')
  async fetchZeroStateConfig(@User() user) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.SEND_USER_MESSAGE)
  @Post('conversation/message')
  async sendUserMessage(@User() user, @Body() body, @Res() response: Response) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.SEND_DOCS_MESSAGE)
  @Post('conversation/docs-message')
  async sendUserDocsMessage(@User() user, @Body() body, @Res() response: Response) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.APPROVE_PRD)
  @Post('conversation/approve-prd')
  async approvePrd(
    @User() user,
    @Param('conversationId') conversationId: string,
    @Body() body,
    @Res() response: Response
  ) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.REGENERATE_MESSAGE)
  @Post('conversation/regenerate-message')
  async regenerateAiMessage(@User() user, @Param('parentMessageId') parentMessageId: string) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.VOTE_MESSAGE)
  @Post('conversation/vote-message')
  async voteAiMessage(@User() user, @Param('messageId') messageId: string, @Body() body) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GET_CREDITS_BALANCE)
  @Get('/get-credits-balance')
  async getCreditsBalance(@User() user) {
    throw new NotFoundException();
  }
}
