import { Injectable } from '@nestjs/common';
import handlebars from 'handlebars';
import { generateInviteURL, generateOrgInviteURL } from 'src/helpers/utils.helper';
import { WhiteLabellingService } from './white_labelling.service';
import {
  WHITE_LABELLING_SETTINGS,
  DEFAULT_WHITE_LABELLING_SETTINGS,
  WHITE_LABELLING_COLUMNS,
} from 'src/helpers/white_labelling.constants';

const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

handlebars.registerHelper('capitalize', function (value) {
  return value.charAt(0);
});

handlebars.registerHelper('highlightMentionedUser', function (comment) {
  const regex = /(\()([^)]+)(\))/g;
  return comment.replace(regex, '<span style="color: #218DE3">$2</span>');
});

@Injectable()
export class EmailService {
  private FROM_EMAIL;
  private TOOLJET_HOST;
  private NODE_ENV;
  private WHITE_LABEL_TEXT;
  private WHITE_LABEL_LOGO;
  private SUB_PATH;

  constructor(private readonly whiteLabellingService: WhiteLabellingService) {
    this.FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL || 'hello@tooljet.io';
    this.TOOLJET_HOST = this.stripTrailingSlash(process.env.TOOLJET_HOST);
    this.SUB_PATH = process.env.SUB_PATH;
    this.NODE_ENV = process.env.NODE_ENV || 'development';
  }

  async init(organizationId?: string) {
    const whiteLabelSettings = await this.retrieveWhiteLabelSettings(organizationId);
    this.WHITE_LABEL_TEXT = await this.retrieveWhiteLabelText(whiteLabelSettings);
    this.WHITE_LABEL_LOGO = await this.retrieveWhiteLabelLogo(whiteLabelSettings);
  }

  async sendEmail(to: string, subject: string, html: string) {
    if (this.NODE_ENV === 'test' || (this.NODE_ENV !== 'development' && !process.env.SMTP_DOMAIN)) return;

    const port = +process.env.SMTP_PORT || 587;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_DOMAIN,
      port: port,
      secure: port == 465,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const message = {
      from: `"${this.WHITE_LABEL_TEXT}" <${this.FROM_EMAIL}>`,
      to,
      subject,
      html,
    };

    /* if development environment, log the content of email instead of sending actual emails */
    if (this.NODE_ENV === 'development') {
      console.log('Captured email');
      console.log('to: ', to);
      console.log('Subject: ', subject);
      console.log('content: ', html);
      const previewEmail = require('preview-email');

      previewEmail(message).then(console.log).catch(console.error);
    } else {
      const info = await transporter.sendMail(message);
      console.log('Message sent: %s', info);
    }
  }

  stripTrailingSlash(hostname: string) {
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
    const subject = `Welcome to ${this.WHITE_LABEL_TEXT}`;
    const inviteUrl = generateInviteURL(invitationtoken, organizationInvitationToken, organizationId);
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta content='text/html; charset=UTF-8' http-equiv='Content-Type' />
        </head>
        <body>
          <p>Hi ${name || ''},</p>
          ${
            organizationInvitationToken && sender && organizationName
              ? `<span>
              ${sender} has invited you to use ${this.WHITE_LABEL_TEXT} workspace: ${organizationName}.
            </span>`
              : ''
          }
          <span>
            Please use the link below to set up your account and get started.
          </span>
          <br>
          <a href="${inviteUrl}">${inviteUrl}</a>
          <br>
          <p>
            Welcome aboard,<br>
            ${this.WHITE_LABEL_TEXT} Team
          </p>
        </body>
      </html>
    `;

    await this.sendEmail(to, subject, html);
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
    const subject = `Welcome to ${this.WHITE_LABEL_TEXT}`;
    const inviteUrl = generateOrgInviteURL(invitationtoken);
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta content='text/html; charset=UTF-8' http-equiv='Content-Type' />
        </head>
        <body>
          <p>Hi ${name || ''},</p>
          <br>
          <span>
          ${sender} has invited you to use ${
      this.WHITE_LABEL_TEXT
    } workspace: ${organizationName}. Use the link below to set up your account and get started.
          </span>
          <br>
          <a href="${inviteUrl}">${inviteUrl}</a>
          <br>
          <br>
          <p>
            Welcome aboard,<br>
            ${this.WHITE_LABEL_TEXT} Team
          </p>
        </body>
      </html>
    `;

    await this.sendEmail(to, subject, html);
  }

  async sendPasswordResetEmail(to: string, token: string, organizationId?: string) {
    await this.init(organizationId);
    const subject = 'password reset instructions';
    const url = `${this.TOOLJET_HOST}${this.SUB_PATH ? this.SUB_PATH : '/'}reset-password/${token}`;
    const html = `
      Please use this link to reset your password: <a href="${url}">${url}</a>
    `;
    await this.sendEmail(to, subject, html);
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
}
