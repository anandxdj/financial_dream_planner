import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 text-sm leading-relaxed",
  {
    variants: {
      variant: {
        default: "border-[#E8E1D6] bg-[#FFFCF8] text-[#344054]",
        destructive: "border-[#A13F39]/40 bg-[#A13F39]/10 text-[#A13F39] [&>svg]:text-[#A13F39]",
        warning: "border-[#7D5200]/40 bg-[#7D5200]/10 text-[#7D5200] [&>svg]:text-[#7D5200]",
        sage: "border-[#3D5C4A]/40 bg-[#3D5C4A]/10 text-[#3D5C4A] [&>svg]:text-[#3D5C4A]",
        blue: "border-[#3B5B8C]/40 bg-[#3B5B8C]/10 text-[#3B5B8C] [&>svg]:text-[#3B5B8C]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
  return (
    <h5
      data-slot="alert-title"
      className={cn("mb-1 font-semibold leading-none tracking-tight text-[#1F2A44]", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
