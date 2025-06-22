import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Play, Clock, Users } from 'lucide-react';
import JsonView from '@uiw/react-json-view';

interface PlanDrawerProps {
  planId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PlanDrawer({ planId, isOpen, onClose }: PlanDrawerProps) {
  const { data, error, isLoading } = useSWR(
    planId ? `/plans/${planId}` : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch plan');
      }
      return response.json();
    }
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Execution Plan</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading plan...</div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-red-500">Failed to load plan</div>
            </div>
          )}
          
          {data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium">Plan ID</div>
                  <div className="text-sm text-muted-foreground">{data.id}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Created</div>
                  <div className="text-sm text-muted-foreground">
                    {data.created_at ? new Date(data.created_at).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Plan Outline</h3>
                {data.outline && data.outline.length > 0 ? (
                  <JsonView 
                    value={data.outline} 
                    collapsed={2}
                    displayDataTypes={false}
                    enableClipboard={false}
                    style={{
                      backgroundColor: 'transparent',
                      fontSize: '14px'
                    }}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground py-4">
                    No plan outline available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}