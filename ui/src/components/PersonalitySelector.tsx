import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, type PersonalitiesResponse } from '@/lib/api';
import { User, Brain } from 'lucide-react';

interface PersonalitySelectorProps {
  selectedPersonality: string;
  onPersonalityChange: (personalityId: string) => void;
}

export function PersonalitySelector({ selectedPersonality, onPersonalityChange }: PersonalitySelectorProps) {
  const [personalities, setPersonalities] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPersonalities();
  }, []);

  const loadPersonalities = async () => {
    try {
      setLoading(true);
      const response: PersonalitiesResponse = await api.getPersonalities();
      setPersonalities(response.personalities);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load personalities');
    } finally {
      setLoading(false);
    }
  };

  const getPersonalityDescription = (personalityId: string): string => {
    const descriptions: Record<string, string> = {
      'SteveJobs': 'Visionary product design with relentless attention to detail and user experience excellence',
      'WarrenBuffett': 'Long-term value investing with fundamental analysis and patient capital allocation',
      'RorySutherland': 'Behavioral psychology meets creative advertising insights and contrarian thinking',
      'BillGates': 'Systematic problem-solving with technology focus and philanthropic impact',
      'ElonMusk': 'First-principles thinking for breakthrough innovation and rapid iteration',
      'Default': 'Balanced approach with professional expertise and comprehensive analysis'
    };
    return descriptions[personalityId] || 'Professional AI assistance with specialized knowledge';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Loading Personalities...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Brain className="h-5 w-5" />
            Error Loading Personalities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadPersonalities} variant="outline" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Agent Personality
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(personalities).map(([id, name]) => (
            <button
              key={id}
              onClick={() => onPersonalityChange(id)}
              className={`p-4 border rounded-lg text-left transition-all hover:border-primary/50 ${
                selectedPersonality === id
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border hover:bg-accent'
              }`}
            >
              <h3 className="font-medium text-sm">{name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {getPersonalityDescription(id)}
              </p>
            </button>
          ))}
        </div>
        
        {selectedPersonality && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <h4 className="font-medium text-sm">
              Selected: {personalities[selectedPersonality]}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {getPersonalityDescription(selectedPersonality)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}