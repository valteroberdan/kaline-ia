export type WebSocketCallback = (data: any) => void;

export class MonitorWebSocketClient {
  private socket: WebSocket | null = null;
  private caseId: number | null = null;
  private callbacks: Set<WebSocketCallback> = new Set();
  private reconnectTimeout: any = null;

  connect(caseId: number) {
    if (this.socket && this.caseId === caseId) {
      return;
    }

    this.disconnect();
    this.caseId = caseId;

    const isFileProtocol = window.location.protocol === 'file:';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = isFileProtocol
      ? `ws://127.0.0.1:8090/ws/monitor/${caseId}`
      : `${protocol}//${host}/ws/monitor/${caseId}`;


    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log(`[WebSocket] Conectado ao caso ${caseId}`);
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.callbacks.forEach((cb) => cb(parsed));
        } catch (e) {
          console.error('[WebSocket] Erro ao processar mensagem JSON:', e);
        }
      };

      this.socket.onerror = (err) => {
        console.error('[WebSocket] Erro na conexão:', err);
      };

      this.socket.onclose = () => {
        console.log('[WebSocket] Conexão encerrada.');
      };
    } catch (err) {
      console.error('[WebSocket] Falha ao instanciar WebSocket:', err);
    }
  }

  subscribe(callback: WebSocketCallback) {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  sendCommand(command: { action: string; [key: string]: any }) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(command));
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.caseId = null;
  }
}

export const wsClient = new MonitorWebSocketClient();
