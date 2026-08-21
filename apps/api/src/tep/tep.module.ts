import { BadRequestException, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { mkdirSync } from 'fs';
import { TepService } from './tep.service';
import { TepController } from './tep.controller';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uploadDir = join(process.cwd(), config.get<string>('UPLOAD_DIR') ?? './uploads');
        mkdirSync(uploadDir, { recursive: true });
        const maxSizeMb = Number(config.get('MAX_FILE_SIZE_MB') ?? 25);
        return {
          storage: diskStorage({
            destination: uploadDir,
            filename: (_req, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname).toLowerCase()}`),
          }),
          limits: { fileSize: maxSizeMb * 1024 * 1024 },
          fileFilter: (_req, file, cb) => {
            const ext = extname(file.originalname).toLowerCase();
            if (!['.doc', '.docx', '.pdf'].includes(ext)) {
              cb(new BadRequestException('Chỉ chấp nhận file .doc, .docx, .pdf'), false);
              return;
            }
            cb(null, true);
          },
        };
      },
    }),
  ],
  providers: [TepService],
  controllers: [TepController],
  exports: [TepService],
})
export class TepModule {}
