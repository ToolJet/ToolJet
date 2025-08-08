import { IEmailUtilService } from '@modules/email/interfaces/IUtilService';
import { INSTANCE_SETTINGS_TYPE, INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';
import { WhiteLabellingUtilService } from '@modules/white-labelling/util.service';
import { Injectable } from '@nestjs/common';
import { SMTPUtilService } from '@modules/smtp/util.service';
import { DEFAULT_WHITE_LABELLING_SETTINGS } from '@modules/white-labelling/constant';
import * as path from 'path';
import * as fs from 'fs';
import handlebars from 'handlebars';
import { join } from 'path';
import * as nodemailer from 'nodemailer';
import { centsToUSD } from '@helpers/utils.helper';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

handlebars.registerHelper('capitalize', function (value) {
  return value.charAt(0);
});

@Injectable()
export class EmailUtilService implements IEmailUtilService {
  private FROM_EMAIL;
  protected TOOLJET_HOST;
  protected NODE_ENV;
  protected WHITE_LABEL_TEXT;
  protected WHITE_LABEL_LOGO;
  protected SUB_PATH;
  protected SMTP: {
    [INSTANCE_SYSTEM_SETTINGS.SMTP_ENABLED]: boolean;
    [INSTANCE_SYSTEM_SETTINGS.SMTP_DOMAIN]: string;
    [INSTANCE_SYSTEM_SETTINGS.SMTP_PORT]: string;
    [INSTANCE_SYSTEM_SETTINGS.SMTP_USERNAME]: string;
    [INSTANCE_SYSTEM_SETTINGS.SMTP_PASSWORD]: string;
    [INSTANCE_SYSTEM_SETTINGS.SMTP_FROM_EMAIL]: string;
    [INSTANCE_SYSTEM_SETTINGS.SMTP_ENV_CONFIGURED]: boolean;
  };
  protected defaultWhiteLabelState: boolean;
  constructor(
    protected readonly whiteLabellingUtilService: WhiteLabellingUtilService,
    protected readonly smtpUtilService: SMTPUtilService,
    protected readonly configService: ConfigService,
    protected readonly logger: Logger
  ) {
    this.TOOLJET_HOST = this.stripTrailingSlash(configService.get<string>('TOOLJET_HOST'));
    this.SUB_PATH = configService.get<string>('SUB_PATH');
    this.NODE_ENV = configService.get<string>('NODE_ENV') || 'development';
  }

  async retrieveWhiteLabelSettings(organizationId?: string | null): Promise<any> {
    const whiteLabelSetting = await this.whiteLabellingUtilService.getProcessedSettings(organizationId);
    return whiteLabelSetting;
  }

  async retrieveSmtpSettings(): Promise<any> {
    const smtpSetting = await this.smtpUtilService.getSmtpEnv(
      [
        INSTANCE_SYSTEM_SETTINGS.SMTP_ENABLED,
        INSTANCE_SYSTEM_SETTINGS.SMTP_DOMAIN,
        INSTANCE_SYSTEM_SETTINGS.SMTP_PORT,
        INSTANCE_SYSTEM_SETTINGS.SMTP_USERNAME,
        INSTANCE_SYSTEM_SETTINGS.SMTP_PASSWORD,
        INSTANCE_SYSTEM_SETTINGS.SMTP_FROM_EMAIL,
        INSTANCE_SYSTEM_SETTINGS.SMTP_ENV_CONFIGURED,
      ],
      false,
      INSTANCE_SETTINGS_TYPE.SYSTEM
    );
    smtpSetting[INSTANCE_SYSTEM_SETTINGS.SMTP_ENABLED] = smtpSetting[INSTANCE_SYSTEM_SETTINGS.SMTP_ENABLED] === 'true';
    smtpSetting[INSTANCE_SYSTEM_SETTINGS.SMTP_FROM_EMAIL] =
      smtpSetting[INSTANCE_SYSTEM_SETTINGS.SMTP_ENV_CONFIGURED] === 'true'
        ? this.configService.get<string>('DEFAULT_FROM_EMAIL')
        : smtpSetting[INSTANCE_SYSTEM_SETTINGS.SMTP_FROM_EMAIL] || 'hello@tooljet.io';
    return smtpSetting;
  }

  async sendPaymentFailedEmail(to: string, firstName: string, invoiceLink: string, expirationDate: string) {
    const subject = 'Payment failed!';
    const templateData = {
      name: firstName || '',
      invoiceLink,
      expirationDate,
      whiteLabelText: DEFAULT_WHITE_LABELLING_SETTINGS.white_label_text,
      whiteLabelLogo: DEFAULT_WHITE_LABELLING_SETTINGS.white_label_logo,
    };
    const templatePath = 'payment_failed.hbs';
    const htmlEmailContent = this.compileTemplate(templatePath, templateData);

    return await this.sendEmail(to, subject, {
      bodyContent: htmlEmailContent,
      footerText: 'You have received this email as a notification about your payment status',
      whiteLabelText: DEFAULT_WHITE_LABELLING_SETTINGS.white_label_text,
      whiteLabelLogo: DEFAULT_WHITE_LABELLING_SETTINGS.white_label_logo,
    });
  }

  public registerPartials() {
    const partialsDir = join(__dirname, '..', '..', 'mails', 'base', 'partials');
    const filenames = ['header.hbs', 'footer.hbs', 'body.hbs']; // Add all your partial filenames here

    filenames.forEach((filename) => {
      const filePath = join(partialsDir, filename);
      const partialName = filename.split('.')[0]; // Remove the file extension to get the partial name
      const template = fs.readFileSync(filePath, 'utf8');
      handlebars.registerPartial(partialName, template);
    });
  }

  async sendEmail(to: string | string[], subject: string, templateData: any) {
    if (!to) {
      return;
    }

    // Filter out test emails if configured
    const filteredDomains = this.configService.get<string>('FILTERED_DOMAINS_FOR_EMAIL') || '';
    if (filteredDomains) {
      const domains = filteredDomains.split(',').map((domain) => domain.trim());
      const hasFilteredDomain = (email: string): boolean => {
        const domain = email.split('@')[1]?.toLowerCase();
        return domains.includes(domain);
      };
      if (typeof to === 'string') {
        if (hasFilteredDomain(to)) {
          this.logger.log('Email not sent to ', to);
          return;
        }
      } else if (to.some((email) => hasFilteredDomain(email))) {
        this.logger.log('Email not sent to ', to?.join(', '));
        return;
      }
    }

    this.registerPartials();

    // Load the main template file
    const templatePath = join(__dirname, '..', '..', 'mails', 'base', 'base_template.hbs');
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
            path: join(__dirname, '..', '../mails/assets/rocket.png'),
            cid: 'rocket',
          },
          {
            filename: 'twitter.png',
            path: join(__dirname, '..', '../mails/assets/twitter.png'),
            cid: 'twitter',
          },
          {
            filename: 'linkedin.png',
            path: join(__dirname, '..', '../mails/assets/linkedin.png'),
            cid: 'linkedin',
          },
          {
            filename: 'youtube.png',
            path: join(__dirname, '..', '../mails/assets/youtube.png'),
            cid: 'youtube',
          },
          {
            filename: 'github.png',
            path: join(__dirname, '..', '../mails/assets/github.png'),
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
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const previewEmail = require('preview-email');
        const transport = nodemailer.createTransport({
          jsonTransport: true,
        });
        const result = await transport.sendMail(mailOptions);
        previewEmail(JSON.parse(result.message)).then(console.log).catch(console.error);
      } else {
        const transport = this.mailTransport(this.SMTP);
        const result = await transport.sendMail(mailOptions);
        this.logger.log(`Message sent: ${result?.messageId || 'No message ID'}`);
        return result;
      }
    } catch (error) {
      if (this.NODE_ENV === 'test' || this.NODE_ENV == 'development') return;
      this.logger.log(error);
    }
  }

  public compileTemplate(templatePath: string, templateData: object) {
    const emailContent = fs.readFileSync(path.join(__dirname, '..', '..', 'mails', templatePath), 'utf8');
    const templateCompile = handlebars.compile(emailContent);
    return templateCompile(templateData);
  }

  mailTransport(smtp) {
    let smtpSettings;

    if (smtp[INSTANCE_SYSTEM_SETTINGS.SMTP_ENV_CONFIGURED] === 'true') {
      // Use environment variables for SMTP settings
      smtpSettings = {
        host: this.configService.get<string>('SMTP_DOMAIN'),
        port: this.configService.get<string>('SMTP_PORT'),
        username: this.configService.get<string>('SMTP_USERNAME'),
        password: this.configService.get<string>('SMTP_PASSWORD'),
      };
    } else {
      smtpSettings = {
        host: smtp[INSTANCE_SYSTEM_SETTINGS.SMTP_DOMAIN],
        port: smtp[INSTANCE_SYSTEM_SETTINGS.SMTP_PORT],
        username: smtp[INSTANCE_SYSTEM_SETTINGS.SMTP_USERNAME],
        password: smtp[INSTANCE_SYSTEM_SETTINGS.SMTP_PASSWORD],
      };
    }

    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.port == 465, // Use `true` for port 465, `false` for others
      auth: {
        user: smtpSettings.username,
        pass: smtpSettings.password,
      },
    });

    return transporter;
  }

  sendSubscriptionStartInfoToToolJet(paymentObj) {
    return this.sendEmail(
      [this.FROM_EMAIL, 'adish@tooljet.com', 'midhun.gs@tooljet.com'],
      '[Important] Selfhost Subscription started',
      {
        bodyContent: `<div><div>${JSON.stringify(
          paymentObj
        )}</div><a href='https://dashboard.stripe.com/subscriptions/${
          paymentObj?.subscription
        }'>Subscription Link</a></div>`,
        footerText: '',
        whiteLabelText: this.WHITE_LABEL_TEXT,
        whiteLabelLogo: this.WHITE_LABEL_LOGO,
      }
    );
  }

  async sendPaymentConfirmationEmail(to: string, firstName: string, invoiceLink: string, amount: string) {
    const subject = 'Payment confirmation';
    const templateData = {
      name: firstName || '',
      invoiceLink,
      amount: centsToUSD(amount),
      whiteLabelText: DEFAULT_WHITE_LABELLING_SETTINGS.white_label_text,
      whiteLabelLogo: DEFAULT_WHITE_LABELLING_SETTINGS.white_label_logo,
    };
    const templatePath = 'payment_confirmation.hbs';
    const htmlEmailContent = this.compileTemplate(templatePath, templateData);

    return await this.sendEmail(to, subject, {
      bodyContent: htmlEmailContent,
      footerText: 'You have received this email as a notification about your payment status',
      whiteLabelText: DEFAULT_WHITE_LABELLING_SETTINGS.white_label_text,
      whiteLabelLogo: DEFAULT_WHITE_LABELLING_SETTINGS.white_label_logo,
    });
  }
  protected stripTrailingSlash(hostname: string) {
    return hostname?.endsWith('/') ? hostname.slice(0, -1) : hostname;
  }
  async init(organizationId?: string | null) {
    const whiteLabelSettings = await this.retrieveWhiteLabelSettings(organizationId);
    this.SMTP = await this.retrieveSmtpSettings();
    this.WHITE_LABEL_TEXT = whiteLabelSettings?.white_label_text;
    this.WHITE_LABEL_LOGO = whiteLabelSettings?.white_label_logo;
    this.defaultWhiteLabelState = whiteLabelSettings?.default;
  }
}
