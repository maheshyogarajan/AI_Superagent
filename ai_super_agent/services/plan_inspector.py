"""Plan Inspector service for analyzing tasks and generating execution plans."""
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime
from ai_super_agent.repos.plan_repository import PlanRepository, ExecutionPlan, PlanStep


class PlanInspector:
    """Service for creating and analyzing execution plans."""
    
    def __init__(self):
        self.plan_repo = PlanRepository()
        self.agent_capabilities = {
            "coordinator": {
                "skills": ["task_routing", "orchestration", "status_tracking"],
                "duration_estimate": 30  # seconds
            },
            "research": {
                "skills": ["market_analysis", "competitive_intelligence", "data_gathering", "report_generation"],
                "duration_estimate": 180  # seconds
            }
        }
    
    def analyze_instruction(self, instruction: str) -> Dict[str, Any]:
        """Analyze instruction to determine complexity and required agents."""
        keywords = instruction.lower()
        
        analysis = {
            "complexity": "medium",
            "required_agents": ["coordinator"],
            "estimated_steps": 1,
            "keywords_found": []
        }
        
        # Research keywords
        research_keywords = [
            "analyze", "research", "competitor", "market", "study", "investigate",
            "compare", "assessment", "intelligence", "analysis", "report"
        ]
        
        found_research_keywords = [kw for kw in research_keywords if kw in keywords]
        
        if found_research_keywords:
            analysis["required_agents"].append("research")
            analysis["estimated_steps"] += 1
            analysis["keywords_found"].extend(found_research_keywords)
            
            # Determine complexity based on keyword density
            if len(found_research_keywords) >= 3:
                analysis["complexity"] = "high"
                analysis["estimated_steps"] += 1
            elif len(found_research_keywords) >= 2:
                analysis["complexity"] = "medium"
        
        # Check for multi-step indicators
        multi_step_indicators = ["comprehensive", "detailed", "step-by-step", "thorough", "complete"]
        if any(indicator in keywords for indicator in multi_step_indicators):
            analysis["complexity"] = "high"
            analysis["estimated_steps"] += 1
        
        return analysis
    
    def create_execution_plan(self, instruction: str, task_id: Optional[str] = None) -> ExecutionPlan:
        """Create detailed execution plan from instruction."""
        if task_id is None:
            task_id = str(uuid.uuid4())
        
        plan_id = f"plan_{str(uuid.uuid4())[:8]}"
        analysis = self.analyze_instruction(instruction)
        
        steps = []
        total_duration = 0
        
        # Step 1: Coordinator analysis (always first)
        coordinator_step = PlanStep(
            step_id="coord_001",
            agent_id="coordinator",
            instruction="Analyze task requirements and determine optimal execution strategy",
            dependencies=[],
            estimated_duration=self.agent_capabilities["coordinator"]["duration_estimate"],
            parameters={
                "original_instruction": instruction,
                "complexity": analysis["complexity"],
                "required_agents": analysis["required_agents"]
            }
        )
        steps.append(coordinator_step)
        total_duration += coordinator_step.estimated_duration
        
        # Step 2: Agent routing (if research needed)
        if "research" in analysis["required_agents"]:
            routing_step = PlanStep(
                step_id="coord_002",
                agent_id="coordinator",
                instruction="Route task to research agent with context and parameters",
                dependencies=["coord_001"],
                estimated_duration=15,
                parameters={
                    "target_agent": "research",
                    "routing_reason": f"Keywords found: {', '.join(analysis['keywords_found'])}"
                }
            )
            steps.append(routing_step)
            total_duration += routing_step.estimated_duration
            
            # Step 3: Research execution
            research_step = PlanStep(
                step_id="research_001",
                agent_id="research",
                instruction=instruction,
                dependencies=["coord_002"],
                estimated_duration=self.agent_capabilities["research"]["duration_estimate"],
                parameters={
                    "research_type": "comprehensive" if analysis["complexity"] == "high" else "standard",
                    "keywords": analysis["keywords_found"]
                }
            )
            steps.append(research_step)
            total_duration += research_step.estimated_duration
            
            # Step 4: Results compilation (if complex)
            if analysis["complexity"] == "high":
                compilation_step = PlanStep(
                    step_id="coord_003",
                    agent_id="coordinator",
                    instruction="Compile and validate research results",
                    dependencies=["research_001"],
                    estimated_duration=30,
                    parameters={
                        "validation_required": True,
                        "output_format": "structured_report"
                    }
                )
                steps.append(compilation_step)
                total_duration += compilation_step.estimated_duration
        
        return ExecutionPlan(
            plan_id=plan_id,
            task_id=task_id,
            original_instruction=instruction,
            steps=steps,
            total_estimated_duration=total_duration,
            status="draft"
        )
    
    def get_plan_summary(self, plan: ExecutionPlan) -> Dict[str, Any]:
        """Generate summary information for a plan."""
        agent_counts = {}
        for step in plan.steps:
            agent_counts[step.agent_id] = agent_counts.get(step.agent_id, 0) + 1
        
        return {
            "plan_id": plan.plan_id,
            "task_id": plan.task_id,
            "total_steps": len(plan.steps),
            "agents_involved": list(agent_counts.keys()),
            "agent_step_counts": agent_counts,
            "estimated_duration_seconds": plan.total_estimated_duration,
            "estimated_duration_minutes": round(plan.total_estimated_duration / 60, 1),
            "complexity": self._determine_plan_complexity(plan),
            "status": plan.status
        }
    
    def _determine_plan_complexity(self, plan: ExecutionPlan) -> str:
        """Determine plan complexity based on steps and agents."""
        if len(plan.steps) >= 4:
            return "high"
        elif len(plan.steps) >= 3:
            return "medium"
        else:
            return "low"
    
    def modify_plan_step(self, plan_id: str, step_id: str, modifications: Dict[str, Any]) -> bool:
        """Modify a specific step in an execution plan."""
        plan = self.plan_repo.load_plan(plan_id)
        if not plan:
            return False
        
        for step in plan.steps:
            if step.step_id == step_id:
                if "instruction" in modifications:
                    step.instruction = modifications["instruction"]
                if "agent_id" in modifications:
                    step.agent_id = modifications["agent_id"]
                if "estimated_duration" in modifications:
                    step.estimated_duration = modifications["estimated_duration"]
                if "parameters" in modifications:
                    step.parameters = {**(step.parameters or {}), **modifications["parameters"]}
                
                # Recalculate total duration
                plan.total_estimated_duration = sum(
                    step.estimated_duration or 0 for step in plan.steps
                )
                
                return self.plan_repo.save_plan(plan)
        
        return False
    
    def approve_plan(self, plan_id: str) -> bool:
        """Approve a plan for execution."""
        return self.plan_repo.update_plan_status(plan_id, "approved")
    
    def get_execution_dag(self, plan: ExecutionPlan) -> Dict[str, Any]:
        """Generate directed acyclic graph representation of execution plan."""
        nodes = []
        edges = []
        
        for step in plan.steps:
            nodes.append({
                "id": step.step_id,
                "label": f"{step.agent_id}\n{step.instruction[:50]}...",
                "agent": step.agent_id,
                "duration": step.estimated_duration,
                "type": "agent_step"
            })
            
            for dependency in step.dependencies:
                edges.append({
                    "from": dependency,
                    "to": step.step_id,
                    "type": "dependency"
                })
        
        return {
            "nodes": nodes,
            "edges": edges,
            "layout": "hierarchical",
            "direction": "UD"  # Up-Down
        }