"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Clay Button — physically inflated, bouncy, matte-finish buttons.
 * States: rest → hover (float up) → active (pressed down, deflate).
 */
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-1.5",
    "font-semibold whitespace-nowrap select-none",
    "transition-all duration-150 ease-out",
    "outline-none",
    /* disabled */
    "disabled:pointer-events-none disabled:opacity-50",
    /* icon children */
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        /* Primary — vivid candy purple */
        default: [
          "bg-clay-primary text-white",
          "shadow-clay-effect-sm",
          "hover:-translate-y-[2px] hover:shadow-clay-effect-md",
          "active:translate-y-[1px] active:scale-[0.97] active:shadow-clay-effect-pressed",
        ].join(" "),

        /* Secondary — tinted surface */
        secondary: [
          "bg-clay-surface2 text-clay-primary",
          "shadow-clay-effect-sm",
          "hover:-translate-y-[2px] hover:shadow-clay-effect-md",
          "active:translate-y-[1px] active:scale-[0.97] active:shadow-clay-effect-pressed",
        ].join(" "),

        /* Outline — barely-there border */
        outline: [
          "bg-clay-surface border-2 border-clay-border text-clay-text",
          "shadow-clay-xs",
          "hover:-translate-y-[2px] hover:border-clay-primary/40 hover:shadow-clay-effect-sm",
          "active:translate-y-[1px] active:scale-[0.97]",
        ].join(" "),

        /* Ghost — no background */
        ghost: [
          "bg-transparent text-clay-text-muted",
          "hover:bg-clay-neutral-100 hover:text-clay-text",
          "active:scale-[0.97]",
        ].join(" "),

        /* Danger — strawberry red */
        destructive: [
          "bg-clay-danger text-white",
          "shadow-clay-effect-sm",
          "hover:-translate-y-[2px] hover:shadow-clay-effect-md",
          "active:translate-y-[1px] active:scale-[0.97] active:shadow-clay-effect-pressed",
        ].join(" "),

        /* Success — mint green */
        success: [
          "bg-clay-success text-white",
          "shadow-clay-effect-sm",
          "hover:-translate-y-[2px] hover:shadow-clay-effect-md",
          "active:translate-y-[1px] active:scale-[0.97] active:shadow-clay-effect-pressed",
        ].join(" "),

        /* Accent — coral rose */
        accent: [
          "bg-clay-accent text-white",
          "shadow-clay-effect-sm",
          "hover:-translate-y-[2px] hover:shadow-clay-effect-md",
          "active:translate-y-[1px] active:scale-[0.97] active:shadow-clay-effect-pressed",
        ].join(" "),

        link: "text-clay-primary underline-offset-4 hover:underline",
      },

      size: {
        xs:      "h-7  rounded-clay-sm  px-3   text-xs",
        sm:      "h-8  rounded-clay-md  px-3.5 text-sm",
        default: "h-9  rounded-clay-lg  px-5   text-sm",
        lg:      "h-11 rounded-clay-xl  px-6   text-base",
        xl:      "h-13 rounded-clay-2xl px-8   text-base",
        icon:    "size-9  rounded-clay-lg",
        "icon-sm":"size-8  rounded-clay-md",
        "icon-xs":"size-7  rounded-clay-sm",
        "icon-lg":"size-11 rounded-clay-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
