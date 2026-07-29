import { Injectable } from '@nestjs/common';
import { DataSource, ILike, Repository } from 'typeorm';
import { UserBanList } from '@entities/user_ban_list.entity';

@Injectable()
export class UserBanListRepository extends Repository<UserBanList> {
  constructor(private dataSource: DataSource) {
    super(UserBanList, dataSource.createEntityManager());
  }

  async findByEmail(email: string): Promise<UserBanList | null> {
    return this.findOne({ where: { email: ILike(email) } });
  }
}
