import { useKPIs } from '@/hooks/useKPIs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Users, Database, Brain, Zap, Shield } from 'lucide-react';

const getKPIIcon = (id: string) => {
  switch (id) {
    case 'total_queued':
    case 'coordinator_queue':
    case 'research_queue':
      return <Database className="h-4 w-4" />;
    case 'active_agents':
      return <Users className="h-4 w-4" />;
    case 'personalities':
      return <Brain className="h-4 w-4" />;
    case 'openai_status':
    case 'gemini_status':
      return <Zap className="h-4 w-4" />;
    case 'redis_status':
      return <Shield className="h-4 w-4" />;
    case 'system_health':
      return <Activity className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getStatusColor = (id: string, value: string) => {
  if (id.includes('status') || id === 'system_health') {
    if (value.toLowerCase().includes('ready') || value.toLowerCase().includes('operational')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    if (value.toLowerCase().includes('disabled') || value.toLowerCase().includes('fallback')) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
  return '';
};

export default function Dashboard() {
  const { data: kpis = [], isLoading, error, isRefetching } = useKPIs();

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Failed to load dashboard data</p>
        <p className="text-sm text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Super Agent Dashboard</h1>
          <p className="text-muted-foreground">Real-time system metrics and performance</p>
        </div>
        {isRefetching && (
          <Badge variant="outline" className="animate-pulse">
            Refreshing...
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {kpis.map(kpi => {
          const statusColor = getStatusColor(kpi.id, kpi.value);
          
          return (
            <Card key={kpi.id} className="shadow rounded-2xl hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.label}
                </CardTitle>
                {getKPIIcon(kpi.id)}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statusColor ? (
                    <Badge className={statusColor}>
                      {kpi.value}
                    </Badge>
                  ) : (
                    <div className="text-2xl font-bold">{kpi.value}</div>
                  )}
                  
                  {kpi.id === 'total_queued' && (
                    <p className="text-xs text-muted-foreground">
                      Tasks pending processing
                    </p>
                  )}
                  {kpi.id === 'active_agents' && (
                    <p className="text-xs text-muted-foreground">
                      Coordinator + Research agents
                    </p>
                  )}
                  {kpi.id === 'personalities' && (
                    <p className="text-xs text-muted-foreground">
                      Available personality profiles
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="text-sm font-medium mb-2">Dashboard Features</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Real-time data refresh every 30 seconds</li>
          <li>• Live queue depth monitoring</li>
          <li>• LLM provider status tracking</li>
          <li>• System health indicators</li>
          <li>• Personality profile availability</li>
        </ul>
      </div>
    </div>
  );
}