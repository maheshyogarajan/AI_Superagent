import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  children: React.ReactNode
  className?: string
}

export function Select({ value, onValueChange, placeholder, children, className }: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || '')

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
    }
  }, [value])

  const handleSelect = (newValue: string) => {
    setSelectedValue(newValue)
    onValueChange?.(newValue)
    setIsOpen(false)
  }

  const selectedChild = React.Children.toArray(children).find((child) => {
    if (React.isValidElement(child) && child.props.value === selectedValue) {
      return child
    }
  }) as React.ReactElement | undefined

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedValue ? "" : "text-muted-foreground"}>
          {selectedChild?.props?.children || placeholder || "Select..."}
        </span>
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                onClick: () => handleSelect(child.props.value),
                className: cn(
                  "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                  child.props.className
                )
              })
            }
          })}
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export interface SelectItemProps {
  value: string
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export function SelectItem({ children, onClick, className }: SelectItemProps) {
  return (
    <div
      onClick={onClick}
      className={className}
    >
      {children}
    </div>
  )
}