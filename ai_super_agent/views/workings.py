"""Task workings endpoints for detailed execution trace viewing."""

import uuid
from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from typing import Dict, List, Any

workings_bp = Blueprint('workings', __name__)

# Mock task workings data for demonstration
SAMPLE_WORKINGS = {
    "sample-task-001": {
        "task_id": "sample-task-001",
        "agent": "Research Agent",
        "instruction": "Research the latest AI developments in 2024",
        "status": "completed",
        "created_at": "2025-06-21T12:23:48.972Z",
        "completed_at": "2025-06-21T12:25:15.432Z",
        "progress": 100,
        "steps": [
            {
                "step_id": "step-001",
                "timestamp": "2025-06-21T12:23:49.000Z",
                "action": "Task Analysis",
                "description": "Analyzing task requirements and determining research approach",
                "status": "completed",
                "output": "Identified key areas: LLM advances, multimodal AI, robotics integration",
                "duration": 15
            },
            {
                "step_id": "step-002", 
                "timestamp": "2025-06-21T12:24:04.000Z",
                "action": "Information Gathering",
                "description": "Collecting data from research papers and industry reports",
                "status": "completed",
                "output": "Retrieved 47 research papers, 23 industry reports, 15 blog posts",
                "duration": 45
            },
            {
                "step_id": "step-003",
                "timestamp": "2025-06-21T12:24:49.000Z", 
                "action": "Data Analysis",
                "description": "Processing and analyzing collected information",
                "status": "completed",
                "output": "Identified 8 major trends, 12 breakthrough technologies",
                "duration": 22
            },
            {
                "step_id": "step-004",
                "timestamp": "2025-06-21T12:25:11.000Z",
                "action": "Report Generation",
                "description": "Synthesizing findings into comprehensive report",
                "status": "completed", 
                "output": "Generated 2,847-word analysis with 15 key findings",
                "duration": 4
            }
        ],
        "result": {
            "summary": "2024 has seen significant advances in AI across multiple domains, with particular breakthroughs in large language models, multimodal AI systems, and practical robotics applications.",
            "key_findings": [
                "GPT-4 and Claude-3 represent major leaps in reasoning capabilities",
                "Multimodal models now handle text, images, and audio seamlessly",
                "AI-powered robotics achieved human-level dexterity in manufacturing",
                "Edge AI deployment increased by 300% in mobile devices",
                "AI safety research gained significant institutional support"
            ],
            "recommendations": [
                "Invest in multimodal AI capabilities for competitive advantage",
                "Develop robust AI governance frameworks before widespread deployment",
                "Focus on edge computing for real-time AI applications",
                "Establish partnerships with leading AI research institutions"
            ],
            "data_sources": [
                "Nature Machine Intelligence Journal",
                "IEEE Transactions on AI",
                "OpenAI Research Blog",
                "Google DeepMind Publications",
                "MIT Technology Review"
            ],
            "confidence_score": 0.92
        }
    }
}

@workings_bp.route('/tasks/<task_id>/workings')
def get_task_workings(task_id: str):
    """
    Get detailed workings for a specific task.
    
    Returns execution steps, progress, and results for task analysis.
    """
    try:
        # In a real implementation, this would query the database
        # For now, return sample data or generate realistic mock data
        
        if task_id in SAMPLE_WORKINGS:
            return jsonify(SAMPLE_WORKINGS[task_id])
            
        # Generate dynamic mock data for any task ID
        working = generate_mock_working(task_id)
        return jsonify(working)
        
    except Exception as e:
        return jsonify({
            "error": "Failed to retrieve task workings",
            "message": str(e),
            "task_id": task_id
        }), 500

@workings_bp.route('/tasks/<task_id>/workings/export')
def export_task_workings(task_id: str):
    """
    Export task workings as downloadable report.
    """
    try:
        if task_id in SAMPLE_WORKINGS:
            working = SAMPLE_WORKINGS[task_id]
        else:
            working = generate_mock_working(task_id)
            
        # Generate export data
        export_data = {
            "export_type": "task_workings",
            "generated_at": datetime.utcnow().isoformat(),
            "task_details": working,
            "metadata": {
                "total_steps": len(working["steps"]),
                "execution_time": calculate_execution_time(working),
                "agent_performance": calculate_agent_metrics(working)
            }
        }
        
        return jsonify(export_data)
        
    except Exception as e:
        return jsonify({
            "error": "Failed to export task workings",
            "message": str(e)
        }), 500

