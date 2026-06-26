# OpenNow — API

Backend REST para consultar servicios de guardia (farmacias, gomería, ferretería, etc.) filtrados por localidad, con estado **abierto/cerrado** calculado en tiempo real.

## Stack

- **Node.js** + **Express 5** + **TypeScript**
- **PostgreSQL 17** (vía Docker)
- Driver: **pg** (sin ORM)

---

## Puesta en marcha

### 1. Levantar la base de datos

```bash
docker compose up -d
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

### 4. Iniciar en modo desarrollo

```bash
npm run start:dev
```

> Al iniciar el servidor crea automáticamente las tablas e inserta categorías y localidades de ejemplo.

La API queda disponible en `http://localhost:3000`

---

## Endpoints

### 🟢 Público — `/api/userapp`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/userapp/localities` | Lista localidades |
| GET | `/api/userapp/categories` | Lista categorías |
| GET | `/api/userapp/places` | Lista lugares con filtros |
| GET | `/api/userapp/places/:id` | Detalle de un lugar |

#### Filtros para `GET /api/userapp/places`

| Parámetro | Descripción |
|-----------|-------------|
| `locality_id` | Filtra por localidad |
| `category_id` | Filtra por categoría |
| `open_now=true` | Solo los abiertos ahora |
| `search=texto` | Búsqueda por nombre |

**Ejemplo:**
```
GET /api/userapp/places?locality_id=1&category_id=1&open_now=true
```

**Respuesta:**
```json
{
  "id": 1,
  "name": "Farmacia Central",
  "address": "San Martín 123",
  "phone": "03462-420000",
  "category": { "id": 1, "name": "Farmacia", "icon": "pill" },
  "locality": { "id": 1, "name": "Venado Tuerto", "province": "Santa Fe" },
  "schedules": [
    { "day_of_week": 1, "open_time": "08:00:00", "close_time": "13:00:00" }
  ],
  "is_open": true
}
```

---

### 🔧 Admin — `/api/admin`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST/PUT/DELETE | `/api/admin/categories` | CRUD categorías |
| GET/POST/PUT/DELETE | `/api/admin/localities` | CRUD localidades |
| GET | `/api/admin/places` | Todos los lugares (habilitados y no) |
| PATCH | `/api/admin/places/:id/toggle` | Habilita/deshabilita un lugar |
| DELETE | `/api/admin/places/:id` | Elimina un lugar |

---

### 🏪 Owner — `/api/owner`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/owner/places?owner_name=X` | Lugares del dueño |
| POST | `/api/owner/places` | Registra un lugar |
| PUT | `/api/owner/places/:id` | Edita un lugar |
| GET | `/api/owner/places/:placeId/schedules` | Horarios del lugar |
| POST | `/api/owner/places/:placeId/schedules` | Agrega un rango horario |
| PUT | `/api/owner/schedules/:id` | Edita un rango horario |
| DELETE | `/api/owner/schedules/:id` | Elimina un rango horario |
| POST | `/api/owner/places/:placeId/schedules/replace` | Reemplaza todos los horarios |

**`day_of_week`:** 0 = domingo, 1 = lunes, …, 6 = sábado

---

## Estructura del proyecto

```
opennow/
├── app.ts
├── src/
│   ├── db/
│   │   ├── pool.ts          ← Conexión a PostgreSQL
│   │   ├── init.ts          ← Creación de tablas
│   │   └── timeUtils.ts     ← Lógica abierto/cerrado
│   ├── userapp/
│   │   └── userapp.routes.ts
│   ├── admin/
│   │   └── admin.routes.ts
│   └── owner/
│       └── owner.routes.ts
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

---

## Git — primeros pasos

```bash
git init
git add .
git commit -m "feat: backend inicial OpenNow"
git remote add origin https://github.com/tu-usuario/opennow.git
git push -u origin main
```
