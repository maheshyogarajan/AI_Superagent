import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { AlertCircle, Settings, User, Edit, Zap, Brain } from 'lucide-react'

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

  const modelOptions = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
    'gemini-pro',
    'gemini-1.5-flash'
  ]

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

        {/* Agent Configuration */}
        <div className="lg:col-span-2">
          {selectedAgent ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>Configure {selectedAgent.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                    <span>{success}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Agent Name</Label>
                      <Input
                        id="name"
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter agent name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={formData.role || ''}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        placeholder="Enter agent role"
                      />
                    </div>

                    <div>
                      <Label htmlFor="personality">Personality Profile</Label>
                      <Select
                        value={formData.personality_id || ''}
                        onValueChange={(value) => handleInputChange('personality_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select personality" />
                        </SelectTrigger>
                        <SelectContent>
                          {personalities.map((personality) => (
                            <SelectItem key={personality.profile_id} value={personality.profile_id}>
                              {personality.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="model">Default Model</Label>
                      <Select
                        value={formData.default_model || ''}
                        onValueChange={(value) => handleInputChange('default_model', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {modelOptions.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tuning Parameters */}
                  <div className="space-y-6">
                    <div>
                      <Label className="flex items-center space-x-2 mb-3">
                        <Zap className="h-4 w-4" />
                        <span>Temperature Cap: {formData.temperature_cap?.toFixed(2)}</span>
                      </Label>
                      <Slider
                        value={[formData.temperature_cap || 0.8]}
                        onValueChange={([value]) => handleInputChange('temperature_cap', value)}
                        max={1.0}
                        min={0.0}
                        step={0.01}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Conservative</span>
                        <span>Creative</span>
                      </div>
                    </div>

                    <div>
                      <Label className="flex items-center space-x-2 mb-3">
                        <Brain className="h-4 w-4" />
                        <span>Risk Bias: {formData.risk_bias?.toFixed(2)}</span>
                      </Label>
                      <Slider
                        value={[formData.risk_bias || 0.5]}
                        onValueChange={([value]) => handleInputChange('risk_bias', value)}
                        max={1.0}
                        min={0.0}
                        step={0.01}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Risk Averse</span>
                        <span>Risk Taking</span>
                      </div>
                    </div>

                    {/* Personality Preview */}
                    {formData.personality_id && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Personality Preview</h4>
                        {(() => {
                          const personality = personalities.find(p => p.profile_id === formData.personality_id)
                          if (!personality) return null
                          return (
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Creativity:</span>
                                <span>{personality.creativity.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Analytical:</span>
                                <span>{personality.analytical.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Max Temperature:</span>
                                <span>{personality.max_temperature.toFixed(2)}</span>
                              </div>
                              {personality.description && (
                                <p className="text-gray-600 mt-2">{personality.description}</p>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFormData(selectedAgent)
                      setError(null)
                      setSuccess(null)
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="min-w-[100px]"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an agent to configure its parameters</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}