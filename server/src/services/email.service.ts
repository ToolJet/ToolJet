import { Injectable } from '@nestjs/common';
const nodemailer = require('nodemailer');
const previewEmail = require('preview-email');

@Injectable()
export class EmailService {
  private FROM_EMAIL;
  private TOOLJET_HOST;
  private NODE_ENV;

  constructor() {
    this.FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL || 'hello@tooljet.io';
    this.TOOLJET_HOST = process.env.TOOLJET_HOST;
    this.NODE_ENV = process.env.NODE_ENV || 'development';
  }

  async sendEmail(to: string, subject: string, html: string) {
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
      from: `"ToolJet" <${this.FROM_EMAIL}>`,
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

      previewEmail(message).then(console.log).catch(console.error);
    } else {
      const info = await transporter.sendMail(message);
      console.log('Message sent: %s', info);
    }
  }

  async sendWelcomeEmail(to: string, name: string, invitationtoken: string) {
    const subject = 'Welcome to ToolJet';
    const inviteUrl = `${this.TOOLJET_HOST}/invitations/${invitationtoken}?signup=true`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta content='text/html; charset=UTF-8' http-equiv='Content-Type' />
        </head>
        <body>
          <p>Hi ${name || ''},</p>
          <span>
            Please use the link below to set up your account and get started.
          </span>
          <br>
          <a href="${inviteUrl}">${inviteUrl}</a>
          <br>
          <p>
            Welcome aboard,<br>
            ToolJet Team
          </p>
        </body>
      </html>
    `;

    await this.sendEmail(to, subject, html);
  }

  async sendOrganizationUserWelcomeEmail(to: string, name: string, sender: string, invitationtoken: string) {
    const subject = 'Welcome to ToolJet';
    const inviteUrl = `${this.TOOLJET_HOST}/invitations/${invitationtoken}`;
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
          ${sender} has invited you to use ToolJet. Use the link below to set up your account and get started.
          </span>
          <br>
          <a href="${inviteUrl}">${inviteUrl}</a>
          <br>
          <br>
          <p>
            Welcome aboard,<br>
            ToolJet Team
          </p>
        </body>
      </html>
    `;

    await this.sendEmail(to, subject, html);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const subject = 'password reset instructions';
    const html = `
      Please use this code to reset your password: ${token}
    `;
    await this.sendEmail(to, subject, html);
  }
}
