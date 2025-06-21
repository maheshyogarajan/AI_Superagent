import { useQuery } from '@tanstack/react-query';
import { request } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';

interface KPI { 
  id: string; 
  label: string; 
  value: string; 
}

export default function Dashboard() {
  const { data = [] } = useQuery<KPI[]>({
    queryKey: ['kpis'],
    queryFn: () => request<KPI[]>('/kpis'),
    refetchInterval: 30_000, // live refresh every 30 s
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {data.map(kpi => (
        <Card key={kpi.id} className="shadow rounded-2xl">
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-muted-foreground">{kpi.label}</p>
            <p className="text-3xl font-bold">{kpi.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}