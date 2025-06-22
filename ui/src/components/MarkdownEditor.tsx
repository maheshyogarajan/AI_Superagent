import React, { useState, useRef } from 'react';
import { Save, Edit3, Eye, FileText } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onSave: (markdown: string) => void;
  placeholder?: string;
  height?: string;
}

export default function MarkdownEditor({ 
  value, 
  onSave, 
  placeholder = "Enter markdown content...",
  height = "400px"
}: MarkdownEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEdit = () => {
    setIsEditing(true);
    setContent(value);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(content);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save markdown:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setContent(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isEditing) {
    return (
      <div className="border rounded-lg bg-white">
        <div className="flex items-center justify-between p-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Strategy Document</span>
          </div>
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        </div>
        <div 
          className="p-4 prose prose-sm max-w-none overflow-auto"
          style={{ height, minHeight: "200px" }}
        >
          {value ? (
            <div 
              className="markdown-content"
              dangerouslySetInnerHTML={{
                __html: value
                  .replace(/\n/g, '<br>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
                  .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mb-2">$1</h1>')
                  .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mb-2">$1</h2>')
                  .replace(/^### (.*$)/gm, '<h3 class="text-md font-medium mb-1">$1</h3>')
              }}
            />
          ) : (
            <div className="text-gray-500 italic">
              No strategy document available. Click Edit to create one.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white">
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Editing Strategy</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <div className="p-4">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full p-3 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          style={{ height, minHeight: "200px" }}
        />
        <div className="mt-2 text-xs text-gray-500">
          Tip: Use Ctrl+S to save, Esc to cancel. Supports basic markdown formatting.
        </div>
      </div>
    </div>
  );
}