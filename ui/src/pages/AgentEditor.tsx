import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { AlertCircle, CheckCircle, Settings, ArrowLeft, Save } from 'lucide-react'

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

export default function AgentEditor() {
  const { agentId } = useParams<{ agentId: string }>()
  const navigate = useNavigate()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [personalities, setPersonalities] = useState<Personality[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<Agent>>({})

  useEffect(() => {
    if (agentId) {
      loadAgent(agentId)
      loadPersonalities()
    } else {
      navigate('/agent-customizer')
    }
  }, [agentId, navigate])

  const loadAgent = async (id: string) => {
    try {
      const response = await fetch(`/api/agents/${id}/config`)
      const data = await response.json()
      if (data.status === 'success') {
        setAgent(data.agent)
        setFormData(data.agent)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Failed to load agent configuration')
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

  const handleInputChange = (field: keyof Agent, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!agent || !agentId) return

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/agents/${agentId}/config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (data.status === 'success') {
        setSuccess('Agent configuration updated successfully')
        setAgent(data.agent)
        setFormData(data.agent)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Failed to save agent configuration')
    } finally {
      setIsSaving(false)
    }
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
        <div className="text-lg">Loading agent configuration...</div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg">Agent not found</p>
          <Button onClick={() => navigate('/agent-customizer')} className="mt-4">
            Back to Agent List
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/agent-customizer')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Settings className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Configure {agent.name}</h1>
        </div>
        <Badge variant="outline">{getPersonalityName(agent.personality_id)}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Configuration</CardTitle>
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
                <label className="block text-sm font-medium mb-2">Agent Name</label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter agent name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <Input
                  value={formData.role || ''}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  placeholder="Enter agent role"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Personality Profile</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.personality_id || ''}
                  onChange={(e) => handleInputChange('personality_id', e.target.value)}
                >
                  <option value="">Select personality</option>
                  {personalities.map((personality) => (
                    <option key={personality.profile_id} value={personality.profile_id}>
                      {personality.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Default Model</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.default_model || ''}
                  onChange={(e) => handleInputChange('default_model', e.target.value)}
                >
                  <option value="">Select model</option>
                  {modelOptions.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tuning Parameters */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Temperature Cap: {formData.temperature_cap?.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={formData.temperature_cap || 0.8}
                  onChange={(e) => handleInputChange('temperature_cap', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Conservative</span>
                  <span>Creative</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Risk Bias: {formData.risk_bias?.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={formData.risk_bias || 0.5}
                  onChange={(e) => handleInputChange('risk_bias', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
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
                setFormData(agent)
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
              {isSaving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}