import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { TrendingUp, Target, AlertTriangle } from 'lucide-react'

export function StrategyViewer() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Strategy Viewer</h1>
        <p className="text-muted-foreground">
          Monitor strategic analysis and competitive intelligence
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Market Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>AI/ML Sector Growth</span>
                <Badge>+23.4%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Enterprise Adoption</span>
                <Badge variant="secondary">High</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Investment Flow</span>
                <Badge>+$12.3B</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Strategic Objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Market Position</span>
                <Badge>Leader</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Innovation Rate</span>
                <Badge variant="secondary">Accelerating</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Risk Profile</span>
                <Badge variant="outline">Moderate</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">Low</div>
                <div className="text-sm text-muted-foreground">Regulatory Risk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">Medium</div>
                <div className="text-sm text-muted-foreground">Competitive Risk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">High</div>
                <div className="text-sm text-muted-foreground">Technology Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}