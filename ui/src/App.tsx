import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { Navigation } from './components/Navigation'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <RouterProvider router={router} />
    </div>
  )
}

export default App