import { Injectable } from '@nestjs/common';
import { join } from 'path';
import handlebars from 'handlebars';
import { generateInviteURL, generateOrgInviteURL } from 'src/helpers/utils.helper';
import { InstanceSettingsService } from './instance_settings.service';
import { INSTANCE_SETTINGS_TYPE, INSTANCE_SYSTEM_SETTINGS } from 'src/helpers/instance_settings.constants';
import { MailerService } from '@nestjs-modules/mailer';
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

@Injectable()
export class EmailService {
  private FROM_EMAIL;
  private TOOLJET_HOST;
  private NODE_ENV;
  private WHITE_LABEL_TEXT;
  private WHITE_LABEL_LOGO;
  private SUB_PATH;

  constructor(
    private readonly mailerService: MailerService,
    private readonly instancesettingsService: InstanceSettingsService
  ) {
    this.FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL || 'hello@tooljet.io';
    this.TOOLJET_HOST = this.stripTrailingSlash(process.env.TOOLJET_HOST);
    this.SUB_PATH = process.env.SUB_PATH;
    this.NODE_ENV = process.env.NODE_ENV || 'development';
  }

  async init() {
    const whiteLabelSettings = await this.retrieveWhiteLabelSettings();
    this.WHITE_LABEL_TEXT = await this.retrieveWhiteLabelText(whiteLabelSettings);
    this.WHITE_LABEL_LOGO = await this.retrieveWhiteLabelLogo(whiteLabelSettings);
  }
  private async sendEmail(to: string, subject: string, templateData: any) {
    try {
      if (this.NODE_ENV === 'test' || (this.NODE_ENV !== 'development' && !process.env.SMTP_DOMAIN)) return;
      const message = {
        to: to,
        subject: subject,
        template: './base/base_template',
        context: templateData,
        from: `"${this.WHITE_LABEL_TEXT}" <${this.FROM_EMAIL}>`,
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
    await this.init();
    const isOrgInvite = organizationInvitationToken && sender && organizationName;
    const inviteUrl = generateInviteURL(invitationtoken, organizationInvitationToken, organizationId);
    const subject = isOrgInvite ? `Welcome to ${organizationName || 'ToolJet'}` : 'Set up your account!';
    const footerText = isOrgInvite
      ? 'You have received this email as an invitation to join ToolJet’s workspace'
      : 'You have received this email to confirm your email address';

    const templateData = {
      name: name || '',
      inviteUrl,
      sender,
      organizationName,
      whiteLabelText: this.WHITE_LABEL_TEXT,
      whiteLabelLogo: this.WHITE_LABEL_LOGO,
    };
    const templatePath = isOrgInvite ? 'invite_user.hbs' : 'setup_account.hbs';
    const htmlEmailContent = this.compileTemplate(templatePath, templateData);

    return await this.sendEmail(to, subject, {
      bodyHeader: subject,
      bodyContent: htmlEmailContent,
      footerText: footerText,
      inviteUrl,
      whiteLabelText: this.WHITE_LABEL_TEXT,
      whiteLabelLogo: this.WHITE_LABEL_LOGO,
    });
  }

  async sendOrganizationUserWelcomeEmail(
    to: string,
    name: string,
    sender: string,
    invitationtoken: string,
    organizationName: string
  ) {
    await this.init();
    const subject = `Welcome to ${organizationName || 'ToolJet'}`;
    const inviteUrl = generateOrgInviteURL(invitationtoken);
    const templateData = {
      name: name || '',
      inviteUrl,
      sender,
      organizationName,
      whiteLabelText: this.WHITE_LABEL_TEXT,
      whiteLabelLogo: this.WHITE_LABEL_LOGO,
    };
    const templatePath = 'invite_user.hbs';
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

  async sendPasswordResetEmail(to: string, token: string, firstName?: string) {
    await this.init();
    const subject = 'Reset your password';
    const url = `${this.TOOLJET_HOST}${this.SUB_PATH ? this.SUB_PATH : '/'}reset-password/${token}`;
    const templateData = {
      name: firstName || '',
      resetLink: url,
      whiteLabelText: this.WHITE_LABEL_TEXT,
      whiteLabelLogo: this.WHITE_LABEL_LOGO,
    };
    const templatePath = 'reset_password.hbs';
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
    fromAvatar: string
  ) {
    await this.init();
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

  async retrieveWhiteLabelSettings() {
    const whiteLabelSetting = await this.instancesettingsService.getSettings(
      [INSTANCE_SYSTEM_SETTINGS.WHITE_LABEL_LOGO, INSTANCE_SYSTEM_SETTINGS.WHITE_LABEL_TEXT],
      false,
      INSTANCE_SETTINGS_TYPE.SYSTEM
    );

    return whiteLabelSetting;
  }

  async retrieveWhiteLabelText(whiteLabelSetting) {
    return whiteLabelSetting?.[INSTANCE_SYSTEM_SETTINGS.WHITE_LABEL_TEXT] !== ''
      ? whiteLabelSetting?.[INSTANCE_SYSTEM_SETTINGS.WHITE_LABEL_TEXT]
      : 'ToolJet';
  }

  async retrieveWhiteLabelLogo(whiteLabelSetting) {
    return whiteLabelSetting?.[INSTANCE_SYSTEM_SETTINGS.WHITE_LABEL_LOGO] !== ''
      ? whiteLabelSetting?.[INSTANCE_SYSTEM_SETTINGS.WHITE_LABEL_LOGO]
      : 'https://uploads-ssl.webflow.com/6266634263b9179f76b2236e/62666392f32677b5cb2fb84b_logo.svg';
  }
}
