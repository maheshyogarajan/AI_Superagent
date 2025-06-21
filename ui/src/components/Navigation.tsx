import { Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/utils'
import { 
  LayoutDashboard, 
  Play, 
  TrendingUp, 
  Users, 
  ScrollText, 
  FileText 
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Task Runner', href: '/task-runner', icon: Play },
  { name: 'Strategy', href: '/strategy', icon: TrendingUp },
  { name: 'Personalities', href: '/personality', icon: Users },
  { name: 'Logs', href: '/logs', icon: ScrollText },
]

export function Navigation() {
  const location = useLocation()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-xl">AI Super Agent</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}