# AI Super Agent System

A comprehensive modular AI agent system with React TypeScript frontend, featuring configurable personality profiles, enhanced MCP communication protocol, and scalable task processing.

## Architecture Overview

### Backend Components
- **Python Flask API**: RESTful endpoints for task submission and system management
- **Modular Agent System**: Coordinator and Research agents with distinct behavioral modes
- **Enhanced MCP Protocol**: Message Communication Protocol with simulation specs and progress tracking
- **Personality System**: 5 real-world personality profiles for behavioral consistency
- **Redis Queue Management**: Async message broker with memory fallback
- **LLM Integration**: OpenAI and Google Gemini API support

### Frontend Components
- **React TypeScript**: Modern UI with shadcn/ui components
- **TailwindCSS**: Utility-first styling with dark mode support
- **Vite Development**: Fast build tool with hot module replacement
- **Agent Interface**: Interactive task submission and personality selection
- **Real-time Status**: System monitoring and queue management

## Features

### Personality Profiles
- **Steve Jobs**: Visionary product design with attention to detail
- **Warren Buffett**: Long-term value investing and fundamental analysis
- **Rory Sutherland**: Behavioral psychology and creative advertising
- **Bill Gates**: Systematic problem-solving with technology focus
- **Elon Musk**: First-principles thinking for breakthrough innovation

### Enhanced MCP Protocol
- Simulation specifications for strategic analysis
- Risk assessment profiles (regulatory, competitive, technical)
- Progress tracking with quality scoring
- Task correlation and parent-child relationships

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Redis (optional, falls back to memory queue)

### Environment Setup
```bash
# API Keys (optional for enhanced functionality)
export OPENAI_API_KEY="your-openai-key"
export GEMINI_API_KEY="your-gemini-key"
export REDIS_URL="redis://localhost:6379"
```

### Backend (Python Flask)
```bash
# Start the agent system and API server
python main.py
# Server runs on http://localhost:5000
```

### Frontend (React TypeScript)
```bash
cd ui
npm install
npm run dev
# Development server runs on http://localhost:3000
```

## API Endpoints

### Core Endpoints
- `POST /api/task` - Submit tasks with personality selection
- `GET /api/status` - System status and queue information
- `GET /api/personalities` - Available personality profiles
- `GET /api/health` - Health check endpoint

### Task Submission Example
```json
{
  "instruction": "Design a revolutionary AI architecture",
  "personality_id": "ElonMusk",
  "context": {
    "entities": ["Neural Networks", "AGI"],
    "constraints": ["efficiency", "scalability"]
  },
  "parameters": {
    "temperature": 0.8,
    "max_tokens": 2000
  },
  "simulation_spec": {
    "players": ["Traditional AI", "AGI Breakthrough"],
    "strategies": {
      "Traditional AI": ["incremental_improvement"],
      "AGI Breakthrough": ["first_principles_redesign"]
    }
  }
}
```

## System Components

### Agent Architecture
```
Coordinator Agent
├── Task routing and management
├── Agent response coordination
└── Error handling and recovery

Research Agent
├── LLM-powered analysis
├── Personality-driven prompting
└── Structured result formatting
```

### Message Queue System
```
Redis Broker (Primary)
├── Persistent message storage
├── Cross-process communication
└── Scalable agent coordination

Memory Broker (Fallback)
├── In-memory queue management
├── Single-process operation
└── Development mode support
```

## Development

### Project Structure
```
ai_super_agent/
├── agents/          # Agent implementations
├── api.py          # Flask API routes
├── models/         # Data models and MCP protocol
├── personalities/  # Personality profile definitions
├── queue/          # Message broker implementations
└── config.py       # Configuration management

ui/
├── src/
│   ├── components/ # React components
│   ├── lib/        # Utility functions
│   └── App.tsx     # Main application
├── package.json    # Node.js dependencies
└── vite.config.ts  # Vite configuration
```

### Adding New Agents
1. Extend `BaseAgent` class in `ai_super_agent/agents/`
2. Implement `handle()` method for message processing
3. Register agent in coordinator routing logic
4. Update API documentation

### Adding Personality Profiles
1. Create JSON profile in `ai_super_agent/personalities/`
2. Define behavioral traits and communication style
3. Set temperature bounds and decision-making approach
4. Update frontend personality descriptions

## Configuration

### Backend Configuration
- Redis connection settings in `ai_super_agent/config.py`
- LLM provider selection (OpenAI/Gemini)
- Agent timeout and queue configurations
- Flask debug and security settings

### Frontend Configuration
- API proxy settings in `vite.config.ts`
- TailwindCSS theme customization
- Component styling with shadcn/ui
- Environment variables for API endpoints

## Deployment

### Production Considerations
- Configure Redis for persistent message storage
- Set production environment variables
- Enable HTTPS for secure API communication
- Implement rate limiting and authentication
- Monitor agent performance and queue metrics

### Scaling Options
- Horizontal agent scaling with Redis coordination
- Load balancing for Flask API endpoints
- CDN deployment for React frontend
- Container orchestration with Docker/Kubernetes

## Contributing

1. Follow existing code patterns and type annotations
2. Add comprehensive tests for new functionality
3. Update documentation for API changes
4. Ensure personality profiles maintain behavioral consistency
5. Test both Redis and memory queue implementations

## License

This project is designed for educational and research purposes, demonstrating advanced AI agent coordination and modern full-stack development practices.