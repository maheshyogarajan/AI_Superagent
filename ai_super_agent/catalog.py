"""Agent catalog with capability matrix for automatic agent assignment."""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass


@dataclass
class AgentCapability:
    """Agent capability definition."""
    agent_id: str
    name: str
    skills: List[str]
    task_types: List[str]
    complexity_level: int  # 1-5, higher means can handle more complex tasks
    estimated_duration: int  # base duration in seconds


# Agent capability matrix
AGENT_CATALOG = {
    "coordinator": AgentCapability(
        agent_id="coordinator",
        name="Task Coordinator",
        skills=["task_routing", "orchestration", "status_tracking", "delegation"],
        task_types=["coordination", "planning", "delegation", "status"],
        complexity_level=3,
        estimated_duration=30
    ),
    "research": AgentCapability(
        agent_id="research", 
        name="Research Specialist",
        skills=[
            "market_analysis", "competitive_intelligence", "data_gathering",
            "report_generation", "trend_analysis", "literature_review",
            "fact_checking", "data_synthesis"
        ],
        task_types=[
            "research", "analysis", "investigation", "assessment", 
            "evaluation", "comparison", "study", "review"
        ],
        complexity_level=4,
        estimated_duration=180
    ),
    "creative": AgentCapability(
        agent_id="creative",
        name="Creative Assistant", 
        skills=[
            "brainstorming", "ideation", "creative_writing", "design_thinking",
            "innovation", "storytelling", "content_creation"
        ],
        task_types=[
            "creative", "brainstorm", "design", "writing", "innovation",
            "ideation", "storytelling", "content"
        ],
        complexity_level=3,
        estimated_duration=120
    ),
    "planner": AgentCapability(
        agent_id="planner",
        name="Strategic Planner",
        skills=[
            "strategic_planning", "project_management", "timeline_creation",
            "resource_allocation", "risk_assessment", "goal_setting"
        ],
        task_types=[
            "planning", "strategy", "project", "timeline", "schedule",
            "roadmap", "goals", "objectives"
        ],
        complexity_level=4,
        estimated_duration=150
    )
}


def get_best_agent(task_type: str, complexity: int = 3) -> AgentCapability:
    """
    Get the best agent for a given task type and complexity.
    
    Args:
        task_type: Type of task to be performed
        complexity: Task complexity level (1-5)
        
    Returns:
        AgentCapability of the best matching agent
    """
    task_type_lower = task_type.lower()
    
    # Score each agent based on capability match
    agent_scores = {}
    
    for agent_id, capability in AGENT_CATALOG.items():
        score = 0
        
        # Direct task type match (highest priority)
        if any(t in task_type_lower for t in capability.task_types):
            score += 50
            
        # Skill keyword match
        skill_matches = sum(1 for skill in capability.skills 
                          if any(keyword in task_type_lower 
                                for keyword in skill.split('_')))
        score += skill_matches * 10
        
        # Complexity level match (prefer agents that can handle the complexity)
        if capability.complexity_level >= complexity:
            score += 20
        elif capability.complexity_level < complexity:
            score -= 10  # Penalize if agent can't handle complexity
            
        agent_scores[agent_id] = score
    
    # Get agent with highest score
    best_agent_id = max(agent_scores.keys(), key=lambda x: agent_scores[x])
    
    # Fallback to coordinator if no good match or score is too low
    if agent_scores[best_agent_id] < 20:
        best_agent_id = "coordinator"
    
    return AGENT_CATALOG[best_agent_id]


def decompose_instruction(instruction: str) -> List[Dict[str, Any]]:
    """
    Decompose user instruction into executable steps.
    
    Args:
        instruction: User's task instruction
        
    Returns:
        List of step dictionaries with type and details
    """
    instruction_lower = instruction.lower()
    steps = []
    
    # Research-heavy keywords
    research_keywords = [
        "research", "analyze", "study", "investigate", "examine",
        "competitor", "market", "trend", "assessment", "evaluation",
        "compare", "comparison", "intelligence", "data", "report"
    ]
    
    # Creative keywords  
    creative_keywords = [
        "brainstorm", "create", "design", "innovative", "creative",
        "ideate", "generate", "invent", "imagine", "storytelling"
    ]
    
    # Planning keywords
    planning_keywords = [
        "plan", "strategy", "roadmap", "timeline", "schedule",
        "project", "goals", "objectives", "organize"
    ]
    
    # Determine primary task type and complexity
    has_research = any(kw in instruction_lower for kw in research_keywords)
    has_creative = any(kw in instruction_lower for kw in creative_keywords)
    has_planning = any(kw in instruction_lower for kw in planning_keywords)
    
    # Estimate complexity based on instruction length and keywords
    complexity = 2  # base complexity
    if len(instruction.split()) > 10:
        complexity += 1
    if has_research and (has_creative or has_planning):
        complexity += 1
    if "comprehensive" in instruction_lower or "detailed" in instruction_lower:
        complexity += 1
    
    complexity = min(complexity, 5)  # cap at 5
    
    # Always start with coordination step
    steps.append({
        "step_id": f"step_001",
        "type": "coordination", 
        "instruction": f"Coordinate and analyze task: {instruction}",
        "complexity": complexity,
        "dependencies": [],
        "parameters": {"original_instruction": instruction}
    })
    
    # Add specialized steps based on content
    step_num = 2
    
    if has_research:
        steps.append({
            "step_id": f"step_{step_num:03d}",
            "type": "research",
            "instruction": f"Research and analyze: {instruction}",
            "complexity": complexity,
            "dependencies": ["step_001"],
            "parameters": {"research_type": "comprehensive"}
        })
        step_num += 1
    
    if has_creative:
        steps.append({
            "step_id": f"step_{step_num:03d}", 
            "type": "creative",
            "instruction": f"Generate creative solutions for: {instruction}",
            "complexity": complexity,
            "dependencies": ["step_001"],
            "parameters": {"creative_approach": "innovative"}
        })
        step_num += 1
        
    if has_planning:
        deps = [f"step_{i:03d}" for i in range(1, step_num)]
        steps.append({
            "step_id": f"step_{step_num:03d}",
            "type": "planning", 
            "instruction": f"Create strategic plan for: {instruction}",
            "complexity": complexity,
            "dependencies": deps,
            "parameters": {"planning_horizon": "medium_term"}
        })
    
    return steps