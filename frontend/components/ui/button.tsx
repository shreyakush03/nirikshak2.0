import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", children, ...props }, ref) => {
    let variantStyles = "bg-[#FF4F00] text-white hover:bg-[#E04500] shadow-sm";
    if (variant === "secondary") {
      variantStyles = "bg-[#F5F5F5] text-neutral-800 hover:bg-[#E5E5E5]";
    } else if (variant === "outline") {
      variantStyles = "border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-neutral-800";
    } else if (variant === "ghost") {
      variantStyles = "hover:bg-[#F5F5F5] text-neutral-700 hover:text-neutral-900";
    } else if (variant === "link") {
      variantStyles = "text-[#FF4F00] underline-offset-4 hover:underline";
    }

    let sizeStyles = "h-9 px-4 py-2 text-sm";
    if (size === "sm") {
      sizeStyles = "h-8 rounded-lg px-3 text-xs";
    } else if (size === "lg") {
      sizeStyles = "h-11 rounded-xl px-8 text-base";
    } else if (size === "icon") {
      sizeStyles = "h-9 w-9 p-0 flex items-center justify-center";
    }

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4F00]/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
