# Plan: Hostear salas WebSocket en Render (frontend + WS)

## Summary
Desplegar el servidor de **salas WebSocket** en Render como **Web Service** y el frontend (Vite/React) como **Static Site** en Render. Configurar `CORS_ORIGIN` en el servidor y `VITE_WS_URL` en el frontend para que los navegadores conecten por **WSS** y puedan crear/unirse a salas desde distintos dispositivos.

## Current State Analysis (repo real)
- Existe un servidor WebSocket Node en [server/index.mjs](file:///workspace/server/index.mjs) que:
  - Escucha en `process.env.PORT` (fallback `3001`) y Render inyecta `PORT` automáticamente.
  - Valida el `Origin` del navegador contra `process.env.CORS_ORIGIN` (fallback `http://localhost:5173`).
  - Mantiene salas **en memoria** (`Map`) y las pierde si el proceso reinicia.
- El frontend toma la URL del WS desde `import.meta.env.VITE_WS_URL` (fallback `ws://localhost:3001`) en [roomStore.ts](file:///workspace/src/store/roomStore.ts#L96-L105).
- `vite build` genera en `dist/` (no hay `outDir` custom), ver [vite.config.ts](file:///workspace/vite.config.ts#L7-L11).

## Assumptions & Decisions
- Frontend: **Render Static Site** (HTTPS).
- WebSocket: **Render Web Service** en **Free tier**.
- Restricción: para que las salas (in-memory) funcionen, el servicio WS debe correr con **1 instancia** (sin escalado horizontal). Con varias instancias, cada una tendría “sus” salas y los jugadores se separarían.
- Free tier puede:
  - Dormirse por inactividad (corta conexiones WS).
  - Reiniciarse (se pierden salas activas y códigos).
  - Esto es aceptable para V1; para producción estable se recomienda plan Always-on o persistencia (Redis/DB).

## Proposed Changes
### 1) Render Web Service: servidor WebSocket
**Objetivo**: levantar `server/index.mjs` como servicio público con WSS.

- **Servicio**: Render → New → **Web Service**
- **Runtime**: Node
- **Root directory**: repo root
- **Build Command** (pnpm):
  - `corepack enable && pnpm install --frozen-lockfile`
- **Start Command**:
  - `node server/index.mjs`
- **Env vars**:
  - `CORS_ORIGIN=https://<TU-STATIC-SITE>.onrender.com`
    - Debe coincidir EXACTO con el origen del frontend (incluye `https://`).
  - `PORT`:
    - No se setea manualmente; Render lo inyecta.
- **Scaling**:
  - Instancias: **1**
- **Health check**:
  - Render puede hacer checks HTTP. El server responde `{ ok: true }` en `/` (HTTP), suficiente para health checks.

**Resultado esperado**
- Tendrás un endpoint público del tipo:
  - `https://<TU-WS-SERVICE>.onrender.com`
- Y el WebSocket se conectará como:
  - `wss://<TU-WS-SERVICE>.onrender.com`

### 2) Render Static Site: frontend Vite/React
**Objetivo**: publicar el `dist` y apuntar el cliente al WS por WSS.

- **Servicio**: Render → New → **Static Site**
- **Build Command**:
  - `corepack enable && pnpm install --frozen-lockfile && pnpm build`
- **Publish directory**:
  - `dist`
- **Env vars (Build)**:
  - `VITE_WS_URL=wss://<TU-WS-SERVICE>.onrender.com`
    - Importante: si el frontend es HTTPS, debe ser **wss://**.

### 3) Ajustes recomendados por Free tier (sin cambiar arquitectura)
**Objetivo**: que la experiencia no “se rompa” silenciosamente.

- UX:
  - Mostrar error claro si el WS no conecta (ya hay `status/errorMessage` en `roomStore`).
  - En free tier, avisar: “Si pasan ~X minutos sin uso, Render puede dormir el servidor y la sala se perderá”.
- Operación:
  - Mantener el WS “caliente” con un ping externo (opcional, fuera de repo; Render no lo recomienda formalmente en free, pero es común).

### 4) (Opcional, si quieres estabilidad real)
Si después quieres que **las salas sobrevivan** reinicios y/o usar múltiples instancias:
- Persistir salas en Redis/DB y usar pub/sub para broadcast.
- Cambiar el “source of truth” de salas de memoria a almacenamiento compartido.

## Verification Steps (aceptación)
1) Desplegar WS Web Service y copiar el dominio `https://<ws>.onrender.com`.
2) Desplegar frontend Static Site con `VITE_WS_URL=wss://<ws>.onrender.com`.
3) Setear `CORS_ORIGIN=https://<frontend>.onrender.com` en el WS.
4) Abrir el frontend en 2 dispositivos (o 2 navegadores):
   - Dispositivo A: Online → Crear sala → ver código de 6 dígitos.
   - Dispositivo B: Online → Unirse con el código → debe aparecer en roster.
5) Iniciar ronda desde el host:
   - Cada dispositivo debe ver su rol/palabra (privado).
6) Prueba de “sleep” (solo para free):
   - Dejar inactivo y confirmar que si Render duerme/reinicia, la app muestra error y permite re-crear sala.

