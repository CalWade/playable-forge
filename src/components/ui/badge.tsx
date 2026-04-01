import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-clay-sm px-3 py-1 text-xs font-bold clay-shadow-sm clay-transition",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-clay-pink-50 to-clay-pink-100 text-clay-text",
        secondary: "bg-gradient-to-br from-gray-100 to-gray-200 text-clay-text",
        destructive: "bg-gradient-to-br from-red-200 to-red-300 text-red-700",
        outline: "bg-white text-clay-text",
        success: "bg-gradient-to-br from-clay-green-50 to-clay-green-100 text-green-700",
        warning: "bg-gradient-to-br from-clay-yellow-50 to-clay-yellow-100 text-yellow-700",
        error: "bg-gradient-to-br from-red-200 to-red-300 text-red-700",
        info: "bg-gradient-to-br from-clay-blue-50 to-clay-blue-100 text-blue-700",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
