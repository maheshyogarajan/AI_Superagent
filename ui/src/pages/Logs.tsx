import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { ScrollText, Download, RefreshCw } from 'lucide-react'

interface LogEntry {
  timestamp: string
  level: string
  message: string
  agent?: string
}

export function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Simulate log entries since we don't have a real logs endpoint
        const simulatedLogs: LogEntry[] = [
          {
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'System initialized successfully',
            agent: 'system'
          },
          {
            timestamp: new Date(Date.now() - 60000).toISOString(),
            level: 'INFO',
            message: 'Coordinator agent started',
            agent: 'coordinator'
          },
          {
            timestamp: new Date(Date.now() - 120000).toISOString(),
            level: 'INFO',
            message: 'Research agent started',
            agent: 'research'
          },
          {
            timestamp: new Date(Date.now() - 180000).toISOString(),
            level: 'DEBUG',
            message: 'Memory broker initialized',
            agent: 'broker'
          }
        ]
        setLogs(simulatedLogs)
      } catch (error) {
        console.error('Failed to fetch logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
    
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getLevelBadgeVariant = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'destructive'
      case 'warn':
      case 'warning':
        return 'secondary'
      case 'info':
        return 'default'
      case 'debug':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const handleDownloadLogs = () => {
    const logContent = logs.map(log => 
      `[${log.timestamp}] ${log.level} ${log.agent ? `(${log.agent})` : ''}: ${log.message}`
    ).join('\n')
    
    const blob = new Blob([logContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ai-agent-logs-${new Date().toISOString().split('T')[0]}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">System Logs</h1>
            <p className="text-muted-foreground">
              Monitor agent system activity and debug information
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadLogs}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Logs
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <ScrollText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No logs available</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Badge variant={getLevelBadgeVariant(log.level)} className="mt-0.5">
                    {log.level}
                  </Badge>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      {log.agent && (
                        <Badge variant="outline" className="text-xs">
                          {log.agent}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm break-words">{log.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {logs.filter(log => log.level.toLowerCase() === 'info').length}
              </div>
              <div className="text-sm text-muted-foreground">Info Messages</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {logs.filter(log => log.level.toLowerCase() === 'warn' || log.level.toLowerCase() === 'warning').length}
              </div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {logs.filter(log => log.level.toLowerCase() === 'error').length}
              </div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}