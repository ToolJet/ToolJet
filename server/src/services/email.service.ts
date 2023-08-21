import { Injectable } from '@nestjs/common';
import handlebars from 'handlebars';
import { generateInviteURL, generateOrgInviteURL, retrieveWhiteLabelText } from 'src/helpers/utils.helper';
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

  constructor() {
    this.FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL || 'hello@tooljet.io';
    this.TOOLJET_HOST = this.stripTrailingSlash(process.env.TOOLJET_HOST);
    this.NODE_ENV = process.env.NODE_ENV || 'development';
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
      from: `"${retrieveWhiteLabelText()}" <${this.FROM_EMAIL}>`,
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
    const subject = `Welcome to ${retrieveWhiteLabelText()}`;
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
              ${sender} has invited you to use ${retrieveWhiteLabelText()} workspace: ${organizationName}.
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
            ${retrieveWhiteLabelText()} Team
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
    organizationName: string
  ) {
    const subject = `Welcome to ${retrieveWhiteLabelText()}`;
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
          ${sender} has invited you to use ${retrieveWhiteLabelText()} workspace: ${organizationName}. Use the link below to set up your account and get started.
          </span>
          <br>
          <a href="${inviteUrl}">${inviteUrl}</a>
          <br>
          <br>
          <p>
            Welcome aboard,<br>
            ${retrieveWhiteLabelText()} Team
          </p>
        </body>
      </html>
    `;

    await this.sendEmail(to, subject, html);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const subject = 'password reset instructions';
    const url = `${this.TOOLJET_HOST}/reset-password/${token}`;
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
    fromAvatar: string
  ) {
    const filePath = path.join(__dirname, '../assets/email-templates/comment-mention.html');
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);
    const companyName = retrieveWhiteLabelText();
    const companyLogo = process.env?.WHITE_LABEL_LOGO
      ? process.env.WHITE_LABEL_LOGO
      : 'https://uploads-ssl.webflow.com/6266634263b9179f76b2236e/62666392f32677b5cb2fb84b_logo.svg';
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
}
