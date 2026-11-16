import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import healthRoutes from './routes/healthRoutes.js';
import eligibilityRoutes from './routes/eligibilityRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import authRoutes from './routes/authRoutes.js';
import crmRoutes from './routes/crmRoutes.js';
import automationRoutes from './routes/automationRoutes.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config();

const app = express();

// Security & Header hardening
app.use(helmet());

// CORS configuration (supports local dev, production frontend URLs, and Vercel domains)
const clientUrl = process.env.CLIENT_URL;
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

if (clientUrl) {
  clientUrl.split(',').forEach((url) => {
    const trimmed = url.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, tests, server-to-server webhooks)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

// Request parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Mount API routes
app.use('/api/v1', healthRoutes);
app.use('/api/v1/eligibility', eligibilityRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/enquiries', enquiryRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1', catalogRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/crm', crmRoutes);
app.use('/api/v1/automation', automationRoutes);
app.use('/api/v1/crm', automationRoutes);
app.use('/api/v1/chat', automationRoutes);

// Static frontend serving if built
const distPath = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      appName: 'ADMINATOR',
      tagline: 'SMART ADMISSIONS. ZERO CHAOS.',
      status: 'ONLINE',
      version: '1.0.0',
      healthCheck: '/api/v1/health'
    });
  });
}

// Error handling middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
