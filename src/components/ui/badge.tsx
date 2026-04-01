import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Clay Badge — small inflated pill labels.
 * Each color variant gets its own pastel clay look.
 */
const badgeVariants = cva(
  [
    "inline-flex items-center justify-center",
    "rounded-clay-full px-2.5 py-0.5",
    "text-xs font-semibold",
    "shadow-clay-xs",
    "transition-all duration-150",
  ].join(" "),
  {
    variants: {
      variant: {
        default:     "bg-clay-neutral-100 text-clay-neutral-600 border border-clay-neutral-200",
        secondary:   "bg-clay-surface2    text-clay-primary     border border-clay-primary/20",
        success:     "bg-clay-success-lt  text-clay-success-dk  border border-clay-success/30",
        warning:     "bg-clay-warning-lt  text-clay-warning-dk  border border-clay-warning/30",
        error:       "bg-clay-danger-lt   text-clay-danger-dk   border border-clay-danger/30",
        destructive: "bg-clay-danger-lt   text-clay-danger-dk   border border-clay-danger/30",
        info:        "bg-clay-info-lt     text-clay-info-dk     border border-clay-info/30",
        accent:      "bg-clay-accent-lt   text-clay-accent-dk   border border-clay-accent/30",
        outline:     "bg-transparent      text-clay-text-muted  border-2 border-clay-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
