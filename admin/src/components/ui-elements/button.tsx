import { cva, VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 text-center font-medium hover:bg-opacity-90 font-medium transition focus:outline-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white",
        secondary: "bg-[#13C296] text-white",
        dark: "bg-dark text-white dark:bg-white/10",
        gray: "bg-[#637381] text-white",
        light: "bg-[#EFEFEF] text-[#212B36] dark:bg-dark-3 dark:text-white",
        warning: "bg-[#F9C107] text-dark",
        danger: "bg-[#DC3545] text-white",
        success: "bg-[#219653] text-white",
        info: "bg-[#3BA2B8] text-white",

        outlinePrimary: "border border-primary hover:bg-primary/10 text-primary",
        outlineSecondary: "border border-[#13C296] text-[#13C296] hover:bg-[#13C296]/10",
        outlineDark: "border border-dark hover:bg-dark/10 text-dark dark:hover:bg-white/10 dark:border-white/25 dark:text-white",
        outlineGray: "border border-[#637381] text-[#637381] hover:bg-[#637381]/10",
        outlineLight: "border border-[#EFEFEF] text-[#212B36] hover:bg-[#EFEFEF]/50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3",
        outlineWarning: "border border-[#F9C107] text-[#F9C107] hover:bg-[#F9C107]/10",
        outlineDanger: "border border-[#DC3545] text-[#DC3545] hover:bg-[#DC3545]/10",
        outlineSuccess: "border border-[#219653] text-[#219653] hover:bg-[#219653]/10",
        outlineInfo: "border border-[#3BA2B8] text-[#3BA2B8] hover:bg-[#3BA2B8]/10",
      },
      shape: {
        default: "",
        rounded: "rounded-[5px]",
        full: "rounded-full",
      },
      size: {
        default: "py-3.5 px-10 py-3.5 lg:px-8 xl:px-10",
        small: "py-[11px] px-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      shape: "default",
      size: "default",
    },
  },
);

type ButtonProps = HTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    label: string;
    icon?: React.ReactNode;
  };

export function Button({
  label,
  icon,
  variant,
  shape,
  size,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, shape, size, className })}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}
