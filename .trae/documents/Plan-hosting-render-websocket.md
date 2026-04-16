# Plan: Salas online con SOLO Static Site (Render) usando Supabase Realtime + RLS

## Summary
Si quieres hostear **solo** una página estática en Render (sin Web Service), no puedes correr tu propio servidor WebSocket en Render. La alternativa es usar un proveedor que ya te dé el “tiempo real” hospedado. En este plan se usa **Supabase** (Postgres + Realtime) con **Row Level Security (RLS)** para mantener privados los mensajes de rol/palabra por jugador, sin backend propio.

## Current State Analysis (repo real)
- El repo hoy incluye un servidor WebSocket Node en [server/index.mjs](file:///workspace/server/index.mjs), pero **un Static Site en Render no lo ejecuta**.
- El frontend actual espera un WS en `import.meta.env.VITE_WS_URL` (fallback `ws://localhost:3001`) en [roomStore.ts](file:///workspace/src/store/roomStore.ts#L96-L105); con Supabase esta parte se reemplaza por un cliente Supabase.
- `vite build` genera en `dist/` (no hay `outDir` custom), ver [vite.config.ts](file:///workspace/vite.config.ts#L7-L11).

## Assumptions & Decisions
- Frontend: **Render Static Site** (HTTPS).
- Backend propio: **no** (solo Static Site).
- Tiempo real: **Supabase Realtime**.
- Privacidad: **RLS (seguro)** con **Supabase Auth** (sesión anónima) para que:
  - La lista de jugadores y el estado público sea visible para miembros de la sala.
  - Los mensajes privados (rol/palabra) solo los pueda leer el destinatario.

## Proposed Changes
### 1) Supabase: proyecto + Auth + tablas
**Objetivo**: modelar salas, miembros, estado público, acciones y mensajes privados.

**Tablas propuestas (Postgres)**
- `rooms`
  - `code text primary key` (6 dígitos)
  - `host_user_id uuid not null`
  - `created_at timestamptz default now()`
- `room_members`
  - `room_code text references rooms(code)`
  - `user_id uuid not null`
  - `name text not null`
  - `joined_at timestamptz default now()`
  - primary key `(room_code, user_id)`
- `room_state`
  - `room_code text primary key references rooms(code)`
  - `state jsonb not null`
  - `updated_at timestamptz default now()`
- `client_actions`
  - `id bigserial primary key`
  - `room_code text references rooms(code)`
  - `user_id uuid not null`
  - `action jsonb not null`
  - `created_at timestamptz default now()`
- `private_messages`
  - `id bigserial primary key`
  - `room_code text references rooms(code)`
  - `recipient_user_id uuid not null`
  - `payload jsonb not null`
  - `created_at timestamptz default now()`

**RLS (reglas mínimas)**
- `rooms`
  - Insert: permitido si `auth.uid()` existe; `host_user_id = auth.uid()`.
  - Select: permitido si el usuario es host o miembro en `room_members`.
- `room_members`
  - Insert: permitido si la sala existe.
  - Select: permitido solo a miembros de esa `room_code`.
- `room_state`
  - Upsert/Update: solo host de la sala.
  - Select: solo miembros.
- `client_actions`
  - Insert: solo miembros.
  - Select: solo host.
- `private_messages`
  - Insert: solo host (para un `recipient_user_id` miembro).
  - Select: solo si `recipient_user_id = auth.uid()`.

**Realtime**
- Habilitar Realtime (postgres changes) para:
  - `room_members` (para roster)
  - `room_state` (para sincronía de fase/tiempos)
  - `client_actions` (para que el host consuma acciones)
  - `private_messages` (para que cada jugador reciba su rol/palabra)

### 2) Frontend: reemplazar WS por Supabase
**Objetivo**: crear/unirse a sala y sincronizar por suscripciones Realtime con RLS.

**Dependencias**
- Agregar `@supabase/supabase-js` (cliente).

**Env vars en Render Static Site**
- `VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<anon key>`

**Flujos**
- Crear sala:
  - `signInAnonymously()`
  - Insert en `rooms` con `code` y `host_user_id=auth.uid()`
  - Insert en `room_members` (host como miembro)
  - Crear/Upsert `room_state` inicial (`phase="setup"`, roster, etc.)
- Unirse:
  - `signInAnonymously()`
  - Insert en `room_members` con `room_code` + nombre
  - Subscribe a:
    - `room_members` para roster
    - `room_state` para snapshots
    - `private_messages` filtrado por `recipient_user_id=auth.uid()`
- Acciones:
  - Jugador: insert en `client_actions`
  - Host: escucha inserts en `client_actions`, actualiza estado (`room_state`) y emite privados (`private_messages`).

### 3) Render Static Site: despliegue
**Objetivo**: publicar el `dist` (sin servidor).

- **Servicio**: Render → New → Static Site
- **Build Command**: `corepack enable && pnpm install --frozen-lockfile && pnpm build`
- **Publish directory**: `dist`
- **Env vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### 4) Limpieza (sugerida)
Sin backend, se recomienda un cleanup programado en Supabase:
- Job (cron) para borrar `rooms` y datos asociados con `created_at < now() - interval '1 day'` (o el TTL que decidas).

## Verification Steps (aceptación)
1) Crear proyecto Supabase y aplicar tablas + RLS.
2) Configurar Realtime para las tablas indicadas.
3) Desplegar frontend Static Site con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4) Abrir el frontend en 2 dispositivos (o 2 navegadores):
   - Dispositivo A: Online → Crear sala → ver código de 6 dígitos.
   - Dispositivo B: Online → Unirse con el código → debe aparecer en roster.
5) Iniciar ronda desde el host:
   - Cada dispositivo debe recibir su mensaje en `private_messages` y mostrar rol/palabra.
6) Verificar privacidad:
   - Un jugador NO puede leer los `private_messages` de otros (RLS).
