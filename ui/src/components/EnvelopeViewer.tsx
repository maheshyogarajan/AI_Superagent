import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Target, Brain, TrendingUp } from 'lucide-react';
import type { Envelope, ProgressUpdate, TaskResult, QualityScore } from '@/types/mcp';

interface EnvelopeViewerProps {
  taskId?: string;
}

export function EnvelopeViewer({ taskId }: EnvelopeViewerProps) {
  const [envelope, setEnvelope] = useState<Envelope | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mockEnvelope: Envelope = {
    sender: "user_interface",
    recipient: "coordinator",
    timestamp: new Date().toISOString(),
    task_id: taskId || "c2f453e7-aa8a-4fd5-82fa-6245185b56e5",
    instruction: "Create a comprehensive marketing strategy for a new AI-powered productivity app targeting creative professionals",
    parameters: {
      temperature: 0.9,
      max_tokens: 3000
    },
    context: {
      entities: ["Creative Professionals", "Productivity Apps", "AI Tools", "Marketing Psychology"],
      constraints: ["behavioral insights", "unconventional approaches", "viral potential"],
      timeline: "6 months launch",
      target_market: "designers, writers, content creators"
    },
    simulation_spec: {
      players: ["Creative Professionals", "Traditional Tools", "AI Competitors", "Viral Adoption"],
      strategies: {
        "Creative Professionals": ["workflow_integration", "creative_enhancement", "time_saving"],
        "Traditional Tools": ["feature_parity", "price_competition", "brand_loyalty"],
        "AI Competitors": ["technical_superiority", "enterprise_focus", "platform_integration"],
        "Viral Adoption": ["social_proof", "network_effects", "word_of_mouth"]
      },
      solution_concept: "behavioral_marketing_breakthrough"
    },
    risk_profile: {
      regulatory: 0.2,
      competitive: 0.9,
      tech: 0.4
    },
    progress_updates: [
      {
        at: new Date(Date.now() - 300000).toISOString(),
        percent_complete: 25,
        status: "Initial analysis completed"
      },
      {
        at: new Date(Date.now() - 180000).toISOString(),
        percent_complete: 60,
        status: "Market research and competitive analysis"
      },
      {
        at: new Date(Date.now() - 60000).toISOString(),
        percent_complete: 85,
        status: "Strategy formulation and behavioral insights"
      }
    ],
    result: {
      status: "in_progress",
      data_output_ref: "marketing_strategy_v1.json"
    },
    quality_score: {
      self: 0.82,
      coordinator: 0.78
    },
    signature: "sha256:abc123def456..."
  };

  useEffect(() => {
    if (taskId) {
      // In a real implementation, fetch the actual envelope from the backend
      // For now, use the mock data to demonstrate the UI
      setEnvelope(mockEnvelope);
    }
  }, [taskId]);

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const renderProgressUpdates = (updates: ProgressUpdate[]) => {
    return (
      <div className="space-y-3">
        {updates.map((update, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {Math.round(update.percent_complete)}%
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{update.status}</p>
              <p className="text-xs text-muted-foreground">
                {formatTimestamp(update.at)}
              </p>
            </div>
            <div className="w-20">
              <div className="w-full bg-background rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${update.percent_complete}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRiskProfile = (riskProfile: Record<string, number>) => {
    return (
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(riskProfile).map(([key, value]) => (
          <div key={key} className="text-center p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium capitalize">{key}</p>
            <p className="text-lg font-bold mt-1">
              {Math.round(value * 100)}%
            </p>
            <div className="w-full bg-background rounded-full h-1 mt-2">
              <div 
                className={`h-1 rounded-full ${
                  value > 0.7 ? 'bg-red-500' : 
                  value > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${value * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!envelope) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            MCP Envelope Viewer
          </CardTitle>
          <CardDescription>
            No task selected. Submit a task to view its MCP envelope details.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          MCP Envelope Details
        </CardTitle>
        <CardDescription>
          Task ID: {envelope.task_id}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Sender:</span>
              <Badge variant="outline">{envelope.sender}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Recipient:</span>
              <Badge variant="outline">{envelope.recipient}</Badge>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Timestamp:</span>
              <span className="text-sm text-muted-foreground">
                {formatTimestamp(envelope.timestamp)}
              </span>
            </div>
            {envelope.result && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Status:</span>
                <Badge className={getStatusColor(envelope.result.status)}>
                  {envelope.result.status}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Instruction */}
        <div>
          <h4 className="text-sm font-medium mb-2">Instruction</h4>
          <p className="text-sm bg-muted p-3 rounded-lg">
            {envelope.instruction}
          </p>
        </div>

        {/* Parameters */}
        <div>
          <h4 className="text-sm font-medium mb-2">Parameters</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Temperature</p>
              <p className="text-lg font-mono">{envelope.parameters.temperature}</p>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Max Tokens</p>
              <p className="text-lg font-mono">{envelope.parameters.max_tokens}</p>
            </div>
          </div>
        </div>

        {/* Risk Profile */}
        {envelope.risk_profile && (
          <div>
            <h4 className="text-sm font-medium mb-2">Risk Assessment</h4>
            {renderRiskProfile(envelope.risk_profile)}
          </div>
        )}

        {/* Progress Updates */}
        {envelope.progress_updates && envelope.progress_updates.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Progress Updates</h4>
            {renderProgressUpdates(envelope.progress_updates)}
          </div>
        )}

        {/* Quality Score */}
        {envelope.quality_score && (
          <div>
            <h4 className="text-sm font-medium mb-2">Quality Assessment</h4>
            <div className="grid grid-cols-2 gap-3">
              {envelope.quality_score.self !== undefined && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Self Assessment</p>
                  <p className="text-lg font-bold">
                    {Math.round(envelope.quality_score.self * 100)}%
                  </p>
                </div>
              )}
              {envelope.quality_score.coordinator !== undefined && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Coordinator Assessment</p>
                  <p className="text-lg font-bold">
                    {Math.round(envelope.quality_score.coordinator * 100)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Simulation Spec */}
        {envelope.simulation_spec && (
          <div>
            <h4 className="text-sm font-medium mb-2">Simulation Configuration</h4>
            <div className="bg-muted p-3 rounded-lg">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(envelope.simulation_spec, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}