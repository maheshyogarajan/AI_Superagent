import { createBrowserRouter } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { SimpleTaskRunner } from './pages/SimpleTaskRunner'
import WorkingsViewer from './pages/WorkingsViewer'
import AgentCustomizer from './pages/AgentCustomizer'
import AgentEditor from './pages/AgentEditor'
import { PlanInspector } from './pages/PlanInspector'
import Logs from './pages/Logs'
import StrategyViewer from './pages/StrategyViewer'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />
  },
  {
    path: '/task-runner',
    element: <SimpleTaskRunner />
  },
  {
    path: '/workings/:taskId',
    element: <WorkingsViewer />
  },
  {
    path: '/agent-customizer',
    element: <AgentCustomizer />
  },
  {
    path: '/agents/:agentId/edit',
    element: <AgentEditor />
  },
  {
    path: '/plan-inspector',
    element: <PlanInspector />
  },
  {
    path: '/logs',
    element: <Logs />
  },
  {
    path: '/strategies',
    element: <StrategyViewer />
  }
])