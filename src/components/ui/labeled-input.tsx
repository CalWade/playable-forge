import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface LabeledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const LabeledInput = React.forwardRef<HTMLInputElement, LabeledInputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full space-y-2">
        {label && (
          <Label
            htmlFor={inputId}
            className="text-sm font-semibold text-clay-text-muted"
          >
            {label}
          </Label>
        )}
        <Input
          ref={ref}
          id={inputId}
          className={cn(error && "border-clay-danger/60", className)}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-clay-danger-dk">{error}</p>
        )}
      </div>
    );
  }
);

LabeledInput.displayName = "LabeledInput";

export { LabeledInput };
