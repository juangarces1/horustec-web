import * as signalR from '@microsoft/signalr';

export interface VisualizationPayload {
  nozzleCode: string;
  currentCash: number;
  tagId: string | null;
}

export class MonitoringHub {
  private connection: signalR.HubConnection | null = null;

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(process.env.NEXT_PUBLIC_SIGNALR_HUB_URL || 'http://localhost:5000/hubs/monitoring', {
        accessTokenFactory: () => {
          if (typeof window !== 'undefined') {
            return localStorage.getItem('token') || '';
          }
          return '';
        }
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    try {
      await this.connection.start();
      console.log('SignalR Connected');
    } catch (err) {
      console.error('SignalR Connection Error:', err);
      setTimeout(() => this.connect(), 5000);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      console.log('SignalR Disconnected');
    }
  }

  onStatusChanged(callback: (nozzleNumber: number, status: number, statusDescription: string) => void): void {
    this.connection?.on('StatusChanged', callback);
  }

  onVisualizationUpdated(callback: (payload: VisualizationPayload) => void): void {
    this.connection?.on('ReceiveVisualization', (data: VisualizationPayload | VisualizationPayload[]) => {
      const items = Array.isArray(data) ? data : [data];
      items.forEach((payload) => {
        console.log('[SignalR] ReceiveVisualization:', payload);
        callback(payload);
      });
    });
  }

  off(methodName: string): void {
    this.connection?.off(methodName);
  }
}

// Singleton instance
export const monitoringHub = new MonitoringHub();
