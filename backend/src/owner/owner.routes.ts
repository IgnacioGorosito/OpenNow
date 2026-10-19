import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { AuthPayload, AuthRequest } from '../auth/auth.middleware';

export const ownerRouter = Router();

/* ─────────────────────────────────────────────
   Helpers de permisos
   El usuario sale del token (lo pone requireAuth), nunca del body ni de la URL.
───────────────────────────────────────────── */

function getUser(req: Request): AuthPayload {
  return (req as AuthRequest).user as AuthPayload;
}

function toId(value: string | string[] | undefined): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// ¿El lugar es del usuario? (el admin puede con todos)
async function ownsPlace(placeId: number | null, user: AuthPayload): Promise<boolean> {
  if (placeId === null) return false;
  if (user.role === 'admin') return true;
  const r = await pool.query(`SELECT 1 FROM places WHERE id = $1 AND owner_id = $2`, [placeId, user.id]);
  return r.rows.length > 0;
}

// ¿El horario pertenece a un lugar del usuario?
async function ownsSchedule(scheduleId: number | null, user: AuthPayload): Promise<boolean> {
  if (scheduleId === null) return false;
  if (user.role === 'admin') return true;
  const r = await pool.query(
    `SELECT 1 FROM schedules s JOIN places p ON p.id = s.place_id
     WHERE s.id = $1 AND p.owner_id = $2`,
    [scheduleId, user.id]
  );
  return r.rows.length > 0;
}

/* ─────────────────────────────────────────────
   LUGARES DEL DUEÑO
───────────────────────────────────────────── */

// GET /api/owner/places  -> solo los lugares del usuario logueado
ownerRouter.get('/places', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const result = await pool.query(
      `SELECT
         p.id, p.name, p.address, p.phone, p.email,
         p.description, p.latitude, p.longitude, p.is_enabled, p.updated_at,
         c.id AS category_id, c.name AS category_name,
         l.id AS locality_id,  l.name AS locality_name, l.province
       FROM places p
       JOIN categories c ON c.id = p.category_id
       JOIN localities l ON l.id = p.locality_id
       WHERE p.owner_id = $1
       ORDER BY p.name`,
      [user.id]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Error al obtener lugares' }); }
});

