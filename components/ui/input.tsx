import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, ...props }, ref) => (
    <div className="space-y-1">
      {label && (
        <label className="text-xs font-medium text-gray-500 px-1">{label}</label>
      )}
      <input
        type={type}
        className={cn(
          "flex h-14 w-full rounded-2xl bg-gray-100 px-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  )
);
Input.displayName = "Input";

export { Input };
