import { CheckIcon, XIcon } from "@/assets/icons";
import { cn } from "@/lib/utils";
import { useId, InputHTMLAttributes } from "react";

interface PropsType extends InputHTMLAttributes<HTMLInputElement> {
  withIcon?: "check" | "x";
  withBg?: boolean;
  label: string;
  minimal?: boolean;
  radius?: "default" | "md";
}

export function Checkbox({
  withIcon,
  label,
  withBg,
  minimal,
  radius,
  className,
  ...props
}: PropsType) {
  const id = useId();

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-center select-none",
          !minimal && "text-body-sm font-medium",
        )}
      >
        <div className="relative">
          <input
            type="checkbox"
            id={id}
            className="peer sr-only"
            {...props}
          />

          <div
            className={cn(
              "mr-2 flex size-5 items-center justify-center rounded border border-dark-5 outline-0 peer-checked:border-primary peer-checked:*:block focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary dark:border-dark-6",
              withBg
                ? "*:text-white peer-checked:bg-primary"
                : "peer-checked:bg-gray-2 dark:peer-checked:bg-transparent",
              minimal && "mr-3 border-stroke dark:border-dark-3",
              radius === "md" && "rounded-md",
            )}
          >
            {!withIcon && (
              <span className="hidden size-2.5 rounded-sm bg-primary" />
            )}

            {withIcon === "check" && (
              <CheckIcon className="hidden text-primary" />
            )}

            {withIcon === "x" && <XIcon className="hidden text-primary" />}
          </div>
        </div>
        <span className="text-sm font-normal text-dark dark:text-white">{label}</span>
      </label>
    </div>
  );
}
