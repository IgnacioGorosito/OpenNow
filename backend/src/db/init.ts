import { pool } from './pool';

export async function initDB(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Categorías de servicios (farmacia, gomería, ferretería, etc.)
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(100) NOT NULL UNIQUE,
        icon       VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Localidades
    await client.query(`
      CREATE TABLE IF NOT EXISTS localities (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(150) NOT NULL,
        province   VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(name, province)
      );
    `);

    // Lugares / negocios
    await client.query(`
      CREATE TABLE IF NOT EXISTS places (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(200) NOT NULL,
        address     VARCHAR(300),
        phone       VARCHAR(50),
        email       VARCHAR(150),
        description TEXT,
        latitude    NUMERIC(10,7),
        longitude   NUMERIC(10,7),
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        locality_id INTEGER NOT NULL REFERENCES localities(id) ON DELETE RESTRICT,
        owner_name  VARCHAR(200),
        is_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Horarios por día (0=domingo … 6=sábado)
    // Un lugar puede tener múltiples rangos por día (mañana y tarde)
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id          SERIAL PRIMARY KEY,
        place_id    INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        open_time   TIME NOT NULL,
        close_time  TIME NOT NULL,
        CHECK (close_time > open_time)
      );
    `);

    // Datos de ejemplo
    await client.query(`
      INSERT INTO categories (name, icon) VALUES
        ('Farmacia',             'pill'),
        ('Gomería',              'tire'),
        ('Ferretería',           'wrench'),
        ('Estación de servicio', 'fuel'),
        ('Veterinaria',          'paw'),
        ('Kiosko',               'store'),
        ('Panadería',            'bread'),
        ('Guardia médica',       'cross')
      ON CONFLICT (name) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO localities (name, province) VALUES
        ('Venado Tuerto', 'Santa Fe'),
        ('Rosario',       'Santa Fe'),
        ('Córdoba',       'Córdoba'),
        ('Buenos Aires',  'Buenos Aires')
      ON CONFLICT (name, province) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ [OpenNow] Base de datos inicializada correctamente');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ [OpenNow] Error inicializando la base de datos:', err);
    throw err;
  } finally {
    client.release();
  }
}
