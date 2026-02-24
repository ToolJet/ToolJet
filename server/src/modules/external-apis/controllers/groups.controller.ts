import { Controller, Post, Param, Body, NotFoundException } from '@nestjs/common';
import { CreateGroupExternalDto } from '../dto/groups.dto';

@Controller('ext')
export class ExternalApisGroupsController {
    constructor() { }

    async createGroup(
        @Param('workspaceId') workspaceId: string,
        @Body() createGroupDto: CreateGroupExternalDto
    ): Promise<void> {
        throw new NotFoundException();
    }
}
