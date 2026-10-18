import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export type Role = 'user' | 'owner' | 'admin';

export interface AuthPayload {
  id: number;
  name: string;
  role: Role;
}

export type AuthRequest = Request & { user?: AuthPayload };

function getSecret(): string {
  return process.env.JWT_SECRET ?? 'dev-secret-cambiar';
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '8h' });
}

// Uso: requireAuth() = cualquier usuario logueado; requireAuth('admin') = solo admin
export function requireAuth(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Tenés que iniciar sesión' });
      return;
    }
    try {
      const payload = jwt.verify(header.slice(7), getSecret()) as AuthPayload;
      if (roles.length > 0 && !roles.includes(payload.role)) {
        res.status(403).json({ error: 'No tenés permisos para esta sección' });
        return;
      }
      (req as AuthRequest).user = payload;
      next();
    } catch {
      res.status(401).json({ error: 'Sesión inválida o vencida' });
    }
  };
}