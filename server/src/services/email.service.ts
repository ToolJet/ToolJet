import { Injectable } from '@nestjs/common';
import { join } from 'path';
import handlebars from 'handlebars';
import { centsToUSD, generateInviteURL, generateOrgInviteURL } from 'src/helpers/utils.helper';
import { defaultWhiteLabellingSettings } from 'src/helpers/instance_settings.constants';
import { MailerService } from '@nestjs-modules/mailer';
import { WhiteLabellingService } from './white_labelling.service';
import {
  WHITE_LABELLING_SETTINGS,
  DEFAULT_WHITE_LABELLING_SETTINGS,
  WHITE_LABELLING_COLUMNS,
} from 'src/helpers/white_labelling.constants';

const path = require('path');
const fs = require('fs');

handlebars.registerHelper('capitalize', function (value) {
  return value.charAt(0);
});

handlebars.registerHelper('highlightMentionedUser', function (comment) {
  const regex = /(\()([^)]+)(\))/g;
  return comment.replace(regex, '<span style="color: #218DE3">$2</span>');
});
handlebars.registerHelper('eq', (a, b) => a == b);

handlebars.registerHelper('eq', (a, b) => a == b);

@Injectable()
export class EmailService {
  private FROM_EMAIL;
  private TOOLJET_HOST;
  private NODE_ENV;
  private WHITE_LABEL_TEXT;
  private WHITE_LABEL_LOGO;
  private SUB_PATH;
  private defaultWhiteLabelState;

  constructor(
    private readonly whiteLabellingService: WhiteLabellingService,
    private readonly mailerService: MailerService
  ) {
    this.FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL || 'hello@tooljet.io';
    this.TOOLJET_HOST = this.stripTrailingSlash(process.env.TOOLJET_HOST);
    this.SUB_PATH = process.env.SUB_PATH;
    this.NODE_ENV = process.env.NODE_ENV || 'development';
  }

  async init(organizationId?: string) {
    const whiteLabelSettings = await this.retrieveWhiteLabelSettings(organizationId);
    this.WHITE_LABEL_TEXT = await this.retrieveWhiteLabelText(whiteLabelSettings);
    this.WHITE_LABEL_LOGO = await this.retrieveWhiteLabelLogo(whiteLabelSettings);
    this.defaultWhiteLabelState = this.checkDefaultWhiteLabelState();
  }

  private async sendEmail(to: string, subject: string, templateData: any) {
    try {
      if (this.NODE_ENV === 'test' || (this.NODE_ENV !== 'development' && !process.env.SMTP_DOMAIN)) return;
      const message = {
        to: to,
        subject: subject,
        template: './base/base_template',
        context: templateData,
        from: this.FROM_EMAIL,
        ...(templateData?.whiteLabelText === 'ToolJet' && {
          attachments: [
            {
              filename: 'rocket.png',
              path: join(__dirname, '../mails/assets/rocket.png'),
              cid: 'rocket',
            },
            {
              filename: 'twitter.png',
              path: join(__dirname, '../mails/assets/twitter.png'),
              cid: 'twitter',
            },
            {
              filename: 'linkedin.png',
              path: join(__dirname, '../mails/assets/linkedin.png'),
              cid: 'linkedin',
            },
            {
              filename: 'youtube.png',
              path: join(__dirname, '../mails/assets/youtube.png'),
              cid: 'youtube',
            },
            {
              filename: 'github.png',
              path: join(__dirname, '../mails/assets/github.png'),
              cid: 'github',
            },
          ],
        }),
      };

      const info = await this.mailerService.sendMail(message);
      console.log('Message sent: %s', info);
    } catch (error) {
      if (this.NODE_ENV === 'test' || this.NODE_ENV == 'development') return;
      console.error('Email sent error', error);
    }
  }

  private compileTemplate(templatePath: string, templateData: object) {
    const emailContent = fs.readFileSync(path.join(__dirname, '..', 'mails', templatePath), 'utf8');
    const templateCompile = handlebars.compile(emailContent);
    return templateCompile(templateData);
  }

  private stripTrailingSlash(hostname: string) {
    return hostname?.endsWith('/') ? hostname.slice(0, -1) : hostname;
  }

