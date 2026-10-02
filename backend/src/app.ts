import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/error';
import { UPLOAD_DIR } from './services/StorageService';
import { apiLimiter } from './middleware/rateLimit';
import routes from './routes';

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
// Raised from 100kb: issue reports carry a base64-encoded photo (up to ~5MB raw, larger once encoded).
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/api', apiLimiter, routes);
app.use(notFound);
app.use(errorHandler);
