import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CreateFileDto, UpdateFileDto } from '@modules/files/dto';
import { File } from '@entities/file.entity';
import { User } from '@entities/user.entity';
import { OrganizationUser } from '@entities/organization_user.entity';

export interface FileAvatarOwnerContext {
  ownerId: string;
  ownerInRequesterOrganization: boolean;
}

@Injectable()
export class FilesRepository extends Repository<File> {
  constructor(private dataSource: DataSource) {
    super(File, dataSource.createEntityManager());
  }

  /**
   * Files served by GET /files/:id are currently only ever user avatars (User.avatarId) —
   * marketplace plugin assets are returned inline by the plugins module, never fetched by id
   * here. Resolves who owns the file's avatar, and whether that owner shares the requester's
   * active organization, so the ability layer can scope access without guessing at a rule it
   * can't reliably evaluate for files that aren't avatars.
   */
  async getAvatarOwnerContext(
    fileId: string,
    requesterOrganizationId: string | undefined
  ): Promise<FileAvatarOwnerContext | null> {
    const owner = await this.manager.findOne(User, {
      where: { avatarId: fileId },
      select: ['id'],
    });
    if (!owner) {
      return null;
    }

    let ownerInRequesterOrganization = false;
    if (requesterOrganizationId) {
      const membership = await this.manager.findOne(OrganizationUser, {
        where: { userId: owner.id, organizationId: requesterOrganizationId },
      });
      ownerInRequesterOrganization = !!membership;
    }

    return { ownerId: owner.id, ownerInRequesterOrganization };
  }

  async createOne(createFileDto: CreateFileDto, manager: EntityManager) {
    const newFile = manager.create(File, {
      filename: createFileDto.filename,
      data: createFileDto.data,
    });
    await manager.save(File, newFile);
    return newFile;
  }

  async getOne(id: string) {
    const file = await this.manager.findOne(File, {
      where: { id },
    });
    if (!file) {
      throw new NotFoundException();
    }
    return file;
  }

  async updateOne(id: string, updateFileDto: UpdateFileDto, manager: EntityManager) {
    const newFile = await manager.update(
      File,
      { id },
      {
        data: updateFileDto.data,
      }
    );
    return newFile;
  }

  async removeOne(id: string, manager: EntityManager) {
    const deleteResponse = await manager.delete(File, id);
    if (!deleteResponse?.affected) {
      throw new NotFoundException();
    }
    return deleteResponse;
  }
}
