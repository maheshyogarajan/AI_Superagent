import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Activity, Users, Database, Brain } from 'lucide-react'

interface KPI {
  id: string
  label: string
  value: string
}

export function Dashboard() {
  const [kpis, setKpis] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const response = await fetch('/api/kpi')
        const data = await response.json()
        setKpis(data.kpis || [])
      } catch (error) {
        console.error('Failed to fetch KPIs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchKPIs()
    const interval = setInterval(fetchKPIs, 5000)
    return () => clearInterval(interval)
  }, [])

  const getKPIIcon = (id: string) => {
    switch (id) {
      case 'active_agents':
      case 'personalities':
        return <Users className="h-4 w-4" />
      case 'redis_status':
        return <Database className="h-4 w-4" />
      case 'system_health':
        return <Activity className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const getStatusVariant = (value: string) => {
    if (value.toLowerCase().includes('operational') || value.toLowerCase().includes('ready') || value.toLowerCase().includes('connected')) {
      return 'default'
    }
    if (value.toLowerCase().includes('error') || value.toLowerCase().includes('failed')) {
      return 'destructive'
    }
    return 'secondary'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Super Agent Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor system performance and agent coordination
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpis.map((kpi) => (
            <Card key={kpi.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.label}
                </CardTitle>
                {getKPIIcon(kpi.id)}
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusVariant(kpi.value)}>
                    {kpi.value}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}