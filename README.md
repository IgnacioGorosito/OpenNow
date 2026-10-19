# OpenNow

Aplicación web para encontrar **servicios abiertos ahora** (farmacias, gomerías, ferreterías, veterinarias, etc.) por localidad o por cercanía, con horarios actualizados y estado **abierto / cerrado** calculado en tiempo real con la hora de Argentina.

Proyecto de la materia **Desarrollo de Software** (UTN).

## Roles

| Rol | Acceso | Qué puede hacer |
|---|---|---|
| **Usuario** | Público (cuenta opcional) | Buscar lugares por localidad, categoría y nombre; ver solo los abiertos ahora; usar **Cerca de mí** (GPS) para ordenarlos por distancia; verlos en **lista o en mapa**; llamar o abrir el mapa. |
| **Dueño** | Con cuenta (rol Dueño) | Crear y editar **sus** locales, cargar su ubicación con GPS y administrar los horarios por día. |
| **Admin** | Con cuenta (rol Admin) | Habilitar, deshabilitar y eliminar lugares; ABM de categorías y localidades. |

## Funcionalidades destacadas

- **Cerca de mí:** usa el GPS del navegador, calcula la distancia con la fórmula de Haversine y ordena por cercanía, con radio configurable.
- **Mapa interactivo:** Leaflet + OpenStreetMap, con pines verdes (abierto) y rojos (cerrado) y selector **Lista / Mapa**.
- **Login con roles:** registro e ingreso con email y contraseña; la sesión usa un token JWT.
- **Tema original y tema oscuro:** botón sol / luna en la barra superior; recuerda la elección y respeta la preferencia del sistema la primera vez.
- **Transiciones:** animaciones entre pantallas (View Transitions) y entrada escalonada de tarjetas, con soporte para `prefers-reduced-motion`.

## Tecnologías

- **Backend:** Node.js, Express 5, TypeScript, PostgreSQL 17 (Docker), `pg`, JWT (`jsonwebtoken`) y `bcryptjs`.
- **Frontend:** Angular (componentes standalone, signals, nuevo control flow), Leaflet, CSS propio con variables.
- **Tests:** Vitest + Supertest (backend) y el runner de Angular (frontend).

## Estructura

```
OpenNow/
├── backend/
│   ├── app.ts                 # arranque del servidor
│   ├── docker-compose.yml     # base de datos PostgreSQL
│   ├── src/                   # código del backend
│   │   ├── createApp.ts       # arma la app Express (rutas y middlewares)
│   │   ├── auth/              # registro, login y protección por rol (JWT)
│   │   ├── userapp/           # rutas públicas de búsqueda
│   │   ├── owner/             # rutas del dueño
│   │   ├── admin/             # rutas del administrador
│   │   └── db/                # conexión, creación de tablas y lógica de horarios
│   └── test/                  # tests del backend
└── frontend/
    └── src/app/
        ├── core/              # servicios, modelos, interceptor, guards, geo y tema
        ├── features/          # userapp (buscador), login, owner, admin
        └── shared/            # places-map (mapa reutilizable)
```

## Requisitos

- Node.js (LTS) y npm
- Angular CLI: `npm install -g @angular/cli`
- Docker Desktop

## Puesta en marcha

### 1. Base de datos y backend

```bash
cd backend
npm install
cp .env.example .env        # en Windows PowerShell: Copy-Item .env.example .env
docker compose up -d
npm run start:dev
```

En el archivo `.env` completá los valores que indica `.env.example` y definí una clave propia:

```
JWT_SECRET=un-texto-largo-y-secreto
CORS_ORIGIN=http://localhost:4200
PORT=3000
```

El backend queda en `http://localhost:3000`. Al arrancar crea las tablas y carga categorías y localidades de ejemplo. Podés comprobarlo en `http://localhost:3000/api/health`.

> El archivo `.env` contiene secretos y **no se sube a Git**.

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
ng serve
```

La aplicación queda en `http://localhost:4200`.

