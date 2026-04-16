export type WsClientMessage = Record<string, unknown> & { type: string }

type WsClientParams = {
  url: string
  onMessage: (msg: WsClientMessage) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: () => void
}

export function createWsClient(params: WsClientParams) {
  let ws: WebSocket | null = null
  let pending: WsClientMessage[] = []

  function closeCurrent() {
    pending = []
    if (!ws) return
    const current = ws
    ws = null
    try {
      current.close()
    } catch (err) {
      void err
    }
  }

  function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

    ws = new WebSocket(params.url)

    ws.addEventListener("open", () => {
      params.onOpen?.()
      for (const msg of pending) ws?.send(JSON.stringify(msg))
      pending = []
    })

    ws.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as WsClientMessage
        if (!msg || typeof msg.type !== "string") return
        params.onMessage(msg)
      } catch (err) {
        void err
      }
    })

    ws.addEventListener("close", () => {
      params.onClose?.()
    })

    ws.addEventListener("error", () => {
      params.onError?.()
    })
  }

  function send(message: WsClientMessage) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
      return
    }
    pending = [...pending, message]
    connect()
  }

  function disconnect() {
    closeCurrent()
  }

  return {
    connect,
    send,
    disconnect,
    get readyState() {
      return ws?.readyState ?? WebSocket.CLOSED
    },
  }
}
