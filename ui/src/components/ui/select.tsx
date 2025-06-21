import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export function Select({ children, value = '', onValueChange, disabled = false }: SelectProps) {
  const [selectedValue, setSelectedValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (newValue: string) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  React.useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  // Find the selected item's display text
  let selectedText = "Select...";
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === SelectItem) {
      const itemProps = child.props as SelectItemProps;
      if (itemProps.value === selectedValue) {
        selectedText = String(itemProps.children);
      }
    }
  });

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="block truncate">{selectedText}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full rounded-md border bg-popover text-popover-foreground shadow-md mt-1">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === SelectItem) {
              const itemProps = child.props as SelectItemProps;
              return (
                <div
                  key={itemProps.value}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                  onClick={() => handleSelect(itemProps.value)}
                >
                  {itemProps.children}
                </div>
              );
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
}

export function SelectTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <></>;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectItem({ value, children }: SelectItemProps) {
  return <div data-value={value}>{children}</div>;
}