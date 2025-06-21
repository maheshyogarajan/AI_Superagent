import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { X } from 'lucide-react';

interface DrawerProps {
  title: string;
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

export function Drawer({ title, isOpen, onClose, children }: DrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[calc(80vh-100px)]">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}