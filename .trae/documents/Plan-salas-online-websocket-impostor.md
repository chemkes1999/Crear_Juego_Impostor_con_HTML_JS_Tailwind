# Plan: Salas online por WebSocket (código de 6 dígitos)

## Summary
Habilitar un modo **online** para que una persona cree una sala, comparta un **código numérico de 6 dígitos**, y otras personas se unan desde sus dispositivos. La sincronización se hace con **WebSockets** usando un servidor Node sencillo que actúa como “relay” (enruta mensajes), mientras el **host** mantiene la lógica de juego y emite snapshots de estado para que todos vean la misma fase/tiempos.

## Current State Analysis
- La app actual es **frontend-only** (Vite + React + TypeScript) y el juego es 100% local; no existe backend. Ver [Arquitectura-tecnica-juego-impostor.md](file:///workspace/.trae/documents/Arquitectura-tecnica-juego-impostor.md#L11-L16).
- El estado del juego vive en Zustand en [gameStore.ts](file:///workspace/src/store/gameStore.ts) con fases: `setup | deal | discussion | vote | elimination | gameover`.
- La UX está pensada para “pasar el dispositivo” (reveal secuencial), ver [SetupScreen.tsx](file:///workspace/src/components/game/SetupScreen.tsx#L107-L120) y la pantalla de reparto.
- No hay uso actual de WebSocket en el repo.

## Assumptions & Decisions
- Alcance: **Sincronía completa** para el flujo de partida, con **un jugador por dispositivo** (cada cliente controla sus acciones cuando corresponda).
- El creador de la sala (host) **también juega**.
- El código de sala es **numérico de 6 dígitos**.
- Se agrega un **backend Node dentro del repo** para WebSockets.
- El servidor WebSocket es deliberadamente “simple”: gestiona salas, roster y enrutamiento; el host es autoritativo para la lógica (selección de palabra/impostor, fases, conteos).
- Para evitar que un “sleep” del host rompa los temporizadores, los temporizadores se sincronizan por **timestamp** (`endsAt`) y cada cliente calcula `secondsLeft` localmente.

## Proposed Changes

### 1) Backend WebSocket (Node)
**Objetivo**: Crear/join de salas, presencia (lista de jugadores) y enrutamiento de mensajes entre host y clientes.

- **Nuevo**: `server/index.mjs`
  - Levanta un servidor HTTP mínimo + WebSocket.
  - Configuración por env:
    - `PORT` (default 3001)
    - `CORS_ORIGIN` (para limitar orígenes en prod; en dev permitir `http://localhost:5173`)
  - Mantiene un `Map<string, Room>` in-memory:
    - `code: string` (6 dígitos)
    - `hostConnId: string`
    - `hostKey: string` (token secreto para autenticar mensajes “host-only”)
    - `players: Array<{ playerId: string; name: string; connId: string }>`
    - `lastPublicState: object | null` (snapshot público para nuevos joiners)
  - Regenera código si colisiona.
  - Maneja desconexiones:
    - Si se va el host: cierra sala y notifica a los clientes (`ROOM_CLOSED`).
    - Si se va un cliente: lo elimina del roster y notifica (`ROSTER_UPDATE`).

- **Nuevo**: `server/messages.mjs`
  - Define el contrato de mensajes (tipos + payload esperado) y helpers:
    - `send(conn, msg)`
    - `broadcast(room, msg, { exceptConnId? })`
    - `routeToHost(room, msg)`
    - `routeToPlayer(room, playerId, msg)` (para mensajes privados como “tu rol”)

- **Dependencias a agregar** (en ejecución, no en este plan): `ws`
  - Se usa `WebSocketServer` para manejo simple.

**Protocolo propuesto (JSON)**:
- Cliente → Servidor
  - `CREATE_ROOM { name }`
  - `JOIN_ROOM { code, name }`
  - `LEAVE_ROOM {}`
  - `HOST_PUBLIC_STATE { code, hostKey, state }` (snapshot sin secretos)
  - `HOST_PRIVATE { code, hostKey, playerId, payload }` (rol/palabra solo para ese jugador)
  - `CLIENT_ACTION { code, playerId, action }` (p.ej. `READY`, `VOTE`, `NEXT_PHASE`)
- Servidor → Cliente
  - `ROOM_CREATED { code, hostKey, playerId, roster }`
  - `JOINED { code, playerId, roster, publicState? }`
  - `ROSTER_UPDATE { roster }`
  - `PUBLIC_STATE { state }`
  - `PRIVATE { payload }`
  - `ERROR { message }`
  - `ROOM_CLOSED { message }`

### 2) Cliente WebSocket + estado de “sala” (frontend)
**Objetivo**: Conectar/desconectar, mantener `roomCode`, `playerId`, `isHost`, roster y aplicar snapshots.

- **Nuevo**: `src/network/wsClient.ts`
  - `connect(url)`
  - `send(msg)`
  - Reintento simple de reconexión (con backoff) solo si el usuario sigue “en sala”.

- **Nuevo**: `src/store/roomStore.ts`
  - Estado:
    - `mode: "local" | "online"`
    - `status: "idle" | "connecting" | "in_room" | "error"`
    - `roomCode: string | null`
    - `playerId: string | null`
    - `isHost: boolean`
    - `hostKey: string | null` (solo host; persistible en `sessionStorage`)
    - `roster: Array<{ playerId; name }>`
  - Acciones:
    - `setMode(mode)`
    - `createRoom(name)`
    - `joinRoom(code, name)`
    - `leaveRoom()`
    - `handleServerMessage(msg)` (router de mensajes)

### 3) Integración con el juego (sincronía completa)
**Objetivo**: Mantener el juego local como está, y agregar un “camino online” que:
1) Use el mismo set de pantallas/fases cuando sea posible.
2) Evite filtrar secretos (palabra/impostor) a clientes incorrectos.

- **Actualizar**: `src/store/gameStore.ts`
  - Añadir APIs para “modo remoto” sin reescribir todo:
    - `applyPublicState(state)` para setear fase, jugadores, discusión, etc.
    - `applyPrivate(payload)` para setear `secretWord` del jugador local y banderas (p.ej. `isImpostorLocal`).
  - En modo online, los botones que hoy mutan estado directamente deben disparar `CLIENT_ACTION`/`HOST_*` según corresponda.

- **Nuevo**: `src/game/onlineActions.ts`
  - Traduce eventos UI → acciones enviadas por WS:
    - `hostStartGame(options)`
    - `playerReady()`
    - `playerVote(targetId)`
    - `hostAdvanceAfterElimination()`
  - El host recibe `CLIENT_ACTION` (vía `roomStore`) y ejecuta lógica existente del store (o helpers), luego emite:
    - `HOST_PUBLIC_STATE` (snapshot actualizado)
    - `HOST_PRIVATE` (rol/palabra por jugador cuando empieza la ronda)

**Snapshot público recomendado** (sin secretos):
- `phase`, `roundNumber`
- `players` (ids, names, isEliminated)
- `discussion: { secondsTotal, endsAt, running }` (reemplaza `secondsLeft` como fuente autoritativa)
- `vote: { eligibleIds, ... }` sin revelar impostor
- `elimination` (solo el resultado público)
- `gameOver` (incluye palabra e impostor cuando termina)

### 4) UI: crear/unirse y lobby online
**Objetivo**: UX clara para crear sala, copiar código, entrar al lobby y arrancar.

- **Actualizar**: `src/components/game/SetupScreen.tsx`
  - Selector `Local / Online`.
  - En “Online”:
    - Input nombre
    - Botón “Crear sala”
    - Input “Código (6 dígitos)” + botón “Unirse”

- **Nuevo**: `src/components/online/LobbyScreen.tsx`
  - Muestra:
    - Código de sala
    - Lista de jugadores conectados
    - Controles del host: categorías/dificultad/tiempos y botón “Empezar”
  - No-host: muestra “Esperando al host…”

- **Actualizar**: `src/pages/Home.tsx`
  - Si `mode === "online"` y `status !== "in_room"` → mostrar Setup online.
  - Si `mode === "online"` y `phase === "setup"` pero ya en sala → mostrar Lobby.
  - En fases posteriores reutiliza pantallas existentes con pequeños cambios:
    - `DealScreen`: en online no se “pasa el dispositivo”; es “tu rol” y botón “Listo”.
    - `VoteScreen`: cada jugador vota desde su dispositivo (una vez).

### 5) Reglas y edge cases (mínimos para una primera versión)
- Validar nombre no vacío y longitud máxima (p.ej. 20).
- No permitir más de N jugadores por sala (p.ej. 15, alineado a `setPlayerCount` actual).
- Manejar colisión/expiración de sala:
  - Sala se elimina si host desconecta.
  - Mensajes con `code` inexistente → `ERROR`.
- Reconexión:
  - V1: reconexión best-effort (si se corta, el usuario puede re-join con el código; se crea un nuevo `playerId`).
  - V2 (fuera de alcance): reconexión con token por jugador.

## Verification Steps
- Servidor:
  - Levantar `server/index.mjs` y verificar:
    - Crear sala devuelve `code` 6 dígitos + `hostKey`
    - Join actualiza roster
    - Host publica `PUBLIC_STATE` y llega a todos
    - `HOST_PRIVATE` llega solo al `playerId` destino
    - Al desconectar host se envía `ROOM_CLOSED`
- Frontend:
  - Flujos:
    - Crear sala → aparece código y roster
    - Unirse desde otro navegador → aparece en roster y recibe snapshot público
    - Iniciar partida → cada jugador recibe su rol/palabra de forma privada
    - Discusión basada en `endsAt` se mantiene sincronizada entre pestañas
    - Votación: cada jugador envía voto, host calcula y publica resultado

