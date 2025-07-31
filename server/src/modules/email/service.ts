import { Injectable } from '@nestjs/common';
import handlebars from 'handlebars';
import { generateInviteURL, generateOrgInviteURL, getTooljetEdition } from 'src/helpers/utils.helper';
import {
  SendWelcomeEmailPayload,
  SendOrganizationUserWelcomeEmailPayload,
  SendCommentMentionEmailPayload,
  SendPasswordResetEmailPayload,
} from '@modules/email/dto';
import { EmailUtilService } from './util.service';
import { IEmailService } from './interfaces/IService';
import { WhiteLabellingUtilService } from '@modules/white-labelling/util.service';

handlebars.registerHelper('capitalize', function (value) {
  return value.charAt(0);
});

handlebars.registerHelper('highlightMentionedUser', function (comment) {
  const regex = /(\()([^)]+)(\))/g;
  return comment.replace(regex, '<span style="color: #218DE3">$2</span>');
});
handlebars.registerHelper('eq', (a, b) => a == b);
handlebars.registerHelper('or', (a, b) => {
  return a || b;
});
handlebars.registerHelper('and', (a, b) => {
  return a && b;
});

@Injectable()
export class EmailService implements IEmailService {
  protected TOOLJET_HOST;
  protected NODE_ENV;
  protected WHITE_LABEL_TEXT;
  protected WHITE_LABEL_LOGO;
  protected SUB_PATH;
  protected defaultWhiteLabelState: boolean;
  protected tooljetEdition: string;

  constructor(
    protected readonly emailUtilService: EmailUtilService,
    protected readonly whiteLabellingUtilService: WhiteLabellingUtilService
  ) {
    this.TOOLJET_HOST = this.stripTrailingSlash(process.env.TOOLJET_HOST);
    this.SUB_PATH = process.env.SUB_PATH;
    this.NODE_ENV = process.env.NODE_ENV || 'development';
    this.tooljetEdition = getTooljetEdition();
  }

  protected registerPartials() {
    this.emailUtilService.registerPartials();
  }

  mailTransport(smtp) {
    this.emailUtilService.mailTransport(smtp);
  }

  async sendEmail(to: string, subject: string, templateData: any) {
    await this.emailUtilService.sendEmail(to, subject, templateData);
  }

  async init(organizationId?: string | null) {
    const whiteLabelSettings = await this.emailUtilService.retrieveWhiteLabelSettings(organizationId);
    this.WHITE_LABEL_TEXT = whiteLabelSettings?.white_label_text;
    this.WHITE_LABEL_LOGO = whiteLabelSettings?.white_label_logo;
    this.defaultWhiteLabelState = whiteLabelSettings?.default;
    await this.emailUtilService.init(organizationId);
  }

  protected compileTemplate(templatePath: string, templateData: object) {
    return this.emailUtilService.compileTemplate(templatePath, templateData);
  }

  protected stripTrailingSlash(hostname: string) {
    return hostname?.endsWith('/') ? hostname.slice(0, -1) : hostname;
  }
  async sendWelcomeEmail(payload: SendWelcomeEmailPayload) {
    const {
      to,
      name,
      invitationtoken,
      organizationInvitationToken,
      organizationId,
      organizationName,
      sender,
      redirectTo,
    } = payload;
    await this.init(organizationId);
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
      tooljetEdition: this.tooljetEdition,
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
      footerText: footerText,
      inviteUrl,
      whiteLabelText: this.WHITE_LABEL_TEXT,
      whiteLabelLogo: this.WHITE_LABEL_LOGO,
    });
  }

  async sendOrganizationUserWelcomeEmail(payload: SendOrganizationUserWelcomeEmailPayload) {
    const { to, name, sender, invitationtoken, organizationName, organizationId, redirectTo } = payload;
    await this.init(organizationId);
    const subject = `Welcome to ${organizationName || 'ToolJet'}`;
    const inviteUrl = generateOrgInviteURL(invitationtoken, organizationId, true, redirectTo);
    const templateData = {
      name: name || '',
      inviteUrl,
      sender,
      organizationName,
      whiteLabelText: this.WHITE_LABEL_TEXT,
      whiteLabelLogo: this.WHITE_LABEL_LOGO,
      tooljetEdition: this.tooljetEdition,
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

  async sendPasswordResetEmail(payload: SendPasswordResetEmailPayload) {
    const { to, token, firstName, organizationId } = payload;
    await this.init(organizationId);
    const subject = 'Reset your password';
    const url = `${this.TOOLJET_HOST}${this.SUB_PATH ? this.SUB_PATH : '/'}reset-password/${token}`;
    const templateData = {
      name: firstName || '',
      resetLink: url,
      whiteLabelText: this.WHITE_LABEL_TEXT,
      whiteLabelLogo: this.WHITE_LABEL_LOGO,
      tooljetEdition: this.tooljetEdition,
    };
    const templatePath = this.defaultWhiteLabelState ? 'default_reset_password.hbs' : 'reset_password.hbs';
    const htmlEmailContent = this.compileTemplate(templatePath, templateData);

    return await this.sendEmail(to, subject, {
      bodyContent: htmlEmailContent,
      footerText: 'You have received this email because a request to reset your password was made',
      whiteLabelText: this.WHITE_LABEL_TEXT,
      whiteLabelLogo: this.WHITE_LABEL_LOGO,
    });
  }

  async sendCommentMentionEmail(payload: SendCommentMentionEmailPayload) {
    const { to, from, appName, appLink, commentLink, timestamp, comment, fromAvatar, organizationId } = payload;
    await this.init(organizationId);
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
      tooljetEdition: this.tooljetEdition,
    };
    const htmlEmailContent = this.compileTemplate('mention.hbs', templateData);

    return await this.sendEmail(to, subject, {
      bodyContent: htmlEmailContent,
      footerText: 'You have received this email because a request to reset your password was made',
      whiteLabelText: this.WHITE_LABEL_TEXT,
      whiteLabelLogo: this.WHITE_LABEL_LOGO,
    });
  }
}
