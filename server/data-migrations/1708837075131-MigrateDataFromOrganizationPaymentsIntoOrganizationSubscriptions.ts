import { MigrationInterface, QueryRunner } from 'typeorm';
import { OrganizationSubscriptionInvoice } from 'src/entities/organization_subscription_invoice.entity';

const stripe = require('stripe')(process.env.STRIPE_API_KEY);

export class MigrateDataFromOrganizationPaymentsIntoOrganizationSubscriptions1708837075131
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    const existingOrganizationPayments = await queryRunner.query(
      `SELECT subscription_id from organizations_payments GROUP BY subscription_id`
    );

    for (const existingOrganizationPayment of existingOrganizationPayments) {
      const { subscription_id } = existingOrganizationPayment;
      const subscription = await stripe.subscriptions.retrieve(subscription_id);
      const subscriptionStatus = subscription.status;
      const customerId = subscription.customer;

      const latestSubscription = await queryRunner.query(
        `SELECT * FROM organizations_payments WHERE subscription_id=$1 ORDER BY created_at DESC limit 1`,
        [subscription_id]
      );

      const latestSub = latestSubscription[0];

      const {
        organization_id,
        user_id,
        invoice_id,
        invoice_paid_date,
        invoice_type,
        no_of_editors,
        no_of_readers,
        email,
        compnay_name,
        is_license_generated,
        subscription_type,
        mode,
      } = latestSub;

      const result = await queryRunner.query(
        `
      INSERT INTO organization_subscriptions (organization_id, user_id, subscription_id, no_of_editors, no_of_readers, email, company_name, is_license_generated, subscription_type, mode, customer_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `,
        [
          organization_id,
          user_id,
          subscription_id,
          no_of_editors,
          no_of_readers,
          email,
          compnay_name || '',
          is_license_generated,
          subscription_type,
          mode,
          customerId,
          subscriptionStatus,
        ]
      );
      const insertedId = result[0].id;
      const retrievedInvoice = await stripe.invoices.retrieve(invoice_id);
      const { period_end, status, customer, hosted_invoice_url, period_start } = retrievedInvoice;
      const invoice = {
        subscriptionId: subscription_id,
        customerId: customer,
        status,
        organizationId: organization_id,
        invoiceDue: new Date(period_end * 1000),
        userId: user_id,
        invoiceId: invoice_id,
        invoiceLink: hosted_invoice_url,
        isViewed: true,
        paidDate: invoice_paid_date,
        currentPeriodStart: new Date(period_start * 1000),
        currentPeriodEnd: new Date(period_end * 1000),
        type: invoice_type,
        organizationSubscriptionId: insertedId,
      };
      await entityManager.save(
        OrganizationSubscriptionInvoice,
        entityManager.create(OrganizationSubscriptionInvoice, invoice)
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS organization_subscriptions');
  }
}
