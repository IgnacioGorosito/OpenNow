import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/createApp';
import { signToken, Role } from '../src/auth/auth.middleware';

const app = createApp();

function tokenDe(role: Role): string {
  return signToken({ id: 1, name: 'Tester', role });
}

beforeAll(() => {
  process.env.JWT_SECRET = 'secreto-solo-para-tests';
});

describe('API pública', () => {
  it('GET /api/health responde ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('protección por token y rol', () => {
  it('/api/admin sin token responde 401', async () => {
    const res = await request(app).get('/api/admin/categories');
    expect(res.status).toBe(401);
  });

  it('/api/owner sin token responde 401', async () => {
    const res = await request(app).get('/api/owner/places');
    expect(res.status).toBe(401);
  });

  it('un token inválido responde 401', async () => {
    const res = await request(app)
      .get('/api/admin/categories')
      .set('Authorization', 'Bearer esto-no-es-un-token');
    expect(res.status).toBe(401);
  });

  it('un dueño no puede entrar a /api/admin (403)', async () => {
    const res = await request(app)
      .get('/api/admin/categories')
      .set('Authorization', `Bearer ${tokenDe('owner')}`);
    expect(res.status).toBe(403);
  });

  it('un usuario común no puede entrar a /api/owner (403)', async () => {
    const res = await request(app)
      .get('/api/owner/places')
      .set('Authorization', `Bearer ${tokenDe('user')}`);
    expect(res.status).toBe(403);
  });

  it('/api/auth/me devuelve los datos del token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenDe('owner')}`);
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('owner');
    expect(res.body.name).toBe('Tester');
  });
});

describe('validación de /api/auth', () => {
  it('login sin datos responde 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('registro sin datos responde 400', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  it('registro con contraseña corta responde 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ana', email: 'ana@test.com', password: '123' });
    expect(res.status).toBe(400);
  });
});