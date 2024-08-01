import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EmailService } from './email.service';

@Global()
@Module({
  providers: [EmailService],
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const templatePath = join(__dirname, 'templates');
        return {
          transport: {
            host: configService.get('EMAIL_HOST'),
            port: 587,
            secure: false,
            auth: {
              user: configService.get('EMAIL_USER'),
              pass: configService.get('EMAIL_PASSWORD'),
            },
          },
          defaults: {
            from: `"No Reply" <${configService.get('EMAIL_USER')}>`,
          },
          template: {
            dir: templatePath,
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [EmailService],
})
export class EmailModule {}
