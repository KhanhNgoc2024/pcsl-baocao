import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      this.logger.warn('SMTP_HOST chưa cấu hình — bỏ qua gửi email, chỉ dùng thông báo trong ứng dụng.');
      return;
    }
    const user = this.config.get<string>('SMTP_USER');
    this.transporter = nodemailer.createTransport({
      host,
      port: Number(this.config.get('SMTP_PORT') ?? 587),
      auth: user ? { user, pass: this.config.get<string>('SMTP_PASS') } : undefined,
    });
  }

  async gui(to: string[], subject: string, html: string): Promise<void> {
    if (!this.transporter || to.length === 0) return;
    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_FROM'),
        to: to.join(','),
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Gửi email thất bại: ${(err as Error).message}`);
    }
  }
}
