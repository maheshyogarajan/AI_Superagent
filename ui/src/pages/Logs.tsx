import { useQuery } from '@tanstack/react-query';
import { request } from '@/lib/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, MessageSquare, Activity, X } from 'lucide-react';
import type { Envelope } from '@/types/mcp';

interface LogsResponse {
  logs: Envelope[];
  metadata: {
    total_logs: number;
    returned_count: number;
    offset: number;
    limit: number;
    has_more: boolean;
  };
}

export default function Logs() {
  const { data, isLoading, error } = useQuery<LogsResponse>({
    queryKey: ['logs'],
    queryFn: () => request<LogsResponse>('/logs?limit=200'),
    refetchInterval: 10_000,
  });
  
  const [selected, setSelected] = useState<Envelope | null>(null);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing':
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSenderIcon = (sender: string) => {
    switch (sender) {
      case 'user_interface':
        return <User className="h-4 w-4" />;
      case 'coordinator':
        return <Activity className="h-4 w-4" />;
      case 'research':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Failed to load envelope logs</p>
        <p className="text-sm text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  const logs = data?.logs || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MCP Envelope Logs</h1>
          <p className="text-muted-foreground">
            {data?.metadata ? `${data.metadata.total_logs} total envelopes` : 'Loading envelope history...'}
          </p>
        </div>
        {data?.metadata?.has_more && (
          <Badge variant="outline">
            Showing {data.metadata.returned_count} of {data.metadata.total_logs}
          </Badge>
        )}
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Envelope Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-4 bg-muted rounded flex-1"></div>
                  <div className="h-4 bg-muted rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No envelope logs available
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Sender</th>
                    <th className="pb-3 font-medium">Task</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map(row => (
                    <tr 
                      key={row.signature || row.task_id} 
                      className="hover:bg-muted/30 cursor-pointer transition-colors" 
                      onClick={() => setSelected(row)}
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {new Date(row.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {getSenderIcon(row.sender)}
                          <span className="capitalize">{row.sender.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="py-3 max-w-md">
                        <p className="truncate">{row.instruction}</p>
                      </td>
                      <td className="py-3">
                        <Badge className={getStatusColor(row.result?.status || 'pending')}>
                          {row.result?.status || 'pending'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Envelope Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50">
          <div 
            className="fixed inset-0 bg-black/80" 
            onClick={() => setSelected(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[80vh] flex-col rounded-t-[10px] border bg-background">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">MCP Envelope Details</h3>
              <button
                onClick={() => setSelected(null)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                {/* Quick Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Task ID</p>
                    <p className="text-muted-foreground font-mono">{selected.task_id}</p>
                  </div>
                  <div>
                    <p className="font-medium">Timestamp</p>
                    <p className="text-muted-foreground">{new Date(selected.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Sender</p>
                    <p className="text-muted-foreground capitalize">{selected.sender.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="font-medium">Recipient</p>
                    <p className="text-muted-foreground capitalize">{selected.recipient}</p>
                  </div>
                </div>

                {/* Instruction */}
                <div>
                  <p className="font-medium mb-2">Instruction</p>
                  <p className="text-sm bg-muted p-3 rounded">{selected.instruction}</p>
                </div>

                {/* Raw JSON */}
                <div>
                  <p className="font-medium mb-2">Full Envelope (JSON)</p>
                  <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-64">
                    {JSON.stringify(selected, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}