  async sendWelcomeEmail(
    to: string,
    name: string,
    invitationtoken: string,
    organizationInvitationToken?: string,
    organizationId?: string,
    organizationName?: string,
    sender?: string
  ) {
    await this.init(organizationId);
    const isOrgInvite = organizationInvitationToken && sender && organizationName;
    const inviteUrl = generateInviteURL(invitationtoken, organizationInvitationToken, organizationId);
    const subject = isOrgInvite ? `Welcome to ${this.WHITE_LABEL_TEXT || 'ToolJet'}` : 'Set up your account!';
    const footerText = isOrgInvite
      ? `You have received this email as an invitation to join ${this.WHITE_LABEL_TEXT}’s workspace`
      : 'You have received this email to confirm your email address';

    const templateData = {
      name: name || '',
      inviteUrl,
      sender,
      organizationName,
      whiteLabelText: this.WHITE_LABEL_TEXT,
      whiteLabelLogo: this.WHITE_LABEL_LOGO,
    };
    const templatePath = isOrgInvite
      ? this.defaultWhiteLabelState
        ? 'default_invite_user.hbs'
        : 'invite_user.hbs'
      : this.defaultWhiteLabelState
      ? 'default_setup_account.hbs'
      : 'setup_account.hbs';
    const htmlEmailContent = this.compileTemplate(templatePath, templateData);

    return await this.sendEmail(to, subject, {
      bodyHeader: subject,
      bodyContent: htmlEmailContent,
      inviteUrl,
      footerText: footerText,
      whiteLabelText: this.WHITE_LABEL_TEXT,
      whiteLabelLogo: this.WHITE_LABEL_LOGO,
    });
  }

  async sendOrganizationUserWelcomeEmail(
    to: string,
    name: string,
    sender: string,
    invitationtoken: string,
    organizationName: string,
    organizationId?: string
  ) {
    await this.init(organizationId);
    const subject = `Welcome to ${this.WHITE_LABEL_TEXT || 'ToolJet'}`;
    const inviteUrl = generateOrgInviteURL(invitationtoken);
    const templateData = {
      name: name || '',
      inviteUrl,
      sender,
      organizationName,
      whiteLabelText: this.WHITE_LABEL_TEXT,
      whiteLabelLogo: this.WHITE_LABEL_LOGO,
    };
    const templatePath = this.defaultWhiteLabelState ? 'default_invite_user.hbs' : 'invite_user.hbs';
    const htmlEmailContent = this.compileTemplate(templatePath, templateData);

    return await this.sendEmail(to, subject, {
      bodyHeader: subject,
      bodyContent: htmlEmailContent,
      inviteUrl,
      footerText: 'You have received this email as an invitation to join ToolJet’s workspace',
      whiteLabelText: this.WHITE_LABEL_TEXT,
      whiteLabelLogo: this.WHITE_LABEL_LOGO,
    });
  }

  async sendPasswordResetEmail(to: string, token: string, organizationId?: string, firstName?: string) {
    await this.init(organizationId);
    const subject = 'Reset your password';
    const url = `${this.TOOLJET_HOST}${this.SUB_PATH ? this.SUB_PATH : '/'}reset-password/${token}`;
    const templateData = {
      name: firstName || '',
      resetLink: url,
      whiteLabelText: this.WHITE_LABEL_TEXT,
      whiteLabelLogo: this.WHITE_LABEL_LOGO,
    };
    const templatePath = this.defaultWhiteLabelState ? 'default_reset_password.hbs' : 'reset_password.hbs';
    const htmlEmailContent = this.compileTemplate(templatePath, templateData);

    return await this.sendEmail(to, subject, {
      bodyContent: htmlEmailContent,
      footerText: 'You have received this email as because a request to reset your password was made',
      whiteLabelText: this.WHITE_LABEL_TEXT,
      whiteLabelLogo: this.WHITE_LABEL_LOGO,
    });
  }

  async sendCommentMentionEmail(
    to: string,
    from: string,
    appName: string,
    appLink: string,
    commentLink: string,
    timestamp: string,
    comment: string,
    fromAvatar: string,
    organizationId: string
  ) {
    await this.init(organizationId);
    const filePath = path.join(__dirname, '../assets/email-templates/comment-mention.html');
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);
    const companyName = this.WHITE_LABEL_TEXT;
    const companyLogo = this.WHITE_LABEL_LOGO;
    const replacements = {
      to,
      from,
      appName,
      appLink,
      timestamp,
      commentLink,
      comment,
      fromAvatar,
      companyName,
      companyLogo,
    };
    const htmlToSend = template(replacements);
    const subject = `You were mentioned on ${appName}`;
    const html = htmlToSend;

