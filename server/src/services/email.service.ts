import { Injectable } from '@nestjs/common';
import { join } from 'path';
import handlebars from 'handlebars';
import { generateInviteURL, generateOrgInviteURL } from 'src/helpers/utils.helper';
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

@Injectable()
export class EmailService {
  private FROM_EMAIL;
  private TOOLJET_HOST;
  private NODE_ENV;

  constructor(private readonly mailerService: MailerService) {
    this.FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL || 'hello@tooljet.io';
    this.TOOLJET_HOST = this.stripTrailingSlash(process.env.TOOLJET_HOST);
    this.NODE_ENV = process.env.NODE_ENV || 'development';
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
    };
    const templatePath = isOrgInvite ? 'invite_user.hbs' : 'setup_account.hbs';
    const htmlEmailContent = this.compileTemplate(templatePath, templateData);

    return await this.sendEmail(to, subject, {
      bodyHeader: subject,
      bodyContent: htmlEmailContent,
      footerText: footerText,
      inviteUrl,
    });
  }

  async sendOrganizationUserWelcomeEmail(
    to: string,
    name: string,
    sender: string,
    invitationtoken: string,
    organizationName: string
  ) {
    const subject = `Welcome to ${organizationName || 'ToolJet'}`;
    const inviteUrl = generateOrgInviteURL(invitationtoken);
    const templateData = {
      name: name || '',
      inviteUrl,
      sender,
      organizationName,
    };
    const templatePath = 'invite_user.hbs';
    const htmlEmailContent = this.compileTemplate(templatePath, templateData);

    return await this.sendEmail(to, subject, {
      bodyHeader: subject,
      bodyContent: htmlEmailContent,
      footerText: 'You have received this email as an invitation to join ToolJet’s workspace',
      inviteUrl,
    });
  }

  async sendPasswordResetEmail(to: string, token: string, firstName?: string) {
    const subject = 'Reset your password';
    const url = `${this.TOOLJET_HOST}/reset-password/${token}`;
    const templateData = {
      name: firstName || '',
      resetLink: url,
    };
    const templatePath = 'reset_password.hbs';
    const htmlEmailContent = this.compileTemplate(templatePath, templateData);

    return await this.sendEmail(to, subject, {
      bodyContent: htmlEmailContent,
      footerText: 'You have received this email as because a request to reset your password was made',
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
    const filePath = path.join(__dirname, '../assets/email-templates/comment-mention.html');
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);
    const replacements = {
      to,
      from,
      appName,
      appLink,
      timestamp,
      commentLink,
      comment,
      fromAvatar,
    };
    const htmlToSend = template(replacements);
    const subject = `You were mentioned on ${appName}`;
    const html = htmlToSend;

    await this.sendEmail(to, subject, html);
  }
}
