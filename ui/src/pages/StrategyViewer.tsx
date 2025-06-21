import { useQuery } from '@tanstack/react-query';
import { request } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, FileText, BookOpen, History } from 'lucide-react';

interface StrategyResp { 
  content: string; 
  updated_at: string; 
  author: string;
  version: string;
  word_count: number;
  sections: string[];
  metadata: {
    document_type: string;
    classification: string;
    review_cycle: string;
    next_review: string;
  };
}

interface VersionInfo {
  versions: Array<{
    version: string;
    date: string;
    author: string;
    changes: string[];
    status: string;
  }>;
  total_versions: number;
  current_version: string;
}

export default function StrategyViewer() {
  const { data: strategy, isLoading, error } = useQuery<StrategyResp>({
    queryKey: ['strategy'],
    queryFn: () => request<StrategyResp>('/strategy?version=latest'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: versions } = useQuery<VersionInfo>({
    queryKey: ['strategy-versions'],
    queryFn: () => request<VersionInfo>('/strategy/versions'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Failed to load strategy document</p>
        <p className="text-sm text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                AI Super Agent Strategy Document
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Living strategy document with comprehensive system overview
              </p>
            </div>
            <Badge variant="outline">
              v{strategy?.version}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Last Updated</p>
                <p className="text-muted-foreground">{strategy?.updated_at}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Author</p>
                <p className="text-muted-foreground">{strategy?.author}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Word Count</p>
                <p className="text-muted-foreground">{strategy?.word_count?.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Next Review</p>
                <p className="text-muted-foreground">{strategy?.metadata?.next_review}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table of Contents */}
      {strategy?.sections && strategy.sections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Table of Contents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {strategy.sections.map((section, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  {section}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategy Content */}
      <Card>
        <CardContent className="pt-6">
          <article className="prose prose-slate max-w-none dark:prose-invert">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({children}) => <h1 className="text-3xl font-bold mt-8 mb-4 first:mt-0">{children}</h1>,
                h2: ({children}) => <h2 className="text-2xl font-semibold mt-6 mb-3">{children}</h2>,
                h3: ({children}) => <h3 className="text-xl font-medium mt-4 mb-2">{children}</h3>,
                p: ({children}) => <p className="mb-4 leading-relaxed">{children}</p>,
                ul: ({children}) => <ul className="mb-4 ml-6">{children}</ul>,
                ol: ({children}) => <ol className="mb-4 ml-6">{children}</ol>,
                li: ({children}) => <li className="mb-1">{children}</li>,
                code: ({children}) => <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>,
                pre: ({children}) => <pre className="bg-muted p-4 rounded-lg overflow-x-auto">{children}</pre>
              }}
            >
              {strategy?.content ?? ''}
            </ReactMarkdown>
          </article>
        </CardContent>
      </Card>

      {/* Version History */}
      {versions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </CardTitle>
            <p className="text-muted-foreground">
              {versions.total_versions} versions available
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {versions.versions.map((version, index) => (
                <div key={version.version} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={version.status === 'current' ? 'default' : 'secondary'}>
                        v{version.version}
                      </Badge>
                      {version.status === 'current' && (
                        <Badge variant="outline">Current</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {version.date} by {version.author}
                    </p>
                    <ul className="text-sm space-y-1">
                      {version.changes.map((change, changeIndex) => (
                        <li key={changeIndex} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Metadata */}
      {strategy?.metadata && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium">Type</p>
                <p className="text-muted-foreground capitalize">{strategy.metadata.document_type}</p>
              </div>
              <div>
                <p className="font-medium">Classification</p>
                <p className="text-muted-foreground capitalize">{strategy.metadata.classification}</p>
              </div>
              <div>
                <p className="font-medium">Review Cycle</p>
                <p className="text-muted-foreground capitalize">{strategy.metadata.review_cycle}</p>
              </div>
              <div>
                <p className="font-medium">Next Review</p>
                <p className="text-muted-foreground">{strategy.metadata.next_review}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}