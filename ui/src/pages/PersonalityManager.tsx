import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Brain, Settings, CheckCircle, Clock } from 'lucide-react';
import type { PersonalityProfile } from '@/types/personality';

interface Agent { 
  id: string; 
  name: string; 
  personality_id: string;
  status: string;
  last_updated: string;
  description: string;
}

interface PersonalitiesResponse {
  status: string;
  personalities: Record<string, string>;
  count: number;
}

export default function PersonalityManager() {
  const qc = useQueryClient();
  
  const { data: agents = [], isLoading: agentsLoading, error: agentsError } = useQuery<Agent[]>({ 
    queryKey: ['agents'], 
    queryFn: () => request<Agent[]>('/agents'),
    refetchInterval: 30000 // Refresh every 30 seconds
  });
  
  const { data: personalitiesData } = useQuery<PersonalitiesResponse>({ 
    queryKey: ['personalities'], 
    queryFn: () => request<PersonalitiesResponse>('/personalities') 
  });
  
  const mutation = useMutation({
    mutationFn: (payload: { agent_id: string; personality_id: string }) =>
      request(`/agents/${payload.agent_id}/personality`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personality_id: payload.personality_id }) 
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPersonalityDisplayName = (personalityId: string) => {
    if (!personalitiesData?.personalities) return personalityId;
    return personalitiesData.personalities[personalityId] || personalityId;
  };

  const availablePersonalities = personalitiesData?.personalities ? 
    Object.keys(personalitiesData.personalities) : [];

  if (agentsError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Failed to load agents</p>
        <p className="text-sm text-muted-foreground mt-2">
          {agentsError instanceof Error ? agentsError.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Personality Manager</h1>
          <p className="text-muted-foreground">
            Assign personality profiles to agents for behavioral consistency
          </p>
        </div>
        <Badge variant="outline">
          {agents.length} {agents.length === 1 ? 'Agent' : 'Agents'}
        </Badge>
      </div>

      {/* Agent Cards */}
      {agentsLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-10 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {agents.map(agent => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(agent.status)}>
                    {agent.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{agent.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Personality */}
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Current Personality:</span>
                  <Badge variant="outline">
                    {getPersonalityDisplayName(agent.personality_id)}
                  </Badge>
                </div>

                {/* Personality Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Assign Personality:
                  </label>
                  <div className="relative">
                    <select
                      value={agent.personality_id}
                      onChange={(e) => mutation.mutate({ 
                        agent_id: agent.id, 
                        personality_id: e.target.value 
                      })}
                      disabled={mutation.isPending}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {availablePersonalities.map(personalityId => (
                        <option key={personalityId} value={personalityId}>
                          {getPersonalityDisplayName(personalityId)}
                        </option>
                      ))}
                    </select>
                    {mutation.isPending && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Last Updated */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Last updated: {new Date(agent.last_updated).toLocaleString()}</span>
                </div>

                {/* Success Indicator */}
                {mutation.isSuccess && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Personality updated successfully</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Available Personalities Info */}
      {personalitiesData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Available Personalities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(personalitiesData.personalities).map(([id, name]) => (
                <div key={id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Brain className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground">{id}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {personalitiesData.count} personality profiles available for assignment
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}