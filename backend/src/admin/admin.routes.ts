import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

export const adminRouter = Router();

/* ══════════════════════════════════
   CATEGORÍAS
══════════════════════════════════ */

adminRouter.get('/categories', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT id, name, icon, created_at FROM categories ORDER BY name`);
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Error al obtener categorías' }); }
});

adminRouter.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name, icon } = req.body as { name: string; icon?: string };
    if (!name) { res.status(400).json({ error: 'El campo name es obligatorio' }); return; }
    const result = await pool.query(
      `INSERT INTO categories (name, icon) VALUES ($1, $2) RETURNING *`,
      [name, icon ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505')
      res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    else res.status(500).json({ error: 'Error al crear categoría' });
  }
});

adminRouter.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, icon } = req.body as { name?: string; icon?: string };
    const result = await pool.query(
      `UPDATE categories SET
         name = COALESCE($1, name),
         icon = COALESCE($2, icon)
       WHERE id = $3 RETURNING *`,
      [name ?? null, icon ?? null, id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Categoría no encontrada' }); return; }
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Error al actualizar categoría' }); }
});

adminRouter.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM categories WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) { res.status(404).json({ error: 'Categoría no encontrada' }); return; }
    res.json({ message: 'Categoría eliminada' });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23503')
      res.status(409).json({ error: 'No se puede eliminar: hay lugares asociados' });
    else res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

/* ══════════════════════════════════
   LOCALIDADES
══════════════════════════════════ */

adminRouter.get('/localities', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT id, name, province, created_at FROM localities ORDER BY province, name`);
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Error al obtener localidades' }); }
});

adminRouter.post('/localities', async (req: Request, res: Response) => {
  try {
    const { name, province } = req.body as { name: string; province?: string };
    if (!name) { res.status(400).json({ error: 'El campo name es obligatorio' }); return; }
    const result = await pool.query(
      `INSERT INTO localities (name, province) VALUES ($1, $2) RETURNING *`,
      [name, province ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505')
      res.status(409).json({ error: 'Ya existe esa localidad' });
    else res.status(500).json({ error: 'Error al crear localidad' });
  }
});

adminRouter.put('/localities/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, province } = req.body as { name?: string; province?: string };
    const result = await pool.query(
      `UPDATE localities SET
         name     = COALESCE($1, name),
         province = COALESCE($2, province)
       WHERE id = $3 RETURNING *`,
      [name ?? null, province ?? null, id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Localidad no encontrada' }); return; }
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Error al actualizar localidad' }); }
});

adminRouter.delete('/localities/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM localities WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) { res.status(404).json({ error: 'Localidad no encontrada' }); return; }
    res.json({ message: 'Localidad eliminada' });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23503')
      res.status(409).json({ error: 'No se puede eliminar: hay lugares asociados' });
    else res.status(500).json({ error: 'Error al eliminar localidad' });
  }
});

/* ══════════════════════════════════
   GESTIÓN DE LUGARES
══════════════════════════════════ */

adminRouter.get('/places', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
         p.id, p.name, p.address, p.phone, p.email,
         p.description, p.latitude, p.longitude,
         p.owner_name, p.is_enabled, p.created_at, p.updated_at,
         c.name AS category_name,
         l.name AS locality_name, l.province
       FROM places p
       JOIN categories c ON c.id = p.category_id
       JOIN localities l ON l.id = p.locality_id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Error al obtener lugares' }); }
});

// Habilita / deshabilita un lugar
adminRouter.patch('/places/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE places SET is_enabled = NOT is_enabled, updated_at = NOW()
       WHERE id = $1 RETURNING id, name, is_enabled`,
      [id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Lugar no encontrado' }); return; }
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Error al cambiar estado' }); }
});

adminRouter.delete('/places/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM places WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) { res.status(404).json({ error: 'Lugar no encontrado' }); return; }
    res.json({ message: 'Lugar eliminado' });
  } catch { res.status(500).json({ error: 'Error al eliminar lugar' }); }
});
