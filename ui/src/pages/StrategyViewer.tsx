import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, Calendar, User, Search, Filter } from 'lucide-react';

interface Strategy {
  id: string;
  content: string;
  author: string;
  created_at: string;
  updated_at: string;
}

export default function StrategyViewer() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/strategy/list');
      const data = await response.json();
      setStrategies(data.strategies || []);
    } catch (error) {
      console.error('Failed to fetch strategies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStrategies = strategies.filter(strategy =>
    strategy.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    strategy.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMarkdown = (content: string) => {
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs">$1</code>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 text-gray-900">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3 text-gray-800">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2 text-gray-700">$1</h3>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1">• $1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 mb-1 list-decimal">$1</li>');
  };

  const getPreview = (content: string) => {
    const plainText = content.replace(/[#*`]/g, '').replace(/\n/g, ' ');
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading strategy documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Strategy Repository</h1>
        <p className="text-gray-600">
          Strategic insights and analyses from completed plan executions
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search strategies by content or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            {filteredStrategies.length} of {strategies.length} strategies
          </div>
        </div>
      </div>

      {strategies.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Strategy Documents</h3>
            <p className="text-gray-600">
              Complete a plan execution and promote the insights to create your first strategy document.
            </p>
          </CardContent>
        </Card>
      ) : selectedStrategy ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedStrategy(null)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Strategy List
            </button>
            <div className="text-sm text-gray-600">
              Strategy ID: {selectedStrategy.id.slice(0, 8)}...
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Strategy Document</CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedStrategy.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedStrategy.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: formatMarkdown(selectedStrategy.content) }}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStrategies.map((strategy) => (
            <Card 
              key={strategy.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedStrategy(strategy)}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Strategy Document
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                  {getPreview(strategy.content)}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {strategy.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(strategy.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}