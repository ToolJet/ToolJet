import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository, In } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { OrganizationsAiFeature, WalletType } from '@entities/organizations_ai_feature.entity';

@Injectable()
export class OrganizationsAiFeatureRepository extends Repository<OrganizationsAiFeature> {
  constructor(private readonly dataSource: DataSource) {
    super(OrganizationsAiFeature, dataSource.createEntityManager());
  }

  /**
   * Fetch balance, expiry date, and totalAmount for
   * recurring and topup wallets of a given organization.
   */
  async findBalancesByOrganizationId(
    organizationId: string,
    manager?: EntityManager
  ): Promise<
    {
      walletType: WalletType;
      balance: number;
      expiryDate: Date | null;
      totalAmount: number;
    }[]
  > {
    return dbTransactionWrap(async (txnManager: EntityManager) => {
      return txnManager.find(OrganizationsAiFeature, {
        select: ['walletType', 'balance', 'expiryDate', 'totalAmount'],
        where: {
          organizationId,
          walletType: In([WalletType.RECURRING, WalletType.TOPUP]),
        },
      });
    }, manager || this.manager);
  }
}
