import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, type TaskSubmission as TaskSubmissionType } from '@/lib/api';
import { Send, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TaskSubmissionProps {
  selectedPersonality: string;
  onTaskSubmitted: (taskId: string) => void;
}

export function TaskSubmission({ selectedPersonality, onTaskSubmitted }: TaskSubmissionProps) {
  const [instruction, setInstruction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ taskId: string; timestamp: Date } | null>(null);

  const submitTask = async () => {
    if (!instruction.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const taskData: TaskSubmissionType = {
        instruction: instruction.trim(),
        personality_id: selectedPersonality,
        context: {
          timestamp: new Date().toISOString(),
          interface: 'react_frontend',
          user_agent: navigator.userAgent,
          personality_selected: selectedPersonality
        },
        parameters: {
          temperature: getPersonalityTemperature(selectedPersonality),
          max_tokens: 2500
        },
        simulation_spec: {
          players: ['Primary Agent', 'Research Agent', 'Quality Assessor'],
          strategies: {
            'Primary Agent': ['comprehensive_analysis', 'personality_consistency'],
            'Research Agent': ['data_gathering', 'fact_verification'],
            'Quality Assessor': ['output_validation', 'coherence_check']
          },
          solution_concept: 'multi_agent_coordination'
        },
        risk_profile: {
          regulatory: 0.2,
          competitive: 0.6,
          tech: 0.5
        }
      };

      const result = await api.submitTask(taskData);
      
      if (result.status === 'success') {
        setLastResult({
          taskId: result.task_id,
          timestamp: new Date()
        });
        setInstruction('');
        onTaskSubmitted(result.task_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPersonalityTemperature = (personalityId: string): number => {
    const temperatures: Record<string, number> = {
      'SteveJobs': 0.8,     // Creative but focused
      'WarrenBuffett': 0.3,  // Conservative and methodical
      'RorySutherland': 0.9, // Highly creative and unconventional
      'BillGates': 0.5,     // Balanced analytical approach
      'ElonMusk': 0.9,      // High creativity for breakthrough thinking
      'Default': 0.7        // Balanced default
    };
    return temperatures[personalityId] || 0.7;
  };

  const getExamplePrompts = (personalityId: string): string[] => {
    const examples: Record<string, string[]> = {
      'SteveJobs': [
        'Design a revolutionary user interface for AR glasses that feels magical and intuitive',
        'Create a product strategy for the next breakthrough in personal computing',
        'Analyze what makes a technology product truly elegant and user-friendly'
      ],
      'WarrenBuffett': [
        'Evaluate the long-term investment potential of renewable energy companies',
        'Analyze the fundamental business metrics of a technology company',
        'Assess the competitive moat and value proposition of a new market leader'
      ],
      'RorySutherland': [
        'Design a marketing campaign that leverages behavioral psychology principles',
        'Explain why humans make irrational decisions and how to influence them positively',
        'Create an advertising strategy that changes consumer behavior through subtle nudges'
      ],
      'BillGates': [
        'Develop a systematic approach to solving global health challenges with technology',
        'Create a philanthropic strategy for education reform in developing countries',
        'Analyze how technology can address climate change through systematic innovation'
      ],
      'ElonMusk': [
        'Design a sustainable transportation system for Mars colonization',
        'Reimagine energy storage from first principles for grid-scale applications',
        'Create a manufacturing process that achieves 10x cost reduction through automation'
      ]
    };
    return examples[personalityId] || [
      'Analyze current market trends and provide strategic recommendations',
      'Evaluate emerging technologies and their potential impact',
      'Create a comprehensive plan for business innovation'
    ];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Task Submission
        </CardTitle>
        <CardDescription>
          Submit tasks to the AI agent system using {selectedPersonality} personality approach
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Task Instruction</label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Describe the task you want the AI agents to perform..."
            className="w-full min-h-[120px] p-3 border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <p className="text-xs text-muted-foreground">
            Temperature: {getPersonalityTemperature(selectedPersonality)} • Max tokens: 2500
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {lastResult && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-950/20 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-green-700 dark:text-green-300 font-medium">Task submitted successfully</p>
              <p className="text-green-600 dark:text-green-400 text-xs">
                ID: {lastResult.taskId} • {lastResult.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}

        <Button
          onClick={submitTask}
          disabled={!instruction.trim() || isSubmitting}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Submitting Task...' : 'Submit Task'}
        </Button>

        <div className="space-y-2">
          <label className="text-sm font-medium">Example prompts for {selectedPersonality}:</label>
          <div className="space-y-2">
            {getExamplePrompts(selectedPersonality).map((example, index) => (
              <button
                key={index}
                onClick={() => setInstruction(example)}
                className="w-full p-2 text-left text-xs bg-muted hover:bg-accent rounded border border-border transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}