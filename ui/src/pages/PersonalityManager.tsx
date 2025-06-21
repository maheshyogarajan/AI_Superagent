import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { User, Brain, Zap } from 'lucide-react'

interface Personality {
  id: string
  name: string
  description?: string
}

interface Agent {
  id: string
  name: string
  current_personality: string
}

export function PersonalityManager() {
  const [personalities, setPersonalities] = useState<Personality[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [personalitiesResponse, agentsResponse] = await Promise.all([
          fetch('/api/personalities'),
          fetch('/api/status')
        ])

        const personalitiesData = await personalitiesResponse.json()
        const agentsData = await agentsResponse.json()

        setPersonalities(Object.entries(personalitiesData.personalities || {}).map(([id, name]) => ({
          id,
          name: name as string
        })))

        setAgents(agentsData.agents?.map((agent: string) => ({
          id: agent,
          name: agent.charAt(0).toUpperCase() + agent.slice(1),
          current_personality: 'Default'
        })) || [])
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handlePersonalityChange = async (agentId: string, personalityId: string) => {
    try {
      const response = await fetch('/api/personality/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          personality_id: personalityId
        })
      })

      if (response.ok) {
        setAgents(prev => 
          prev.map(agent => 
            agent.id === agentId 
              ? { ...agent, current_personality: personalityId }
              : agent
          )
        )
      }
    } catch (error) {
      console.error('Failed to assign personality:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Personality Manager</h1>
          <p className="text-muted-foreground">Configure agent personalities and behavior</p>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
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
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Personality Manager</h1>
        <p className="text-muted-foreground">
          Configure agent personalities and behavior patterns
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Personalities */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Personalities</h2>
          <div className="space-y-4">
            {personalities.map((personality) => (
              <Card key={personality.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    {personality.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {personality.description || `${personality.name} personality profile with specific behavioral patterns and decision-making approaches.`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Agent Assignments */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Agent Assignments</h2>
          <div className="space-y-4">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {agent.name} Agent
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Personality:</span>
                    <Badge>{agent.current_personality}</Badge>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Assign Personality
                    </label>
                    <Select 
                      value={agent.current_personality}
                      onValueChange={(value) => handlePersonalityChange(agent.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {personalities.map((personality) => (
                          <SelectItem key={personality.id} value={personality.id}>
                            {personality.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handlePersonalityChange(agent.id, agent.current_personality)}
                    className="w-full"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Apply Changes
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}