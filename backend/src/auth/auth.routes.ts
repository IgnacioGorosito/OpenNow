import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { pool } from '../db/pool';
import { requireAuth, signToken, AuthRequest } from './auth.middleware';

export const authRouter = Router();

// POST /api/auth/register  { name, email, password, role?: 'user' | 'owner' }
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body as {
      name?: string; email?: string; password?: string; role?: string;
    };
    if (!name || !email || !password) {
      res.status(400).json({ error: 'name, email y password son obligatorios' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }
    // Por registro solo se puede ser usuario o dueño. El admin se crea aparte.
    const finalRole = role === 'owner' ? 'owner' : 'user';
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
      [name.trim(), email.trim().toLowerCase(), hash, finalRole]
    );
    const user = result.rows[0];
    const token = signToken({ id: user.id, name: user.name, role: user.role });
    res.status(201).json({ token, user });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505')
      res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    else res.status(500).json({ error: 'Error al registrarse' });
  }
});

// POST /api/auth/login  { email, password }
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'email y password son obligatorios' });
      return;
    }
    const result = await pool.query(
      `SELECT id, name, email, role, password_hash FROM users WHERE email = $1`,
      [email.trim().toLowerCase()]
    );
    const row = result.rows[0];
    const valid = row ? await bcrypt.compare(password, row.password_hash) : false;
    if (!row || !valid) {
      res.status(401).json({ error: 'Email o contraseña incorrectos' });
      return;
    }
    const user = { id: row.id, name: row.name, email: row.email, role: row.role };
    const token = signToken({ id: user.id, name: user.name, role: user.role });
    res.json({ token, user });
  } catch {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// GET /api/auth/me  (requiere token)
authRouter.get('/me', requireAuth(), (req: Request, res: Response) => {
  res.json((req as AuthRequest).user);
});