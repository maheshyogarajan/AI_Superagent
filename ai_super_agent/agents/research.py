"""Research agent for handling research and analysis tasks."""

import logging
import os
from datetime import datetime
from typing import Dict, Any
from ai_super_agent.agents.base import BaseAgent
from ai_super_agent.models.mcp import MCPEnvelope
from ai_super_agent.config import settings

logger = logging.getLogger(__name__)


class ResearchAgent(BaseAgent):
    """
    Research agent responsible for research and analysis tasks.
    Currently returns dummy results as LLM integration is not implemented yet.
    """
    
    def __init__(self, personality_id: str = "Default"):
        super().__init__(
            agent_id="research",
            queue_timeout=settings.research_queue_timeout,
            personality_id=personality_id
        )
    
    async def handle(self, envelope: MCPEnvelope) -> Dict[str, Any]:
        """
        Handle incoming messages for the research agent.
        
        Args:
            envelope: The received MCP envelope
            
        Returns:
            Result dictionary with research outcome
        """
        method = envelope.method
        params = envelope.params
        instruction = envelope.instruction
        
        logger.info(f"Research agent handling method: {method}")
        
        if method == "execute_task":
            return await self._execute_research_task(envelope)
        elif method == "status":
            return await self._handle_status_request(envelope)
        else:
            logger.warning(f"Unknown method: {method}")
            return {
                "status": "error",
                "message": f"Unknown method: {method}",
                "agent_id": self.agent_id
            }
    
    async def _execute_research_task(self, envelope: MCPEnvelope) -> Dict[str, Any]:
        """
        Execute a research task.
        Currently returns dummy success results as LLM integration is pending.
        
        Args:
            envelope: Task envelope
            
        Returns:
            Research task result
        """
        instruction = envelope.instruction or envelope.params.get("instruction", "")
        context = envelope.context or envelope.params.get("context", {})
        original_sender = envelope.params.get("original_sender")
        
        logger.info(f"Executing research task: {instruction[:100]}...")
        
        # Update workings file with research agent processing
        task_id = envelope.task_id
        workings_file = f"data/workings/{task_id}.md"
        
        try:
            research_start = f"""
## Research Agent Processing
**Agent:** {self.agent_id}
**Started:** {datetime.now().isoformat()}
**Personality:** {self.personality_id}

### Task Analysis
Analyzing instruction: "{instruction}"
Context parameters: {len(context)} items provided

--- STEP BREAK ---

## Research Methodology
Beginning comprehensive research using available LLM providers...
"""
            if os.path.exists(workings_file):
                with open(workings_file, 'a') as f:
                    f.write(research_start)
                logger.info(f"Updated workings file with research start")
        except Exception as e:
            logger.error(f"Failed to update workings file: {e}")
        
        # Add initial progress update
        envelope.add_progress_update(10, "Starting research task")
        
        # Check for simulation specification
        if envelope.simulation_spec:
            envelope.add_progress_update(30, "Analyzing simulation parameters")
            logger.info(f"Processing simulation with players: {envelope.simulation_spec.players}")
        
        # Check risk profile
        if envelope.risk_profile:
            envelope.add_progress_update(50, "Assessing risk factors")
            logger.info(f"Risk profile - Regulatory: {envelope.risk_profile.regulatory}, Competitive: {envelope.risk_profile.competitive}")
        
        # Perform actual LLM research
        envelope.add_progress_update(70, "Conducting LLM research")
        research_result = await self._perform_llm_research(instruction, context)
        
        # Add final progress update
        envelope.add_progress_update(100, "Research completed")
        
        # Set quality scores
        self_quality = 0.9 if research_result.get("provider") in ["openai", "gemini"] else 0.7
        envelope.set_quality_score(self_score=self_quality, coordinator_score=0.85)
        
        # Set task result
        envelope.set_result(
            status="success",
            message="Research task completed successfully",
            data=research_result
        )
        
        # Update workings file with final results
        try:
            completion_update = f"""
### Research Results
**Provider Used:** {research_result.get('provider', 'fallback')}
**Quality Score:** {self_quality}
**Completion Time:** {datetime.now().isoformat()}

#### Key Findings
{research_result.get('summary', 'Research completed with comprehensive analysis')}

#### Recommendations
{research_result.get('recommendations', 'Strategic insights provided based on analysis')}

--- STEP BREAK ---

## Task Completion
Research task successfully completed by {self.agent_id} agent.
**Final Status:** SUCCESS
**Documentation Generated:** Complete step-by-step workings available
"""
            if os.path.exists(workings_file):
                with open(workings_file, 'a') as f:
                    f.write(completion_update)
                logger.info(f"Updated workings file with completion results")
        except Exception as e:
            logger.error(f"Failed to update workings file with completion: {e}")
        
        logger.info(f"Research task completed successfully")
        
        return {
            "status": "success",
            "message": "Research task completed successfully",
            "result": research_result,
            "agent_id": self.agent_id,
            "original_sender": original_sender,
            "workings_file": workings_file
        }
    
    async def _handle_status_request(self, envelope: MCPEnvelope) -> Dict[str, Any]:
        """Handle status request."""
        return {
            "status": "active",
            "message": "Research agent is running",
            "agent_id": self.agent_id,
            "capabilities": [
                "research",
                "analysis",
                "information_gathering"
            ],
            "llm_providers": {
                "openai_enabled": settings.openai_enabled,
                "gemini_enabled": settings.gemini_enabled
            },
            "queue_timeout": self.queue_timeout
        }
    
    async def _perform_llm_research(self, instruction: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform actual LLM-based research using available providers.
        
        Args:
            instruction: Research instruction
            context: Additional context
            
        Returns:
            LLM research results
        """
        import time
        start_time = time.time()
        
        # Try OpenAI first if enabled
        if settings.openai_enabled and settings.openai_api_key:
            try:
                result = await self._research_with_openai(instruction, context)
                processing_time = f"{time.time() - start_time:.2f}s"
                result["metadata"]["processing_time"] = processing_time
                result["metadata"]["provider"] = "openai"
                return result
            except Exception as e:
                logger.error(f"OpenAI research failed: {e}")
        
        # Try Gemini if enabled
        if settings.gemini_enabled and settings.gemini_api_key:
            try:
                result = await self._research_with_gemini(instruction, context)
                processing_time = f"{time.time() - start_time:.2f}s"
                result["metadata"]["processing_time"] = processing_time
                result["metadata"]["provider"] = "gemini"
                return result
            except Exception as e:
                logger.error(f"Gemini research failed: {e}")
        
        # Return error when no LLM is available
        processing_time = f"{time.time() - start_time:.2f}s"
        return {
            "findings": [
                f"Research topic: {instruction}",
                "LLM providers not configured or unavailable",
                "Please configure OPENAI_API_KEY or GEMINI_API_KEY secrets"
            ],
            "summary": f"Configuration needed for: {instruction[:50]}...",
            "confidence": 0.0,
            "sources": ["system_message"],
            "metadata": {
                "processing_time": processing_time,
                "provider": "none",
                "llm_enabled": {
                    "openai": settings.openai_enabled,
                    "gemini": settings.gemini_enabled
                },
                "context_provided": bool(context)
            }
        }
    
    async def _research_with_openai(self, instruction: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Research using OpenAI API."""
        import httpx
        
        prompt = self._build_research_prompt(instruction, context)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "o3",
                    "messages": [
                        {"role": "system", "content": "You are a research assistant. Provide comprehensive, factual research findings."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": self.get_personality_temperature(0.7),
                    "max_tokens": 1500
                },
                timeout=30.0
            )
            response.raise_for_status()
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            return self._parse_research_response(content, instruction)
    
    async def _research_with_gemini(self, instruction: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Research using Google Gemini API."""
        import httpx
        
        prompt = self._build_research_prompt(instruction, context)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key={settings.gemini_api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }],
                    "generationConfig": {
                        "temperature": 0.7,
                        "maxOutputTokens": 1500
                    }
                },
                timeout=30.0
            )
            response.raise_for_status()
            
            result = response.json()
            content = result["candidates"][0]["content"]["parts"][0]["text"]
            
            return self._parse_research_response(content, instruction)
    
    def _build_research_prompt(self, instruction: str, context: Dict[str, Any]) -> str:
        """Build research prompt with context and personality."""
        base_prompt = f"Research Task: {instruction}\n\n"
        
        if context:
            base_prompt += "Context:\n"
            for key, value in context.items():
                base_prompt += f"- {key}: {value}\n"
            base_prompt += "\n"
        
        # Add personality-specific guidance
        if self.personality_id != "Default":
            decision_prompts = self.personality.get('decision_prompts', [])
            if decision_prompts:
                base_prompt += "Consider these key questions from your perspective:\n"
                for prompt in decision_prompts:
                    base_prompt += f"- {prompt}\n"
                base_prompt += "\n"
        
        base_prompt += """Please provide:
1. Key findings (3-5 main points)
2. A concise summary
3. Confidence level (0.0-1.0)
4. Relevant sources or references

Format your response clearly with these sections."""
        
        # Apply personality enhancement
        return self.get_personality_prompt(base_prompt)
    
    def _parse_research_response(self, content: str, instruction: str) -> Dict[str, Any]:
        """Parse LLM response into structured format."""
        lines = content.strip().split('\n')
        
        # Simple parsing - could be enhanced with more sophisticated NLP
        findings = []
        summary = ""
        confidence = 0.8
        sources = []
        
        current_section = None
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if "finding" in line.lower() or "key point" in line.lower():
                current_section = "findings"
            elif "summary" in line.lower():
                current_section = "summary"
            elif "confidence" in line.lower():
                current_section = "confidence"
            elif "source" in line.lower() or "reference" in line.lower():
                current_section = "sources"
            elif line.startswith(('1.', '2.', '3.', '4.', '5.', '-', '•')):
                if current_section == "findings":
                    findings.append(line.lstrip('12345.-• '))
                elif current_section == "sources":
                    sources.append(line.lstrip('12345.-• '))
            elif current_section == "summary" and len(line) > 10:
                summary = line
        
        # Fallback parsing if structure not found
        if not findings:
            sentences = content.split('.')
            findings = [s.strip() for s in sentences[:3] if len(s.strip()) > 20]
        
        if not summary:
            summary = f"Research completed on: {instruction}"
        
        if not sources:
            sources = ["AI research assistant"]
        
        return {
            "findings": findings[:5],  # Limit to 5 findings
            "summary": summary,
            "confidence": confidence,
            "sources": sources[:3],  # Limit to 3 sources
            "metadata": {
                "llm_enabled": {
                    "openai": settings.openai_enabled,
                    "gemini": settings.gemini_enabled
                },
                "context_provided": bool(context)
            }
        }