    await this.sendEmail(to, subject, html);
  }

  async sendPaymentConfirmationEmail(to: string, firstName: string, invoiceLink: string, amount: string) {
    const subject = 'Payment confirmation';
    const templateData = {
      name: firstName || '',
      invoiceLink,
      amount: centsToUSD(amount),
      whiteLabelText: DEFAULT_WHITE_LABELLING_SETTINGS.WHITE_LABEL_TEXT,
      whiteLabelLogo: DEFAULT_WHITE_LABELLING_SETTINGS.WHITE_LABEL_LOGO,
    };
    const templatePath = 'payment_confirmation.hbs';
    const htmlEmailContent = this.compileTemplate(templatePath, templateData);

    return await this.sendEmail(to, subject, {
      bodyContent: htmlEmailContent,
      footerText: 'You have received this email as a notification about your payment status',
      whiteLabelText: DEFAULT_WHITE_LABELLING_SETTINGS.WHITE_LABEL_TEXT,
      whiteLabelLogo: DEFAULT_WHITE_LABELLING_SETTINGS.WHITE_LABEL_LOGO,
    });
  }

  async sendPaymentFailedEmail(to: string, firstName: string, invoiceLink: string, expirationDate: string) {
    const subject = 'Payment failed!';
    const templateData = {
      name: firstName || '',
      invoiceLink,
      expirationDate,
      whiteLabelText: DEFAULT_WHITE_LABELLING_SETTINGS.WHITE_LABEL_TEXT,
      whiteLabelLogo: DEFAULT_WHITE_LABELLING_SETTINGS.WHITE_LABEL_LOGO,
    };
    const templatePath = 'payment_failed.hbs';
    const htmlEmailContent = this.compileTemplate(templatePath, templateData);

    return await this.sendEmail(to, subject, {
      bodyContent: htmlEmailContent,
      footerText: 'You have received this email as a notification about your payment status',
      whiteLabelText: DEFAULT_WHITE_LABELLING_SETTINGS.WHITE_LABEL_TEXT,
      whiteLabelLogo: DEFAULT_WHITE_LABELLING_SETTINGS.WHITE_LABEL_LOGO,
    });
  }

  async sendPaymentReminderEmail(
    to: string,
    firstName: string,
    invoiceLink: string,
    dueDate,
    paymentDate,
    amount?: string
  ) {
    const subject = 'Payment reminder!';
    const templateData = {
      name: firstName || '',
      invoiceLink,
      dueDate: dueDate,
      paymentDate,
      whiteLabelText: DEFAULT_WHITE_LABELLING_SETTINGS.WHITE_LABEL_TEXT,
      whiteLabelLogo: DEFAULT_WHITE_LABELLING_SETTINGS.WHITE_LABEL_LOGO,
    };
    const templatePath = 'payment_reminder.hbs';
    const htmlEmailContent = this.compileTemplate(templatePath, templateData);

    return await this.sendEmail(to, subject, {
      bodyContent: htmlEmailContent,
      footerText: 'You have received this email as a notification about your payment status',
      whiteLabelText: DEFAULT_WHITE_LABELLING_SETTINGS.WHITE_LABEL_TEXT,
      whiteLabelLogo: DEFAULT_WHITE_LABELLING_SETTINGS.WHITE_LABEL_LOGO,
    });
  }

  sendSubscriptionStartInfoToToolJet(paymentObj) {
    return this.sendEmail(this.FROM_EMAIL, this.FROM_EMAIL, {
      bodyHeader: 'Subscription started',
      bodyContent: `<div>${JSON.stringify(paymentObj)}</div>`,
      footerText: '',
      whiteLabelText: this.WHITE_LABEL_TEXT,
      whiteLabelLogo: this.WHITE_LABEL_LOGO,
    });
  }

  async retrieveWhiteLabelSettings(organizationId?: string) {
    if (!organizationId) {
      return {};
    }
    const whiteLabelSetting = await this.whiteLabellingService.getSettings(organizationId);
    return whiteLabelSetting;
  }

  async retrieveWhiteLabelText(whiteLabelSettings) {
    const whiteLabelText = whiteLabelSettings?.[WHITE_LABELLING_COLUMNS.WHITE_LABEL_TEXT];
    return whiteLabelText || DEFAULT_WHITE_LABELLING_SETTINGS[WHITE_LABELLING_SETTINGS.WHITE_LABEL_TEXT];
  }

  async retrieveWhiteLabelLogo(whiteLabelSettings) {
    const whiteLabelLogo = whiteLabelSettings?.[WHITE_LABELLING_COLUMNS.WHITE_LABEL_LOGO];
    return whiteLabelLogo || DEFAULT_WHITE_LABELLING_SETTINGS[WHITE_LABELLING_SETTINGS.WHITE_LABEL_LOGO];
  }

  checkDefaultWhiteLabelState() {
    return (
      this.WHITE_LABEL_TEXT === defaultWhiteLabellingSettings.WHITE_LABEL_TEXT &&
      (this.WHITE_LABEL_LOGO === defaultWhiteLabellingSettings.WHITE_LABEL_LOGO ||
        this.WHITE_LABEL_LOGO === defaultWhiteLabellingSettings.WHITE_LABEL_LOGO_URL)
    );
  }
}
