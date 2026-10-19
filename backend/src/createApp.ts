import express from 'express';
import cors from 'cors';
import { userappRouter } from './userapp/userapp.routes';
import { adminRouter } from './admin/admin.routes';
import { ownerRouter } from './owner/owner.routes';
import { authRouter } from './auth/auth.routes';
import { requireAuth } from './auth/auth.middleware';

// Arma la aplicación (middlewares y rutas) sin arrancar el servidor.
// Así se puede usar tanto en app.ts como en los tests.
export function createApp() {
  const app = express();

  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  }));

  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', project: 'OpenNow', timestamp: new Date().toISOString() });
  });

  // Rutas
  app.use('/api/auth', authRouter);
  app.use('/api/userapp', userappRouter);
  app.use('/api/owner', requireAuth('owner', 'admin'), ownerRouter);
  app.use('/api/admin', requireAuth('admin'), adminRouter);

  return app;
}