import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { AlertCircle, Settings, User, Edit } from 'lucide-react'

interface Agent {
  id: string
  name: string
  role: string
  personality_id: string
  temperature_cap: number
  risk_bias: number
  default_model: string
  created_at?: string
  updated_at?: string
}

interface Personality {
  profile_id: string
  name: string
  description: string
  creativity: number
  analytical: number
  max_temperature: number
}

export default function AgentCustomizer() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState<Agent[]>([])
  const [personalities, setPersonalities] = useState<Personality[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAgents()
    loadPersonalities()
  }, [])

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      const data = await response.json()
      if (data.status === 'success') {
        setAgents(data.agents)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Failed to load agents')
    }
  }

  const loadPersonalities = async () => {
    try {
      const response = await fetch('/api/personalities')
      const data = await response.json()
      if (data.status === 'success') {
        setPersonalities(data.personalities)
      }
    } catch (err) {
      console.error('Failed to load personalities:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditAgent = (agentId: string) => {
    navigate(`/agents/${agentId}/edit`)
  }

  const getPersonalityName = (personalityId: string) => {
    const personality = personalities.find(p => p.profile_id === personalityId)
    return personality ? personality.name : personalityId
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading agent configurations...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Agent Customizer</h1>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>{agent.name}</span>
                </div>
                <Badge variant="outline">
                  {getPersonalityName(agent.personality_id)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">{agent.role}</div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Temperature Cap:</span>
                  <span className="font-medium">{agent.temperature_cap.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Risk Bias:</span>
                  <span className="font-medium">{agent.risk_bias.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Model:</span>
                  <span className="font-medium">{agent.default_model}</span>
                </div>
              </div>

              <Button 
                onClick={() => handleEditAgent(agent.id)}
                className="w-full"
              >
                <Edit className="h-4 w-4 mr-2" />
                Configure Agent
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}