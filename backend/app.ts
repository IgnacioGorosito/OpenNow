import express from 'express';
import cors from 'cors';
import { userappRouter } from './src/userapp/userapp.routes';
import { adminRouter } from './src/admin/admin.routes';
import { ownerRouter } from './src/owner/owner.routes';
import { initDB } from './src/db/init';
import { authRouter } from './src/auth/auth.routes';
import { requireAuth } from './src/auth/auth.middleware';

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

// Inicializar BD y arrancar servidor
const PORT = Number(process.env.PORT) || 3000;

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 [OpenNow] Servidor corriendo en http://localhost:${PORT}/`);
    });
  })
  .catch((err) => {
    console.error('No se pudo inicializar la base de datos:', err);
    process.exit(1);
  });
