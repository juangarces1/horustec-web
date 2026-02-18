'use client';

import { useState, useEffect } from 'react';
import { monitoringHub } from '@/lib/signalr/monitoring-hub';
import * as signalR from '@microsoft/signalr';

export type ConnectionStatus = 'Connected' | 'Connecting' | 'Disconnected' | 'Reconnecting';

export function useSignalRStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>('Disconnected');

  useEffect(() => {
    const checkConnection = () => {
      // Access the private connection property through the instance
      const connection = (monitoringHub as any).connection as signalR.HubConnection | null;

      if (!connection) {
        setStatus('Disconnected');
        return;
      }

      switch (connection.state) {
        case signalR.HubConnectionState.Connected:
          setStatus('Connected');
          break;
        case signalR.HubConnectionState.Connecting:
          setStatus('Connecting');
          break;
        case signalR.HubConnectionState.Reconnecting:
          setStatus('Reconnecting');
          break;
        case signalR.HubConnectionState.Disconnected:
          setStatus('Disconnected');
          break;
        default:
          setStatus('Disconnected');
      }
    };

    // Check immediately
    checkConnection();

    // Check every 2 seconds
    const interval = setInterval(checkConnection, 2000);

    return () => clearInterval(interval);
  }, []);

  return status;
}
