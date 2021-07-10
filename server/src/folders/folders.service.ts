import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { Folder } from './folder.entity';

@Injectable()
export class FoldersService {

  constructor(
    @InjectRepository(Folder)
    private foldersRepository: Repository<Folder>,
  ) { }

  async all(user: User): Promise<Folder[]> {

    return await this.foldersRepository.find({
        where: {
            organizationId: user.organizationId,
        },
        order: {
            name: 'ASC'
        }
    });
  }
}
