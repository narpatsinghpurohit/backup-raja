import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface LogEntry {
  id: number;
  level: string;
  message: string;
  created_at: string;
}

interface Props {
  operationId: number;
  operationType: 'backup' | 'restore';
  initialLogs?: LogEntry[];
}

export default function TerminalLog({ operationId, operationType, initialLogs = [] }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [status, setStatus] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const pollLogs = async () => {
    const lastLogId = logs.length > 0 ? logs[logs.length - 1].id : 0;
    const endpoint = operationType === 'backup' 
      ? `/api/backups/${operationId}/logs`
      : `/api/restores/${operationId}/logs`;

    try {
      const response = await fetch(`${endpoint}?since_id=${lastLogId}`);
      const data = await response.json();

      if (data.logs && data.logs.length > 0) {
        setLogs((prev) => [...prev, ...data.logs]);
      }

      setStatus(data.status);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await pollLogs();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    // Poll every 10 seconds
    const interval = setInterval(pollLogs, 10000);
    
    // Initial poll
    pollLogs();

    return () => clearInterval(interval);
  }, [operationId, operationType, logs]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-green-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Operation Logs</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-normal text-muted-foreground">Status: {status}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={logContainerRef}
          className="h-96 overflow-y-auto rounded-md bg-black p-4 font-mono text-sm"
        >
          {logs.map((log) => (
            <div key={log.id} className="mb-1">
              <span className="text-gray-500">
                [{new Date(log.created_at).toLocaleTimeString()}]
              </span>{' '}
              <span className={getLevelColor(log.level)}>[{log.level.toUpperCase()}]</span>{' '}
              <span className="text-gray-300">{log.message}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-gray-500">Waiting for logs...</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
