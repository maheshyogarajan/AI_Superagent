import { createBrowserRouter } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { TaskRunner } from './pages/TaskRunner'
import { StrategyViewer } from './pages/StrategyViewer'
import { PersonalityManager } from './pages/PersonalityManager'
import { Logs } from './pages/Logs'
import WorkingsViewer from './pages/WorkingsViewer'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />
  },
  {
    path: '/task-runner',
    element: <TaskRunner />
  },
  {
    path: '/strategy',
    element: <StrategyViewer />
  },
  {
    path: '/personality',
    element: <PersonalityManager />
  },
  {
    path: '/logs',
    element: <Logs />
  },
  {
    path: '/workings/:taskId',
    element: <WorkingsViewer />
  }
])