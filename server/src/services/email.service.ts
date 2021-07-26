import { Injectable } from '@nestjs/common';
const nodemailer = require("nodemailer");

@Injectable()
export class EmailService {

  private FROM_EMAIL;
  private TOOLJET_HOST;

  constructor(
  ) { 
    this.FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL || 'hello@tooljet.io',
    this.TOOLJET_HOST = process.env.TOOLJET_HOST
  }

  async sendEmail(to: string, subject: string, html: string) {

    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_DOMAIN,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
      },
    });

    let info = await transporter.sendMail({
      from: `"ToolJet" <${this.FROM_EMAIL}>`,
      to, 
      subject,
      html,
    });

    console.log("Message sent: %s", info);
  }

  async sendWelcomeEmail(to: string, name: string, invitationtoken: string) {

    const subject = 'Welcome to ToolJet';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta content='text/html; charset=UTF-8' http-equiv='Content-Type' />
        </head>
        <body>
          <p>Hi ${name || ''},</p>
          <br><br>
          <p>
            Please use the link below to set up your account and get started.
          </p>
          <a href="<%= @url %>">${`${this.TOOLJET_HOST}/invitations/${invitationtoken}?signup=true`}</a>
          <br><br>
          <p>
            Welcome aboard,<br>
            ToolJet Team
          </p>
        </body>
      </html>
    `;

    await this.sendEmail(to, subject, html)
  }
}
