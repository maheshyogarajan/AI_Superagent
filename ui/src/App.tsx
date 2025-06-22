import { RouterProvider } from 'react-router-dom'
import { router } from './router-simple'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <nav className="border-b bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <span className="font-bold text-xl">AI Super Agent</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">Dashboard</a>
              <a href="/task-runner" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">Task Runner</a>
              <a href="/plan-inspector" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">Plan Inspector</a>
              <a href="/logs" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">Live Timeline</a>
              <a href="/agent-customizer" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">Agent Customizer</a>
            </div>
          </div>
        </div>
      </nav>
      <RouterProvider router={router} />
    </div>
  )
}

export default App