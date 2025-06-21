import { createBrowserRouter } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { SimpleTaskRunner } from './pages/SimpleTaskRunner'
import WorkingsViewer from './pages/WorkingsViewer'
import AgentCustomizer from './pages/AgentCustomizer'

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
  }
])