import * as React from "react";
import { Input } from "@/components/ui/input";
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
          <label htmlFor={inputId} className="text-sm font-semibold text-clay-text">
            {label}
          </label>
        )}
        <Input ref={ref} id={inputId} className={cn(error && "ring-2 ring-red-300", className)} {...props} />
        {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
      </div>
    );
  }
);

LabeledInput.displayName = "LabeledInput";
export { LabeledInput };
