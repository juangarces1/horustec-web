import * as signalR from '@microsoft/signalr';

export class MonitoringHub {
  private connection: signalR.HubConnection | null = null;

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(process.env.NEXT_PUBLIC_SIGNALR_HUB_URL || 'http://localhost:5000/hubs/monitoring', {
        accessTokenFactory: () => {
          // Get token from localStorage
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
      setTimeout(() => this.connect(), 5000); // Retry after 5 seconds
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

  onVisualizationUpdated(callback: (nozzleNumber: number, currentValue: number) => void): void {
    this.connection?.on('VisualizationUpdated', callback);
  }

  off(methodName: string): void {
    this.connection?.off(methodName);
  }
}

// Singleton instance
export const monitoringHub = new MonitoringHub();