// POST /api/owner/places  -> el dueño siempre es el usuario del token
ownerRouter.post('/places', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const {
      name, address, phone, email, description,
      latitude, longitude, category_id, locality_id,
    } = req.body as {
      name: string; address?: string; phone?: string; email?: string;
      description?: string; latitude?: number; longitude?: number;
      category_id: number; locality_id: number;
    };

    if (!name || !category_id || !locality_id) {
      res.status(400).json({ error: 'name, category_id y locality_id son obligatorios' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO places
         (name, address, phone, email, description, latitude, longitude,
          category_id, locality_id, owner_name, owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [name, address ?? null, phone ?? null, email ?? null, description ?? null,
       latitude ?? null, longitude ?? null, category_id, locality_id, user.name, user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23503')
      res.status(400).json({ error: 'category_id o locality_id no existen' });
    else res.status(500).json({ error: 'Error al crear el lugar' });
  }
});

// PUT /api/owner/places/:id
ownerRouter.put('/places/:id', async (req: Request, res: Response) => {
  try {
    const id = toId(req.params.id);
    if (!(await ownsPlace(id, getUser(req)))) {
      res.status(404).json({ error: 'Lugar no encontrado' });
      return;
    }
    const {
      name, address, phone, email, description,
      latitude, longitude, category_id, locality_id,
    } = req.body as {
      name?: string; address?: string; phone?: string; email?: string;
      description?: string; latitude?: number; longitude?: number;
      category_id?: number; locality_id?: number;
    };

    const result = await pool.query(
      `UPDATE places SET
         name        = COALESCE($1, name),
         address     = COALESCE($2, address),
         phone       = COALESCE($3, phone),
         email       = COALESCE($4, email),
         description = COALESCE($5, description),
         latitude    = COALESCE($6, latitude),
         longitude   = COALESCE($7, longitude),
         category_id = COALESCE($8, category_id),
         locality_id = COALESCE($9, locality_id),
         updated_at  = NOW()
       WHERE id = $10 RETURNING *`,
      [name ?? null, address ?? null, phone ?? null, email ?? null,
       description ?? null, latitude ?? null, longitude ?? null,
       category_id ?? null, locality_id ?? null, id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Lugar no encontrado' }); return; }
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Error al actualizar el lugar' }); }
});

/* ─────────────────────────────────────────────
   HORARIOS
───────────────────────────────────────────── */

// GET /api/owner/places/:placeId/schedules
ownerRouter.get('/places/:placeId/schedules', async (req: Request, res: Response) => {
  try {
    const placeId = toId(req.params.placeId);
    if (!(await ownsPlace(placeId, getUser(req)))) {
      res.status(404).json({ error: 'Lugar no encontrado' });
      return;
    }
    const result = await pool.query(
      `SELECT id, day_of_week, open_time::text, close_time::text
       FROM schedules WHERE place_id = $1 ORDER BY day_of_week, open_time`,
      [placeId]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Error al obtener horarios' }); }
});

// POST /api/owner/places/:placeId/schedules
// Body: { day_of_week: 1, open_time: "08:00", close_time: "13:00" }
ownerRouter.post('/places/:placeId/schedules', async (req: Request, res: Response) => {
  try {
    const placeId = toId(req.params.placeId);
    if (!(await ownsPlace(placeId, getUser(req)))) {
      res.status(404).json({ error: 'Lugar no encontrado' });
      return;
    }
    const { day_of_week, open_time, close_time } = req.body as {
      day_of_week: number; open_time: string; close_time: string;
    };
    if (day_of_week === undefined || !open_time || !close_time) {
      res.status(400).json({ error: 'day_of_week, open_time y close_time son obligatorios' });
      return;
    }
    const result = await pool.query(
      `INSERT INTO schedules (place_id, day_of_week, open_time, close_time)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [placeId, day_of_week, open_time, close_time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23514')
      res.status(400).json({ error: 'Horario inválido: el día debe ir de 0 a 6 y el cierre debe ser posterior a la apertura' });
    else res.status(500).json({ error: 'Error al crear horario' });
  }
});

// PUT /api/owner/schedules/:id
ownerRouter.put('/schedules/:id', async (req: Request, res: Response) => {
  try {
    const id = toId(req.params.id);
    if (!(await ownsSchedule(id, getUser(req)))) {
      res.status(404).json({ error: 'Horario no encontrado' });
      return;
    }
    const { day_of_week, open_time, close_time } = req.body as {
      day_of_week?: number; open_time?: string; close_time?: string;
    };
    const result = await pool.query(
      `UPDATE schedules SET
         day_of_week = COALESCE($1, day_of_week),
         open_time   = COALESCE($2::time, open_time),
         close_time  = COALESCE($3::time, close_time)
       WHERE id = $4 RETURNING *`,
      [day_of_week ?? null, open_time ?? null, close_time ?? null, id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Horario no encontrado' }); return; }
    res.json(result.rows[0]);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23514')
      res.status(400).json({ error: 'Horario inválido: el día debe ir de 0 a 6 y el cierre debe ser posterior a la apertura' });
    else res.status(500).json({ error: 'Error al actualizar horario' });
  }
});

// DELETE /api/owner/schedules/:id
ownerRouter.delete('/schedules/:id', async (req: Request, res: Response) => {
  try {
    const id = toId(req.params.id);
    if (!(await ownsSchedule(id, getUser(req)))) {
      res.status(404).json({ error: 'Horario no encontrado' });
      return;
    }
    const result = await pool.query(`DELETE FROM schedules WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) { res.status(404).json({ error: 'Horario no encontrado' }); return; }
    res.json({ message: 'Horario eliminado' });
  } catch { res.status(500).json({ error: 'Error al eliminar horario' }); }
});

// POST /api/owner/places/:placeId/schedules/replace
// Reemplaza TODOS los horarios de un lugar de una sola vez
// Body: [{ day_of_week, open_time, close_time }, ...]
ownerRouter.post('/places/:placeId/schedules/replace', async (req: Request, res: Response) => {
  const placeId = toId(req.params.placeId);
  if (!(await ownsPlace(placeId, getUser(req)))) {
    res.status(404).json({ error: 'Lugar no encontrado' });
    return;
  }
  const schedules = req.body as { day_of_week: number; open_time: string; close_time: string }[];
  if (!Array.isArray(schedules)) {
    res.status(400).json({ error: 'El body debe ser un array de horarios' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM schedules WHERE place_id = $1`, [placeId]);
    const inserted = [];
    for (const s of schedules) {
      const r = await client.query(
        `INSERT INTO schedules (place_id, day_of_week, open_time, close_time)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [placeId, s.day_of_week, s.open_time, s.close_time]
      );
      inserted.push(r.rows[0]);
    }
    await client.query('COMMIT');
    res.status(201).json(inserted);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al reemplazar horarios' });
  } finally {
    client.release();
  }
});