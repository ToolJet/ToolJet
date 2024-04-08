import { Module } from '@nestjs/common';
import { EmailService } from '@services/email.service';
import { OrganizationPaymentService } from '@services/organization_payment.service';
import { OrganizationPaymentController } from '@controllers/organization_payment.controller';
import { WhiteLabellingModule } from '../white-labelling/white-labelling.module';

@Module({
  imports: [WhiteLabellingModule],
  providers: [OrganizationPaymentService, EmailService],
  controllers: [OrganizationPaymentController],
  exports: [],
})
export class OrganizationPaymentModule {}
