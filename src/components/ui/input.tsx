import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

/**
 * Clay Input — a concave/sunken slot carved into the clay surface.
 * Inner shadow creates the illusion of depth (like a pressed groove).
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0",
        "rounded-clay-md",
        "border-2 border-clay-border",
        "bg-clay-neutral-50",
        "px-3.5 py-2",
        "text-sm text-clay-text",
        "placeholder:text-clay-text-faint",
        /* Sunken / concave clay shadow */
        "shadow-clay-input",
        "transition-all duration-150",
        /* Focus: ring + deepen the groove */
        "focus-visible:outline-none focus-visible:border-clay-primary/50 focus-visible:shadow-clay-input-focus",
        /* Disabled */
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        /* File input */
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-clay-text",
        /* Validation */
        "aria-invalid:border-clay-danger/60 aria-invalid:shadow-none",
        className
      )}
      {...props}
    />
  )
}

export { Input }
