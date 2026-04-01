import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Clay Textarea — a deeper sunken clay groove for multi-line input.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex w-full min-h-[80px]",
        "rounded-clay-md",
        "border-2 border-clay-border",
        "bg-clay-neutral-50",
        "px-3.5 py-2.5",
        "text-sm text-clay-text leading-relaxed",
        "placeholder:text-clay-text-faint",
        "shadow-clay-input",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:border-clay-primary/50 focus-visible:shadow-clay-input-focus",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-y",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
