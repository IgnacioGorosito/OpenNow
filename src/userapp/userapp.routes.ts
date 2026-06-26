import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { isOpenNow } from '../db/timeUtils';

export const userappRouter = Router();

/* ─────────────────────────────────────────────
   GET /api/userapp/localities
───────────────────────────────────────────── */
userappRouter.get('/localities', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, province FROM localities ORDER BY name`
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener localidades' });
  }
});

/* ─────────────────────────────────────────────
   GET /api/userapp/categories
───────────────────────────────────────────── */
userappRouter.get('/categories', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, icon FROM categories ORDER BY name`
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

/* ─────────────────────────────────────────────
   GET /api/userapp/places
   ?locality_id=1  &category_id=2  &open_now=true  &search=texto
───────────────────────────────────────────── */
userappRouter.get('/places', async (req: Request, res: Response) => {
  try {
    const { locality_id, category_id, open_now, search } = req.query;

    const conditions: string[] = ['p.is_enabled = TRUE'];
    const params: unknown[] = [];

    if (locality_id) {
      params.push(Number(locality_id));
      conditions.push(`p.locality_id = $${params.length}`);
    }
    if (category_id) {
      params.push(Number(category_id));
      conditions.push(`p.category_id = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`p.name ILIKE $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const placesResult = await pool.query(
      `SELECT
         p.id, p.name, p.address, p.phone, p.email,
         p.description, p.latitude, p.longitude, p.owner_name,
         c.id   AS category_id,   c.name AS category_name, c.icon AS category_icon,
         l.id   AS locality_id,   l.name AS locality_name, l.province
       FROM places p
       JOIN categories c ON c.id = p.category_id
       JOIN localities l ON l.id = p.locality_id
       ${where}
       ORDER BY p.name`,
      params
    );

    if (placesResult.rows.length === 0) { res.json([]); return; }

    const placeIds = placesResult.rows.map((r) => r.id);
    const schedResult = await pool.query(
      `SELECT place_id, day_of_week, open_time::text, close_time::text
       FROM schedules WHERE place_id = ANY($1)`,
      [placeIds]
    );

    const schedByPlace: Record<number, { day_of_week: number; open_time: string; close_time: string }[]> = {};
    for (const s of schedResult.rows) {
      if (!schedByPlace[s.place_id]) schedByPlace[s.place_id] = [];
      schedByPlace[s.place_id].push(s);
    }

    let places = placesResult.rows.map((p) => {
      const schedules = schedByPlace[p.id] ?? [];
      return {
        id: p.id, name: p.name, address: p.address,
        phone: p.phone, email: p.email, description: p.description,
        latitude: p.latitude, longitude: p.longitude, owner_name: p.owner_name,
        category: { id: p.category_id, name: p.category_name, icon: p.category_icon },
        locality: { id: p.locality_id, name: p.locality_name, province: p.province },
        schedules,
        is_open: isOpenNow(schedules),
      };
    });

    if (open_now === 'true') places = places.filter((p) => p.is_open);

    res.json(places);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener lugares' });
  }
});

/* ─────────────────────────────────────────────
   GET /api/userapp/places/:id
───────────────────────────────────────────── */
userappRouter.get('/places/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const placeResult = await pool.query(
      `SELECT
         p.id, p.name, p.address, p.phone, p.email,
         p.description, p.latitude, p.longitude, p.owner_name,
         c.id AS category_id, c.name AS category_name, c.icon AS category_icon,
         l.id AS locality_id,  l.name AS locality_name, l.province
       FROM places p
       JOIN categories c ON c.id = p.category_id
       JOIN localities l ON l.id = p.locality_id
       WHERE p.id = $1 AND p.is_enabled = TRUE`,
      [id]
    );

    if (placeResult.rows.length === 0) {
      res.status(404).json({ error: 'Lugar no encontrado' });
      return;
    }

    const p = placeResult.rows[0];
    const schedResult = await pool.query(
      `SELECT day_of_week, open_time::text, close_time::text
       FROM schedules WHERE place_id = $1 ORDER BY day_of_week, open_time`,
      [id]
    );
    const schedules = schedResult.rows;

    res.json({
      id: p.id, name: p.name, address: p.address,
      phone: p.phone, email: p.email, description: p.description,
      latitude: p.latitude, longitude: p.longitude, owner_name: p.owner_name,
      category: { id: p.category_id, name: p.category_name, icon: p.category_icon },
      locality: { id: p.locality_id, name: p.locality_name, province: p.province },
      schedules,
      is_open: isOpenNow(schedules),
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener el lugar' });
  }
});
