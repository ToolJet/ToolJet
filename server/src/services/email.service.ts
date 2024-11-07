import { Injectable } from '@nestjs/common';
import { join } from 'path';
import handlebars from 'handlebars';
import { generateInviteURL, generateOrgInviteURL } from 'src/helpers/utils.helper';
import { InstanceSettingsService } from '@instance-settings/service';
import * as nodemailer from 'nodemailer';

import {
  INSTANCE_SETTINGS_TYPE,
  INSTANCE_SYSTEM_SETTINGS,
  defaultWhiteLabellingSettings,
} from '@instance-settings/constants';
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
  private TOOLJET_HOST;
  private NODE_ENV;
  private WHITE_LABEL_TEXT;
  private WHITE_LABEL_LOGO;
  private SUB_PATH;
  private SMTP: {
    [INSTANCE_SYSTEM_SETTINGS.SMTP_ENABLED]: boolean;
    [INSTANCE_SYSTEM_SETTINGS.SMTP_DOMAIN]: string;
    [INSTANCE_SYSTEM_SETTINGS.SMTP_PORT]: string;
    [INSTANCE_SYSTEM_SETTINGS.SMTP_USERNAME]: string;
    [INSTANCE_SYSTEM_SETTINGS.SMTP_PASSWORD]: string;
    [INSTANCE_SYSTEM_SETTINGS.SMTP_FROM_EMAIL]: string;
  };
  private defaultWhiteLabelState;

  constructor(private readonly instanceSettingsService: InstanceSettingsService) {
    this.TOOLJET_HOST = this.stripTrailingSlash(process.env.TOOLJET_HOST);
    this.SUB_PATH = process.env.SUB_PATH;
    this.NODE_ENV = process.env.NODE_ENV || 'development';
  }

  private registerPartials() {
    const partialsDir = join(__dirname, '..', 'mails', 'base', 'partials');
    const filenames = ['header.hbs', 'footer.hbs', 'body.hbs']; // Add all your partial filenames here

    filenames.forEach((filename) => {
      const filePath = join(partialsDir, filename);
      const partialName = filename.split('.')[0]; // Remove the file extension to get the partial name
      const template = fs.readFileSync(filePath, 'utf8');
      handlebars.registerPartial(partialName, template);
    });
  }

  mailTransport(smtp) {
    const transporter = nodemailer.createTransport({
      host: smtp[INSTANCE_SYSTEM_SETTINGS.SMTP_DOMAIN],
      port: smtp[INSTANCE_SYSTEM_SETTINGS.SMTP_PORT],
      secure: smtp[INSTANCE_SYSTEM_SETTINGS.SMTP_PORT] == 465, // Use `true` for port 465, `false` for all other ports
      auth: {
        user: smtp[INSTANCE_SYSTEM_SETTINGS.SMTP_USERNAME],
        pass: smtp[INSTANCE_SYSTEM_SETTINGS.SMTP_PASSWORD],
      },
    });

    return transporter;
  }

  async sendEmail(to: string, subject: string, templateData: any) {
    this.registerPartials();

    // Load the main template file
    const templatePath = join(__dirname, '..', 'mails', 'base', 'base_template.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');

    // Compile the template
    const template = handlebars.compile(templateSource);
    // Generate the HTML by applying the context to the template
    const htmlToSend = template(templateData);

    // Define the email options
    const mailOptions = {
      to,
      subject,
      html: htmlToSend,
      from: `"${this.WHITE_LABEL_TEXT}" <${this.SMTP[INSTANCE_SYSTEM_SETTINGS.SMTP_FROM_EMAIL]}>`,
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

    try {
      // Skip sending email if test env or production and smtp disabled
      if (
        this.NODE_ENV === 'test' ||
        (this.NODE_ENV !== 'development' && !this.SMTP[INSTANCE_SYSTEM_SETTINGS.SMTP_ENABLED])
      )
        return;

      /* if development environment and disabled SMTP, log the content of email instead of sending actual emails */
      if (this.NODE_ENV === 'development' && !this.SMTP[INSTANCE_SYSTEM_SETTINGS.SMTP_ENABLED]) {
        console.log('Captured email');
        console.log('to: ', to);
        console.log('Subject: ', subject);
        console.log('content: ', htmlToSend);
        const previewEmail = require('preview-email');
        const transport = nodemailer.createTransport({
          jsonTransport: true,
        });
        const result = await transport.sendMail(mailOptions);
        previewEmail(JSON.parse(result.message)).then(console.log).catch(console.error);
      } else {
        const transport = this.mailTransport(this.SMTP);
        const result = await transport.sendMail(mailOptions);
        console.log('Message sent: %s', result);
        return result;
      }
    } catch (error) {
      if (this.NODE_ENV === 'test' || this.NODE_ENV == 'development') return;
      console.log(error);
    }
  }

  async init() {
    const whiteLabelSettings = await this.retrieveWhiteLabelSettings();
    this.SMTP = await this.retrieveSmtpSettings();
    this.WHITE_LABEL_TEXT = await this.retrieveWhiteLabelText(whiteLabelSettings);
    this.WHITE_LABEL_LOGO = await this.retrieveWhiteLabelLogo(whiteLabelSettings);
    this.defaultWhiteLabelState = this.checkDefaultWhiteLabelState();
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
    sender?: string,
    redirectTo?: string
  ) {
    await this.init();
    const isOrgInvite = organizationInvitationToken && sender && organizationName;
    const inviteUrl = generateInviteURL(invitationtoken, organizationInvitationToken, organizationId, null, redirectTo);
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
    const templatePath = isOrgInvite
      ? this.defaultWhiteLabelState
        ? 'default_invite_user.hbs'
        : 'invite_user.hbs'
      : this.defaultWhiteLabelState
      ? 'default_setup_account.hbs'
      : 'setup_account.hbs';
    const htmlEmailContent = this.compileTemplate(templatePath, templateData);

    //New Mail service Using Nodemailer
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
    organizationName: string,
    organizationId: string,
    redirectTo?: string
  ) {
    await this.init();
    const subject = `Welcome to ${organizationName || 'ToolJet'}`;
    const inviteUrl = generateOrgInviteURL(invitationtoken, organizationId, true, redirectTo);
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
    //new Email Service
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
    const templatePath = this.defaultWhiteLabelState ? 'default_reset_password.hbs' : 'reset_password.hbs';
    const htmlEmailContent = this.compileTemplate(templatePath, templateData);

    //New Email service
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
    const subject = `You were mentioned on ${appName}`;
    const templateData = {
      to,
      from,
      appName,
      appLink,
      timestamp,
      commentLink,
      comment,
      fromAvatar,
      companyName: this.WHITE_LABEL_TEXT,
      companyLogo: this.WHITE_LABEL_LOGO,
    };
    const htmlEmailContent = this.compileTemplate('mention.hbs', templateData);

    //New Email service
    return await this.sendEmail(to, subject, {
      bodyContent: htmlEmailContent,
      footerText: 'You have received this email as because a request to reset your password was made',
      whiteLabelText: this.WHITE_LABEL_TEXT,
      whiteLabelLogo: this.WHITE_LABEL_LOGO,
    });
  }

  async retrieveWhiteLabelSettings() {
    const whiteLabelSetting = await this.instanceSettingsService.getSettings(
      [INSTANCE_SYSTEM_SETTINGS.WHITE_LABEL_LOGO, INSTANCE_SYSTEM_SETTINGS.WHITE_LABEL_TEXT],
      false,
      INSTANCE_SETTINGS_TYPE.SYSTEM
    );

    return whiteLabelSetting;
  }

  private async retrieveSmtpSettings() {
    const smtpSetting = await this.instanceSettingsService.getSettings(
      [
        INSTANCE_SYSTEM_SETTINGS.SMTP_ENABLED,
        INSTANCE_SYSTEM_SETTINGS.SMTP_DOMAIN,
        INSTANCE_SYSTEM_SETTINGS.SMTP_PORT,
        INSTANCE_SYSTEM_SETTINGS.SMTP_USERNAME,
        INSTANCE_SYSTEM_SETTINGS.SMTP_PASSWORD,
        INSTANCE_SYSTEM_SETTINGS.SMTP_FROM_EMAIL,
      ],
      false,
      INSTANCE_SETTINGS_TYPE.SYSTEM
    );
    smtpSetting[INSTANCE_SYSTEM_SETTINGS.SMTP_ENABLED] = smtpSetting[INSTANCE_SYSTEM_SETTINGS.SMTP_ENABLED] === 'true';
    smtpSetting[INSTANCE_SYSTEM_SETTINGS.SMTP_FROM_EMAIL] =
      smtpSetting[INSTANCE_SYSTEM_SETTINGS.SMTP_FROM_EMAIL] || 'hello@tooljet.io';
    return smtpSetting;
  }

  async retrieveWhiteLabelText(whiteLabelSetting) {
    const whiteLabelText = whiteLabelSetting?.[INSTANCE_SYSTEM_SETTINGS.WHITE_LABEL_TEXT];
    return whiteLabelText || defaultWhiteLabellingSettings.WHITE_LABEL_TEXT;
  }
  async retrieveWhiteLabelLogo(whiteLabelSetting) {
    const whiteLabelLogo = whiteLabelSetting?.[INSTANCE_SYSTEM_SETTINGS.WHITE_LABEL_LOGO];
    return whiteLabelLogo || defaultWhiteLabellingSettings.WHITE_LABEL_LOGO;
  }

  checkDefaultWhiteLabelState() {
    return (
      this.WHITE_LABEL_TEXT === defaultWhiteLabellingSettings.WHITE_LABEL_TEXT &&
      (this.WHITE_LABEL_LOGO === defaultWhiteLabellingSettings.WHITE_LABEL_LOGO ||
        this.WHITE_LABEL_LOGO === defaultWhiteLabellingSettings.WHITE_LABEL_LOGO_URL)
    );
  }
}
