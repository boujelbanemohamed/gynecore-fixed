import multer from 'multer';
import path from 'path';
import fs from 'fs';

const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'logos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(/\s+/g, '_').replace(ext, '');
    cb(null, `${Date.now()}_${name}${ext}`);
  },
});

const logoFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type non autorise'));
  }
};

export const uploadLogo = multer({ storage: logoStorage, fileFilter: logoFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(/\s+/g, '_').replace(ext, '');
    cb(null, `${Date.now()}_${name}${ext}`);
  },
});

const docFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type non autorise'));
  }
};

export const uploadDocument = multer({ storage: docStorage, fileFilter: docFilter, limits: { fileSize: 20 * 1024 * 1024 } });
