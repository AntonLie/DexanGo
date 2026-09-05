import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');

// Ensure the uploads directory exists at startup.
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const photoMulterOptions = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req: any, file: any, cb: (e: Error | null, name: string) => void) => {
      const ext = extname(file.originalname) || '.png';
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req: any, file: any, cb: (e: Error | null, ok: boolean) => void) => {
    if (!file.mimetype?.startsWith('image/')) {
      return cb(new BadRequestException('Only image files are allowed'), false);
    }
    cb(null, true);
  },
};