def generate_mock_working(task_id: str) -> Dict[str, Any]:
    """Generate realistic mock working data for any task ID."""
    
    # Determine agent and instruction based on recent activity
    agents = ["Coordinator Agent", "Research Agent"]
    instructions = [
        "Analyze competitive landscape for SaaS products",
        "Compare market strategies for tech startups", 
        "Generate strategic recommendations for Q1 2025",
        "Research blockchain adoption in financial services"
    ]
    
    # Use task_id hash to deterministically select agent and instruction
    agent_idx = hash(task_id) % len(agents)
    instr_idx = hash(task_id + "instr") % len(instructions)
    
    agent = agents[agent_idx]
    instruction = instructions[instr_idx]
    
    # Generate realistic timestamps
    created_time = datetime.utcnow() - timedelta(minutes=15)
    completed_time = datetime.utcnow() - timedelta(minutes=2)
    
    steps = [
        {
            "step_id": f"step-{i+1:03d}",
            "timestamp": (created_time + timedelta(minutes=i*3)).isoformat(),
            "action": action,
            "description": desc,
            "status": "completed",
            "output": output,
            "duration": duration
        }
        for i, (action, desc, output, duration) in enumerate([
            ("Task Initialization", "Setting up analysis framework", "Initialized task parameters and context", 8),
            ("Data Collection", "Gathering relevant information", "Retrieved 23 data sources, 156 data points", 180),
            ("Analysis Phase", "Processing collected data", "Identified 7 key patterns, 4 major insights", 95),
            ("Synthesis", "Generating conclusions and recommendations", "Produced comprehensive analysis report", 45)
        ])
    ]
    
    return {
        "task_id": task_id,
        "agent": agent,
        "instruction": instruction,
        "status": "completed",
        "created_at": created_time.isoformat(),
        "completed_at": completed_time.isoformat(),
        "progress": 100,
        "steps": steps,
        "result": {
            "summary": f"Analysis completed for {instruction.lower()} with comprehensive findings and actionable recommendations.",
            "key_findings": [
                "Market consolidation accelerating in target sector",
                "Customer acquisition costs trending upward",
                "Technology differentiation becoming critical",
                "Regulatory landscape evolving rapidly"
            ],
            "recommendations": [
                "Focus on proprietary technology development",
                "Diversify customer acquisition channels", 
                "Monitor regulatory changes closely",
                "Consider strategic partnerships"
            ],
            "data_sources": [
                "Industry Research Reports",
                "Public Financial Filings",
                "Expert Interviews",
                "Market Analysis Tools"
            ],
            "confidence_score": 0.87
        }
    }

def calculate_execution_time(working: Dict[str, Any]) -> str:
    """Calculate total execution time from workings data."""
    if not working.get("created_at") or not working.get("completed_at"):
        return "Unknown"
        
    try:
        start = datetime.fromisoformat(working["created_at"].replace('Z', '+00:00'))
        end = datetime.fromisoformat(working["completed_at"].replace('Z', '+00:00'))
        duration = end - start
        
        total_seconds = int(duration.total_seconds())
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        
        if minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"
            
    except Exception:
        return "Unknown"

def calculate_agent_metrics(working: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate performance metrics from workings data."""
    steps = working.get("steps", [])
    
    if not steps:
        return {}
        
    total_duration = sum(step.get("duration", 0) for step in steps)
    completed_steps = len([s for s in steps if s.get("status") == "completed"])
    
    return {
        "total_steps": len(steps),
        "completed_steps": completed_steps,
        "success_rate": round(completed_steps / len(steps) * 100, 1) if steps else 0,
        "total_duration": total_duration,
        "avg_step_duration": round(total_duration / len(steps), 1) if steps else 0
    }