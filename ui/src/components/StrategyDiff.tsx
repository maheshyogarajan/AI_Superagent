import React, { useState, useEffect } from 'react';
import { CheckCircle, FileText, Upload, Loader2 } from 'lucide-react';
import MarkdownEditor from './MarkdownEditor';

interface StrategyDiffProps {
  planId: string;
  planStatus: string;
  className?: string;
}

export default function StrategyDiff({ planId, planStatus, className = "" }: StrategyDiffProps) {
  const [diffMd, setDiffMd] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionSuccess, setPromotionSuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (planStatus === 'completed') {
      generateStrategyDiff();
    }
  }, [planId, planStatus]);

  const generateStrategyDiff = async () => {
    setIsGenerating(true);
    try {
      // Generate strategy content based on plan execution
      const response = await fetch(`/api/plans/${planId}`);
      const plan = await response.json();
      
      // Fetch task results for this plan
      const tasksResponse = await fetch(`/api/tasks?plan_id=${planId}`);
      const tasksData = await tasksResponse.json();
      
      const strategicInsights = generateMarkdownFromPlan(plan, tasksData.tasks || []);
      setDiffMd(strategicInsights);
    } catch (error) {
      console.error('Failed to generate strategy diff:', error);
      // Provide a template if generation fails
      setDiffMd(generateDefaultTemplate(planId));
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMarkdownFromPlan = (plan: any, tasks: any[]) => {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const failedTasks = tasks.filter(t => t.status === 'failed');
    
    return `# Strategic Analysis: ${plan.instruction || 'Plan Execution'}

## Executive Summary
This plan executed ${tasks.length} total tasks with ${completedTasks.length} successful completions and ${failedTasks.length} failures.

## Key Outcomes
${completedTasks.map((task, index) => 
  `### ${index + 1}. ${task.agent_id} Agent Task
- **Instruction**: ${task.instruction}
- **Status**: ✅ Completed
- **Strategic Value**: [Add strategic insights here]`
).join('\n\n')}

## Lessons Learned
${failedTasks.length > 0 ? 
  `### Challenges Encountered\n${failedTasks.map(task => 
    `- **${task.agent_id}**: ${task.instruction} (Failed - requires review)`
  ).join('\n')}` : 
  '- All tasks completed successfully'
}

## Strategic Recommendations
1. **Process Optimization**: [Analyze workflow efficiency]
2. **Resource Allocation**: [Review agent performance and capabilities]
3. **Risk Mitigation**: [Identify potential failure points]
4. **Future Applications**: [Explore similar use cases]

## Implementation Notes
- Plan ID: \`${plan.id}\`
- Execution Date: ${new Date().toISOString().split('T')[0]}
- Total Tasks: ${tasks.length}
- Success Rate: ${tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%

## Next Steps
- [ ] Review and validate outcomes
- [ ] Document best practices
- [ ] Plan follow-up actions
- [ ] Share insights with stakeholders`;
  };

  const generateDefaultTemplate = (planId: string) => {
    return `# Strategic Analysis: Plan ${planId.slice(0, 8)}

## Executive Summary
[Summarize the key outcomes and strategic value of this plan execution]

## Key Insights
- [Insight 1]
- [Insight 2]  
- [Insight 3]

## Lessons Learned
[Document what worked well and what could be improved]

## Strategic Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

## Next Steps
- [ ] Action item 1
- [ ] Action item 2
- [ ] Action item 3`;
  };

  const saveStrategy = async (markdown: string) => {
    setIsPromoting(true);
    try {
      const response = await fetch('/strategy/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown: markdown,
          author: 'Plan Executor',
          plan_id: planId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to promote strategy');
      }

      setPromotionSuccess(true);
      setTimeout(() => setPromotionSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save strategy:', error);
      throw error;
    } finally {
      setIsPromoting(false);
    }
  };

  if (planStatus !== 'completed') {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 text-center ${className}`}>
        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">Strategy insights will be available once the plan is completed</p>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className={`bg-white rounded-lg border p-6 text-center ${className}`}>
        <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-spin" />
        <p className="text-gray-600">Generating strategic insights from plan execution...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold">Strategic Analysis</h3>
        </div>
        {promotionSuccess && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
            <Upload className="w-4 h-4" />
            Strategy promoted successfully!
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4 text-sm">
        <p className="text-blue-800">
          <strong>Plan completed successfully!</strong> Review and edit the strategic insights below, 
          then save to promote this analysis to your strategy repository.
        </p>
      </div>

      <MarkdownEditor
        value={diffMd}
        onSave={saveStrategy}
        placeholder="Enter strategic analysis and insights from this plan execution..."
        height="500px"
      />
      
      {isPromoting && (
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Promoting strategy document...
          </div>
        </div>
      )}
    </div>
  );
}