## Cuenta de prueba

Al iniciar, el backend crea un administrador para desarrollo:

- Email: `admin@opennow.com`
- Contraseña: `admin123`

> Cambiá esta contraseña antes de publicar el proyecto.

Los usuarios y dueños se crean desde **Crear cuenta** en la aplicación.

## Cómo probar el flujo completo

1. **Crear cuenta** como *Tengo un negocio* (Dueño).
2. En **Mi negocio**: crear un lugar, tocar **Usar mi ubicación actual** y cargar un horario que incluya la hora actual.
3. **Salir** y, desde el inicio, filtrar por localidad o tocar **Cerca de mí** para verlo ordenado por distancia. Alternar entre **Lista** y **Mapa**.
4. Probar el botón de **tema** (luna / sol) en la barra superior.
5. **Ingresar** como administrador para habilitar, deshabilitar o eliminar lugares y gestionar categorías y localidades.

## API

Todas las rutas empiezan con `/api`.

| Ruta | Acceso | Descripción |
|---|---|---|
| `GET /health` | Público | Estado del servidor |
| `POST /auth/register` | Público | Crear cuenta (usuario o dueño) |
| `POST /auth/login` | Público | Ingresar; devuelve un token JWT |
| `GET /auth/me` | Con token | Datos de la sesión |
| `GET /userapp/localities` · `/categories` | Público | Listados para los filtros |
| `GET /userapp/places` | Público | Búsqueda (`locality_id`, `category_id`, `open_now`, `search`) |
| `GET /userapp/places/:id` | Público | Detalle de un lugar |
| `GET/POST/PUT /owner/places` | Dueño | Sus lugares (solo los propios) |
| `GET/POST /owner/places/:id/schedules` · `PUT/DELETE /owner/schedules/:id` | Dueño | Horarios de sus lugares |
| `GET/PATCH/DELETE /admin/places` | Admin | Gestión de todos los lugares |
| `/admin/categories` · `/admin/localities` | Admin | ABM completo |

La autenticación usa el encabezado `Authorization: Bearer <token>`. Un dueño solo puede ver y modificar lo que le pertenece (se identifica por el token, no por un nombre); el token dura 8 horas.

## Seguridad

- Las contraseñas se guardan con hash **bcrypt**.
- Los roles se verifican en el servidor con `requireAuth('rol')`; los guards del frontend son solo comodidad de interfaz.
- Los recursos de otros dueños responden **404**, para no revelar que existen.
- El secreto `JWT_SECRET` vive en `.env`, fuera de Git.
- Los popups del mapa escapan el HTML para evitar inyección de código.

## Tests

```bash
# Backend (no necesita base de datos)
cd backend
npm test

# Frontend
cd frontend
ng test --no-watch
```

El backend prueba la lógica de **abierto ahora** (bordes de horario, varios rangos, zona horaria de Argentina, con un reloj simulado) y la **protección por rol** de las rutas. El frontend prueba la creación de cada pantalla, el cálculo de distancias y las llamadas a la API con `HttpTestingController`.

## Notas de diseño

- Los horarios se guardan por día de la semana (0 = domingo … 6 = sábado). Un lugar puede tener varios rangos por día. La hora de apertura es inclusiva y la de cierre exclusiva.
- No se admiten horarios que crucen la medianoche: se cargan como dos rangos de días distintos.
- La distancia de **Cerca de mí** se calcula en el navegador con la fórmula de Haversine a partir de la latitud y longitud de cada lugar.
- El diseño "Océano" usa azul marino y turquesa, con verde para *abierto* y rojo para *cerrado*. La paleta está definida con variables CSS; el tema oscuro redefine esas variables mediante `data-theme="dark"` en el elemento `<html>`.
- Los controles de formulario (incluida la lista desplegable) heredan la tipografía y los colores de la aplicación.

## Autor

Ignacio Gorosito — UTN, Desarrollo de Software.