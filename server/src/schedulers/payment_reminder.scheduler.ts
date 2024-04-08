import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailService } from '@services/email.service';
import { OrganizationSubscriptionInvoice } from 'src/entities/organization_subscription_invoice.entity';
import { OrganizationsLicense } from 'src/entities/organization_license.entity';
import { OrganizationSubscription } from 'src/entities/organization_subscription.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EntityManager } from 'typeorm';

@Injectable()
export class PaymentReminderScheduler {
  constructor(private emailService: EmailService) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async handleCron() {
    console.log('starting job to send payment reminders', new Date().toISOString());
    await dbTransactionWrap(async (manager: EntityManager) => {
      const currentDateMinusOneDay = new Date();
      currentDateMinusOneDay.setDate(currentDateMinusOneDay.getDate() - 1);
      const currentYear = currentDateMinusOneDay.getFullYear();
      const currentMonth = (currentDateMinusOneDay.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
      const currentDay = currentDateMinusOneDay.getDate().toString().padStart(2, '0');
      const formattedCurrentDate = `${currentYear}-${currentMonth}-${currentDay}`;
      const licenses = await manager
        .createQueryBuilder(OrganizationsLicense, 'organizations_license')
        .where(
          "DATE_TRUNC('day',organizations_license.expiry_with_grace_period) = TO_DATE(:formattedCurrentDate, 'YYYY-MM-DD')",
          {
            formattedCurrentDate,
          }
        )
        .getMany();

      licenses.map(async (license) => {
        const latestInvoice = manager
          .createQueryBuilder(OrganizationSubscriptionInvoice, 'organization_subscription_invoice')
          .select('MAX(organization_subscription_invoice.created_at)', 'latest_created_at')
          .where('organization_subscription_invoice.organizationId = :organizationId', {
            organizationId: license.organizationId,
          })
          .getQuery();

        const subscription = await manager
          .createQueryBuilder(OrganizationSubscription, 'organization_subscription')
          .leftJoinAndSelect(
            'organization_subscription.organizationSubscriptionInvoices',
            'organizationSubscriptionInvoices'
          )
          .leftJoinAndSelect('organization_subscription.user', 'user')
          .where('organization_subscription.organization_id = :organizationId', {
            organizationId: license.organizationId,
          })
          .andWhere(`invoices.created_at = (${latestInvoice})`)
          .getOne();

        const { user, organizationSubscriptionInvoices } = subscription;
        const { email, firstName } = user;
        const invoice = organizationSubscriptionInvoices[0];
        const { invoiceLink, invoiceDue } = invoice;
        const dueDate = moment(invoiceDue).format('DD MMMM YYYY');
        const expiryDate = new Date(license.expiryDate);
        const paymentDate = moment(expiryDate.setDate(expiryDate.getDate() + 14)).format('DD MMMM YYYY');
        this.emailService
          .sendPaymentReminderEmail(email, firstName, invoiceLink, dueDate, paymentDate)
          .catch((err) => console.error('Error while sending Payment reminder mail', err));
      });
    });
  }
}
